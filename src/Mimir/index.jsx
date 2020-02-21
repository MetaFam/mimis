import React, { useState, useEffect, useRef } from 'react'
import './index.scss'
import { Link, useHistory } from 'react-router-dom'
import { Button, Carousel, Tooltip, Icon, Menu, Dropdown, Tag, Input } from 'antd'
import { useLocation } from 'react-router-dom'
import { useDB } from 'react-pouchdb'
import Hammer from 'react-hammerjs'
import * as Z from '../Unzip'
const { zip } = Z

export default (props) => {
  const [docs, setDocs] = useState([])
  const [styles, setStyles] = useState([])
  const location = useLocation()
  const params = (new URLSearchParams(location.search))
  const [url, setURL] = useState(params.get('url') || props.url)
  const frame = useRef()
  const [images, setImages] = useState([])
  const [size, setSize] = useState(100)
  const [paths, setPaths] = useState([])
  const [view, setView] = useState('html')
  const history = useHistory()
  const carousel = useRef()
  const db = useDB()

  const setPage = (p) => {
    if(isNaN(p)) return
    const f = frame.current
    if(!f) return
    f.scrollTo(p * f.clientWidth, 0)
  }
  
  const deltaPage = (d) => {
    const f = frame.current
    if(!f) return
    const curr = Math.round(f.scrollLeft / f.clientWidth)
    setPage(curr + d)
  }

  const listeners = {
    wheel: (evt) => {
      const delta = evt.deltaX + evt.deltaY
      const pages = Math.abs(delta) / delta
      deltaPage(pages)
    },
    keyup: (evt) => {
      if(evt.key === 'ArrowDown' || evt.key === 'ArrowRight') {
        deltaPage(1)
      } else if(evt.key === 'ArrowUp' || evt.key === 'ArrowLeft') {
        deltaPage(-1)
      } else if(evt.key === 'PageUp') {
        deltaPage(-5)
      } else if(evt.key === 'PageDown') {
        deltaPage(5)
      } else if(evt.key === '-') {
        setSize(size => size - 10)
      } else if(evt.key === '+') {
        setSize(size => size + 10)
      }
    },
  }

  useEffect(() => {
    Object.keys(listeners).forEach((t) => {
      window.addEventListener(t, listeners[t])
    })
    return () => {
      Object.keys(listeners).forEach((t) => {
        window.removeEventListener(t, listeners[t])
      })
    }
  }, [listeners])

  useEffect(() => {
    const scroll = () => {
      // Make sure the window is on an even multiple of
      // the page width
      const f = frame.current
      const fs = f.clientWidth
      const s = f.scrollLeft
      const page = s / fs
      if(Math.abs(page - Math.round(page)) > 0.2) {
        setPage(Math.floor(page))
      }
    }

    const f = frame.current
    f.addEventListener('scroll', scroll)
    return () => {
      f.removeEventListener('scroll', scroll)
    }
  }, [frame])
  
  useEffect(() => {
    const hash = props.hash.split('/').shift()
    db.query('paths/contains', { key: hash })
    .then((res) => {
      setPaths(res.rows.map((r => r.value)))
    })
  }, [props.hash, db])

  const process = (entries) => {
    const content = entries.find(
      e => e.filename === 'OEBPS/content.opf'
    )
    const writer = new zip.BlobWriter('text/xml')
    content.getData(writer, (blob) => {
      const reader = new FileReader()
      reader.onload = async () => {
        const doc = (new DOMParser()).parseFromString(reader.result, 'text/html')
        const spine = doc.querySelectorAll('spine itemref')
        let manifest = [], images = {}, styles = []
        for(const val of spine.values()) {
          const ref = val.attributes['idref'].value
          const item = doc.querySelector(`manifest #${ref}`)
          const file = item.attributes['href'].value
          manifest.push(entries.find(
            e => e.filename === `OEBPS/${file}`
          ))
        }
        let promises = []
        doc.querySelectorAll('item').forEach((item) => {
          const type = item.attributes['media-type'].value
          const href = item.attributes['href'].value
          if(/^(image\/|text\/css)/.test(type)) {
            promises.push(new Promise((resolve, reject) => {
              const writer = new zip.BlobWriter(type)
              const entry = entries.find(
                e => e.filename === `OEBPS/${href}`
              )
              entry.getData(writer, (blob) => {
                if(/^image\//.test(type)) {
                  images[href] = URL.createObjectURL(blob)
                } else if(type === 'text/css') {
                  styles.push(URL.createObjectURL(blob))
                }
                resolve()
              })
            }))
          }
        })
        await Promise.allSettled(promises)
        setStyles(styles)
        setImages(images)
        promises = manifest.map((m) => 
          new Promise((resolve, reject) => {
            const writer = new zip.BlobWriter('text/html')
            m.getData(writer, (blob) => {
              const reader = new FileReader()
              reader.onload = () => {
                const doc = (new DOMParser()).parseFromString(reader.result, 'text/html')
                doc.querySelectorAll('img').forEach((img) => {
                  const href = img.attributes['src'].value
                  img.setAttribute('src', images[href])
                  img.setAttribute('id', images[href])
                })
                doc.querySelectorAll('a').forEach((link) => {
                  if(link.attributes['href']) {
                    const href = link.attributes['href'].value
                    if(/#/.test(href)) {
                      link.setAttribute('href', href.replace(/^.*#/, '#'))
                    }
                  } else {
                    //console.log(link)
                  }
                })
                resolve(doc)
              }
              reader.readAsText(blob)
            })
          })
        )
        Promise.allSettled(promises).then((res) => {
          let elems = res.map(r => r.value.querySelectorAll('body > *'))
          elems = elems.map(e => Array.from(e)).flat()
          setDocs(elems)
        })
      }
      reader.readAsText(blob)
    })
  }

  useEffect(() => {
    const reader = new zip.HttpReader(url)
    zip.createReader(reader, function(zipReader) {
      zipReader.getEntries(process)
    }, console.error)
  }, [url])

  const onTap = (evt) => {
    const w = evt.target.offsetWidth
    let x = (evt.center.x - evt.target.offsetLeft % w) / w
    if(x <= 0.25) deltaPage(-1)
    if(x > 0.25) deltaPage(1)
  }

  const onSwipe = (evt) => {
    if(evt.deltaX < 0) {
      deltaPage(-1)
    } else {
      deltaPage(1)
    }
  }

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

  return <div className='mimir'>
    <nav>
      <span title='Content' className='title-icon'>📖</span>
      <Button title='Back' onClick={() => history.goBack()}><Icon type='arrow-left'/></Button>
      <Link title='Home' to='/'><Button><Icon type='home'/></Button></Link>
      {paths.length > 0 &&
        <Dropdown overlay={pathList} trigger={['click', 'hover']}>
          <Button title='Paths'><Icon type='unordered-list'/></Button>
        </Dropdown>
      }
      <Button title='Images' type={view === 'images' ? 'primary' : 'default'} onClick={() => setView('images')}><Icon type='file-image'/></Button>
      <Button title='HTML' type={view === 'html' ? 'primary' : 'default'} onClick={() => setView('html')}><Icon type='html5'/></Button>
      <a href='//github.com/dhappy/mimis' className='github'>
        <Button title='Github'><Icon type='github'/></Button>
      </a>
    </nav>
    {view === 'images' && <div className='carousel'>
      <Button className='nav left' onClick={() => carousel.current.prev()}><Icon type='arrow-left'/></Button>
      <Button className='nav right' onClick={() => carousel.current.next()}><Icon type='arrow-right'/></Button>
      <Carousel ref={carousel}>
        {Object.values(images).map((img, idx) => (
          <div key={idx}><Tooltip title={img}>
            <Link to={`/book/${img}/index.html#img`}>
              <img alt={img} src={img}/>
            </Link>
          </Tooltip></div>
        ))}
      </Carousel>
    </div>}
    {view === 'html' && <div className='content'>
      {url ? '' : <div className='input'>
        <h2>EPub URL:</h2>
        <Input onPressEnter={evt => setURL(evt.target.value)}/>
      </div>}
      {styles.map((s, i) => <link key={i} rel='stylesheet' href={s}/>)}
      <div className='frame' style={{fontSize: `${size}%`}} ref={frame}>
        <Hammer onTap={onTap} onSwipe={onSwipe}><div className='content'>
          {docs.map((d, i) => (
            <div key={i} dangerouslySetInnerHTML={{__html: d.outerHTML}}/>
          ))}
        </div></Hammer>
      </div>
    </div>}
  </div>
}