import CommitCompare from './util/CommitCompare'
import GitCommit from './GitCommit'
import GitTag from './GitTag'
import GitBlob from './GitBlob'
import GitTree from './GitTree'
import Ref from './util/Ref'

const DEFAULT_HEAD_REF = 'refs/heads/master'

//TODO: cleanup
class GitRepo {
  constructor(cid, headObj, defaultBranch, ipfs) {
    this.cid = cid
    this.defaultBranch = defaultBranch
    // Note: this is a Promise
    this.refs = Ref.getRefHeads(headObj, ipfs)
  }

  async refHead(refNick) {
    let object = await this.refCommit(refNick)
    if(object instanceof GitTag)
      object = await object.taggedObject()
    return object
  }

  async refCommit(refNick) {
    const refs = await this.refs
    return Ref.refCommit(refs, this.defaultBranch, refNick)
  }

  fetchCommitComparison(refNicks, onUpdate) {
    return new CommitCompare(this, refNicks, onUpdate).start()
  }

  async getObject(path, ipfs) {
    console.debug('Fetch', path)
    const data = (await ipfs.dag.get(path)).value
    // If this is a Uint8Array treat it as a Git blob
    if (data instanceof Uint8Array) {
      console.debug('%cGot blob', 'color: blue', path)
      return new GitBlob(data, path)
    }
    // If it has a gitType commit treat it as a commit
    if (data.gitType === 'commit') {
      const c = new GitCommit(this, data, path)
      console.debug('%cGot commit', 'color: blue', path, `'${c.summary}'`)
      return c
    }
    // If it has a gitType tag treat it as a tag
    if (data.gitType === 'tag') {
      console.debug('Got tag', path)
      return new GitTag(this, data, path)
    }
    // Otherwise assume git tree
    console.debug('%cGot tree', 'color: blue', path)
    return new GitTree(this, data, path, ipfs)
  }

  static async fetch(cid, ipfs) {
    const repo = await ipfs.dag.get(cid).then(r => r.value)
    console.log('%c repo', 'color: red', repo)
    const defaultBranch = await GitRepo.getDefaultBranch(repo, ipfs)
    return new GitRepo(cid, repo, defaultBranch, ipfs)
  }

  static async getDefaultBranch(dagRepo, ipfs) {
    const head = dagRepo._links.find(l => l._name === 'HEAD')
    if (!head) return DEFAULT_HEAD_REF

    console.debug('cid', head._cid)
    return (await ipfs.cat(head._cid)).toString()
  }

  static wrapGitObject(obj, cid) {
    if(obj instanceof Blob) {
      return new GitBlob(obj, cid)
    }
    switch (obj.gitType) {
      case 'commit':
        return new GitCommit(this, obj, cid)
      case 'tag':
        return new GitTag(this, obj, cid)
      default:
        return new GitTree(this, obj, cid)
    }
  }
}

export default GitRepo
