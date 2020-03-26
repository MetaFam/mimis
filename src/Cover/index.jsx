import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useDB } from 'react-pouchdb'
import { Link } from 'react-router-dom'
import { Tag, Button } from 'antd'
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
  const db = useDB()

  useEffect(() => {
    const hash = key
    db.query('paths/contains', { key: hash })
    .then((res) => {
      const ret = res.rows.map((r => r.value))
      console.log('P', ret)
      setPaths(res.rows.map((r => r.value)))
    })
  }, [key, db])

  useEffect(() => {
    db.query('paths/dirs', { key: key })
    .then((res) => {
      console.log('r', res)
      // setDocs(files)
      // setImages(files.filter(f => /^image\//.test(f.type)))
      // setBook(files.find(f => f.name === 'index.epub'))
    })
  }, [key, db])

  return <React.Fragment>
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
    {book && <Link to={`/book/${book.path.join('/')}`}>{book.name}</Link>}
    {images.length > 0 && <Carousel>
      {images.map((d, i) => (
        <img key={i} src={`//ipfs.io/ipfs/${d.path.join('/')}`}/>
      ))}
    </Carousel>}
    {images.length === 0 && <Link to={`/add?to=${key}`}><Button>Add Cover</Button></Link>}
  </React.Fragment>
}