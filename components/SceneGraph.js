import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import style from '../styles/SceneGraph.module.css';

const SceneGraph = ({ data }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || !data.nodes || !data.edges) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svg.node().getBoundingClientRect().width;
    const height = svg.node().getBoundingClientRect().height;

    const simulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(data.edges).id(d => d.id).distance(150)) // Increase link distance
      .force('charge', d3.forceManyBody().strength(-500)) // Increase repulsive force
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius(d => Math.sqrt(d.size) * 12 + 5)); // Add collision force


    const link = svg.append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(data.edges)
      .join('line')
      .attr('stroke-width', d => Math.sqrt(d.size) * 3);

    // Add edge labels
    // setTimeout(() => {
    //   const edgeLabelBg = svg.append('g')
    //     .attr('font-family', 'sans-serif')
    //     .attr('font-size', 12)
    //     .selectAll('text')
    //     .data(data.edges)
    //     .join('rect')
    //     .attr('x', d => {return (d.source.x + d.target.x) / 2 - (d.type ? d.type.length * 4 : 0)})
    //     .attr('y', d => {return (d.source.y + d.target.y) / 2 - 9})
    //     .attr('width', d => d.type ? d.type.length * 8 : 0) // Approximate width calculation
    //     .attr('height', 12)
    //     .attr('fill', 'lightgrey')
    //     .attr('rx', 4) // Set border radius
    //     .attr('ry', 4) // Set border radius

    //   const edgeLabel = svg.append('g')
    //     .attr('font-family', 'sans-serif')
    //     .attr('font-size', 12)
    //     .selectAll('text')
    //     .data(data.edges)
    //     .join('text')
    //     .attr('x', d => {return (d.source.x + d.target.x) / 2})
    //     .attr('y', d => {return (d.source.y + d.target.y) / 2})
    //     // .attr('dy', '0.35em')
    //     .attr('text-anchor', 'middle')
    //     .text(d => !d.type ? '' : d.type.length > 10 ? (d.type.slice(0, 8) + '..') : d.type)
    //     .style('opacity', d => d.type ? 1 : 0)
    // }, 2500)
    
    const node = svg.append('g')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .selectAll('circle')
      .data(data.nodes)
      .join('circle')
      .attr('r', d => Math.sqrt(d.size) * 15)
      .attr('fill', d => d3.hsl(d.ntype == 'object' ? 180 : 90, 0.5, d.ntype == 'object' ?  0.5 : 0.5 - 0.5 * d.bias))
      .call(drag(simulation));

    node.append('title')
      .text(d => d.id);   
      
    const label = svg.append('g')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 12)
      .selectAll('text')
      .data(data.nodes)
      .join('text')
      .attr('x', d => d.x)
      .attr('y', d => d.y)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .style('pointer-events', 'none')
      .text(d => d.id)
      .style('opacity', d => d.ntype == 'object' ? 1 : 0);

    node.on('mouseover', function (event, d) {
      // console.log(event, d)
      d3.select(this)
        .transition()
        .duration(200)
        .attr('r', Math.sqrt(d.size) * 20);
      label.filter(node => node == d)
        .transition()
        .duration(200)
        .style('opacity', 1);
      
      // Update tooltip content with a bar chart
      if(d.ntype != 'attribute') return;
      const tooltip_g = svg.append('g')
        .attr('class', 'tooltip');
      console.log(tooltip_g)

      const barWidth = 50;
      const barHeight = 20;
      const barPadding = 5;

      const data = Object.entries(d.values);

      const x = d3.scaleLinear()
        .range([0, barWidth])
        .domain([0, d3.max(data, ([_, value]) => value)]);

      const y = d3.scaleBand()
        .range([0, data.length * (barHeight + barPadding)])
        .padding(0.1);

      tooltip_g.append('rect')
        .attr('x', event.offsetX + 10)
        .attr('y', event.offsetY + 10)
        .attr('width', barWidth + 120)
        .attr('height', data.length * (barHeight + barPadding) + 40)
        .attr('fill', 'white')
        .attr('stroke', '#ccc');

      const bars = tooltip_g.selectAll('.bar')
        .data(data)
        .enter().append('g')
        .attr('transform', (_, i) => `translate(${event.offsetX + 30}, ${event.offsetY + 30 + i * (barHeight + barPadding)})`);

      bars.append('rect')
        .attr('class', 'bar')
        .attr('width', d => x(d[1]))
        .attr('height', barHeight)
        .attr('fill', d3.hsl(d.ntype == 'object' ? 180 : 90, 0.5, 0.5));

      bars.append('text')
        .attr('class', 'bar-label')
        .attr('x', d => x(d[1]) + 5)
        .attr('y', barHeight / 2)
        .attr('dy', '0.35em')
        .text(([label, value]) => `${label}: ${value}`);
    })
    .on('mouseout', function () {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('r', d => Math.sqrt(d.size) * 15);
      label.filter(d => d === this.__data__ && d.ntype != 'object')
        .transition()
        .duration(200)
        .style('opacity', 0);
      svg.select('.tooltip').remove();
    });

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);

      label
        .attr('x', d => d.x)
        .attr('y', d => d.y);
    });

    function drag(simulation) {
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
    }

    // Add zoom and pan functionality
    const zoom = d3.zoom()
      .scaleExtent([0.5, 10]) // Set the minimum and maximum zoom levels
      .on('zoom', (event) => {
        svg.selectAll('g')
          .attr('transform', event.transform);
      });

    svg.call(zoom);
  }, [data]);

  return <svg ref={svgRef} className={style.graphSvg} />;
};

export default SceneGraph;