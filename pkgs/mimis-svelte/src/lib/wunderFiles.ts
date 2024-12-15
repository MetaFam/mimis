import type { WunderbaumOptions } from 'wb_options'
import { Wunderbaum } from 'wunderbaum'
import { formatBytes } from './formatBytes'
import type { Node } from '../types'

export const wunderFiles = (
  { mount, ...opts }:
  { mount: string } & Partial<WunderbaumOptions>
) => {
  const element = (
    document.getElementById(mount) as HTMLDivElement
  )
  element.replaceChildren()

  const columns = [
    { id: '*', title: 'Path', width: '300px' },
    {
      id: 'childCount', title: 'Count',
      width: '95px',	classes: 'wb-numeric',
    },
    {
      id: 'size', title: 'Size',
      width: '120px',	classes: 'wb-numeric',
    },
  ]
  if((opts.source?.[0] as Node).cid) {
    columns.push({
      id: 'cid', title: 'CID',
      width: '200px',
    })
  }

  return new Wunderbaum({
    element,
    selectMode: 'hier',
    checkbox: true,
    columnsFilterable: true,
    columnsResizable: true,
    columnsSortable: true,
    columnsMenu: true,
    fixedCol: false,
    columns,

    render: (evt) => {
      const { node } = evt

      for (const col of (
        Object.values(evt.renderColInfosById)
      )) {
        if(col.elem) {
          let val = node.data[col.id]
          if(!!val && col.id === 'size') {
            val = formatBytes(val)
          }
          if(typeof val === 'number') {
            val = val.toLocaleString()
          }
          if(!!val && col.id === 'cid') {
            val = `${val.slice(0, 10)}…${val.slice(-13)}`
          }
          col.elem.textContent = val
        }
      }
    },
    ...opts,
  })
}