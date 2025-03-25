import React, { useEffect, useState } from 'react'
import { Readium } from '@evidentpoint/readium-js'
import { Button } from 'antd'

export default (props) => <iframe src={`/readium/?epub=${props.url}`}/>
