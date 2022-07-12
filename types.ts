export type Maybe<T> = T | null

export type Path = Array<string>

export type LoginResponse = {
  ens: string
  address: string
}

// Used by PathsetInput to track the active
// path atom and specify its movement through
// the the list of lists.
export type PathsetPosition = {
  paths: Array<Path>
  pidx: number
}
export type PathsetAtomPosition = {
  aidx: number
} & PathsetPosition
export type AddPathAtomProps = {
  atom?: string
} & PathsetAtomPosition
export type AddPathProps = {
  path?: Path
} & PathsetPosition