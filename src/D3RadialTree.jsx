import * as d3 from 'd3'
import { chakra } from '@chakra-ui/react'
import { useEffect, useRef } from 'react'

const width = 2000, radius = width / 2

const chart = ({ svg: domNode, graph }) => {
  const svg = (
    d3.select(domNode)
    .attr('viewBox', [0, 0, width, width].join(' '))
  )
  const g = (
    svg.append('g')
    .attr('transform', `translate(${radius},${radius})`)
  )
  const tree = (
    d3.tree()
    .size([360, radius])
    .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth)
  )
  const root = tree(d3.hierarchy(graph))
  const link = (
    g.selectAll('.link')
    .data(root.descendants().slice(1))
    .enter().append('path')
    .attr('class', 'link')
    .attr('d', (d) => (
      'M' + project(d.x, d.y)
      + 'C' + project(d.x, (d.y + d.parent.y) / 2)
      + ' ' + project(d.parent.x, (d.y + d.parent.y) / 2)
      + ' ' + project(d.parent.x, d.parent.y)
    ))
    .style('fill', 'none')
    .style('stroke', 'white')
    .style('stroke-width', 3)
    .style('stroke-opacity', 0.5)
  )
  const node = (
    g.selectAll('.node')
    .data(root.descendants())
    .enter().append('g')
    .attr('class', (d) => `node node--${d.children ? 'internal' : 'leaf'}`)
    .attr('transform', (d) => `translate(${project(d.x, d.y)})`)
  )

  node.append('circle')
  .attr('r', 2.5);

  node.append('text')
  .attr('dy', '.31em')
  .attr('x', (d) => ((d.x < 180) === !d.children) ? 6 : -6)
  .style('text-anchor', (d) => ((d.x < 180) === !d.children) ? 'start' : 'end')
  .attr('transform', (d) => `rotate(${d.x < 180 ? d.x - 90 : d.x + 90})`)
  .text((d) => d.data.name)

  const viewbox = svg.attr('viewBox').split(' ').map(d => +d)
  const extent = [
    [viewbox[0], viewbox[1]],
    [(viewbox[2] - viewbox[0]), (viewbox[3] - viewbox[1])]
  ]
  const brush = (
    d3.brush()
    .extent(extent)
    .on('brush', brushed)
  )
  const zoom = (
    d3.zoom().scaleExtent([0.05, 1]).on('zoom', zoomed)
  )

  svg.call(zoom)

  function brushed(evt) {
    // Ignore brush-via-zoom
    if(evt.sourceEvent && evt.sourceEvent.type === 'zoom') return;

    let sel = evt.selection
    const box = (
      sel ? (
        [
          sel[0][0], sel[0][1],
          (sel[1][0] - sel[0][0]),
          (sel[1][1] - sel[0][1])
        ]
      ) : (
        viewbox
      )
    )
    const k = box[3] / viewbox[3]
    const t = d3.zoomIdentity.translate(box[0], box[1]).scale(k)

    svg
    .attr('viewBox', box.join(' '))
    .property('__zoom', t)
  }

  function zoomed(evt) {
    // Ignore zoom via brush
    if(!evt.sourceEvent || evt.sourceEvent.type === 'brush') return;

    // Process the zoom event on the main SVG
    let t = evt.transform
    t.x = t.x < viewbox[0] ? viewbox[0] : t.x
    t.x = t.x > viewbox[2] ? viewbox[2] : t.x
    t.y = t.y < viewbox[1] ? viewbox[1] : t.y
    t.y = t.y > viewbox[3] ? viewbox[3] : t.y
    if(t.k === 1) t.x = t.y = 0

    const box = [t.x, t.y, viewbox[2] * t.k, viewbox[3] * t.k]

    svg.attr('viewBox', box.join(' '))
  }
}

function project(x, y) {
  var angle = (x - 90) / 180 * Math.PI, radius = y;
  return [radius * Math.cos(angle), radius * Math.sin(angle)];
}

export default ({ graph }) => {
  const svg = useRef()
  const generate = () => {
    if(graph && svg.current) {
      chart({ svg: svg.current, graph })
    }
  }
  useEffect(generate, [graph])

  return (
    <chakra.svg
      ref={svg}
      w="100vw" h="100vh"
      fill="white"
    />
  )
}