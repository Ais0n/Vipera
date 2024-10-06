import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as Utils from '../utils.js';

const TreeView = ({ data, handleBarHover, handleNodeHover }) => {
    if (!data || data == {}) { return null; }

    const svgRef = useRef();

    const createTree = () => {
        const width = 700;
        const height = 850;
        const barHeight = 60; // Fixed height for the bar chart area

        // Clear previous SVG content
        d3.select(svgRef.current).selectAll('*').remove();

        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height);

        const g = svg.append('g').attr('transform', 'translate(40,20)');
        const rectHeight = 30;
        let _data = Utils.deepClone(data);
        const root = d3.hierarchy(_data);
        const treeLayout = d3.tree().size([height, width - 20]);

        treeLayout(root);

        const linkGenerator = d3.linkVertical()
            .x(d => d.y)
            .y(d => d.x);

        g.selectAll('.link')
            .data(root.links())
            .enter().append('path')
            .attr('class', 'link')
            .attr('d', d => {
                let sourceY = d.source.y;
                let targetY = d.target.y;

                if (d.source.data.name === 'values') {
                    sourceY += 30;
                }
                if (d.target.data.name === 'values') {
                    targetY += 30;
                }

                const sourceX = d.source.x + 15;
                const targetX = d.target.x + 15;

                return linkGenerator({
                    source: { x: sourceX, y: sourceY },
                    target: { x: targetX, y: targetY }
                });
            })
            .attr('fill', 'none')
            .attr('stroke', '#ccc')
            .attr('stroke-width', '2');

        const nodes = g.selectAll('.node')
            .data(root.descendants())
            .enter().append('g')
            .attr('class', 'node')
            .attr('transform', d => {
                const rectWidth = d.depth == 0 ? 20 : getTextWidth(d.data.name) + 20;
                let rectHeight = d.data.name === 'values' ? 60 : 30;
                return `translate(${d.y - rectWidth / 2},${d.x - rectHeight / 2})`;
            });

        function getTextWidth(text) {
            const textElement = document.createElement('span');
            textElement.textContent = text;
            document.body.appendChild(textElement);
            const width = textElement.offsetWidth;
            document.body.removeChild(textElement);
            return width + 30;
        }

        let rects = nodes.append('rect')
            .attr('width', d => d.depth == 0 ? 30 : getTextWidth(d.data.name) + 20)
            .attr('height', d => d.data.name === 'values' ? 80 : rectHeight)
            .attr('fill', d => (d.depth === 0 ? 'grey' : '#fff'))
            .attr('stroke', '#333')
            .attr('rx', 5)
            .attr('ry', 5)
            .attr('transform', `translate(0,${rectHeight / 2})`)

        rects.filter(d => d.data.name != 'values')
            .on('mouseover', function (event, d) {
                console.log(d);
                handleNodeHover(d.data.imageInfo);
            })
            .on('mouseout', function (event, d) {
                handleNodeHover(null);
            });

        rects.filter(d => d.data.name == 'values')
            .on('mouseover', function (event, d) {
                console.log(d);
                let imageIds = [];
                d.data.list.forEach(dataItem => {
                    imageIds.push(...dataItem.imageId);
                });
                handleBarHover({imageId: imageIds});
            })
            .on('mouseout', function (event, d) {
                handleNodeHover(null);
            });

        nodes.filter(d => d.data.name != 'values').append('text')
            .attr('dy', '1.2em')
            .attr('x', d => {
                const rectWidth = getTextWidth(d.data.name) + 20;
                return rectWidth / 2;
            })
            .attr('y', rectHeight / 2)
            .style('text-anchor', 'middle')
            .text(d => {
                if (d.depth === 0) return '';
                const text = `${d.data.name}`;
                return text + ` (${d.data.count})`;
            })
            .attr('pointer-events', 'none')

        // stacked bar chart
        nodes.filter(d => d.data.name === 'values')
            .each(function (d) {

                console.log(d)
                if(!d.data.list) return;
                const g = d3.select(this);

                // Define dimensions based on the container size
                const chartWidth = getTextWidth(d.data.name) + 20; // Adjust based on your layout
                const chartHeight = 60; // Adjust as needed
                const margin = { top: 0, right: 0, bottom: 0, left: 0 };

                // Create a group for the chart
                const chartGroup = g.append('g')
                    .attr('transform', `translate(${margin.left},${margin.top})`);

                // Set up color scale based on batch
                const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

                // Create scales
                const xScale = d3.scaleBand()
                    .domain(d.data.list.map(d => d.dataItem))
                    .range([0, chartWidth])
                    .padding(0.1);

                // group by batch and calculate the maximum count
                let maxCount = 0;
                let dataItemMap = {};
                d.data.list.forEach(dataItem => {
                    if (!dataItemMap[dataItem.dataItem]) {
                        dataItemMap[dataItem.dataItem] = 0;
                    }
                    dataItemMap[dataItem.dataItem] += dataItem.count;
                    maxCount = Math.max(maxCount, dataItemMap[dataItem.dataItem]);
                });
                console.log(d.data.list, maxCount)

                // Stack the data for the bars
                let yOffset = 25;
                d.data.list.forEach(dataItem => {
                    let height = dataItem.count / maxCount * (chartHeight - 15);
                    chartGroup.append('rect')
                        .attr('x', xScale(dataItem.dataItem)) // Use xScale to position bars
                        .attr('y', yOffset) // Position bars
                        .attr('width', xScale.bandwidth())
                        .attr('height', height)
                        .attr('fill', colorScale(dataItem.batch))
                        .on('mouseover', function (event, d) {
                            console.log(dataItem);
                            event.stopPropagation();
                            handleBarHover(dataItem);
                        })
                        .on('mouseout', function (event, d) {
                            event.stopPropagation();
                            handleBarHover(null);
                        });

                    // Add count labels on top of each bar
                    chartGroup.append('text')
                        .attr('x', xScale(dataItem.dataItem) + xScale.bandwidth() / 2) // Center label
                        .attr('y', yOffset + height / 2 + 5) // Position label above the bar
                        .attr('text-anchor', 'middle')
                        .text(dataItem.count);

                    yOffset += height;
                });

                // Add x-axis labels (no axis)
                chartGroup.selectAll('.x-axis-label')
                    .data(d.data.list)
                    .enter().append('text')
                    .attr('class', 'x-axis-label')
                    .attr('x', d => xScale(d.dataItem) + xScale.bandwidth() / 2) // Center label
                    .attr('y', yOffset + 18) // Position below the bars
                    .attr('text-anchor', 'middle')
                    .text(d => d.dataItem);
            });

        const zoom = d3.zoom()
            .scaleExtent([0.25, 2])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });

        svg.call(zoom);

        svg.transition()
            .duration(750)
            .call(zoom.transform, d3.zoomIdentity.translate(40, 20).scale(0.8));
    };

    useEffect(() => {
        createTree();
    }, [data]);

    return (
        <svg ref={svgRef}></svg>
    );
};

export default TreeView;