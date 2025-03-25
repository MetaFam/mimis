import React, { useState, useEffect } from 'react'
import { connect } from '@aragon/connect'
import { Voting } from '@aragon/connect-thegraph-voting'

export default () => {
  const [apps, setApps] = useState([])

  useEffect(() => {(async () => {
    const org = await connect('libre.aragonid.eth', 'thegraph')
    //setApps(await org.apps())

    //console.log((await org.app('voting')).address)
    const voting = new Voting(
      (await org.app('voting')).address,
      'https://api.thegraph.com/subgraphs/name/aragon/aragon-voting-mainnet'
    )
    const votes = await voting.votes()
    setApps(votes)
  })()}, [])

  return (
    <ul>
      {apps.map((app, i) => <li key={i}>{app.metadata}</li>)}
      {/*apps.map((app, i) => <li>{app.name}: {app.address}</li>)*/}
    </ul>
  )
}