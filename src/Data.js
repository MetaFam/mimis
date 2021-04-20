export const ceramic = {
  // Initial state pulled from IDX for the current user
  'ceramic://1…': {
    didLook: 1,
    children: {
      book: 'ceramic://2…',
      geo: 'ceramic://3…',
      org: 'ceramic://4…',
      user: 'ceramic://5…',
    },
    overrides: [
      'did:3:1…',
      'did:3:2…',
      'did:3:3…',
    ],
  },
  // Dereferenced 'org' from above
  'ceramic://4…': {
    didLook: 1,
    children: {
      '1Hive': 'ceramic://6…',
      MetaGame: 'ceramic://7…',
      'Raid Guild': 'ceramic://8…',
      SourceCred: 'ceramic://9…',
    },
    overrides: [
      'did:3:4…',
    ],
  },
  // Override #1 from ceramic://1…
  'ceramic://0…': {
    didLook: 0,
    children: {
      book: 'ceramic://2…',
      celebrity: 'ceramic://A…',
      geo: 'ceramic://3…',
      porn: 'ceramic://B…',
      org: 'ceramic://C…',
    },
  },
  // Override #2 from ceramic://1…
  'ceramic://D…': {
    didLook: 0,
    children: {
      book: 'ceramic://E…',
      paper: 'ceramic://F…',
      porn: 'ceramic://B…',
      user: 'ceramic://G…',
    },
    overrides: [
      'did:3:5…', // not followed; didLook = 0
    ],
  },
  // Override #3 from ceramic://1…
  'ceramic://H…': {
    didLook: 0,
    children: {
      animal: 'ceramic://I…',
      paper: 'ceramic://F…',
      porn: 'ceramic://J…',
      org: 'ceramic://K…',
    },
    overrides: [
      'did:3:6…', // not followed; didLook = 0
    ],
  },
  // 'MetaGame' entry from ceramic://4…
  'ceramic://7…': {
    didLook: 1,
    children: {
      Players: 'ceramic://L…',
      Quests: 'ceramic://M…',
      'Raid Map': 'ceramic://N…',
      SEED: 'ceramic://O…',
    },
    overrides: [
      'did:3:7…',
    ],
  },
  // overrides for ceramic://4…
  'ceramic://P…': {
    didLook: 0,
    children: {
      geo: 'ceramic://3…',
      image: 'ceramic://Q…',
      org: 'ceramic://K…',
      porn: 'ceramic://B…',
    },
    overrides: [
      'did:3:5…', // not followed; didLook = 0
    ],
  },
  // 'org' for ceramic://0…
  'ceramic://C…': {
    didLook: 0,
    children: {
      MetaCartel: 'ceramic://R…',
      MetaGame: 'ceramic://7…',
      'Raid Guild': 'ceramic://8…',
      Shenanigans: 'ceramic://S…',
    },
    overrides: [
      'did:3:8…', // not followed; didLook = 0
    ],
  },
  // 'org' for ceramic://H…
  'ceramic://K…': {
    didLook: 0,
    children: {
      '1Hive': 'ceramic://6…',
      SourceCred: 'ceramic://T…',
      Panvala: 'ceramic://U…',
      '🔥_🔥': 'ceramic://V…',
    },
    overrides: [
      'did:3:9…', // not followed; didLook = 0
    ],
  },
  // 'Players' entry from ceramic://7…
  'ceramic://L…': {
    didLook: 1,
    children: {
      Players: 'ceramic://L…',
      Quests: 'ceramic://M…',
      'Raid Map': 'ceramic://N…',
      SEED: 'ceramic://O…',
    },
    overrides: [
      'did:3:7…',
    ],
  },

}

export const idx = {
  '∅': 'ceramic://1…',
  '∅(did:3:1…)': 'ceramic://0…',
  '∅(did:3:2…)': 'ceramic://D…',
  '∅(did:3:3…)': 'ceramic://H…',
  '∅(did:3:7…)': 'ceramic://0…',
}