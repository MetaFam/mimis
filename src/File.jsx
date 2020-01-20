import React from 'react'
import { Link } from 'react-router-dom'

export default ({ name, path }) => {
  return <Link to={`/hash/${path}`}>{name}</Link>
}