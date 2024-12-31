import { settings } from '$lib/settings.svelte'

export const toHTTP = ({
  url, cid,
}: {
  url?: string | null; cid?: string | null;
}) => {
  if((!url && !cid) || (url && cid)) {
    throw new Error('Must provide either `url` xor `cid`.')
  }
  let path: Array<string> = []
  if(url != null) {
    [,, cid, ...path] = Array.from(
      /^(ipfs:\/\/)?([^/]+)(\/.*)?$/.exec(url) ?? []
    )
  } else if(cid != null) {
    [cid, ...path] = cid.split('/')
  }
  if(cid == null) {
    throw new Error('Could not determine `cid`.')
  }
  return (
    settings.ipfsConversion
    .replace('{cid}', cid)
    .replace('{path}', path.join('/'))
  )
}