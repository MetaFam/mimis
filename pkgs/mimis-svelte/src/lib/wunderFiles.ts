import type { WunderbaumOptions } from 'wb_options'
import { Wunderbaum } from 'wunderbaum'

export const wunderFiles = (
  { mount, ...opts }:
  { mount: string } & Partial<WunderbaumOptions>
) => {
  const element = (
    document.getElementById(mount) as HTMLDivElement
  )
  element.replaceChildren()
  return new Wunderbaum({
    element,
    selectMode: 'hier',
    checkbox: true,
    columnsFilterable: true,
    columnsResizable: true,
    columnsSortable: true,
    columnsMenu: true,
    fixedCol: false,

    columns: [
      { id: '*', title: 'Path', width: '300px' },
      {
        id: 'childCount', title: 'Children',
        width: '70px',	classes: 'wb-numeric',
      },
      {
        id: 'size', title: 'Size',
        width: '120px',	classes: 'wb-numeric',
      },
    ],
    render: (evt) => {
      const { node } = evt

      for (const col of (
        Object.values(evt.renderColInfosById)
      )) {
        if(col.elem) {
          let val = node.data[col.id]
          if(typeof val === 'number') {
            val = val.toLocaleString()
          }
          if(!!val && col.id === 'size') {
            val = `${val} B`
          }
          col.elem.textContent = val
        }
      }
    },
    ...opts,
  })
}