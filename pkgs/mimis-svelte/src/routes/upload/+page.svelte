<script lang="ts">
  import { CarBlockIterator } from '@ipld/car/iterator'
  import { decode } from '@ipld/dag-pb'
  import { stream2AsyncIterator } from '$lib/stream2AsyncIterator'
  import neo4j from 'neo4j-driver'
  import {
    PUBLIC_NEO4J_URI as uri,
    PUBLIC_NEO4J_USER as user,
    PUBLIC_NEO4J_PASSWORD as pass,
  } from '$env/static/public'
  import { formatBytes } from '$lib/formatBytes'
  import type { DirNode, Node } from '../../types'
  import { wunderFiles } from '$lib/wunderFiles'
  import 'bootstrap-icons/font/bootstrap-icons.css'
  import 'wunderbaum/dist/wunderbaum.css'
  import { selectAll } from '$lib/selectAll';
    import type { ChangeEventHandler } from 'svelte/elements';

  let tree: Wunderbaum | null = null
  let carFile: File | null = null

  const chooseCAR = (event: Event) => {
    carFile = (
      (event.target as HTMLInputElement)?.files?.[0] ?? null
    )
  }

  const onSubmit = async (evt: SubmitEvent) => {
    evt.preventDefault()

    const form = (evt.target as HTMLFormElement)
    const file = carFile
    if(!file) {
      throw new Error('No file selected.')
    }
    const reader = await CarBlockIterator.fromIterable(
      stream2AsyncIterator(file.stream())
    )

    const files: Array<string> = []
    const nodes: Record<string, Array<Node>> = {}
    let last: string | null = null

    for await (const { cid, bytes } of reader) {
      last = cid.toString()
      const decoded = await decode(bytes)
      const { Links: raw } = decoded
      if(raw.length === 0) continue
      if(raw.every(({Name}) => Name === '')) {
        files.push(cid.toString())
        continue
      }
      const formatted = raw.map(({ Name, Tsize, Hash }) => ({
        name: Name, size: Tsize, cid: Hash.toString()
      }))
      nodes[cid.toString()] = formatted.map((link) => {
        const type = (
          files.includes(link.cid) ? 'file' : 'directory'
        )
        const next = ({
          type,
          title: link.name ?? `Unknown ${type}`,
          size: link.size ?? 0,
          cid: link.cid,
        })
        if(type === 'directory') {
          (next as DirNode).children = nodes[link.cid]
        }
        return next as Node
      })
    }
    if(!last) throw new Error('No nodes found.')
    const source = nodes[last]
    selectAll(source)
    const tree = wunderFiles({
      source,
      mount: 'fs-tree',
    })
  }

  const wunder2Neo4j = async () => {
    const driver = neo4j.driver(uri, neo4j.auth.basic(user, pass))
    const serverInfo = await driver.getServerInfo()
    console.debug({ serverInfo })
  }
  </script>

<svelte:head>
  <title>Upload a CAR</title>
</svelte:head>

<form onsubmit={onSubmit}>
  <input type="file" id="car" accept=".car" onchange={chooseCAR}/>
  {#if !!carFile}
    <button>Read CAR</button>
  {/if}
  {#if !!tree}
    <button type="button" onclick={wunder2Neo4j}>
      Neo4j Import
    </button>
  {/if}
</form>

<style>
  form {
    display: flex;
    gap: 1rem;
    place-items: center;
    justify-content: center;
    margin-top: 3rem;
  }
</style>

<div id="fs-tree"></div>

<style>
  form {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-top: 15vh;
  }

  #fs-tree {
    margin: auto;
  }
</style>