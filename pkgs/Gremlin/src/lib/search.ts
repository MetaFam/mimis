export const PAGE_SIZE = 100

/**
 * A query’s parts, without the blank ones: it splits at `/`s & spaces,
 * except between `"`s, which keep what they hold exactly as typed. An
 * unclosed `"` holds the rest of the query.
 */
export const partsOf = (query: string) => (
  query.split('"')
  // The even pieces are outside quotes, & the odd ones inside.
  .flatMap((piece, index) => (
    index % 2 === 0 ? piece.split(/[/\s]/) : [piece]
  ))
  .filter((part) => part.trim().length > 0)
)
