import D3Tree from './D3Tree'
import { ceramic as Ceramic, idx as IDX } from './Data'

function Path({ path = '/', searched = 0 }) {
  console.info('path in Path Object', { path, active: path?.active?.() })
  if(path.path) { //path instanceof Path) { // is always false
    this.path = path.path
    console.info('assigned path.path to path', { path: this.path })
  } else if(path?.split && path?.replace) {
    this.path = path.split('/').map((elem) => (
      elem.replace(/%2f/ig, '/').replace(/%25/g, '%')
    ))
    console.info('split path from string', { path: this.path })
    if(this.path.shift() !== '') { // starts with /
      throw new Error("Can't handle relative paths yet.")
    }
  } else {
    this.path = path
  }


  this.searched = searched

  this.active = () => this.path?.[this.searched]

  this.bump = () => ++this.searched

  console.info('this.path of Path Object', { path: this.path, active: this.active() })

  this.search = (term) => {
    if(this.active() === term) {
      this.bump()
      return true
    }
    return false
  } 
}
Path.prototype = []

const subtree = ({ path, ceramic, didLook }) => {
  const active = path.active()
  console.info('BEGIN', { ceramic, active })
  if(didLook < 0) {
    return { name: `look = ${didLook}; Outside Search Tree` }
  }
  console.info('path in subtree function', { path, SRCH: path.searched, active: path.active() })
  const resolution = Ceramic[ceramic]
  let children = []
  if(resolution) {
    const elem = resolution.children?.[path.active()]
    if(elem) {
      console.info("path in child", { path, elem, active: path.active() })
      // const newPath = (
      //   new Path({ path: path.path, searched: path.searched + 1 })
      // )
      const old = path?.active?.()
      path.bump()
      console.info('post-bump in Mock', {
        ldrn: resolution.children,
        path,
        elem,
        children,
        active: Object.assign([], path).active(),
      })
      console.info("path post-copy in child", { old, new: path?.active?.() })
      children.push(
        subtree({
          path,
          ceramic: elem,
          didLook,
        })
      )
    }
    if(resolution.overrides) {
      console.info("path in overrides", { path, overrides: resolution.overrides })
      children = children.concat(
        ...resolution.overrides.map((child) => (
          begin({
            path: new Path({ path }),
            idx: `∅(${child})`,
            didLook: didLook - 1,
          })
        ))
      )
    }
  }
  return {
    name: active ?? resolution?.content,
    children,
  }
}

const begin = ({ path, idx, didLook = 0 }) => {
  console.log('BEGIN', idx)
  if(!(path instanceof Path)) {
    console.info('begin in Mock', { path, active: path?.active?.() })
    path = new Path({ path })
    console.info('parsed path in Mock', { path, active: path?.active?.() })
  }
  return ({
    name: idx,
    children: [subtree({ path, ceramic: IDX[idx], didLook })],
  })
}

export default () => (
  <D3Tree graph={begin({
    path: '/org/MetaGame/players/dysbulic/svg',
    idx: '∅',
    didLook: 1,
  })}/>
)