import { CID } from 'multiformats/cid'
import { ipfsLinkPattern } from '@/config'
import { Maybe } from '@/types'
import { useContext } from 'react'
import { SettingsContext } from './SettingsContext'

export const verifyNeo4j = () => {
  const vars = [
    'NEO4J_URI',
    'NEO4J_USERNAME',
    'NEO4J_PASSWORD',
    'NEO4J_DATABASE',
  ]
  for(const variable of vars) {
    if(!process.env[variable]) {
      throw new Error(`\`\$${variable}\` unspecified.`)
    }
  }
}

export const httpURL = (uri: Maybe<string>, { gwPattern = ipfsLinkPattern }) => {
  const [, origCID, path] = (
    uri?.match(/^(?:ipfs|dweb):(?:\/\/)?([^/]+)(?:\/(.*))?$/) ?? []
  )

  if(origCID) {
    const cid = CID.parse(origCID)
    const v0CID = cid.toV0().toString()
    const v1CID = cid.toV1().toString()
    const pattern = `http://${gwPattern}`
    return (
      encodeURI(
        pattern
        .replace(/{cid}/g, origCID)
        .replace(/{v0cid}/g, v0CID)
        .replace(/{v1cid}/g, v1CID)
        .replace(/{path}/g, path ?? '')
      )
      .replace(/#/g, '%23')
    )
  }

  return uri
}