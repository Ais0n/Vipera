import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const Tooltip = ({ visible, x, y, image, data }) => {
    const svgRef = useRef();

    useEffect(() => {
        if (visible && svgRef.current) {
            const svg = d3.select(svgRef.current);
            svg.selectAll("*").remove(); // Clear previous content
            let keys = Object.keys(data), N = keys.length;
            console.log(data, N)
            const radius = 40; // Radius of the arcs
            const arcMargin = 0.1; // Margin between arcs
            const angleStep = (Math.PI * 2) / N - arcMargin; // Angle for each arc

            // Define a single color for the arcs
            const arcColor = '#aaa'; // Change this to your desired color

            const arcGenerator = d3.arc()
                .innerRadius(12)
                .outerRadius((d) => (d.p / 2 + 0.5) * radius); // Use data value for outer radius

            // Create groups for each arc
            for (let i = 0; i < N; i++) {
                const startAngle = i * (angleStep + arcMargin); // Adjust start angle for margin
                const endAngle = (i + 1) * (angleStep + arcMargin) - arcMargin; // Adjust end angle for margin

                // Create the arc
                svg.append('path')
                    .attr('d', arcGenerator({ startAngle, endAngle, p: data[keys[i]].percentage }))
                    .attr('transform', `translate(${100}, ${50})`) // Center the arcs
                    .attr('fill', arcColor); // Use the same color for all arcs

                // Calculate label position and line end points
                const midAngle = (startAngle + endAngle) / 2;
                const curRadius = radius * (data[keys[i]].percentage / 2 + 0.5);
                const lineX1 = 100 + (curRadius * 0.75) * Math.sin(midAngle);
                const lineY1 = 50 - (curRadius * 0.75) * Math.cos(midAngle);
                const lineX2 = 100 + (curRadius * 1.15) * Math.sin(midAngle); // Extend line outward
                const lineY2 = 50 - (curRadius * 1.15) * Math.cos(midAngle);

                // Add lines
                svg.append('line')
                    .attr('x1', lineX1)
                    .attr('y1', lineY1)
                    .attr('x2', lineX2)
                    .attr('y2', lineY2)
                    .attr('stroke', 'black')
                    .attr('stroke-width', 2);

                // Determine label position
                const isLeft = lineX2 < 100; // Check if label is on the left
                const labelOffset = isLeft ? -65 : 5; // Offset to prevent overlap
                const labelX = lineX2 + labelOffset; // Adjust label X position
                const labelY = lineY2;

                // Add labels beside the line using foreignObject for wrapping
                svg.append('foreignObject')
                    .attr('x', labelX)
                    .attr('y', labelY - 10) // Adjust vertical position
                    .attr('width', 60) // Set width for wrapping
                    .attr('height', 30) // Adjust height as needed
                    .append('xhtml:div')
                    .style('font-size', '10px')
                    .style('text-align', isLeft ? 'right' : 'left') // Align text based on position
                    .text(data[keys[i]].value);
            }
        }
    }, [visible, data]);

    if (!visible) return null;

    return (
        <div
            style={{
                position: 'absolute',
                left: x,
                top: y,
                background: '#fff',
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '10px',
                pointerEvents: 'none',
            }}>
            <img src={`data:image/png;base64,${image}`} alt="Image" style={{ width: '100px', height: '100px' }} />
            <svg ref={svgRef} width="200" height="110"/>
        </div>
    );
};

export default Tooltip;