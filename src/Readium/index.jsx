import React, { useEffect } from 'react'
import { Readium } from '@evidentpoint/readium-js'

console.log(Readium)

export default (props) => {
  useEffect(() => {
    const readiumOptions = { jsLibRoot: '/' }
    const readerOptions = { el: '#reader' }
    const readium = new Readium(readiumOptions, readerOptions)
    readium.openPackageDocument(props.url)
  }, [props.url])

  return <div id='reader'></div>
}