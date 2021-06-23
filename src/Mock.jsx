import React from 'react'
import { ceramic as Ceramic, idx as IDX } from './Data'
import D3Tree from './D3Tree'

function Path({ path = '/', searched = 0 }) {
  if(path.path) { //path instanceof Path) { // is always false
    this.path = path.path
  } else if(path?.split && path?.replace) {
    this.path = path.split('/').map((elem) => (
      elem.replace(/%2f/ig, '/').replace(/%25/g, '%')
    ))
    if(this.path.shift() !== '') { // starts with /
      throw new Error("Can't handle relative paths yet.")
    }
  } else {
    this.path = path
  }

  this.searched = searched
  this.active = () => this.path?.[this.searched]
  this.bump = () => ++this.searched
  this.search = (term) => {
    if(this.active() === term) {
      this.bump()
      return true
    }
    return false
  } 
}
Path.prototype = []

const zIndices = [...new Array(10)]

console.info('ZI', { zIndices })

const subtree = ({ path, ceramic, didLook }) => {
  const active = path.active()
  if(didLook < 0) {
    return {
      name: `look = ${didLook}; Outside Search Tree`,
      type: 'out-of-bounds',
    }
  }
  const resolution = Ceramic[ceramic]
  let children = []
  if(resolution) {
    if(resolution.overrides) {
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
    const elem = resolution.children?.[path.active()]
    if(elem) {
      path.bump()
      children.push(
        subtree({
          path,
          ceramic: elem,
          didLook,
        })
      )
    }
  }
  const ret = {
    name: active ?? resolution?.content,
    type: active ? 'context' : 'content'
  }
  if(children.length > 0) {
    ret.children = children
  }
  return ret
}

const begin = ({ path, idx, didLook = 0 }) => {
  if(!(path instanceof Path)) {
    path = new Path({ path })
  }
  return ({
    name: idx,
    children: [subtree({ path, ceramic: IDX[idx], didLook })],
  })
}

export default ({ Grapher = D3Tree }) => (
  <Grapher graph={begin({
    path: '/org/MetaGame/players/dysbulic/svg',
    idx: '∅',
    didLook: 1,
  })}/>
)