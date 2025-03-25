import React from 'react'
import { useLocation } from 'react-router-dom'

export default () => {
  const params = new URLSearchParams(useLocation().search)

  return <h1>Add To: {params.get('to')}</h1>
}