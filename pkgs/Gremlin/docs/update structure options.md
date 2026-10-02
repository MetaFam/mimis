# Update Structure Options

Three candidate layouts for how `Update`s are published and how the trees under them are stored, followed by how multiple devices combine.

The running example is one user with this tree:

```text
/
├── music/
│   └── song  (audio/mpeg)
└── docs/
    └── cv    (application/pdf)
```

Update 1 imports everything. Update 2 edits `cv`. Update 3 deletes `song`.

Legend: 🟧 orange nodes are newly written, ⬜ grey nodes are reused from an earlier update, 🟦 blue nodes are search-tree blocks, and dashed arrows are references by UUID or `previous` links rather than hash links from parent to child.

## Option A: Delta Layers (current document)

Each `Update` holds only the changed nodes plus the intermediate `Spot`s needed to reach them from the root. Every `Update` root is mounted in `Layers` forever, ordered by the negative of its creation time.

```mermaid
flowchart TD
  user["User 0xAb…"]
  user -->|HAS| layers["Layers"]
  user -->|"USES device=laptop"| updates["Updates"]

  updates -->|SPANS| up1["Update seq 1"]
  updates -->|SPANS| up2["Update seq 2"]
  updates -->|SPANS| up3["Update seq 3"]
  up3 -.->|previous| up2
  up2 -.->|previous| up1

  layers -->|"MOUNT order −300"| r3
  layers -->|"MOUNT order −200"| r2
  layers -->|"MOUNT order −100"| r1

  subgraph d1["Update 1: import"]
    r1["/"] -->|music| m1["music"]
    r1 -->|docs| dc1["docs"]
    m1 -->|song| s1["song"]
    dc1 -->|cv| cv1["cv"]
    s1 -->|audio/mpeg| b1[("blob")]
    cv1 -->|application/pdf| b2[("blob")]
  end

  subgraph d2["Update 2: edit cv"]
    r2["/"] -->|docs| dc2["docs"]
    dc2 -->|cv| cv2["cv"]
    cv2 -->|application/pdf| b3[("blob′")]
  end

  subgraph d3["Update 3: delete song"]
    r3["/"] -->|music| m3["music"]
    m3 -->|song| s3["song ✝ deleted"]
  end

  up1 -->|IS| r1
  up2 -->|IS| r2
  up3 -->|IS| r3

  classDef new fill:#f6c28b,stroke:#b5651d,color:#000
  classDef tomb fill:#e8a0a0,stroke:#8b0000,color:#000
  class r1,m1,dc1,s1,cv1,b1,b2,r2,dc2,cv2,b3,r3,m3 new
  class s3 tomb
```

Resolving `/music/song` walks layer −300 and hits the tombstone (410). Resolving a path nobody ever created walks every layer before returning 404, so the cost grows with the number of updates. The intermediate `/` and `docs` nodes are rewritten in every delta that touches something below them.

## Option B: Snapshot Merkle Tree

Each `Update` is a complete tree. `CONTAINS` links point at children by CID, so unchanged subtrees are shared between versions, just like git. Only the latest head is mounted. Other paths to a `Spot` are floating mounts by UUID.

```mermaid
flowchart TD
  subgraph v1["Update seq 1"]
    r1["/ (cid a1)"]
    m1["music (cid m1)"]
    dc1["docs (cid d1)"]
    s1["song (cid s1)"]
    cv1["cv (cid c1)"]
  end

  subgraph v2["Update seq 2: edit cv"]
    r2["/ (cid a2)"]
    dc2["docs (cid d2)"]
    cv2["cv (cid c2)"]
  end

  subgraph v3["Update seq 3: delete song, add favorites"]
    r3["/ (cid a3)"]
    m3["music (cid m3)"]
    f3["favorites (cid f3)"]
  end

  r1 -->|music| m1
  r1 -->|docs| dc1
  m1 -->|song| s1
  dc1 -->|cv| cv1
  s1 -->|audio/mpeg| b1[("blob")]
  cv1 -->|application/pdf| b2[("blob")]

  r2 -->|music| m1
  r2 -->|docs| dc2
  dc2 -->|cv| cv2
  cv2 -->|application/pdf| b3[("blob′")]

  r3 -->|music| m3
  r3 -->|docs| dc2
  r3 -->|favorites| f3
  f3 -.->|"MOUNT → uuid(cv)"| cv2

  layers["Layers"] ==>|"MOUNT (head only)"| r3
  r3 -.->|previous| r2
  r2 -.->|previous| r1

  classDef new fill:#f6c28b,stroke:#b5651d,color:#000
  class r1,m1,dc1,s1,cv1,b1,b2,r2,dc2,cv2,b3,r3,m3,f3 new
```

- Editing `cv` rewrites `cv → docs → /`: three documents, the depth of the change.
- Update 2's `/` points at the **same** `music (m1)` as update 1, and Update 3's `/` points at the **same** `docs (d2)` as update 2.
- Deleting `song` means `music (m3)` doesn't list it. No tombstone.
- `favorites` reaches `cv` through a floating mount by UUID, so it follows future edits to `cv` without being rewritten when `cv` changes.
- Each folder's CID covers everything below it, so `/ipfs/a3/docs/cv` works in a gateway.

## Option C: UUID Table (everything floating)

Each `Update` root is `{ rootUUID, spots }`, where `spots` is an ordered Merkle search tree mapping UUID → `Spot` CID. `Spot` documents name their children by UUID, so no path is preferred and a `Spot` can have any number of parents.

### Layout of one snapshot

```mermaid
flowchart TD
  commit["Update seq 1<br/>root: {rootUUID: u0, spots: t1}"]
  commit --> t1["search tree root t1"]

  t1 --> n1["node<br/>u0 … u3"]
  t1 --> n2["node<br/>u4 … u9"]

  n1 -->|u0| sr["Spot u0 /"]
  n1 -->|u1| sm["Spot u1 music"]
  n1 -->|u2| sd["Spot u2 docs"]
  n2 -->|u4| ss["Spot u4 song"]
  n2 -->|u5| sc["Spot u5 cv"]
  n2 -->|u6| sp["Spot u6 playlists"]

  sr -.->|"contains music = u1"| sm
  sr -.->|"contains docs = u2"| sd
  sr -.->|"contains playlists = u6"| sp
  sm -.->|"contains song = u4"| ss
  sd -.->|"contains cv = u5"| sc
  sp -.->|"contains favorite = u4"| ss

  ss -->|audio/mpeg| b1[("blob")]
  sc -->|application/pdf| b2[("blob")]

  classDef table fill:#cfe2f3,stroke:#3d6e9e,color:#000
  classDef spot fill:#f6c28b,stroke:#b5651d,color:#000
  class t1,n1,n2 table
  class sr,sm,sd,ss,sc,sp spot
```

Solid arrows are hash links. Dashed arrows are names, resolved by looking the UUID up in the table. `song` is reachable as both `/music/song` and `/playlists/favorite`, and neither path is preferred.

### Editing `cv` (Update 2)

```mermaid
flowchart TD
  c1["Update seq 1<br/>spots: t1"] --> t1["tree root t1"]
  c2["Update seq 2<br/>spots: t2"] --> t2["tree root t2"]

  t1 --> n1["node u0 … u3"]
  t1 --> n2["node u4 … u9"]
  t2 --> n1
  t2 --> n2b["node′ u4 … u9"]

  n1 --> rest["Spots u0, u1, u2<br/>(unchanged)"]
  n2 --> ss["Spot u4 song"]
  n2 --> sc["Spot u5 cv"]
  n2b --> ss
  n2b --> sc2["Spot u5 cv′"]

  sc -->|application/pdf| b2[("blob")]
  sc2 -->|application/pdf| b3[("blob′")]

  c2 -.->|previous| c1

  classDef new fill:#f6c28b,stroke:#b5651d,color:#000
  classDef shared fill:#e0e0e0,stroke:#777,color:#000
  class c2,t2,n2b,sc2,b3 new
  class c1,t1,n1,n2,rest,ss,sc,b2 shared
```

Only the `cv` document and the search-tree path above its entry are rewritten. `docs` and `/` are untouched because they refer to `cv` by UUID `u5`, which didn't change. The trade-off is that `docs` no longer has a CID covering its contents.

### Resolving a path: B vs C

```mermaid
sequenceDiagram
  participant C as Client
  participant I as IPFS

  Note over C,I: Option B: /music/song
  C->>I: get root (cid a3)
  I-->>C: music = m3
  C->>I: get m3
  I-->>C: song = s1
  C->>I: get s1
  I-->>C: audio/mpeg = blob

  Note over C,I: Option C: /music/song
  C->>I: get commit
  I-->>C: rootUUID u0, spots t1
  loop for each of u0, u1, u4
    C->>I: walk search tree t1 for uuid (~log n blocks, top levels cached)
    I-->>C: Spot cid
    C->>I: get Spot
    I-->>C: contains next = uuid
  end
```

## Combining Devices

This applies to options B and C. Each device signs its own chain. When a device imports another device's head, it merges it into its own tree and records what it has seen in `seen`.

```mermaid
%%{init: { 'gitGraph': { 'mainBranchName': 'laptop' } } }%%
gitGraph
  commit id: "L1 seen{L1}"
  commit id: "L2 seen{L2}"
  branch phone
  checkout phone
  commit id: "P1 seen{L2,P1}"
  checkout laptop
  commit id: "L3 seen{L3}"
  checkout phone
  commit id: "P2 seen{L2,P2}"
  checkout laptop
  merge phone id: "L4 seen{L4,P2}"
```

- After `L3` and `P2`, neither head's `seen` covers the other, so they are **concurrent**: both are mounted and merged entry by entry.
- `L4` has seen `P2`, so it **dominates**: only `L4` is mounted until the phone publishes again.

### Merging concurrent heads

```mermaid
flowchart LR
  subgraph L3["Laptop head L3 · seen {L:3, P:0}"]
    la["contains.song<br/>dot L:1"]
    lb["contains.cv<br/>dot L:3"]
  end

  subgraph P2["Phone head P2 · seen {L:2, P:2}"]
    pa["(song removed)"]
    pb["contains.cv<br/>dot L:1"]
    pc["contains.notes<br/>dot P:2"]
  end

  subgraph M["Merged view"]
    ma["song: dropped<br/>P2 saw L:1 and removed it"]
    mb["cv: L3's version<br/>P2 hasn't seen L:3"]
    mc["notes: kept<br/>L3 hasn't seen P:2"]
  end

  la --> ma
  pa --> ma
  lb --> mb
  pb --> mb
  pc --> mc
```

An entry present in one head and absent from another survives only if the head missing it has not already seen the entry's dot. Two different values for the same key, each unseen by the other head, are a real conflict and need a deterministic tiebreak.
