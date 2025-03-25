import { DAGNode } from 'ipld-dag-pb'
import GitRepo from '../GitRepo'
import Ipfs from 'ipfs'

const MAX_REFS_DEPTH = 10

class Ref {
  static async refCommit(refs, defaultBranch, refNick) {
    const [ref] = ['heads', 'tags'].filter(b => refs[`refs/${b}/${refNick}`])
    const refPath = ref ? `refs/${ref}/${refNick}` : defaultBranch
    return refs[refPath]
  }

  static refNick(refPath) {
    return (refPath || '').replace('refs/heads/', '')
      .replace('refs/tags/', '')
  }

  static async getRefHeads(node, ipfs) {
    const refs = {}
    await Ref.walkRefDir(refs, '', node, 1, ipfs)
    return refs
  }

  static walkRefDir(refs, path, node, depth, ipfs) {
    if (depth > MAX_REFS_DEPTH) return

    return Promise.all(node._links.map(async l => {
      const obj = await ipfs.dag.get(l._cid).then(r => r.value)
      if (obj instanceof DAGNode) {
        return Ref.walkRefDir(refs, path + l._name + '/', obj, depth + 1, ipfs)
      }

      refs[path + l.name] = GitRepo.wrapGitObject(obj, l._cid)
    }))
  }
}

export default Ref
