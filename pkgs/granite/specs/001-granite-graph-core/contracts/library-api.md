# Contract: Public Library API

**Package**: `granite-mimis` (ESM, TypeScript). Types below are the public
surface exported from `src/index.ts`; signatures are contracts, bodies are not.

## Construction

```ts
type GraniteConfig = {
  kubo: string,                 // Kubo RPC URL, e.g. http://127.0.0.1:5001
  gremlin?: string,             // Gremlin Server WS URL; omit ⇒ cache disabled, DAG-walk resolution only
  chain: {
    rpcUrl: string,             // Ethereum JSON-RPC
    registry: `0x${string}`,    // GraniteRegistry address
  },
  key?: `0x${string}`,          // publisher private key; omit ⇒ read-only instance
  maxMountDepth?: number,       // bound on node-mount traversal (FR-014); default 8
}

function connect(config: GraniteConfig): Promise<Granite>
Granite.close(): Promise<void>
```

Errors: unreachable Kubo/chain/Gremlin endpoints throw on first use (not on
`connect`), naming the endpoint.

## Publishing (US1 / FR-001..006)

```ts
type Tree = {
  data?: Record<string, unknown>,
  edges?: Record<string, { props?: Record<string, unknown>, child: Tree | CID }>,
  mounts?: {
    source: CID | `0x${string}`,   // Node CID, or publisher address (FR-014)
    path?: string,                 // address sources only: mount the node at this path
                                   // within the publisher's graph (Spot → Spot, live)
    order: number,                 // higher shadows lower; own edges shadow all mounts
  }[],
}

Granite.publish(tree: Tree): Promise<{
  update: CID,       // the Update document's CID
  root: CID,         // top Node CID
  prev?: CID,        // chained previous Update (absent on first publish)
}>
```

- Requires `key`; throws `MissingKeyError` otherwise.
- Writes all Node docs + Update doc to IPFS, records the Update CID in the
  registry, and broadcasts a signed announcement — one call, no follow-ups
  (SC-005).
- `child: CID` grafts an existing subtree by reference (dedup / partial
  update support).
- Trees are partial snapshots (FR-013): publish only the paths being
  asserted — older layers of the chain keep serving everything else through
  fall-through.

## Reading (US2, US4 / FR-009, FR-010, FR-012)

```ts
type Mount = { source: CID | `0x${string}` }   // Update CID, or publisher ⇒ their entire
                                                // update chain, newest shadowing oldest (FR-013)

Granite.stack(mounts: Mount[], alias?: string): Promise<Stack>

Stack.resolve(path: string): Promise<Resolved | undefined>
type Resolved = {
  node: CID,
  data?: Record<string, unknown>,
  edges: Record<string, { props?: Record<string, unknown>, child: CID }>,
  via: CID,          // the Update that won the shadow contest for this path
}
```

- Stack identity is the key derived from the ordered mount sources (see
  cache-schema.md); `alias` is a cosmetic label — identical mount lists are
  the same stack, in and out of the cache.
- Resolution honors published node mounts (FR-014): own edges shadow mounted
  content, mounts shadow by `order`, traversal bounded by `maxMountDepth`.
- Retrieval is incremental (FR-015): only documents along the consulted
  resolution paths are fetched; a cache miss hydrates exactly the missing
  node — fetch counts never scale with graph size (SC-007).
- `undefined` ⇔ path present in no mount (definitive not-present).
- Unreachable `child` or NodeMount target mid-walk ⇒ `UnreachableNodeError`
  carrying the CID; likewise falling through past an unreachable `prev` link
  in an expanded chain — partial snapshots mean absence cannot be asserted
  across a break.
- Malformed document ⇒ `MalformedDocumentError` carrying CID + field.
- Deterministic: same stack + path + depth bound ⇒ same result (SC-004).

## Cache (FR-009 performance path)

```ts
Stack.hydrate(): Promise<void>       // OPTIONAL eager warm-up: materialize the whole stack for
                                     // traversal-style queries; resolve hydrates lazily on its own
Stack.invalidate(): Promise<void>    // mark stale; next resolve rehydrates affected publishers
```

With `gremlin` configured, `resolve` is cache-first with DAG fall-back and
write-back; without it, resolution walks the DAG directly. Results MUST be
identical either way (agreement invariant, data-model.md).

## Discovery & history (US3 / FR-007, FR-008, FR-011)

```ts
Granite.latest(publisher: `0x${string}`): Promise<CID | undefined>   // registry read; undefined ⇒ never published

Granite.history(from: `0x${string}` | CID): AsyncIterable<{
  update: CID,
  publisher: `0x${string}`,
  prev?: CID,
  at: number,
}>                                    // newest → oldest; throws UnreachableNodeError on a broken
                                      // chain link; never-published address ⇒ empty iterable

Granite.follow(handler: (a: Announcement) => void): () => void       // verified announcements only; returns unsubscribe
type Announcement = { publisher: `0x${string}`, root: CID, prev?: CID, at: number }
```

## Keys (FR-005)

```ts
generateKey(): `0x${string}`                     // random secp256k1 private key
addressOf(key: `0x${string}`): `0x${string}`     // publisher identity
```

## Error taxonomy

| Error | Thrown when |
|-------|-------------|
| `MissingKeyError` | write operation on a read-only instance |
| `MalformedDocumentError` | fetched document violates the data-model shape (FR-012) |
| `UnreachableNodeError` | a linked CID cannot be retrieved during a walk |
| `RegistryError` | registry read/write reverts or the RPC fails |

Absence is never an error: `resolve` → `undefined`, `latest` → `undefined`.
