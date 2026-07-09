# Quickstart: Spider & CAR Transfer

Validation guide for feature 002. Interfaces: [contracts/cli.md](./contracts/cli.md); archive rules: [contracts/archive.md](./contracts/archive.md).

## Prerequisites

Everything from feature 001's quickstart (Node ≥ 24, pnpm, Kubo, anvil; Gremlin Server optional), most easily via:

```console
$ pnpm run dev    # anvil + Kubo + Gremlin Server + registry + funded key
```

## Automated validation

```console
$ pnpm test                   # includes walker/selection/validation units
$ pnpm run test:integration   # includes the live spider → load round trip
```

## Manual walkthrough

### US1 — spider interactively (SC-001, SC-006)

```console
$ mkdir -p /tmp/demo/docs && echo 'hello granite' > /tmp/demo/docs/hello.txt && echo 'secret' > /tmp/demo/.env
$ granite spider /tmp/demo
```

**Expect**: a tree UI; `.env` present but dimmed and deselected (hidden); on-screen key hints; space toggles; enter confirms; a `.car` file appears, named after the directory and update.

### US3 — scripted spidering (SC-005)

```console
$ granite spider /tmp/demo --exclude 'docs/*.tmp' --yes --json
{ "car": "demo-….car", "update": "bafy…", "root": "bafy…", "files": 1, "bytes": 14 }
$ granite spider /tmp/demo --exclude '*' --yes; echo "exit: $?"
exit: 1
```

**Expect**: no UI; second run errors on the empty selection.

### US2 — load and resolve (SC-002, SC-003, SC-004)

Simulate a clean machine by wiping what the spider added, then load:

```console
$ granite load demo-….car --json
{ "update": "bafy…", "root": "bafy…", "publisher": "0x…", "blocks": … }
$ granite resolve /docs/hello.txt --mount <update-cid> --json
{ "node": "bafy…", "data": { "content": "bafk…", "size": 14, "type": "text/plain" }, "edges": {}, "via": "bafy…" }
$ ipfs cat <content-cid>
hello granite
$ granite load demo-….car && echo idempotent
idempotent
```

**Expect**: resolution reaches the file leaf; `ipfs cat` returns the exact bytes; the second load succeeds without change.

### Rejection (SC-004)

```console
$ head -c 512 demo-….car > broken.car
$ granite load broken.car; echo "exit: $?"
```

**Expect**: exit 1 with the missing/offending CID named; nothing reported as loaded.
