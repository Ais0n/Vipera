import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const Tooltip = ({ visible, x, y, image, data }) => {
    const svgRef = useRef();

    useEffect(() => {
        if (visible && svgRef.current) {
            const svg = d3.select(svgRef.current);
            svg.selectAll("*").remove(); // Clear previous content

            const keys = Object.keys(data);
            const values = keys.map(key => data[key].percentage); // Normalize percentage values
            const labels = keys.map(key => String(key) + ': ' + String(data[key].value));
            const N = values.length;

            const radius = 50; // Radius of the radar chart
            const centerX = 100; // X-coordinate of the center
            const centerY = 70; // Y-coordinate of the center

            // Scales
            const angleScale = d3.scaleLinear()
                .domain([0, N])
                .range([0, 2 * Math.PI]);
            const radiusScale = d3.scaleLinear()
                .domain([0, 1]) // Assuming percentage values are between 0 and 1
                .range([0, radius]);

            // Radar grid (spider web)
            const gridLevels = 5; // Number of concentric circles
            for (let i = 1; i <= gridLevels; i++) {
                const r = (radius / gridLevels) * i;
                svg.append("circle")
                    .attr("cx", centerX)
                    .attr("cy", centerY)
                    .attr("r", r)
                    .attr("fill", "none")
                    .attr("stroke", "#ccc")
                    .attr("stroke-width", 0.5);
            }

            // Axes
            labels.forEach((label, i) => {
                const angle = angleScale(i);
                const x2 = centerX + radius * Math.sin(angle);
                const y2 = centerY - radius * Math.cos(angle);

                // Draw axis line
                svg.append("line")
                    .attr("x1", centerX)
                    .attr("y1", centerY)
                    .attr("x2", x2)
                    .attr("y2", y2)
                    .attr("stroke", "#ccc")
                    .attr("stroke-width", 0.5);

                // Add axis label
                const labelX = centerX + (radius + 10) * Math.sin(angle);
                const labelY = centerY - (radius + 10) * Math.cos(angle);
                svg.append("text")
                    .attr("x", labelX)
                    .attr("y", labelY)
                    .attr("text-anchor", "middle")
                    .attr("dominant-baseline", "central")
                    .style("font-size", "10px")
                    .text(label);
            });

            // Radar data points
            const radarLine = d3.lineRadial()
                .radius((d, i) => d)
                .angle((d, i) => angleScale(i))
                .curve(d3.curveLinearClosed);

            const radarData = values.map(v => radiusScale(v));

            if (N > 1) {
                svg.append("path")
                    .datum(radarData)
                    .attr("d", radarLine)
                    .attr("transform", `translate(${centerX},${centerY})`)
                    .attr("fill", "rgba(0, 123, 255, 0.3)")
                    .attr("stroke", "blue")
                    .attr("stroke-width", 2);
            } else if (N === 1) {
                // Draw a single point for one dimension
                svg.append("circle")
                    .attr("cx", centerX)
                    .attr("cy", centerY - radarData[0])
                    .attr("r", 5)
                    .attr("fill", "blue");
            }

            // Data points
            radarData.forEach((r, i) => {
                const angle = angleScale(i);
                const x = centerX + r * Math.sin(angle);
                const y = centerY - r * Math.cos(angle);

                svg.append("circle")
                    .attr("cx", x)
                    .attr("cy", y)
                    .attr("r", 3)
                    .attr("fill", "blue");
            });
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
            }}
        >
            <img
                src={`data:image/png;base64,${image}`}
                alt="Image"
                style={{ width: '150px', height: '150px' }}
            />
            <svg ref={svgRef} width="250" height="150" />
        </div>
    );
};

export default Tooltip;