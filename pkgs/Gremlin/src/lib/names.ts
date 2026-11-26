import { error } from '@sveltejs/kit'

/** Why `name` can’t name a Spot, or `null` if it can (FR-007). */
export function nameProblem(name: string) {
  const trimmed = name.trim()
  const why = (
    trimmed === '' ? 'it’s empty'
    : trimmed === '.' || trimmed === '..' ? 'it’s reserved'
    : trimmed.includes('/') ? 'it contains “/”'
    : null
  )
  return why && `“${name}” isn’t a name: ${why}.`
}

/** `name`, trimmed, or a `400` saying why it can’t name a Spot. */
export function validName(name: string) {
  const problem = nameProblem(name)
  if(problem) error(400, problem)
  return name.trim()
}
