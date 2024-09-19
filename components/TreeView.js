import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as Utils from '../utils.js';

const TreeView = ({ data }) => {
    if (!data || data == {}) { return null; }

    const svgRef = useRef();

    const createTree = () => {
        const width = 600;
        const height = 350;

        // Clear previous SVG content
        d3.select(svgRef.current).selectAll('*').remove();

        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height);

        const g = svg.append('g').attr('transform', 'translate(40,20)');

        let _data = Utils.deepClone(data);
        const root = d3.hierarchy(_data);
        const treeLayout = d3.tree().size([height, width - 20]);

        // Create the tree structure
        treeLayout(root);

        // Create a vertical link generator
        const linkGenerator = d3.linkVertical()
            .x(d => d.y)
            .y(d => d.x);

        g.selectAll('.link')
            .data(root.links())
            .enter().append('path')
            .attr('class', 'link')
            .attr('d', d => {
                const sourceY = d.source.y + (d.source.depth === 0 ? 20 : 30);
                const sourceX = d.source.x + 15; // Adjust for rect height
                const targetX = d.target.x + 15; // Adjust for rect height
                const targetY = d.target.y;

                return linkGenerator({
                    source: { x: sourceX, y: sourceY },
                    target: { x: targetX, y: targetY }
                });
            })
            .attr('fill', 'none')
            .attr('stroke', '#ccc')
            .attr('stroke-width', '2');

        const rectHeight = 30;

        // Create nodes
        const nodes = g.selectAll('.node')
            .data(root.descendants())
            .enter().append('g')
            .attr('class', 'node')
            .attr('transform', d => {
                const rectWidth = d.depth == 0 ? 20 : getTextWidth(d.data.name) + 20; // Get width of the rectangle
                return `translate(${d.y - rectWidth / 2},${d.x})`; // Center align the node
            });

        function getTextWidth(text) {
            const textElement = document.createElement('span');
            textElement.textContent = text;
            document.body.appendChild(textElement);
            const width = textElement.offsetWidth;
            document.body.removeChild(textElement);
            return width + 30;
        }

        // Append rectangles to nodes
        nodes.append('rect')
            .attr('width', d => d.depth == 0 ? 30 : getTextWidth(d.data.name) + 20)
            .attr('height', rectHeight)
            .attr('fill', d => (d.depth === 0 ? 'grey' : '#fff'))
            .attr('stroke', '#333')
            .attr('rx', 5)
            .attr('ry', 5);

        // Append text labels to nodes
        nodes.append('text')
            .attr('dy', '1.2em')
            .attr('x', d => {
                const rectWidth = getTextWidth(d.data.name) + 20; // Calculate width for centering
                return rectWidth / 2; // Center the text based on rectangle width
            })
            .style('text-anchor', 'middle')
            .text(d => {
                if (d.depth === 0) return ''; // No text for root node
                const text = `${d.data.name}`;
                return text + ` (${d.data.count})`; // Truncate if necessary
            });

        // Set up zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.5, 3])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });

        svg.call(zoom);

        // Set initial zoom
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