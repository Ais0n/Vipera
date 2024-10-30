import { useEffect, useState } from 'react';
import * as d3 from 'd3';

const BookmarkedCharts = ({ bookmarkedCharts, colorScale, comments, setComments }) => {
    useEffect(() => {
        if (bookmarkedCharts.length > 0) {
            renderBookmarkedCharts();
        }
    }, [bookmarkedCharts]);

    const renderBarChart = (svg, data, chartHeight, chartWidth, margin) => {
        const xScale = d3.scaleBand()
            .domain(data.map(d => d.dataItem))
            .range([margin.left, chartWidth - margin.right])
            .padding(0.1);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.count)])
            .nice()
            .range([chartHeight - margin.bottom, margin.top]);

        // Render bars
        svg.selectAll('rect')
            .data(data)
            .enter().append('rect')
            .attr('x', d => xScale(d.dataItem))
            .attr('y', d => yScale(d.count))
            .attr('width', xScale.bandwidth())
            .attr('height', d => yScale(0) - yScale(d.count))
            .attr('fill', d => colorScale(d.batch)); // Simple color scale

        // Add x-axis
        svg.append('g')
            .attr('transform', `translate(0,${chartHeight - margin.bottom})`)
            .call(d3.axisBottom(xScale));

        // Add y-axis
        svg.append('g')
            .attr('transform', `translate(${margin.left},0)`)
            .call(d3.axisLeft(yScale));
    }

    const renderScatterplot = (svg, data, chartHeight, chartWidth, margin) => {
        const x = d3.scaleLinear()
            .domain(d3.extent(data, d => d[0])).nice()
            .range([0, chartWidth]);

        const y = d3.scaleLinear()
            .domain(d3.extent(data, d => d[1])).nice()
            .range([chartHeight, 0]);

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        g.selectAll("circle")
            .data(data)
            .enter().append("circle")
            .attr("cx", d => x(d[0]))
            .attr("cy", d => y(d[1]))
            .attr("r", 5)
            .attr("fill", d => { return colorScale(d[2].metaData.batch) })
            .attr("opacity", 0.7);
    }

    const renderBookmarkedCharts = () => {
        bookmarkedCharts.forEach((_data, index) => {
            let { type, data } = _data;

            const chartsContainer = document.getElementById('bookmarked-charts');
            const marginBarchart = { top: 10, right: 20, bottom: 30, left: 30 };
            const marginScatterplot = { top: 20, right: 30, bottom: 30, left: 40 };

            let margin = (type === 'bar' ? marginBarchart : marginScatterplot);

            const svgWidth = chartsContainer.offsetWidth * 0.5; 
            const svgHeight = 220; 

            const chartWidth = svgWidth - margin.left - margin.right; // Set width for the new charts
            const chartHeight = svgHeight - margin.top - margin.bottom; // Set height for the new charts

            const container = d3.select(`#chart-${index}`);
            container.selectAll('*').remove();

            const svg = container.append('svg')
                .attr('width', svgWidth)
                .attr('height', svgHeight);


            if (type === 'bar') {
                renderBarChart(svg, data, chartHeight, chartWidth, margin);
            } else {
                renderScatterplot(svg, data, chartHeight, chartWidth, margin);
            }
        });
    };

    const handleCommentChange = (index, event) => {
        setComments({
            ...comments,
            [index]: event.target.value
        });
    };

    return (
        <div style={{ marginTop: '20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                    <tr>
                        <th className='bookmarked-cell'>Chart</th>
                        <th className='bookmarked-cell'>Comments</th>
                    </tr>
                </thead>
                <tbody id="bookmarked-charts">
                    {bookmarkedCharts.map((data, index) => (
                        <tr key={index}>
                            <td className='bookmarked-cell'>
                                {data.title && <b>{data.title}</b>}
                                <div className='charts' id={`chart-${index}`} style={{ width: '100%', height: '220px' }}></div>
                            </td>
                            <td className='bookmarked-cell'>
                                <div>
                                    <textarea
                                        value={comments[index] || ''}
                                        onChange={(event) => handleCommentChange(index, event)}
                                        placeholder="Write down your insights here..."
                                        style={{ width: 'calc(100% - 30px)', height: '170px', padding: '8px', margin: '10px' }}
                                    />
                                </div>
                            </td>
                        </tr>
                    ))}
                    {bookmarkedCharts.length === 0 && (
                        <tr>
                            <td colSpan="2" style={{ textAlign: 'center', padding: '20px' }}>Please bookmark a chart and add notes here.</td>
                        </tr>
                    )}
                </tbody>
            </table>
            <style jsx>{`
                .bookmarked-cell {
                    border: 1px solid #ddd;
                    padding: 8px;
                    vertical-align: top;
                    width: 50%;
                }
            `}</style>
        </div>
    );
};

export default BookmarkedCharts;