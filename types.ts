export type Maybe<T> = T | null

export type Path = Array<string>

export type PathsetPosition = {
  paths: Array<Path>
  pidx: number
}
export type PathsetAtomPosition = PathsetPosition & {
  aidx: number
}

export type AddPathAtomProps = {
  atom?: string
} & PathsetAtomPosition

export type AddPathProps = {
  path?: Path
} & PathsetAtomPosition