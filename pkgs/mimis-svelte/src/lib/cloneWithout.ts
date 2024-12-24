/**
 * Deep clone an object skipping a spcified list of attributes.
 */
export const cloneWithout: any = (
  root: any, attrs: Array<string>,
) => {
  if(Array.isArray(root)) {
    return root.map((node) => cloneWithout(node, attrs))
  }
  if(typeof root === 'object') {
    const out: Record<string, unknown> = {}
    for(const attr in root) {
      if(!attrs.includes(attr)) {
        out[attr] = cloneWithout(root[attr], attrs)
      }
    }
    return out
  }
  return root
}
