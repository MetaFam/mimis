import React, { useState, useEffect } from 'react'
import './index.scss'
import { useDB } from 'react-pouchdb'
//import { Carousel } from 'antd'
import Hammer from 'react-hammerjs'
import { Link, useHistory } from 'react-router-dom'
import * as CarouselLib from 'react-responsive-carousel'
import 'react-responsive-carousel/lib/styles/carousel.css'
const Carousel = CarouselLib.Carousel

export default (props) => {
  const { contents, path, hash } = props
  const [docs, setDocs] = useState([])
  const [covers, setCovers] = useState([])
  const [book, setBook] = useState()
  const history = useHistory()

  const pullMimis = (key) => {
    if(key) {
      return fetch(`//ipfs.io/ipfs/${key}`)
      .then(res => res.json())
      .then(data => setBook(data))
    }
  }

  useEffect(() => {
    contents.covers && setCovers(Object.values(contents.covers))
    contents['mimis.json'] && pullMimis(contents['mimis.json'])
  }, [contents])

  const onSelect = cover => history.push(`/cover/${path}`)

  const Head = () => {
    if(covers.length > 0) {
      return <Carousel
        onClickItem={idx => onSelect(covers[idx])}
        showThumbs={false && covers.length !== 1}
        showIndicators={false}
      >
        {covers.map((c, i) => (
          <img key={i} alt={path} src={`//ipfs.io/ipfs/${c}`}/>
        ))}
      </Carousel>
    } else if(book) {
      return <Link to={`/cover/${path}`}>
        <h1>{book.title}</h1>
        <h2>by {book.author}</h2>
      </Link>
    } else {
      return <h3>{path}</h3>
    }
  }

  return <div className='mimis-fileentry'>
    <Head/>
    {covers.length === 0 && <ul className='mimis-filelist'>
      {docs.map((d, i) => <li key={i}>{d.path.slice(1).join('/')}</li>)}
    </ul>}
  </div>
}