export const cloneWithout: unknown = (
  root: unknown, attrs: Array<string>,
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
