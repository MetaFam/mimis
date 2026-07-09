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

## Reading (US2, US4 / FR-009, FR-010, FR-012)

```ts
type Mount = { source: CID | `0x${string}` }   // Update CID, or publisher ⇒ their latest

Granite.stack(name: string, mounts: Mount[]): Promise<Stack>

Stack.resolve(path: string): Promise<Resolved | undefined>
type Resolved = {
  node: CID,
  data?: Record<string, unknown>,
  edges: Record<string, { props?: Record<string, unknown>, child: CID }>,
  via: CID,          // the Update that won the shadow contest for this path
}
```

- `undefined` ⇔ path present in no mount (definitive not-present).
- Unreachable `child` mid-walk ⇒ `UnreachableNodeError` carrying the CID.
- Malformed document ⇒ `MalformedDocumentError` carrying CID + field.
- Deterministic: same stack + path ⇒ same result (SC-004).

## Cache (FR-009 performance path)

```ts
Stack.hydrate(): Promise<void>       // materialize this stack into the cache (idempotent)
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
}>                                    // newest → oldest; throws UnreachableNodeError on a broken chain link

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
