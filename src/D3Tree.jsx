import * as d3 from 'd3'
import { useEffect, useRef } from 'react'

// const data = ((()=> {
//   const root = { value: [0, 1] }
//   const queue = [root]
//   let p, size = 0, n = 1 << 6
//   while (++size < n && (p = queue.shift())) {
//     const k = p.value.length - 1
//     const a = { value: (
//       p.value.slice(0, k).concat(p.value[k] + 1)
//     ) }
//     const b = { value: (
//       p.value.slice(0, k).concat(p.value[k] - 1, 2)
//     ) }
//     p.children = k & 1 ? [a, b] : [b, a]
//     queue.push(a, b)
//   }
//   return root
// })())

const width = 640, height = 480, margin = 20

const tree = (data) => {
  const root = d3.hierarchy(data)
  root.dx = 10
  root.dy = width / (root.height + 1)
  return d3.tree().nodeSize([root.dx, root.dy])(root)
}

const chart = ({ svg: svgNode, graph }) => {
  const root = tree(graph)
  let x0 = Infinity
  let x1 = -x0
  root.each((d) => {
    if(d.x > x1) x1 = d.x;
    if(d.x < x0) x0 = d.x;
  })

  const svg = (
    d3.select(svgNode)
    .attr('viewBox', [0, 0, width, x1 - x0 + root.dx * 2])
  )
  const g = (
    svg.append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("transform", `translate(${root.dy / 3},${root.dx - x0})`)
  )
  const link = (
    g.append("g")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", 1.5)
    .selectAll("path")
    .data(root.links())
    .join("path")
    .attr("d",
      d3.linkHorizontal()
      .x(d => d.y)
      .y(d => d.x)
    )
  )
  const node = (
    g.append("g")
    .attr("stroke-linejoin", "round")
    .attr("stroke-width", 3)
    .selectAll("g")
    .data(root.descendants())
    .join("g")
    .attr("transform", d => `translate(${d.y},${d.x})`)
  )

  node.append("circle")
  .attr("fill", d => d.children ? "#555" : "#999")
  .attr("r", 2.5);

  node.append("text")
  .attr("dy", "0.31em")
  .attr("x", d => d.children ? -6 : 6)
  .attr("text-anchor", d => d.children ? "end" : "start")
  .text(d => d.data.name)
  .clone(true).lower()
  .attr("stroke", "white");
  
  return svg.node();
}

const data = {
  name: 'rrt',
  children: [
    { name: 'tst' },
    { name: "tst'n" },
    {
      name: 'prnt',
      children: [
        { name: 'child' },
        { name: 'too' },
      ],
    },    
  ],
}

export default ({ graph }) => {
  const svg = useRef()
  const generate = () => {
    if(graph && svg.current) {
      console.info('GENERATING')
      chart({ svg: svg.current, graph })
    }
  }
  useEffect(generate, [graph])

  console.info({ graph })

  return <svg ref={svg}/>
}