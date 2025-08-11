import React, { useEffect, useState, useRef } from 'react';
import HighlightedText from './HighlightedText';
import { Image, Switch, Popover, Button } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import axios from 'axios';
import * as d3 from 'd3';
import * as Utils from '../utils.js';
import ModalTreeAdd from './ModalTreeAdd';
import ModalTreeRelabel from './ModalTreeRelabel.js';

/**
 * A reusable React component to render a stacked bar chart using D3.
 * This component's logic is based on the provided createStackedBarchart function.
 */
const StackedBarChart = ({ node, colorScale, groups, handleBarHover, tooltipRef, height = 250 }) => {
    const ref = useRef(null);

    useEffect(() => {
        // Ensure the ref is attached and we have a node to render
        if (!ref.current || !node) return;

        const d = node;
        const svg = d3.select(ref.current);
        svg.selectAll('*').remove(); // Clear SVG from previous renders

        // Display a loading message if chart data isn't available yet
        if (!d.list) {
            svg.append('text')
                .attr('x', '50%')
                .attr('y', '50%')
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'middle')
                .text('Loading...')
                .attr('fill', '#666')
                .attr('font-size', '16px');
            return;
        }

        // Define chart dimensions based on the container size
        const containerWidth = ref.current.clientWidth;
        const containerHeight = ref.current.clientHeight;
        const margin = { top: 5, right: 10, bottom: 60, left: 10 };
        const chartWidth = containerWidth - margin.left - margin.right;
        const chartHeight = containerHeight - margin.top - margin.bottom;

        const chartGroup = svg.append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);
        
        // --- Data Processing (from createStackedBarchart) ---
        let dataItemMap = {}, dataItemCount = {};
        d.list.forEach(dataItem => {
            let key = dataItem.dataItem;
            dataItemMap[key] = dataItemMap[dataItem.dataItem] || [];
            dataItemMap[key].push(dataItem);
        });
        
        for (let key in dataItemMap) {
            let newMap = {};
            dataItemMap[key].forEach(dataItem => {
                let groupId = Utils.getGroupId(groups, dataItem.batch - 1);
                groupId = (groupId == -1) ? `b${dataItem.batch}` : groupId;
                newMap[groupId] = newMap[groupId] || [];
                newMap[groupId].push(dataItem);
            });
            dataItemMap[key] = [];
            for (let groupId in newMap) {
                let count = 0, newImageIds = [], _batch = 0;
                newMap[groupId].forEach(dataItem => {
                    count += dataItem.count;
                    newImageIds = [...newImageIds, ...dataItem.imageId];
                    _batch = dataItem.batch;
                });
                dataItemMap[key].push({ dataItem: key, count: count, batch: _batch, imageId: newImageIds });
            }
        }

        for (let key in dataItemMap) {
             dataItemCount[key] = dataItemMap[key].reduce((sum, item) => sum + Math.log(item.count + 5), 0);
        }
        const maxTotalLogCount = Math.max(0, ...Object.values(dataItemCount));

        // --- D3 Scales ---
        const xScale = d3.scaleBand()
            .domain(Object.keys(dataItemMap))
            .range([0, chartWidth])
            .padding(0.2);

        const yScale = d3.scaleLinear()
            .domain([0, maxTotalLogCount])
            .range([chartHeight, 0]);

        // --- Render Bars ---
        for (let key in dataItemMap) {
            let yOffset = 0;
            dataItemMap[key].forEach(segment => {
                const logValue = Math.log(segment.count + 5);
                const barHeight = chartHeight - yScale(logValue);

                const rect = chartGroup.append('rect')
                    .datum(segment) // Bind the segment data to the rect element
                    .attr('x', xScale(key))
                    .attr('y', yScale(yOffset + logValue))
                    .attr('width', xScale.bandwidth())
                    .attr('height', barHeight)
                    .attr('fill', colorScale(segment.batch))
                    .style('cursor', 'pointer')
                    .on('mouseover', function (event, d) {
                        if (handleBarHover) handleBarHover(d);
                        if (!tooltipRef || !tooltipRef.current) return;
                        
                        const rectBounds = event.currentTarget.getBoundingClientRect();
                        d3.select(tooltipRef.current)
                            .style('display', 'block')
                            .html(`
                                <strong>${d.dataItem}</strong><br/>
                                <strong>Count:</strong> ${d.count}
                            `)
                            .style('left', `${rectBounds.left + window.scrollX + 10}px`)
                            .style('top', `${rectBounds.top + window.scrollY - 30}px`)
                            .style('opacity', 0.95);
                    })
                    .on('mouseout', function (event, d) {
                        if (handleBarHover) handleBarHover(null);
                        if (!tooltipRef || !tooltipRef.current) return;
                        
                        setTimeout(() => {
                            d3.select(tooltipRef.current)
                                .transition().duration(200)
                                .style('opacity', 0)
                                .on('end', () => d3.select(tooltipRef.current).style('display', 'none'));
                        }, 200);
                    });

                if (barHeight > 14) {
                    chartGroup.append('text')
                        .attr('x', xScale(key) + xScale.bandwidth() / 2)
                        .attr('y', yScale(yOffset + logValue) + barHeight / 2)
                        .attr('text-anchor', 'middle')
                        .attr('dominant-baseline', 'middle')
                        .attr('pointer-events', 'none')
                        .style('fill', '#fff')
                        .style('font-size', '11px')
                        .style('font-weight', 'bold')
                        .text(segment.count);
                }
                
                yOffset += logValue;
            });
        }

        // --- X-axis Labels ---
        const xAxisGroup = chartGroup.append('g')
            .attr('transform', `translate(0, ${chartHeight})`);
            
        xAxisGroup.selectAll('.x-axis-label')
            .data(xScale.domain())
            .enter().append('text')
            .attr('class', 'x-axis-label')
            .attr('x', d => xScale(d) + xScale.bandwidth() / 2)
            .attr('y', 15)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .text(d => d.length > 15 ? d.substring(0, 12) + '...' : d);

    }, [node, colorScale, groups, handleBarHover, tooltipRef]); // Add dependencies

    return <svg ref={ref} style={{ width: '100%', height: `${height}px` }}></svg>;
};

// Main CriteriaView Component
const CriteriaView = ({ 
    graph, 
    graphSchema,
    prompts = [], 
    colorScale, 
    groups, 
    images, 
    handleBarHover,
    addBookmarkedChart,
    handleNodeAdd,
    handleNodeEdit,
    handleNodeRelabel,
    treeUtils,
    compact = false
}) => {
    const attributeNodes = Utils.getLeafNodes(graph).filter(node => node.type === 'attribute');
    
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isRelabelModalOpen, setIsRelabelModalOpen] = useState(false);
    const tooltipRef2 = useRef(null);
    const [contextMenuData, setContextMenuData] = useState(null);
    const handleAdd = (newNode) => {
        handleNodeAdd(null, newNode, false);
    }
    const handleEdit = (newNode) => {
        handleNodeEdit(contextMenuData, newNode, false);
    }

    const handleRelabel = (config) => {
        console.log('Relabel node', config);
        handleNodeRelabel(contextMenuData, config, false);
    }

    // Handler for the bookmark click
    const handleBookmarkClick = (node) => {
        if (!addBookmarkedChart) {
            console.error("addBookmarkedChart function not provided.");
            return;
        }
        
        // Format the data as required by the bookmarking function
        const chartData = node.list.map(item => ({
            dataItem: item.dataItem,
            count: item.count,
            batch: item.batch
        }));

        addBookmarkedChart({
            type: "bar",
            data: chartData,
            title: node.name // Use the node name as the title
        });
    };

    const handleEditClick = (node) => {
        setContextMenuData({...graphSchema[node.name], name: node.name});
        setIsEditModalOpen(true);
    };

    const handleRelabelClick = (node) => {
        setContextMenuData({...graphSchema[node.name], name: node.name});
        setIsRelabelModalOpen(true);
    }

    return (
        <>
            <div
                ref={tooltipRef2}
                className="bar-tooltip"
                style={{ display: 'none', pointerEvents: 'none' }}
            ></div>
            <div style={{ "marginBottom": "10px" }}>
                <h2 style={{ "margin": 0, "display": "inline-block" }}>Criteria</h2>
                <Button style={{ 'display': 'inline-block', 'marginLeft': '15px' }} onClick={() => setIsAddModalOpen(true)}>Add</Button>
            </div>
            <div className={`criteria-view-content ${compact ? 'compact' : ''}`}>
                {attributeNodes.length === 0 ? ("No attribute criteria available.") : (
                    attributeNodes.map((node, index) => (
                        <div className={`criteria-view-item ${compact ? 'compact' : ''}`} key={node.id || index}>
                            <div className={`criteria-item-header ${compact ? 'compact' : ''}`}>
                                <h4 className={`criteria-item-title ${compact ? 'compact' : ''}`}>{node.name}</h4>
                                <div className={`card-actions ${compact ? 'compact' : ''}`}>
                                    <div className="action-icon" onClick={() => handleEditClick(node)} title="Edit this criterion">
                                        <img src="/edit.svg" alt="Edit Icon" width="18" height="18" />
                                    </div>
                                    <div className="action-icon" onClick={() => handleRelabelClick(node)} title="Relabel images on this criterion">
                                        <img src="/refresh-cw.svg" alt="Relabel Icon" width="18" height="18" />
                                    </div>
                                    <div className="action-icon" onClick={() => handleBookmarkClick(node)} title="Bookmark this chart">
                                        <img src="/bookmark.svg" alt="Bookmark Icon" width="18" height="18" />
                                    </div>
                                </div>
                            </div>
                            <div className={`chart-container ${compact ? 'compact' : ''}`}>
                                <StackedBarChart 
                                    node={node} 
                                    colorScale={colorScale} 
                                    groups={groups}
                                    handleBarHover={handleBarHover}
                                    tooltipRef={tooltipRef2}
                                    height={250}
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>
            <ModalTreeAdd
                isOpen={isAddModalOpen || isEditModalOpen}
                modalType={isAddModalOpen ? 'add' : 'edit'}
                onClose={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                onSave={isAddModalOpen ? handleAdd : handleEdit}
                prompts={prompts}
                colorScale={colorScale}
                groups={groups}
                images={images}
                contextMenuData={contextMenuData}
                treeUtils={treeUtils}
                useSceneGraph={false}
            />
            <ModalTreeRelabel
                isOpen={isRelabelModalOpen}
                onClose={() => setIsRelabelModalOpen(false)}
                onSave={handleRelabel}
                contextMenuData={contextMenuData}
            />
            <style jsx>{`
                h2 { color: #333; }
                .bookmark-icon {
                    cursor: pointer;
                    color: #888;
                    padding: 5px;
                    border-radius: 50%;
                    transition: background-color 0.2s, color 0.2s;
                }
                .bookmark-icon:hover {
                    background-color: #f0f0f0;
                    color: #1a1a1a;
                }
                .criteria-view-content {
                    display: flex; 
                    flex-direction: row; 
                    flex-wrap: wrap; 
                    gap: 20px; 
                    padding: 10px 0;
                }
                .criteria-view-content.compact {
                    flex-direction: row;
                    flex-wrap: wrap;
                    gap: 16px;
                }
                .criteria-view-item {
                    flex: 1 1 calc(25% - 20px); 
                    max-width: calc(25% - 20px); 
                    min-width: 300px;
                    display: flex; flex-direction: column;
                    background-color: #fff; border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09); border: 1px solid #f0f0f0;
                    transition: box-shadow 0.3s;
                }
                .criteria-view-item.compact {
                    flex: 1 1 calc(50% - 8px); 
                    max-width: calc(50% - 8px); 
                    min-width: 200px;
                }
                .criteria-view-item:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12); }
                .criteria-item-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 15px;
                    border-bottom: 1px solid #f0f0f0;
                }
                .criteria-item-header.compact {
                    padding: 10px 15px;
                }
                .criteria-item-title {
                    margin: 0;
                    padding: 0;
                    font-size: 16px;
                    text-align: left;
                    font-weight: 600;
                    color: #333;
                    flex: 1;
                    padding-right: 15px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .criteria-item-title.compact {
                    font-size: 15px;
                    padding-right: 8px;
                }
                .card-actions {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-shrink: 0;
                }
                .card-actions.compact {
                    gap: 2px;
                }
                .action-icon {
                    cursor: pointer;
                    color: #888;
                    padding: 5px;
                    border-radius: 50%;
                    transition: background-color 0.2s, color 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .action-icon:hover {
                    background-color: #f0f0f0;
                    color: #1a1a1a;
                }
                .chart-container {
                    padding: 10px; 
                    flex-grow: 1;
                }
                .chart-container.compact {
                    padding: 10px;
                }
                .bar-tooltip {
                    position: absolute;
                    background-color: white;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    padding: 8px;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                    font-size: 12px;
                    z-index: 1000;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                }
                /* Responsive adjustments */
                @media (max-width: 1200px) { .criteria-view-item { flex-basis: calc(33.333% - 20px); max-width: calc(33.333% - 20px); } }
                @media (max-width: 992px) { .criteria-view-item { flex-basis: calc(50% - 20px); max-width: calc(50% - 20px); } }
                @media (max-width: 600px) { .criteria-view-item { flex-basis: 100%; max-width: 100%; } }
            `}</style>
        </>
    );
};

export default CriteriaView;