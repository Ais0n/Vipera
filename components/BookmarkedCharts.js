import { useEffect, useState, useRef } from 'react';
import { Image } from 'antd';
import * as d3 from 'd3';
import axios from 'axios';

const BookmarkedCharts = ({ bookmarkedCharts, colorScale, comments, setComments, priorPrompts, generalNotes, setGeneralNotes }) => {
    const [dynamicPlaceholders, setDynamicPlaceholders] = useState({});
    const [loadingStates, setLoadingStates] = useState({});
    const abortControllers = useRef({});
    useEffect(() => {
        if (bookmarkedCharts.length > 0) {
            renderBookmarkedCharts();
        }
    }, [bookmarkedCharts]);

    const renderBarChart = (svg, data, chartHeight, chartWidth, margin) => {
        // Group data by dataItem to create stacked bars
        let dataItemMap = {};
        data.forEach(item => {
            if (!dataItemMap[item.dataItem]) {
                dataItemMap[item.dataItem] = [];
            }
            dataItemMap[item.dataItem].push(item);
        });

        // Calculate total counts for each dataItem to set domain
        let dataItemTotals = {};
        for (let key in dataItemMap) {
            dataItemTotals[key] = dataItemMap[key].reduce((sum, item) => sum + item.count, 0);
        }

        const xScale = d3.scaleBand()
            .domain(Object.keys(dataItemMap))
            .range([margin.left, chartWidth - margin.right])
            .padding(0.1);

        const yScale = d3.scaleLinear()
            .domain([0, Math.max(...Object.values(dataItemTotals))])
            .nice()
            .range([chartHeight - margin.bottom, margin.top]);

        // Render stacked bars
        for (let key in dataItemMap) {
            let yOffset = 0;
            dataItemMap[key].forEach(segment => {
                const barHeight = yScale(0) - yScale(segment.count);
                
                svg.append('rect')
                    .attr('x', xScale(key))
                    .attr('y', yScale(yOffset + segment.count))
                    .attr('width', xScale.bandwidth())
                    .attr('height', barHeight)
                    .attr('fill', colorScale(segment.batch));
                
                // Add text label if bar is tall enough
                if (barHeight > 14) {
                    svg.append('text')
                        .attr('x', xScale(key) + xScale.bandwidth() / 2)
                        .attr('y', yScale(yOffset + segment.count) + barHeight / 2)
                        .attr('text-anchor', 'middle')
                        .attr('dominant-baseline', 'middle')
                        .attr('pointer-events', 'none')
                        .style('fill', '#000')
                        .style('font-size', '11px')
                        .style('font-weight', 'bold')
                        .text(segment.count);
                }
                
                yOffset += segment.count;
            });
        }

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
            } else if (type === 'scatterplot') {
                renderScatterplot(svg, data, chartHeight, chartWidth, margin);
            } else {
                // renderNonAttribute(svg, data, chartHeight, chartWidth, margin);  // no need
            }
        });
    };

    const handleFocus = async (index) => {
        // Only fetch suggestion if the comment box is empty
        if (!comments[index] && bookmarkedCharts[index] && bookmarkedCharts[index].type == 'bar') {
            setLoadingStates(prev => ({ ...prev, [index]: true }));
            try {
                const suggestion = await fetchSuggestion(index);
                setDynamicPlaceholders(prev => ({
                    ...prev, 
                    [index]: suggestion || "Please write your insights here..."
                }));
            } catch (err) {
                setDynamicPlaceholders(prev => ({
                    ...prev, 
                    [index]: "Failed to fetch suggestion. Please enter manually."
                }));
            } finally {
                setLoadingStates(prev => ({ ...prev, [index]: false }));
            }
        }
    };

    const handleCommentChange = (index, event) => {
        const text = event.target.value;
        setComments({ ...comments, [index]: text });
        // Reset placeholder if user starts typing
        if (text) setDynamicPlaceholders(prev => ({ ...prev, [index]: "" }));
    };

    const handleKeyDown = (index, e) => {
        // When placeholder exists and user presses Tab
        if (e.key === 'Tab' && dynamicPlaceholders[index]) {
            e.preventDefault();
            setComments(prev => ({
                ...prev,
                [index]: dynamicPlaceholders[index]
            }));
            setDynamicPlaceholders(prev => ({ ...prev, [index]: "" }));
        }
    };

    const fetchSuggestion = async (index) => {
        if (process.env.NEXT_PUBLIC_LLM_ENABLED == 'false') {
            return "";
        }

        let usedBatchIds = new Set(), usedPrompts = {};
        bookmarkedCharts[index].data.forEach((item) => {
            usedBatchIds.add(item.batch);
        })

        usedBatchIds.forEach((batchId) => {
            usedPrompts[batchId] = priorPrompts[batchId - 1];
        });
        console.log("Request sent: ", bookmarkedCharts[index], usedPrompts);
        const response = await axios.post('/api/suggest-note', {
            chart: bookmarkedCharts[index],
            priorPrompts: usedPrompts,
        });
        return response.data.res;
    };

    return (
        <div style={{ marginTop: '20px' }}>
            {/* General Notes Section */}
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #ddd' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold' }}>General Notes</h3>
                <textarea
                    value={generalNotes || ''}
                    placeholder="Add general observations, insights, or notes about the overall analysis..."
                    onChange={(e) => setGeneralNotes && setGeneralNotes(e.target.value)}
                    style={{ 
                        width: '100%', 
                        height: '80px', 
                        padding: '8px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontFamily: 'inherit',
                        fontSize: '14px',
                        resize: 'vertical'
                    }}
                />
            </div>
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
                                <div className='charts' id={`chart-${index}`} style={{ width: '100%', height: data.type != 'non-attribute' ? '220px' : 0 }}></div>
                                <div className="imageContainer">
                                    {data.type == "non-attribute" && data.images.map((image, index) => (
                                        <div key={index} className="imageItem" style={{ 'borderTop': '7px solid ' + colorScale(image.batch) }}>
                                            <Image width={'100%'} src={`data:image/png;base64,${image.data}`} alt={`Image ${image.imageId}`}/>
                                        </div>
                                    ))}
                                </div>
                            </td>
                            <td className='bookmarked-cell'>
                                <div>
                                    <textarea
                                        value={comments[index] || ''}
                                        placeholder={loadingStates[index] 
                                            ? "Loading AI-generated suggestions..." 
                                            : dynamicPlaceholders[index] ? (dynamicPlaceholders[index] + ' (Press [Tab] to apply)') : "Write down your insights here..."
                                        }
                                        onChange={(e) => handleCommentChange(index, e)}
                                        onFocus={() => handleFocus(index)}
                                        onBlur={() => {
                                            setDynamicPlaceholders(prev => ({ ...prev, [index]: "" }));
                                            setLoadingStates(prev => ({ ...prev, [index]: false }));
                                        }}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        style={{ 
                                            width: 'calc(100% - 30px)', 
                                            height: '170px', 
                                            padding: '8px',
                                            margin: '10px',
                                            position: 'relative',
                                        }}
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
                .imageItem {
                    width: 60px;
                    height: 60px;
                    border-radius: 5px;
                    overflow: hidden;
                    box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1);
                }
                .imageContainer {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    max-height: 300px;
                    overflow-y: scroll;
                }
            `}</style>
        </div>
    );
};

export default BookmarkedCharts;