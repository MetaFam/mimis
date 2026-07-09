export class MissingKeyError extends Error {
  constructor(operation: string) {
    super(`${operation} requires a publishing key; this instance is read-only.`)
    this.name = 'MissingKeyError'
  }
}

export class MalformedDocumentError extends Error {
  cid: string
  field: string

  constructor(cid: string, field: string, detail: string) {
    super(`Malformed Document ${cid} at ${field}: ${detail}`)
    this.name = 'MalformedDocumentError'
    this.cid = cid
    this.field = field
  }
}

export class UnreachableNodeError extends Error {
  cid: string

  constructor(cid: string, cause?: unknown) {
    super(`Unreachable Document: ${cid}`, { cause })
    this.name = 'UnreachableNodeError'
    this.cid = cid
  }
}

export class RegistryError extends Error {
  constructor(detail: string, cause?: unknown) {
    super(`Registry Failure: ${detail}`, { cause })
    this.name = 'RegistryError'
  }
}