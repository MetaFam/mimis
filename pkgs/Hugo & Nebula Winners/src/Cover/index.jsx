import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useDB } from 'react-pouchdb'
import { Link } from 'react-router-dom'
import { Tag, Button, Tree, Tabs } from 'antd'
import './index.scss'
import { ProfileOutlined, FileOutlined, FileImageOutlined, EyeOutlined } from '@ant-design/icons';
import * as CarouselLib from 'react-responsive-carousel'
import 'react-responsive-carousel/lib/styles/carousel.css'
const Carousel = CarouselLib.Carousel
const { TabPane } = Tabs

export default (props) => {
  const key = useParams()[0]
  const [paths, setPaths] = useState([])
  const [repo, setRepo] = useState()
  const [images, setImages] = useState([])
  const [book, setBook] = useState()
  const [tree, setTree] = useState([])
  const [file, setFile] = useState()
  const db = useDB()

  useEffect(() => {
    db.query('paths/contains', { key: key })
      .then((res) => {
        const ret = res.rows.map((r => r.value))
        console.log('P', key, ret)
        setPaths(res.rows.map((r => r.value)))
      })
  }, [key, db])

  useEffect(() => {
    db.query('paths/contents', { key: key })
      .then((res) => {
        let contents = {}
        res.rows.forEach(c => Object.assign(contents, c.value))

        setRepo(contents['.'])

        if (contents.covers) {
          const covers = Object.keys(contents.covers)
          .filter(key => key !== '.')
          .reduce((res, key) => res.add(contents.covers[key]), new Set())
          setImages([...covers])
        } else {
          setImages(
            Object.keys(contents)
            .filter(key => /^cover\./i.test(key))
            .reduce((res, key) => (res[key] = contents[key], res), {})
          )
        }

        if(contents['META-INF']) {
          setBook(contents['.'])
        }

        const makeTree = (obj) => {
          const tree = []
          Object.keys(obj).forEach((key) => {
            const val = obj[key]
            if(typeof(val) === 'string') {
              if(key !== '.') {
                tree.push({ title: key, key: val })
              }
            } else {
              tree.push({ title: key, key: `${val['.']}/`, children: makeTree(val) })
            }
          })
          return tree
        }

        setTree(makeTree(contents))
      })
  }, [key, db])

  const onSelect = (keys) => {
    if(keys.length === 1) {
      setFile(keys[0])
    }
  }

  return <div id='book'><Tabs defaultActiveKey='files'>
    <TabPane tab={<Link to="/">📚</Link>} key="home"/>
    <TabPane key='paths'
      tab={<span><ProfileOutlined /> Paths</span>}
    >
      <ul>
        {paths.map((path) => <li>
          {path.slice(1).map((d, i) => {
            const q = JSON.stringify(path.slice(1, i + 2))
            return <Link className='tag-link' to={`/?q=${q}`} key={i}>
              <Tag>{d}</Tag>
            </Link>
          })}
        </li>)}
      </ul>
      {repo && <p>Checkout This Using: <code>git clone ipfs::{repo}</code></p>}
    </TabPane>
    <TabPane key='read'
      tab={<span><EyeOutlined /> Read</span>}
    >
      {book
        ? <iframe src={`/readium/?epub=http://localhost:8080/ipfs/${book}`}/>
        : <Button>Contribute</Button>
      }
    </TabPane>
    <TabPane key='files'
      tab={<span><FileOutlined /> Files</span>}
    >
      <div className='files'>
        {<div className='tree'><Tree treeData={tree} onSelect={onSelect}/></div>}
        {file && <div className='view'><iframe className='content' src={`//ipfs.io/ipfs/${file}`}/></div>}
      </div>
    </TabPane>
    <TabPane key='covers'
      tab={<span><FileImageOutlined /> Covers</span>}
    >
      {images.length > 0 && <Carousel>
        {images.map((id, i) => (
          <img key={i} src={`//ipfs.io/ipfs/${id}`} />
        ))}
      </Carousel>}
      {images.length === 0 && <Link to={`/add?to=${key}`}><Button>Add Cover</Button></Link>}
    </TabPane>
  </Tabs></div>
}