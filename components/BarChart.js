// components/BarChart.js
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const BarChart = ({ data }) => {
    if (!data) {
        data = [
            { category: 'A', value: 30 },
            { category: 'B', value: 80 },
            { category: 'C', value: 45 },
            { category: 'D', value: 60 },
        ]
    }

    const svgRef_barChart = useRef();

    useEffect(() => {
        const svg = d3.select(svgRef_barChart.current);
        const width = svg.node().clientWidth;
        const height = svg.node().clientHeight;
    
        svg.selectAll('*').remove(); // Clear previous content
    
        if (data.length === 0) return;
    
        const margin = { top: 10, right: 20, bottom: 20, left: 20 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;
    
        const isCategorical = typeof data[0] === 'object' && Object.keys(data[0]).length > 1;
    
        const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    
        if (isCategorical) {
          // Categorical Bar Chart
          const categories = data.map(d => d.category);
          const values = data.map(d => d.value);
    
          const xScale = d3.scaleBand()
            .domain(categories)
            .range([0, innerWidth])
            .padding(0.1);
    
          const yScale = d3.scaleLinear()
            .domain([0, d3.max(values)])
            .range([innerHeight, 0]);
    
          g.append('g')
            .attr('transform', `translate(0, ${innerHeight})`)
            .call(d3.axisBottom(xScale));
    
          g.append('g').call(d3.axisLeft(yScale));
    
          g.selectAll('.bar')
            .data(data)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => xScale(d.category))
            .attr('y', d => yScale(d.value))
            .attr('width', xScale.bandwidth())
            .attr('height', d => innerHeight - yScale(d.value));
        } else {
          // Numerical Histogram
          const bins = d3.histogram()
            .domain([d3.min(data), d3.max(data)])
            .thresholds(10)(data);
    
          const xScale = d3.scaleLinear()
            .domain([d3.min(data), d3.max(data)])
            .range([0, innerWidth]);
    
          const yScale = d3.scaleLinear()
            .domain([0, d3.max(bins, d => d.length)])
            .range([innerHeight, 0]);
    
          g.append('g')
            .attr('transform', `translate(0, ${innerHeight})`)
            .call(d3.axisBottom(xScale));
    
          g.append('g').call(d3.axisLeft(yScale));
    
          g.selectAll('.bar')
            .data(bins)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => xScale(d.x0))
            .attr('y', d => yScale(d.length))
            .attr('width', d => xScale(d.x1) - xScale(d.x0) - 1)
            .attr('height', d => innerHeight - yScale(d.length));
        }
      }, [data]);
    

    return (
        <div style={{ 'overflowX': 'scroll', width: '100%', height: '100%'}}>
            <svg ref={svgRef_barChart} style={{ width: '100%', height: '100%' }} />
        </div>
    );
};

export default BarChart;