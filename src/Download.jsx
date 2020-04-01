import { Button } from 'antd'
import React, { useState, useEffect } from 'react'
import JSZip from 'jszip'
import GitRepo from "./IGiS/lib/git/GitRepo";
import GitTree from "./IGiS/lib/git/GitTree";
import GitBlob from "./IGiS/lib/git/GitBlob";
import FileSaver from "file-saver";

export default (props) => {
  const { cid } = props
  const [processing, setProcessing] = useState(false)
  const [current, setCurrent] = useState()
  const [repo, setRepo] = useState()

  useEffect(() => {
    (async () => setRepo(await GitRepo.fetch(cid)))()
  }, [cid])

  const populateTree = async (zipDir, path, name) => {
    setCurrent((path || '').split('/').slice(1).join('/'))
    console.debug('repo', repo)
    let data = await repo.getObject(path)
    if(data instanceof GitBlob) {
      zipDir.file(name, data.content, {base64: true});
    } else if (data instanceof GitTree) {
      let promises = data.files.map(async d => {
        let child = zipDir
        if(name !== '') {
          child = zipDir.folder(name)
        }
        await this.populateTree(child, path + '/' + d.name + '/hash', d.name)
      })

      await Promise.all(promises)
    }
  }

  const handleClick = () => {
    setProcessing(true)
    setCurrent('preparing')

    let zip = new JSZip()
    populateTree(zip, cid + '/tree', '').then(() => {
      setCurrent('finalizing')
      zip.generateAsync({type: 'blob'})
      .then(content => {
        setProcessing(false)
        FileSaver.saveAs(content, 'repository.zip')
      })
    })
  }

  return (
    <Button onClick={handleClick} disabled={!repo}>
      Download Zip
      {processing && (
        <div className="processing">Zip: {current}</div>
      )}
    </Button>
  )
}
