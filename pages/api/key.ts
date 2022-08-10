import { sessionOpts } from '../../config'
import { APIError, MeResponse } from '../../types'
import crypto from 'node:crypto'
import neo4j from 'neo4j-driver'
import {
  withIronSessionApiRoute
} from 'iron-session/next'
import type {
  NextApiRequest, NextApiResponse,
} from 'next'
import { IronSession } from 'iron-session';
import { verifyNeo4j } from '../../lib/helpers'

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<MeResponse | APIError>,
) => {
  const reqSesh = (
    req.session as IronSession & MeResponse
  )

  if (!reqSesh.siwe) {
    res.status(401).json({ message: 'You have to login.' })

    return
  }

  try {
    verifyNeo4j()
  } catch(error) {
    const { message } = error as Error
    res.status(422).json({ message })
    return
  }

  const driver = neo4j.driver(
    process.env.NEO4J_URI!,
    neo4j.auth.basic(
      process.env.NEO4J_USERNAME!,
      process.env.NEO4J_PASSWORD!,
    ),
    {/* encrypted: 'ENCRYPTION_OFF' */},
  )
  const session = driver.session({
    database: process.env.NEO4J_DATABASE!,
  })

  try {
    if(req.method === 'GET') {
    } else if(req.method === 'POST') {
      const bytes = crypto.randomBytes(
        42 + Math.round(Math.random() * 50)
      )
      const key = bytes.toString('base64')

      const query = `
        MATCH (n)
        RETURN COUNT(n) AS count
      `
      const params = { key }

      const result = await session.run(query, params)

      result.records.forEach((record) => {
        console.log(record.get('count'));
      })
    } else if(req.method === 'DELETE') {
    } else {
    }
  } finally {
    session.close()
    driver.close()
  }
}

export default withIronSessionApiRoute(
  handler, sessionOpts
)
