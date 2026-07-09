/**
 * Seed JanusGraph with the demo filesystem as a Mïmis transducer.
 *
 * Translates the app's in-memory `createSeedTree()` into the graph model the
 * README describes and the sibling `pkgs/Gremlin` package implements:
 *
 *   (SpotRoot {signer})
 *        │ CONTAINS {path: 'home'}
 *        ▼
 *      (Spot) ──CONTAINS {path: 'user'}──▶ (Spot) ──…
 *                                            │ REPRESENTATION
 *                                            ▼
 *                                          (File {cid, type, size})
 *
 * Path elements live on the CONTAINS *edges*, never on the nodes — folders and
 * files are told apart only by their outgoing edges (CONTAINS vs REPRESENTATION),
 * matching the routing model. Spot metadata (modified, hidden) rides on the Spot;
 * size/type/cid ride on the File.
 *
 * Scope: CONTAINS + REPRESENTATION only (no MOUNT, SIGNIFIER, or versioning),
 * per the agreed first pass. Idempotent-ish: pass --reset to drop the signer's
 * existing tree first; otherwise it refuses to seed over a populated root.
 *
 * Run:  node scripts/seed-janusgraph.mjs [--reset]
 * Env:  JANUSGRAPH_URL, JANUSGRAPH_USERNAME, JANUSGRAPH_PASSWORD, MIMIS_DEV_SIGNER
 */

import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(here, '..')
const repoRoot = resolve(pkgRoot, '..', '..')

// The `gremlin` client is installed in the sibling Gremlin package; reuse it
// rather than adding a dependency just for seeding.
const require = createRequire(resolve(repoRoot, 'pkgs/Gremlin/package.json'))
const gremlin = require('gremlin')

const { driver, process: gp } = gremlin
const { DriverRemoteConnection, auth: { PlainTextSaslAuthenticator } } = driver
const { statics: __, t: T, merge: Merge } = gp

/** Pull defaults from the sibling package's .env.local so creds stay in one place. */
function loadEnv() {
  const out = {}
  try {
    const text = readFileSync(resolve(repoRoot, 'pkgs/Gremlin/.env.local'), 'utf8')
    for (const line of text.split('\n')) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/)
      if (m) out[m[1]] = m[2]
    }
  } catch { /* fall back to process.env / hardcoded defaults */ }
  return out
}

const envFile = loadEnv()
const URL = process.env.JANUSGRAPH_URL || envFile.PUBLIC_JANUSGRAPH_URL || 'ws://localhost:8182/gremlin'
const USER = process.env.JANUSGRAPH_USERNAME || envFile.PUBLIC_JANUSGRAPH_USERNAME || 'mimis'
const PASS = process.env.JANUSGRAPH_PASSWORD || envFile.PUBLIC_JANUSGRAPH_PASSWORD || ''
const SIGNER = process.env.MIMIS_DEV_SIGNER || '0xdev'
const RESET = process.argv.includes('--reset')

const NOW = new Date().toISOString()

/** Deterministic placeholder CID for a mock file (no real content exists). */
function fakeCid(path, size) {
  // Not a real multihash — clearly synthetic, stable per path so reseeds match.
  let h = 0
  for (const ch of `${path}:${size}`) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return `bafymock${h.toString(16).padStart(8, '0')}`
}

/** Best-effort MIME from extension, mirroring the app's icon heuristics loosely. */
function mimeFor(name) {
  const ext = (name.match(/\.([^.]+)$/)?.[1] ?? '').toLowerCase()
  const map = {
    txt: 'text/plain', md: 'text/markdown', json: 'application/json',
    ts: 'text/x-typescript', css: 'text/css', pdf: 'application/pdf',
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
    webp: 'image/webp', heic: 'image/heic', svg: 'image/svg+xml',
    mp3: 'audio/mpeg', flac: 'audio/flac', mp4: 'video/mp4', mkv: 'video/x-matroska',
    iso: 'application/x-iso9660-image', zip: 'application/zip',
    gz: 'application/gzip', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  }
  return map[ext] ?? 'application/octet-stream'
}

async function main() {
  const conn = new DriverRemoteConnection(URL, {
    authenticator: new PlainTextSaslAuthenticator(USER, PASS),
  })

  try {
    const g = gp.traversal().withRemote(conn)

    // Load the app's seed tree. The data module is plain TS that Node v24 can
    // strip-type on the fly, and it has no runtime imports beyond its own types.
    const { createSeedTree } = await import(resolve(pkgRoot, 'src/lib/fs/data.ts'))
    const tree = createSeedTree()

    // --- existing-data guard / reset -------------------------------------
    const existing = await g.V().hasLabel('SpotRoot').has('signer', SIGNER).id().toList()
    if (existing.length) {
      if (!RESET) {
        console.error(
          `SpotRoot for signer "${SIGNER}" already exists (id ${existing[0]}).\n` +
          `Re-run with --reset to drop and reseed it, or set MIMIS_DEV_SIGNER to a fresh signer.`,
        )
        process.exitCode = 1
        return
      }
      console.log(`--reset: dropping existing tree for signer "${SIGNER}"…`)
      // Drop the whole reachable subtree (Spots + Files) then the root itself.
      await g.V(existing[0]).repeat(__.out()).emit().aggregate('x')
        .cap('x').unfold().drop().iterate()
      await g.V(existing[0]).drop().iterate()
    }

    // --- root --------------------------------------------------------------
    const rootId = (
      await g.addV('SpotRoot')
        .property('signer', SIGNER)
        .property('createdAt', NOW)
        .id().next()
    ).value
    console.log(`SpotRoot(${SIGNER}) → ${rootId}`)

    let spots = 0
    let files = 0

    /** Recursively materialise children of the Spot/Root with id `parentId`. */
    async function emit(parentId, node, pathSoFar) {
      for (const child of node.children ?? []) {
        const childPath = `${pathSoFar}/${child.name}`

        // Create the child Spot and the CONTAINS edge carrying the path element.
        const spotId = (
          await g.V(parentId).as('parent')
            .addV('Spot')
            .property('createdAt', NOW)
            .property('modified', new Date(child.modified).toISOString())
            .property('hidden', Boolean(child.hidden))
            .as('spot')
            .addE('CONTAINS').from_('parent')
            .property('path', child.name)
            .property('createdAt', NOW)
            .select('spot').id().next()
        ).value
        spots++

        if (child.kind === 'folder') {
          await emit(spotId, child, childPath)
        } else {
          // A file: attach one File via REPRESENTATION, keyed by MIME type.
          await g.V(spotId).as('spot')
            .addV('File')
            .property('cid', fakeCid(childPath, child.size))
            .property('type', mimeFor(child.name))
            .property('size', Math.round(child.size))
            .property('createdAt', NOW)
            .addE('REPRESENTATION').from_('spot')
            .property('createdAt', NOW)
            .iterate()
          files++
        }
      }
    }

    await emit(rootId, tree, '')

    const vCount = (await g.V().count().next()).value
    const eCount = (await g.E().count().next()).value
    console.log(`Seeded ${spots} Spots + ${files} Files.`)
    console.log(`Graph now: ${vCount} vertices, ${eCount} edges.`)
  } finally {
    await conn.close()
  }
}

main().catch((err) => {
  console.error('SEED FAILED:', err?.stack ?? err)
  process.exitCode = 1
})
