import * as vscode from 'vscode'

/** Stamped in by the build, to tell a stale bundle from a fresh one. */
declare const __BUILD__: string

const SCHEME = 'mimis'
const STAGED_KEY = 'mimis.staged'
const TOKEN_KEY = 'mimis.token'

interface StagedEntry {
  cid: string
  type: string
  size: number
  mtime: number
}

/**
 * Keyed by URI path, e.g. `/a/b/README.md`. Kept in `globalState`
 * rather than `workspaceState` because a folder opened with a
 * pairing code is, to VS Code, a different workspace than the same
 * folder opened without one — & these paths are absolute in the
 * Mïmis tree, so they don’t collide between workspaces anyway.
 */
type StagedMap = Record<string, StagedEntry>

interface APIEntry {
  name: string
  kind: 'directory' | 'file'
  size?: number
  ctime?: number
  mtime?: number
}

const config = () => (
  vscode.workspace.getConfiguration('mimis')
)

const apiRoot = () => (
  (config().get<string>('apiURL') ?? 'http://localhost:5173')
  .replace(/\/+$/, '')
)

const uriFor = (path: string) => (
  vscode.Uri.from({ scheme: SCHEME, path })
)

/** “Mïmis” in the Output panel: where pairing explains itself. */
const log = vscode.window.createOutputChannel('Mïmis')

const note = (message: string) => {
  log.appendLine(`${new Date().toISOString()} ${message}`)
}

const isWorkspaceRoot = (uri: vscode.Uri) => (
  vscode.workspace.workspaceFolders?.some(
    ({ uri: folder }) => (
      folder.scheme === uri.scheme && folder.path === uri.path
    )
  ) ?? false
)

const decoded = (str: string) => {
  try {
    return decodeURIComponent(str)
  } catch {
    return str // already decoded on the way through `Uri.parse`
  }
}

/**
 * Trades the single-use code the app leaves in the folder URI’s
 * query — the only part of the opening URL a web extension can
 * read — for a session token. Reloading such a URL replays a spent
 * code, so a failure is only worth reporting when it leaves us
 * with no token at all.
 */
async function redeem({ quiet }: { quiet: boolean }) {
  const folder = vscode.workspace.workspaceFolders?.[0]?.uri
  note(`Folder: ${folder?.toString() ?? '‹none›'}`)
  note(`API: ${apiRoot()}`)

  const code = folder?.query.match(/(?:^|&)code=(.*)$/)?.[1]
  if(code == null) {
    note(
      folder?.query
      ? `No \`code\` in the folder query: ${folder.query}`
      : 'No query on the folder URI — opened without a pairing code.'
    )
    return null
  }

  try {
    note(`Redeeming a ${code.length}-character code…`)
    const res = await fetch(`${apiRoot()}/api/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: decoded(code) }),
    })
    note(`Exchange responded ${res.status}.`)
    if(!res.ok) {
      throw new Error(
        res.status === 401
        ? 'the code was expired or already spent'
        : `HTTP ${res.status}`
      )
    }
    const { token } = await res.json() as { token: string }
    return token
  } catch(err) {
    note(`Exchange failed: ${(err as Error).message}`)
    if(!quiet) {
      vscode.window.showErrorMessage(
        `Mïmis pairing failed — ${
          (err as Error).message
        }. Open the folder afresh from the app for a new code, or run`
        + ' “Mïmis: Set Token” to pair by hand.'
      )
    }
    return null
  }
}

/**
 * A Mïmis tree as a filesystem: Spots are directories & their
 * current representations are files. Writes stage in IPFS (the
 * bytes upload immediately, unpinned) & only an explicit commit
 * updates the graph, versioning the previous representation.
 */
export class MimisFS implements vscode.FileSystemProvider {
  token: string | null = null
  /** Held while pairing, so early reads don’t race it to a 401. */
  pairing: Promise<unknown> | null = null
  onStagedChange: (() => void) | null = null

  private emitter = new vscode.EventEmitter<Array<vscode.FileChangeEvent>>()
  onDidChangeFile = this.emitter.event

  constructor(private context: vscode.ExtensionContext) {}

  get staged(): StagedMap {
    return this.context.globalState.get<StagedMap>(STAGED_KEY) ?? {}
  }

  private async setStaged(map: StagedMap) {
    await this.context.globalState.update(STAGED_KEY, map)
    this.onStagedChange?.()
  }

  private async request(
    path: string,
    { query = {}, method = 'GET', body, headers = {} }: {
      query?: Record<string, string>
      method?: string
      body?: BodyInit
      headers?: Record<string, string>
    } = {},
  ) {
    if(this.pairing) await this.pairing
    const segments = (
      path.split('/').filter(Boolean).map(encodeURIComponent)
    )
    const url = new URL(
      `${apiRoot()}/api/fs${
        segments.length > 0 ? `/${segments.join('/')}` : ''
      }`
    )
    for(const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value)
    }
    let res
    try {
      res = await fetch(url, {
        method,
        body,
        headers: {
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
          ...headers,
        },
      })
    } catch(err) {
      throw vscode.FileSystemError.Unavailable(
        `Mïmis API unreachable @ ${apiRoot()}: ${(err as Error).message}`
      )
    }
    if(res.status === 401) {
      throw vscode.FileSystemError.NoPermissions(
        'Not authorized — run “Mïmis: Set Token” with a token copied from the app.'
      )
    }
    if(res.status === 404) {
      throw vscode.FileSystemError.FileNotFound(path)
    }
    if(!res.ok) {
      let message = `HTTP ${res.status}`
      try {
        message = (await res.json()).message ?? message
      } catch { /* not JSON */ }
      if(res.status === 405 || res.status === 400) {
        throw vscode.FileSystemError.NoPermissions(message)
      }
      throw vscode.FileSystemError.Unavailable(message)
    }
    return res
  }

  watch(): vscode.Disposable {
    return new vscode.Disposable(() => {})
  }

  async stat(uri: vscode.Uri): Promise<vscode.FileStat> {
    const entry = this.staged[uri.path]
    if(entry) {
      return {
        type: vscode.FileType.File,
        size: entry.size,
        ctime: entry.mtime,
        mtime: entry.mtime,
      }
    }
    let res
    try {
      res = await this.request(uri.path, { query: { op: 'stat' } })
    } catch(err) {
      // VS Code’s startup check reads a refusal on the workspace
      // folder as “Workspace does not exist” & throws up a modal —
      // misleading whether we hold no token or a stale one. Claiming
      // the root is a directory keeps the workspace open & lets the
      // real complaint surface in the explorer, which says what’s
      // actually wrong.
      const denied = (
        err instanceof vscode.FileSystemError
        && err.code === 'NoPermissions'
      )
      if(denied && isWorkspaceRoot(uri)) {
        note(`Unauthorized for the workspace root ${uri.path}.`)
        return { type: vscode.FileType.Directory, size: 0, ctime: 0, mtime: 0 }
      }
      throw err
    }
    const info = await res.json() as APIEntry
    return {
      type: (
        info.kind === 'directory'
        ? vscode.FileType.Directory
        : vscode.FileType.File
      ),
      size: info.size ?? 0,
      ctime: info.ctime ?? 0,
      mtime: info.mtime ?? 0,
    }
  }

  async readDirectory(uri: vscode.Uri) {
    const res = await this.request(uri.path, { query: { op: 'list' } })
    const listed = new Map<string, vscode.FileType>()
    for(const { name, kind } of await res.json() as Array<APIEntry>) {
      listed.set(
        name,
        kind === 'directory' ? vscode.FileType.Directory : vscode.FileType.File,
      )
    }
    // Staged files the graph doesn’t know of yet
    const prefix = uri.path === '/' ? '/' : `${uri.path}/`
    for(const key of Object.keys(this.staged)) {
      if(!key.startsWith(prefix)) continue
      const rest = key.slice(prefix.length)
      if(rest.includes('/')) continue
      listed.set(rest, vscode.FileType.File)
    }
    return [...listed.entries()] as Array<[string, vscode.FileType]>
  }

  async readFile(uri: vscode.Uri) {
    const entry = this.staged[uri.path]
    const res = await (
      entry
      ? this.request('', { query: { cid: entry.cid } })
      : this.request(uri.path)
    )
    return new Uint8Array(await res.arrayBuffer())
  }

  async writeFile(uri: vscode.Uri, content: Uint8Array) {
    const res = await this.request(uri.path, {
      method: 'PUT',
      body: content as BodyInit,
      headers: { 'Content-Type': 'application/octet-stream' },
    })
    const { cid, size, type } = await res.json() as StagedEntry
    await this.setStaged({
      ...this.staged,
      [uri.path]: {
        cid,
        type,
        size: Number(size ?? content.length),
        mtime: Date.now(),
      },
    })
    this.emitter.fire([{ type: vscode.FileChangeType.Changed, uri }])
    if(config().get<string>('commitMode') === 'onSave') {
      await this.commit([uri.path])
    }
  }

  /** Writes the staged CIDs into the graph & pins them. */
  async commit(paths?: Array<string>) {
    const { staged } = this
    const keys = (paths ?? Object.keys(staged)).filter((key) => staged[key])
    if(keys.length === 0) return 0
    const entries = keys.map((key) => ({
      path: key,
      cid: staged[key].cid,
      type: staged[key].type,
      size: staged[key].size,
    }))
    await this.request('', {
      method: 'POST',
      query: { op: 'commit' },
      body: JSON.stringify({ entries }),
      headers: { 'Content-Type': 'application/json' },
    })
    const remaining = { ...staged }
    for(const key of keys) {
      delete remaining[key]
    }
    await this.setStaged(remaining)
    return keys.length
  }

  /** Drops a staged entry; the committed version shows again. */
  async discard(path: string) {
    const staged = { ...this.staged }
    if(!staged[path]) return
    delete staged[path]
    await this.setStaged(staged)
    this.emitter.fire([
      { type: vscode.FileChangeType.Changed, uri: uriFor(path) },
    ])
  }

  async createDirectory(uri: vscode.Uri) {
    await this.request(uri.path, {
      method: 'POST',
      query: { op: 'mkdir' },
    })
    this.emitter.fire([{ type: vscode.FileChangeType.Created, uri }])
  }

  async rename(oldUri: vscode.Uri, newUri: vscode.Uri) {
    const staged = this.staged
    if(staged[oldUri.path]) {
      const moved = { ...staged, [newUri.path]: staged[oldUri.path] }
      delete moved[oldUri.path]
      await this.setStaged(moved)
    }

    let committed = true
    try {
      await this.request(oldUri.path, { query: { op: 'stat' } })
    } catch {
      committed = false // staged-only: nothing in the graph to rename
    }
    if(committed) {
      await this.request(oldUri.path, {
        method: 'POST',
        query: { op: 'rename' },
        body: JSON.stringify({ to: newUri.path }),
        headers: { 'Content-Type': 'application/json' },
      })
    }

    this.emitter.fire([
      { type: vscode.FileChangeType.Deleted, uri: oldUri },
      { type: vscode.FileChangeType.Created, uri: newUri },
    ])
  }

  delete(): void {
    throw vscode.FileSystemError.NoPermissions(
      'Deletion is unsupported: the Mïmis graph is append-only.'
    )
  }
}

export async function activate(context: vscode.ExtensionContext) {
  const fs = new MimisFS(context)

  context.subscriptions.push(
    vscode.workspace.registerFileSystemProvider(
      SCHEME, fs, { isCaseSensitive: true }
    ),
  )

  // VS Code for the Web keeps `context.secrets` in memory only —
  // nothing survives a reload without a `secretStorageProvider` —
  // so the token lives in `globalState` instead.
  const stored = context.globalState.get<string>(TOKEN_KEY) ?? null
  fs.token = stored
  note(`Bundle built ${__BUILD__}.`)
  note(`Stored token: ${stored == null ? 'none' : 'present'}.`)
  fs.pairing = (async () => {
    const token = await redeem({ quiet: stored != null })
    if(token != null) {
      await context.globalState.update(TOKEN_KEY, token)
      fs.token = token
    }
    note(`Paired by: ${
      token != null ? 'exchange' : stored != null ? 'stored token' : 'nothing'
    }.`)
    if(fs.token == null) {
      const shown = await vscode.window.showWarningMessage(
        'Mïmis is unpaired. Open the folder from the app’s file browser for'
        + ' a fresh code, or run “Mïmis: Set Token”.',
        'Show Log',
      )
      if(shown === 'Show Log') log.show()
    }
    fs.pairing = null
  })()
  await fs.pairing

  const scm = vscode.scm.createSourceControl('mimis', 'Mïmis')
  const group = scm.createResourceGroup('staged', 'Staged Changes')
  scm.acceptInputCommand = { command: 'mimis.commit', title: 'Commit' }
  scm.inputBox.placeholder = (
    'Commit staged changes to the Mïmis graph (message is unused)'
  )
  const status = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left
  )
  status.command = 'mimis.commit'
  context.subscriptions.push(scm, status, log)

  const refresh = () => {
    const keys = Object.keys(fs.staged)
    group.resourceStates = keys.map((path) => (
      {
        resourceUri: uriFor(path),
        command: {
          command: 'vscode.open',
          title: 'Open',
          arguments: [uriFor(path)],
        },
      }
    ))
    scm.count = keys.length
    if(keys.length > 0) {
      status.text = `$(cloud-upload) Mïmis: ${keys.length} staged`
      status.show()
    } else {
      status.hide()
    }
  }
  fs.onStagedChange = refresh
  refresh()

  context.subscriptions.push(
    vscode.commands.registerCommand('mimis.commit', async () => {
      try {
        const count = await fs.commit()
        vscode.window.showInformationMessage(
          count === 0
          ? 'Mïmis: nothing staged.'
          : `Mïmis: committed ${count} file${count === 1 ? '' : 's'}.`
        )
      } catch(err) {
        vscode.window.showErrorMessage(
          `Mïmis commit failed: ${(err as Error).message}`
        )
      }
    }),
    vscode.commands.registerCommand(
      'mimis.discard',
      async (resource?: vscode.SourceControlResourceState) => {
        let path = resource?.resourceUri.path
        path ??= await vscode.window.showQuickPick(
          Object.keys(fs.staged),
          { placeHolder: 'Staged change to discard' },
        )
        if(path != null) await fs.discard(path)
      },
    ),
    vscode.commands.registerCommand('mimis.setToken', async () => {
      const token = await vscode.window.showInputBox({
        prompt: 'Editor token, copied from the Mïmis app’s actions menu',
        password: true,
        ignoreFocusOut: true,
      })
      if(!token) return
      await context.globalState.update(TOKEN_KEY, token)
      fs.token = token
      vscode.window.showInformationMessage('Mïmis: token stored.')
    }),
    vscode.commands.registerCommand('mimis.showLog', () => log.show()),
    vscode.commands.registerCommand('mimis.open', async () => {
      const path = await vscode.window.showInputBox({
        prompt: 'Mïmis path to open, e.g. media/book/by',
        value: '',
      })
      if(path == null) return
      const uri = uriFor(`/${path.split('/').filter(Boolean).join('/')}`)
      await vscode.commands.executeCommand('vscode.openFolder', uri)
    }),
  )
}

export function deactivate() {}
