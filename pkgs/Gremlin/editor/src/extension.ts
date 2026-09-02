import * as vscode from 'vscode'

const SCHEME = 'mimis'
const STAGED_KEY = 'mimis.staged'
const TOKEN_KEY = 'mimis.token'

interface StagedEntry {
  cid: string
  type: string
  size: number
  mtime: number
}

/** Keyed by URI path, e.g. `/a/b/README.md`. */
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

const decoded = (str: string) => {
  try {
    return decodeURIComponent(str)
  } catch {
    return str // already decoded on the way through `Uri.parse`
  }
}

/**
 * Trades the single-use code the app leaves in the folder URI for
 * a session token, stores it, & reopens the folder without it.
 * The query is the only part of the opening URL a web extension
 * can see, & the credential shouldn’t outlive the handoff.
 */
async function redeem(context: vscode.ExtensionContext) {
  const folder = vscode.workspace.workspaceFolders?.[0]?.uri
  const code = folder?.query.match(/(?:^|&)code=(.*)$/)?.[1]
  if(!folder || code == null) return null

  try {
    const res = await fetch(`${apiRoot()}/api/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: decoded(code) }),
    })
    if(!res.ok) {
      throw new Error(
        res.status === 401
        ? 'the code was expired or already spent'
        : `HTTP ${res.status}`
      )
    }
    const { token } = await res.json() as { token: string }
    await context.secrets.store(TOKEN_KEY, token)

    // The query is part of the workspace’s identity, so dropping
    // it also settles staged state under the URI it will keep.
    void vscode.commands.executeCommand(
      'vscode.openFolder', folder.with({ query: '' }),
    )
    return token
  } catch(err) {
    vscode.window.showErrorMessage(
      `Mïmis pairing failed — ${
        (err as Error).message
      }. Run “Mïmis: Set Token” to pair by hand.`
    )
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
  onStagedChange: (() => void) | null = null

  private emitter = new vscode.EventEmitter<Array<vscode.FileChangeEvent>>()
  onDidChangeFile = this.emitter.event

  constructor(private context: vscode.ExtensionContext) {}

  get staged(): StagedMap {
    return this.context.workspaceState.get<StagedMap>(STAGED_KEY) ?? {}
  }

  private async setStaged(map: StagedMap) {
    await this.context.workspaceState.update(STAGED_KEY, map)
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
    const res = await this.request(uri.path, { query: { op: 'stat' } })
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

  fs.token = (
    (await redeem(context))
    ?? (await context.secrets.get(TOKEN_KEY))
    ?? null
  )

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
  context.subscriptions.push(scm, status)

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
      await context.secrets.store(TOKEN_KEY, token)
      fs.token = token
      vscode.window.showInformationMessage('Mïmis: token stored.')
    }),
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
