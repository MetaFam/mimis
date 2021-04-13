import React, { useState, useEffect, useContext } from 'react'
import * as Diff from 'diff'
import IPFSContext from '../IPFSContext'
import Line from './Line'
import './index.scss'

const isBinary = (str) => /[\x00-\x09\x0E-\x1F]/.test(str)
const ipfsURL = (cid) => `//ipfs.io/ipfs/${cid}`

export default (props) => {
  const [ipfs] = useContext(IPFSContext)
  const [lines, setLines] = useState([])
  const [status, setStatus] = useState()

  const diffLines = (from, to) => {
    const patch = Diff.createPatch(props.filename, from, to).split("\n")

    let line
    do { // skip the header
      line = patch.shift()
    } while(!/^={5,}$/.test(line))

    const lines = []
    let lCnt, rCnt, lName, rName, lQue = [], rQue = []
    patch.forEach(line => {
      if(line.startsWith('---')) {
        rName = line.substring(4)
      } else if(line.startsWith('+++')) {
        lName = line.substring(4)
      } else if(line.startsWith('@@')) {
        let match
        if(match = line.match(/@@ -(?<lno>\d+),(?<lct>\d+)\s+\+(?<rno>\d+),(?<rct>\d+) @@/)) {
          lCnt = match.groups.lno
          rCnt = match.groups.rno
          lines.push({ start: line })
        } else {
          console.error(`Unrecognized: ${line}`)
        }
      } else if(line.startsWith('+')) {
        rQue.push(line.substring(1))
      } else if(line.startsWith('-')) {
        lQue.push(line.substring(1))
      } else {
        while(lQue.length > 0 && rQue.length > 0) {
          let left = lQue.shift(), right = rQue.shift()
          const changes = Diff.diffWordsWithSpace(left, right)
          left = []
          right = []
          for(let part of changes) {
            if(part.added) {
              right.push(<span className='added'>{part.value}</span>)
            } else if(part.removed) {
              left.push(<span className='removed'>{part.value}</span>)
            } else {
              const val = <span>{part.value}</span>
              right.push(val)
              left.push(val)
            }
          }
          lines.push({ type: 'replacement', left: left, right: right, lNum: lCnt++, rNum: rCnt++ })
        }
        while(lQue.length) {
          lines.push({ type: 'left', left: lQue.shift(), lNum: lCnt++ })
        }
        while(rQue.length > 0) {
          lines.push({ type: 'right', right: rQue.shift(), rNum: rCnt++ })
        }
        lines.push({ type: 'match', right: line, left: line, lNum: lCnt++, rNum: rCnt++ })
      }
    })
    return lines
  }

  useEffect(() => {
    (async () => {
      if(ipfs) {
        const [from, to] = await Promise.all(
          [props.from, props.to]
          .map(async cid => {
            if(!cid) {
              return ''
            } else {
              const chunks = []
              for await (const chunk of ipfs.cat(cid)) {
                chunks.push(Buffer.from(chunk))
              }
              return Buffer.concat(chunks).toString()
            }
          })
        )
        if(isBinary(from) || isBinary(to)) {
          if(props.from && props.to) {
            setStatus(<p>
              Changed Binary File
              <a href={ipfsURL(props.from)}>View From</a>
              <a href={ipfsURL(props.to)}>View To</a>
            </p>)
          } else if(props.from) {
            setStatus(<p>
              Removed Binary File
              <a href={ipfsURL(props.from)}>View</a>
            </p>)
          } else if(props.to) {
            setStatus(<p>
              Added Binary File
              <a href={ipfsURL(props.to)}>View</a>
            </p>)
          }
        } else {
          setLines(diffLines(from, to))
        }
      }
    })()
  }, [ipfs])
  
  return <div id='diff'>
    <h1>{props.filename} {props.from && props.from.toString()}/{props.to && props.to.toString()}</h1>

    <div className='status'>{status}</div>

    <ol>
      {lines.map(({ start, right, left, rNum, lNum, type }, i) => {
        return (
          start
          ? <li className='start row' key={i}>{start}</li>
          : <li className={`${type} row`} key={i}>
            <Line num={lNum} text={left} type='left'/>
            <Line num={rNum} text={right} type='right'/>
          </li>
        )
      })}
    </ol>
  </div>
}