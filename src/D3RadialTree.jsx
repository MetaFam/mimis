import * as d3 from 'd3'
import { useEffect, useRef } from 'react'

const width = 1024, radius = width / 2

const autoBox = () => {
  document.body.appendChild(this)
  const {x, y, width, height} = this.getBBox()
  document.body.removeChild(this)
  return [x, y, width, height]
}

const tree = (
  d3.tree()
  .size([2 * Math.PI, radius])
  .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth)
)

const chart = ({ svg: svgNode, graph }) => {
  const root = tree(graph)
  const svg = d3.select(svgNode)

  svg
  .append('g')
    .attr('fill', 'none')
    .attr('stroke', '#555')
    .attr('stroke-opacity', 0.4)
    .attr('stroke-width', 1.5)
  .selectAll('path')
  .data(root.links())
  .join('path')
    .attr('d', d3.linkRadial()
      .angle(d => d.x)
      .radius(d => d.y));

  svg
  .append('g')
  .selectAll('circle')
  .data(root.descendants())
  .join('circle')
    .attr('transform', d => `
      rotate(${d.x * 180 / Math.PI - 90})
      translate(${d.y},0)
    `)
    .attr('fill', d => d.children ? '#555' : '#999')
    .attr('r', 2.5);

  svg
  .append('g')
    .attr('font-family', 'sans-serif')
    .attr('font-size', 10)
    .attr('stroke-linejoin', 'round')
    .attr('stroke-width', 3)
  .selectAll('text')
  .data(root.descendants())
  .join('text')
    .attr('transform', d => `
      rotate(${d.x * 180 / Math.PI - 90}) 
      translate(${d.y},0) 
      rotate(${d.x >= Math.PI ? 180 : 0})
    `)
    .attr('dy', '0.31em')
    .attr('x', d => d.x < Math.PI === !d.children ? 6 : -6)
    .attr('text-anchor', d => d.x < Math.PI === !d.children ? 'start' : 'end')
    .text(d => d.data.name)
  .clone(true).lower()
    .attr('stroke', 'white');

  return svg.attr('viewBox', autoBox).node();
}

export default ({ graph }) => {
  const svg = useRef()
  const generate = () => {
    if(graph && svg.current) {
      chart({ svg: svg.current, graph })
    }
  }
  useEffect(generate, [graph])

  console.info({ graph })

  return <svg ref={svg}/>
}