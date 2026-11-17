export const PAGE_SIZE = 100

/** A query’s `/`-separated parts, without the blank ones. */
export const partsOf = (query: string) => (
  query.split('/').filter((part) => part.trim().length > 0)
)
