import React, { useState, useEffect, useContext } from 'react'
import { Button } from 'antd'
import JSZip from 'jszip'
import GitRepo from "./IGiS/lib/git/GitRepo";
import GitTree from "./IGiS/lib/git/GitTree";
import GitBlob from "./IGiS/lib/git/GitBlob";
import FileSaver from "file-saver";
import IPFSContext from './IPFSContext'

export default (props) => {
  const [ipfs] = useContext(IPFSContext)
  const { cid, onLoad } = props
  const [processing, setProcessing] = useState(false)
  const [current, setCurrent] = useState()
  const [repo, setRepo] = useState()

  useEffect(() => {
    console.log('IPFS', ipfs)
    if(ipfs) {
      GitRepo.fetch(cid, ipfs).then(setRepo)
    }
  }, [cid, ipfs])

  const populateTree = (zipDir, path, name, ipfs) => {
    setCurrent((path || '').split('/').slice(1).join('/'))
    console.debug('%crepo', 'color: orange', repo)
    return repo.getObject(path, ipfs)
    .then(data => {
      console.debug('%cRepo Got', 'color: red', name)
      if(data instanceof GitBlob) {
        console.debug('storing', name)
        zipDir.file(name, data.content, {base64: true})
        return Promise.resolve()
        .then(a => console.log('%cDone', 'color: yellow', name))
      } else if(data instanceof GitTree) {
        let promises = data.files.map(d => {
          let child = zipDir
          if(name !== '') {
            child = zipDir.folder(name)
          }
          console.debug('%crecurse', 'color: red', path + '/' + d.name)
          return populateTree(child, path + '/' + d.name + '/hash', d.name, ipfs)
          .then(a => console.log('%cDone', 'color: green', d.name))
        })

        console.log('%cprep', 'color: red', path, name)
        return Promise.allSettled(promises)
        .then(a => console.log('Done', name))
      }
    })
  }

  const handleClick = () => {
    setProcessing(true)
    setCurrent('preparing')

    let zip = new JSZip()
    populateTree(zip, cid + '/refs/heads/master/tree', '', ipfs)
    .then(() => {
      setCurrent('finalizing')
      zip.generateAsync({type: 'blob'})
      .then(content => {
        onLoad(URL.createObjectURL(content))
        setProcessing(false)
        //FileSaver.saveAs(content, 'repository.zip')
      })
    })
  }

  return (
    <Button onClick={handleClick} disabled={!repo}>
      {processing ? current : 'Download Zip'}
    </Button>
  )
}
