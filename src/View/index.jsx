import React, { useState, useEffect, useRef } from 'react'
import { useDB } from 'react-pouchdb'
import { Link, useParams, useHistory } from 'react-router-dom'
import { Button, Carousel, Tooltip, Icon, Menu, Dropdown, Tag } from 'antd'
import './index.scss'

export default (props) => {
  const params = useParams()
  const hash = params[0]
  const db = useDB()
  const [docs, setDocs] = useState([])
  const [images, setImages] = useState([])
  const [index, setIndex] = useState(null)
  const [paths, setPaths] = useState([])
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
          branch: r.doc.path,
        }))

        let images = []
        let files = []
        entries.forEach((e) => {
          if(/(png|jpg|jpeg|gif)$/.test(e.name)) {
            images.push(e)
          } else if(e.name === 'index.html') {
            setIndex(e)
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

  useEffect(
    () => {
      db.query('paths/contains', { key: hash })
      .then((res) => {
        setPaths(res.rows.map((r => r.value)))
      })
    },
    [hash]
  )

  const pathList = <Menu>
    {paths.map((p, i) => (
      <Menu.Item key={i}>
        {p.slice(1).map((d, i) => {
          const q = JSON.stringify(p.slice(1, i + 2))
          return <Link className='tag-link' to={`/?q=${q}`} key={i}>
            <Tag>{d}</Tag>
          </Link>
        })}
      </Menu.Item>
    ))}
  </Menu>

  const fileList = <Menu>
    {docs.map((d, i) => <Menu.Item key={i}>
      <Link to={`/hash/${d.path}`}>{d.name}</Link>
    </Menu.Item>
    )}
  </Menu>

  return <div className='view'>
    <span title='Info' className='title-icon'>📕</span>
    <Button title='Back' onClick={() => history.goBack()}><Icon type='arrow-left'/></Button>
    <Link to='/'><Button title='Home'><Icon type='home'/></Button></Link>
    {index &&
      <Button title='Index'><Link to={`/book/${index.path}`}><Icon type='html5'/></Link></Button>
    }
    {paths.length > 0 &&
      <Dropdown overlay={pathList} trigger={['click', 'hover']}>
        <Button title='Paths'><Icon type='unordered-list'/></Button>
      </Dropdown>
    }
    {docs.length > 0 &&
      <Dropdown overlay={fileList} trigger={['click', 'hover']}>
        <Button title='Files'><Icon type='folder'/></Button>
      </Dropdown>
    }
    <hr/>
    {images.length > 0 && <Carousel ref={carousel}>
      {images.map((img, idx) => (
        <div key={idx}><Tooltip title={img.name}>
          <Link to={`/book/${img.branch[0]}/index.html#img-${img.branch.slice(1).join('/')}`}>
            <img alt={img.name} src={`//ipfs.io/ipfs/${img.path}`}/>
          </Link>
        </Tooltip></div>
      ))}
    </Carousel>}
    <Button className='img-nav left' onClick={() => carousel.current.prev()}><Icon type='arrow-left'/></Button>
    <Button className='img-nav right' onClick={() => carousel.current.next()}><Icon type='arrow-right'/></Button>
  </div>
}