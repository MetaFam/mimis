export type Op = {
  condition?: () => boolean
  branch?: {
    if?: () => unknown
    else?: () => unknown
  }
}

export function toggle({
  condition = () => true,
  branch = { if: () => {}, else: () => {} }
}: Op) {
  return (() => {
    if(condition?.()) {
      return branch?.if?.()
    } else {
      return branch?.else?.()
    }
  })
}

export function records2Object(records) {
  return (
    records.map((rec) => (
      Object.fromEntries(rec.keys.map((key) => (
        [key, rec.get(key)]
      )))
    ))
  )
}