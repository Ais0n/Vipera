import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const Tooltip = ({ visible, x, y, image, data }) => {
    const svgRef = useRef();

    useEffect(() => {
        console.log("Tooltip data:", data);
        if (visible && svgRef.current) {
            const svg = d3.select(svgRef.current);
            svg.selectAll("*").remove();

            const keys = Object.keys(data);
            if (keys.length === 0) return;
            
            const categories = keys
                .map(key => {
                    const { value: imageLabel, percentage } = data[key];
                    
                    // Skip categories with invalid percentages or no label
                    if (percentage <= 0 || !imageLabel) return null;

                    // Create segments: highlighted label and remaining portion
                    const segments = [
                        { 
                            label: imageLabel, 
                            percentage: percentage,
                            isHighlight: true 
                        },
                        { 
                            label: 'others', 
                            percentage: 1 - percentage,
                            isHighlight: false 
                        }
                    ].filter(seg => seg.percentage > 0); // Remove empty segments

                    return {
                        key: key,
                        segments,
                        imageLabel,
                        total: 1 // Using 1 as base for percentage calculations
                    };
                })
                .filter(category => category !== null);

            if (categories.length === 0) return;

            const margin = { top: 20, right: 20, bottom: 30, left: 150 };
            const width = 250 - margin.left - margin.right;
            const height = 150 - margin.top - margin.bottom;

            const chart = svg.append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);

            // Create scales
            const xScale = d3.scaleLinear()
                .domain([0, 1])
                .range([0, width])
                .nice();

            const yScale = d3.scaleBand()
                .domain(categories.map(d => d.key))
                .range([height, 0])
                .padding(0.1);

            // Add bars (segments) for each category
            const categoryGroups = chart.selectAll(".category")
                .data(categories)
                .enter()
                .append("g")
                .attr("class", "category")
                .attr("transform", d => `translate(0, ${yScale(d.key)})`);

            categoryGroups.each(function(category) {
                const group = d3.select(this);
                let currentX = 0;
            
                category.segments.forEach(segment => {
                    const segmentWidth = xScale(segment.percentage);
            
                    group.append("rect")
                        .attr("x", xScale(currentX))
                        .attr("width", segmentWidth)
                        .attr("height", yScale.bandwidth())
                        .attr("fill", segment.isHighlight ? "#1e88e5" : "#ddd")
                        .attr("stroke", "#fff")
                        .attr("stroke-width", 0.5);
            
                    currentX += segment.percentage;
                });
            
                // Add the text labels after the rectangles
                currentX = 0; // Reset currentX for positioning text labels
                category.segments.forEach(segment => {
                    const segmentWidth = xScale(segment.percentage);
            
                    if (segment.isHighlight) {
                        const textContent = d3.format(".0%")(segment.percentage);
                        const minLabelWidth = 25; // Minimum width for inner labels
                        
                        const labelX = segmentWidth > minLabelWidth 
                            ? xScale(currentX + segment.percentage / 2)  // Center position
                            : xScale(currentX + segment.percentage) + 3; // Right-aligned
            
                        const labelColor = segmentWidth > minLabelWidth ? "white" : "#666";
                        const textAnchor = segmentWidth > minLabelWidth ? "middle" : "start";
            
                        group.append("text")
                            .attr("x", labelX)
                            .attr("y", yScale.bandwidth() / 2)
                            .attr("text-anchor", textAnchor)
                            .attr("dy", "0.35em")
                            .style("font-size", "10px")
                            .style("fill", labelColor)
                            .text(textContent);
                    }
            
                    currentX += segment.percentage;
                });
            });

            // Add y-axis with category and image label with text wrapping
            const yAxis = chart.append("g")
                .attr("class", "y-axis");

            // Custom text wrapping function
            const wrapText = (text, maxWidth) => {
                const words = text.split(/\s+/);
                const lines = [];
                let currentLine = words[0] || '';

                for (let i = 1; i < words.length; i++) {
                    const word = words[i];
                    const testLine = currentLine + ' ' + word;
                    
                    // Estimate text width (rough approximation)
                    if (testLine.length * 6 <= maxWidth) {
                        currentLine = testLine;
                    } else {
                        lines.push(currentLine);
                        currentLine = word;
                    }
                }
                lines.push(currentLine);
                return lines;
            };

            // Add custom y-axis labels with wrapping
            categories.forEach(category => {
                const labelText = `${category.key}: ${category.imageLabel}`;
                const maxLabelWidth = margin.left - 10; // Available space for labels
                const lines = wrapText(labelText, maxLabelWidth);
                
                const labelGroup = yAxis.append("g")
                    .attr("class", "tick")
                    .attr("transform", `translate(0, ${yScale(category.key) + yScale.bandwidth()/2})`);

                // Add tick line
                labelGroup.append("line")
                    .attr("stroke", "currentColor")
                    .attr("x2", -6);

                // Add multiline text
                lines.forEach((line, i) => {
                    labelGroup.append("text")
                        .attr("fill", "currentColor")
                        .attr("x", -9)
                        .attr("y", (i - (lines.length - 1) / 2) * 12) // Center vertically
                        .attr("dy", "0.35em")
                        .style("text-anchor", "end")
                        .style("font-size", "10px")
                        .text(line);
                });
            });
        }
    }, [visible, data]);

    if (!visible || Object.keys(data).length === 0) return null;

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
                zIndex: 1000,
            }}
        >
            <img
                src={`data:image/png;base64,${image}`}
                alt="Image"
                style={{ width: '150px', height: '150px', marginBottom: '10px' }}
            />
            <svg ref={svgRef} width="250" height="150" />
        </div>
    );
};

export default Tooltip;