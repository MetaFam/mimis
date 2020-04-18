import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useDB } from 'react-pouchdb'
import { Link } from 'react-router-dom'
import { Tag, Button, Tree } from 'antd'
import './index.scss'
import * as CarouselLib from 'react-responsive-carousel'
import 'react-responsive-carousel/lib/styles/carousel.css'
const Carousel = CarouselLib.Carousel

export default (props) => {
  const key = useParams()[0]
  const [paths, setPaths] = useState([])
  const [docs, setDocs] = useState([])
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
        console.log('r', contents)
        // setDocs(files)
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
              tree.push({ title: key, key: val })
            } else {
              tree.push({ title: key, key: val['.'], children: makeTree(val) })
            }
          })
          return tree
        }
    
        console.log('CON', contents)
        console.log('T', makeTree(contents))
        setTree(makeTree(contents))
      })
  }, [key, db])

  const onSelect = (keys) => {
    if(keys.length === 1) {
      setFile(keys[0])
    }
  }

  return <div id='book'>
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
    {book
      ? <a href={`/readium/?epub=//localhost:8080/ipfs/${book}`}><Button>Read</Button></a>
      : <Button>Contribute</Button>
    }
    {<Tree treeData={tree} onSelect={onSelect}/>}
    {file && <iframe class='content' src={`//ipfs.io/ipfs/${file}`}/>}
    {images.length > 0 && <Carousel>
      {images.map((id, i) => (
        <img key={i} src={`//ipfs.io/ipfs/${id}`} />
      ))}
    </Carousel>}
    {images.length === 0 && <Link to={`/add?to=${key}`}><Button>Add Cover</Button></Link>}
  </div>
}