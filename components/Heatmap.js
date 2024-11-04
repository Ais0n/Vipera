import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const Heatmap = ({ data }) => {
    const defaultData = [
        { category: 'Female', values: { true: 0.8, false: 0.2 } },
        { category: 'Male', values: { true: 0.5, false: 0.5 } },
        { category: 'Others', values: { true: 0.3, false: 0.7 } },
    ];

    if (!data) {
        data = defaultData;
    }

    const svgRef_heatmap = useRef();
    const heatmapData = data || defaultData;

    useEffect(() => {
        const svg = d3.select(svgRef_heatmap.current);
        const _width = svg.node().clientWidth;
        const _height = svg.node().clientHeight;

        svg.selectAll('*').remove(); // Clear previous content

        if (data.length === 0) return;

        const margin = { top: 20, right: 10, bottom: 60, left: 40 }; // Increased bottom margin for x-axis labels
        const width = _width - margin.left - margin.right;
        const height = _height - margin.top - margin.bottom;

        let yValues = new Set();
        data.forEach(d => Object.keys(d.values).forEach(key => yValues.add(key)));
        yValues = Array.from(yValues);

        const x = d3.scaleBand()
            .range([0, width])
            .domain(heatmapData.map(d => d.category))
            .padding(0.1);

        const y = d3.scaleBand()
            .range([height, 0])
            .domain(yValues)
            .padding(0.1);

        const colorScale = d3.scaleSequential()
            .interpolator(d3.interpolateGreys)
            .domain([0, 1]);

        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        g.selectAll(".cell")
            .data(heatmapData)
            .enter().append("g")
            .attr("class", "cell")
            .attr("transform", (d) => `translate(${x(d.category)},0)`)
            .selectAll("rect")
            .data(d => yValues.map(key => ({ key, value: d.values[key] })))
            .enter().append("rect")
            .attr("x", d => x(d.key))
            .attr("y", d => y(d.key))
            .attr("width", x.bandwidth())
            .attr("height", y.bandwidth())
            .attr("fill", d => colorScale(d.value));

        // X-axis with rotated labels
        const xAxis = g.append("g")
            .attr("class", "x axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));

        // Rotate x-axis labels
        xAxis.selectAll("text")
            .attr("transform", "rotate(-45)") // Rotate labels by -45 degrees
            .attr("text-anchor", "end") // Align text to the end
            .attr("dx", "-0.5em") // Adjust position
            .attr("dy", "0.5em"); // Adjust position

        // Y-axis
        g.append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft(y));
    }, [heatmapData]);

    return (
        <div style={{ overflowX: 'scroll', width: '100%', height: '100%' }}>
            <svg ref={svgRef_heatmap} style={{ width: '100%', height: '100%' }} />
        </div>
    );
};

export default Heatmap;