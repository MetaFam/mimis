import { Record } from 'neo4j-driver'
import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { searchTree } from '$lib/searchTree'
import { toHTTP } from '$lib/toHTTP'

export async function load(
  { url, params }:
  { url: URL, params: Record<string, string> }
): PageServerLoad {
  const { path: search } = params
  const path = search.split('/')
  let type = null
  if(!search.endsWith('/')) {
    ([, type] =  Array.from(
      search.match(/([^/]+)\.\1$/) ?? []
    ))
  }
  console.debug({ search, path, type })
  if(type) {
    const result = await searchTree({ path, type })
    const file = result.find((ret: Record) => (
      ret.get('child')?.labels.includes('File')
    ))
    const { cid } = file?.get('child')?.properties ?? {}
    if(cid) {
      console.debug({ Redirecting: cid })
      throw redirect(303, toHTTP({ cid })) // server only
    }
  }
  return {
    url,
    prop: 'test',
  }
}