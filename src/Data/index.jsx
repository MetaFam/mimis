import React, { useState, useEffect } from 'react'
import './index.scss'
import { useDB } from 'react-pouchdb'
//import { Carousel } from 'antd' // doesn't load
import { Button, Icon } from 'antd'
import { Link, useHistory } from 'react-router-dom'
import * as CarouselLib from 'react-responsive-carousel'
import 'react-responsive-carousel/lib/styles/carousel.css'
const Carousel = CarouselLib.Carousel

export default (props) => {
  const { contents, path, hash } = props
  const [docs, setDocs] = useState([])
  const [covers, setCovers] = useState([])
  const [book, setBook] = useState()
  const [epub, setEPub] = useState()
  const [html, setHTML] = useState()
  const history = useHistory()

  const pullMimis = (key) => {
    if(key) {
      return fetch(`//ipfs.io/ipfs/${key}`)
      .then(res => res.json())
      .then(data => setBook(data))
    }
  }

  useEffect(() => {
    if(contents.covers && Object.keys(contents.covers).length > 0) {
      const covers = Object.keys(contents.covers)
      .filter(key => key !== '.')
      .reduce((res, key) => res.add(contents.covers[key]), new Set())
      setCovers([...covers])
    } else {
      const covers = Object.keys(contents)
      .filter(key => /^cover\.(jpg|jpeg|gif|svg|png|tiff)/.test(key))
      .reduce((res, key) => res.add(contents[key]), new Set())
      setCovers([...covers])

      console.log('C', covers)

      if(covers.size === 0) {
        console.debug('Mimis', path)
        contents['mimis.json'] && pullMimis(contents['mimis.json'])
      }
    }

    let epubFound = false
    if(contents['index.epub']) {
      setEPub(contents['index.epub'])
      epubFound = true
    }
    if(contents['META-INF']) { // exploded
      setEPub(contents['.'])
      epubFound = true
    }
    if(!epubFound) {
      contents['index.html'] && setHTML(contents['.'] + '/index.html')
      contents['index.xhtml'] && setHTML(contents['.'] + '/index.xhtml')
    }
  }, [contents])

  const onSelect = cover => history.push(`/cover/${path}`)

  const Head = () => {
    if(covers.length > 0) {
      return <div>
        <Carousel
          onClickItem={idx => onSelect(covers[idx])}
          showThumbs={false && covers.length !== 1}
          showIndicators={false}
        >
          {covers.map((c, i) => (
            <img key={i} alt={path} src={`//ipfs.io/ipfs/${c}`}/>
          ))}
        </Carousel>
      </div>
    } else if(book) {
      return <div style={{marginTop: '2em'}}>
        <Link to={`/cover/${path}`}>
          <h1>{book.title}</h1>
          <h2>by {book.author}</h2>
        </Link>
      </div>
  } else {
      return <div style={{marginTop: '2em'}}>
        <h3>{path}</h3>
      </div>
    }
  }

  return <div className='mimis-fileentry'>
    <Head/>
    {epub && <a href={`/readium/?epub=//localhost:8080/ipfs/${epub}`} style={{position: 'absolute', top: 0, left: 0 }}>
      📖
    </a>}
    {html && <a href={`//ipfs.io/ipfs/${html}`}>
      <Button style={{position: 'absolute', top: 0, left: 0 }}><Icon type='html5'/></Button>
    </a>}
    {covers.length === 0 && <ul className='mimis-filelist'>
      {docs.map((d, i) => <li key={i}>{d.path.slice(1).join('/')}</li>)}
    </ul>}
  </div>
}