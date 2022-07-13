import { SiweMessage as SIWEMessage } from 'siwe'

export type Maybe<T> = T | null

export type Path = Array<string>

export type APIError = {
  message: string
}

// Cast to a type without needing “as unknown”
export type Force<T> = T

export type LoginResponse = {
  ens: Maybe<string>
  address: Maybe<string>
}

export type MeResponse = {
  ens?: Maybe<string>
  avatar?: Maybe<string>
  address: string
  siwe?: SIWEMessage
  expirationTime?: number
}

export type LogoutResponse = {
  success: boolean
}

export type NonceResponse = {
  nonce: string
}

// Used by PathsetInput to track the active
// path atom and specify its movement through
// the the list of lists.
export type Pathset = Array<Path>
export type PathsetArg = {
  paths: Pathset
}
export type PathsetPosition = {
  pidx: number
}
export type PathsetAtomPosition = {
  aidx: number
} & PathsetPosition
export type RemovePathAtomProps = (
  PathsetArg & PathsetAtomPosition
)
export type AddPathAtomProps = {
    atom?: string
} & RemovePathAtomProps
export type RemovePathProps = (
  PathsetArg & PathsetPosition
)
export type AddPathProps = {
    path?: Path
} & RemovePathProps