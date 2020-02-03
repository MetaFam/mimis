import React, { useState, useEffect, useRef } from 'react'
import { useDB } from 'react-pouchdb'
import { Link, useParams, useHistory } from 'react-router-dom'
import { Button, Carousel, Tooltip } from 'antd'
import './index.scss'

export default (props) => {
  const params = useParams()
  const hash = params[0]
  const db = useDB()
  const [docs, setDocs] = useState([])
  const [images, setImages] = useState([])
  const history = useHistory()
  const carousel = useRef(null)

  useEffect(
    () => {
      db.allDocs({
        startkey: hash, endkey: `${hash}\uFFF0`,
        limit: 500, include_docs: true,
      })
      .then((res) => {
        const entries = res.rows.map((r) => ({
          path: r.id,
          name: r.doc.path.slice(-1)[0],
        }))

        let images = []
        let files = []
        entries.forEach((e) => {
          if(/(png|jpg|jpeg|gif)$/.test(e.name)) {
            images.push(e)
          } else {
            files.push(e)
          }
        })

        setDocs(files)
        setImages(images)
      })
    },
    [hash]
  )

  return <React.Fragment>
    <Button title='Back' onClick={() => history.goBack()}>←</Button>
    <hr/>
    {images.length > 0 && <Carousel ref={carousel}>
      {images.map((img, idx) => (
        <div><Tooltip title={img.name}>
          <img alt={img.name} src={`//ipfs.io/ipfs/${img.path}`}/>
        </Tooltip></div>
      ))}
    </Carousel>}
    <Button className='img-nav' onClick={() => carousel.current.prev()}>←</Button>
    <Button className='img-nav' onClick={() => carousel.current.next()}>→</Button>
    <ul>{docs.map((d, i) => (
      <li key={i}><Link to={`/hash/${d.path}`}>{d.name}</Link></li>
    ))}</ul>
  </React.Fragment>
}