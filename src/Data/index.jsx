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
  const { path, hash } = props
  const db = useDB()
  const [docs, setDocs] = useState([])
  const [covers, setCovers] = useState([])
  const [book, setBook] = useState()
  const [mimis, setMimis] = useState()
  const history = useHistory()

  const pullMimis = async (file) => {
    if(file) {
      const data = await fetch(`//ipfs.io/ipfs/${file.id}`)
      setBook((await data.json()).book)
    }
  }

  useEffect(() => {
    db.allDocs({
      startkey: hash, endkey: `${hash}\uFFF0`,
      limit: 500, include_docs: true,
    })
    .then((res) => {
      const files = res.rows.map((r) => ({
        path: r.doc.path, id: r.id,
        name: r.doc.path.slice(-1)[0],
      }))
      setCovers(files.filter((f) => (
        f.path.slice(-2)[0] == 'covers'
      )))
      pullMimis(files.find(f => f.name === 'mimis.json'))
      setDocs(files)
    })
  }, [hash, db])

  const onSelect = cover => history.push(`/cover/${cover.path[0]}`)

  const Head = () => {
    if(covers.length > 0) {
      return <Carousel
        onClickItem={idx => onSelect(covers[idx])}
        showThumbs={false && covers.length !== 1}
        showIndicators={false}
      >
        {covers.map((c, i) => (
          <img key={i} alt={path} src={`//ipfs.io/ipfs/${c.id}`}/>
        ))}
      </Carousel>
    } else if(book) {
      return <Link to={`/cover/${hash}`}>
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