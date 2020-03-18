import React from 'react'
import PathComplete from '../PathComplete'
import Covers from '../Covers'
import './index.scss'
import { Affix } from 'antd'

export default () => (
  <div className='mimis-browse'>
    <Affix><PathComplete/></Affix>
    <hr/>
    <Covers/>
  </div>
)