import type { Record as Neo4jRecord } from 'neo4j-driver'

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

export const records2Object = (records: Array<Neo4jRecord>) => (
  records.map((rec) => (
    Object.fromEntries(rec.keys.map((key) => (
      [key, rec.get(key)]
    )))
  ))
)

let count = 0
export const identify = (objArray: Array<Record<string, unknown>>) => (
  objArray.map((obj, idx) => ({ id: ++count, ...obj } as Entry))
)
