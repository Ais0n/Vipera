import React, { use, useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as Utils from '../utils.js';
import ModalTreeEdit from './ModalTreeEdit.js';
import ModalTreeAdd from './ModalTreeAdd.js';
import ModalTreeRelabel from './ModalTreeRelabel.js';
import { Modal, Skeleton } from 'antd';
import { BookOutlined } from '@ant-design/icons';


const TreeView = ({ images, data, handleBarHover, handleNodeHover, handleNodeEdit, handleNodeAdd, handleNodeRelabel, colorScale, addBookmarkedChart, highlightTreeNodes, groups, customColors, prompts }) => {
    if (!data || data == {}) { return null; }

    const svgRef = useRef();
    const contextMenuRef = useRef(); // for non-attribute nodes
    const contextMenuRef2 = useRef(); // for attribute nodes

    const [contextMenuData, setContextMenuData] = useState(null);
    const [contextMenuData2, setContextMenuData2] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isRelabelModalOpen, setIsRelabelModalOpen] = useState(false);

    const handleEdit = (newName) => {
        console.log('Edit node', contextMenuData, newName);
        handleNodeEdit(contextMenuData, newName);
    }

    const handleAdd = (newName) => {
        console.log('Add node', contextMenuData, newName);
        handleNodeAdd(contextMenuData, newName);
    }

    const handleRelabel = (candidateValues) => {
        console.log('Relabel node', candidateValues);
        handleNodeRelabel(contextMenuData2, candidateValues);
    }

    const createStackedBarchart = (nodes) => {
        // stacked bar chart
        nodes.filter(d => d.data.type == 'attribute')
            .each(function (d) {
                console.log(d)
                if (!d.data.list) {
                    d3.select(this).append('text')
                        .attr('x', 20)
                        .attr('y', 70)
                        .text('Loading...')
                        .attr('fill', 'black')
                        .attr('font-size', '18px')
                        .attr('font-weight', 'bold');
                    return;
                }
                const g = d3.select(this);

                // Highlight Tree Nodes
                let isHighlighted = false;
                d.data.imageInfo.forEach(item => {
                    if (item.batch == highlightTreeNodes.batch && item.imageId == highlightTreeNodes.imageId) {
                        isHighlighted = true;
                    }
                })
                if (isHighlighted) {
                    g.attr('stroke-width', 4)
                } else {
                    g.attr('stroke-width', 1)
                }

                // Define dimensions based on the container size
                const chartWidth = getNodeWidth(d) // Adjust based on your layout
                const chartHeight = getNodeHeight(d) - 30; // Adjust as needed
                const margin = { top: 0, right: 0, bottom: 0, left: 0 };

                // Create a group for the chart
                const chartGroup = g.append('g')
                    .classed('chart-group', true)
                    .attr('transform', `translate(${margin.left},${margin.top})`);

                // Create scales
                const xScale = d3.scaleBand()
                    .domain(d.data.list.map(d => d.dataItem))
                    .range([0, chartWidth])
                    .padding(0.1);

                // group by batch and calculate the maximum count
                let maxCount = 0;
                let dataItemMap = {}, dataItemCount = {};
                d.data.list.forEach(dataItem => {
                    let key = dataItem.dataItem;
                    dataItemMap[key] = dataItemMap[dataItem.dataItem] || [];
                    dataItemMap[key].push(dataItem);
                });
                // for each bucket, merge dataItems whose batch are in the same group
                // you can calculate group by batch, using Utils.getGroupId = (groups, batch)
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
                        let count = 0, newImageIds = [], _batch = 0; // _batch is any batch value within the group, only used to decide the color
                        newMap[groupId].forEach(dataItem => {
                            count += dataItem.count;
                            newImageIds = [...newImageIds, ...dataItem.imageId];
                            _batch = dataItem.batch;
                        });
                        dataItemMap[key].push({ dataItem: key, count: count, batch: _batch, imageId: newImageIds });
                    }
                }

                // Calculate the maximum count
                for (let key in dataItemMap) {
                    dataItemMap[key].forEach(dataItem => {
                        dataItemCount[dataItem.dataItem] = dataItemCount[dataItem.dataItem] || 0;
                        dataItemCount[dataItem.dataItem] += Math.log(dataItem.count + 5);
                    });
                }
                maxCount = Math.max(...Object.values(dataItemCount));

                // Stack the data for the bars
                console.log(dataItemMap);
                for (let key in dataItemMap) {
                    let yOffset = -25;
                    dataItemMap[key].forEach(dataItem => {
                        let height = Math.log(dataItem.count + 5) / maxCount * (chartHeight - 15);
                        yOffset += height;
                        chartGroup.append('rect')
                            .data([dataItem])
                            .classed('bar', true)
                            .attr('x', xScale(dataItem.dataItem)) // Use xScale to position bars
                            .attr('y', chartHeight - yOffset) // Position bars
                            .attr('width', xScale.bandwidth())
                            .attr('height', height)
                            .attr('fill', colorScale(dataItem.batch))
                            .on('mouseover', function (event, d) {
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
                            .attr('y', chartHeight - yOffset + height / 2 + 5) // Position label above the bar
                            .attr('text-anchor', 'middle')
                            .attr('pointer-events', 'none')
                            .text(dataItem.count);
                    });
                }

                // Add x-axis labels (no axis). IF the label name is more than 6 characters, you can rotate the labels
                chartGroup.selectAll('.x-axis-label')
                    .data(d.data.list)
                    .enter().append('text')
                    .attr('class', 'x-axis-label')
                    .attr('x', d => xScale(d.dataItem) + xScale.bandwidth() / 2)
                    .attr('y', chartHeight + 37)
                    .attr('text-anchor', 'middle')
                    .attr('pointer-events', 'none')
                    .each(function (d) {
                        let text = d.dataItem;
                        let fontSize = '12px'; // Default font size

                        // Adjust font size based on text length
                        if (text.length > 10) {
                            fontSize = '10px'; // Smaller font for longer text
                        }
                        if (text.length > 20) {
                            text = text.substring(0, 17) + '...'; // Truncate if too long
                            fontSize = '8px'; // Even smaller for truncated text
                        }

                        d3.select(this)
                            .style('font-size', fontSize)
                            .text(text);
                    });


                // Add the "Store" button
                const storeButton = g.append('g')
                    .attr('transform', `translate(${chartWidth - 20}, ${20})`)
                    // pointer
                    .style('cursor', 'pointer')
                    .on('click', () => {
                        console.log(d);
                        // Store the raw data when clicked
                        const chartData = d.data.list.map(item => ({
                            dataItem: item.dataItem,
                            count: item.count,
                            batch: item.batch
                        }));
                        let pathStr = "", curNode = d;
                        while (curNode && curNode.data.name != 'root') {
                            pathStr = (pathStr == "") ? curNode.data.name : curNode.data.name + '.' + pathStr;
                            curNode = curNode.parent;
                        }
                        addBookmarkedChart({
                            type: "bar",
                            data: chartData,
                            title: pathStr
                        });
                    });

                // Load and append the local SVG
                d3.xml('/bookmark.svg').then(svgData => {
                    const importedNode = document.importNode(svgData.documentElement, true);
                    const svg = d3.select(importedNode).attr('width', 20).attr('height', 20);
                    storeButton.node().appendChild(importedNode);
                });
            });
    }

    function getTextWidth(text) {
        const textElement = document.createElement('span');
        textElement.textContent = text;
        document.body.appendChild(textElement);
        const width = textElement.offsetWidth;
        document.body.removeChild(textElement);
        return width + 40;
    }

    function getNodeWidth(d) {
        return d.depth == 0 ? 30 : d.data.type == 'object' ? getTextWidth(d.data.name) : 300;
    }

    function getNodeHeight(d) {
        return d.data.type == 'attribute' ? 100 : 30;
    }

    const createTree = () => {
        const width = 880;
        const height = 600;
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

                if (d.source.data.type == 'attribute') {
                    sourceY += 30;
                }
                if (d.target.data.type == 'attribute') {
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
                let rectHeight = d.data.type == 'attribute' ? 80 : 30;
                return `translate(${d.y - rectWidth / 2},${d.x - rectHeight / 2})`;
            });

        let rects = nodes.append('rect')
            .attr('width', d => getNodeWidth(d))
            .attr('height', d => getNodeHeight(d))
            .attr('fill', d => (d.depth === 0 ? 'grey' : '#fff'))
            .attr('stroke', '#333')
            .attr('rx', 5)
            .attr('ry', 5)
            .attr('transform', `translate(0,${rectHeight / 2})`)

        const contextMenu = d3.select(contextMenuRef.current);
        rects.filter(d => d.data.type != 'attribute')
            .on('mouseover', function (event, d) {
                // console.log(d);
                handleNodeHover(d.data.imageInfo);
            })
            .on('mouseout', function (event, d) {
                handleNodeHover(null);
            })
            .on('contextmenu', function (event, d) {
                event.preventDefault();
                // Get the position of the rectangle
                const rectBounds = this.getBoundingClientRect();

                // Set the position of the context menu near the rectangle
                contextMenu.style("left", `${rectBounds.left + window.scrollX}px`) // Right side of the rectangle
                    .style("top", `${rectBounds.bottom + window.scrollY}px`) // Aligned with the top of the rectangle
                    .style("display", "block");

                setContextMenuData(d);
            });

        const contextMenu2 = d3.select(contextMenuRef2.current);
        rects.filter(d => d.data.type == 'attribute')
            .on('contextmenu', function (event, d) {
                event.preventDefault();
                // Get the position of the rectangle
                const rectBounds = this.getBoundingClientRect();

                // Set the position of the context menu near the rectangle
                contextMenu2.style("left", `${rectBounds.left + window.scrollX}px`) // Right side of the rectangle
                    .style("top", `${rectBounds.bottom + window.scrollY}px`) // Aligned with the top of the rectangle
                    .style("display", "block");

                setContextMenuData2(d);
            });

        d3.select("body").on("click", function () {
            contextMenu.style("display", "none");
            contextMenu2.style("display", "none");
        });

        // rects.filter(d => d.data.type == 'attribute')
        //     .on('mouseover', function (event, d) {
        //         console.log(d);
        //         let imageIds = [];
        //         d.data.list.forEach(dataItem => {
        //             imageIds.push(...dataItem.imageId);
        //         });
        //         handleBarHover({ imageId: imageIds });
        //     })
        //     .on('mouseout', function (event, d) {
        //         handleNodeHover(null);
        //     });

        nodes.append('text')
            .attr('dy', '1.2em')
            .attr('x', d => {
                const rectWidth = getNodeWidth(d);
                return rectWidth / 2;
            })
            .attr('y', rectHeight / 2)
            .style('text-anchor', 'middle')
            .text(d => {
                if (d.depth === 0) return '';
                const text = `${d.data.name}`;
                return text //+ ` (${d.data.count})`;
            })
            .attr('pointer-events', 'none')

        createStackedBarchart(nodes);

        // Add the "Store" button for each non-attribute node
        nodes.filter(d => d.data.type != 'attribute' && d.data.name != 'root')
            .each(function (d) {
                const g = d3.select(this);
                const storeButtonForNonAttrNodes = g.append('g')
                    .attr('transform', `translate(${getNodeWidth(d) - 17}, ${17})`)
                    .style('cursor', 'pointer')
                    .on('click', () => {
                        console.log(d);
                        // Store the raw data when clicked
                        let pathStr = "", curNode = d;
                        while (curNode && curNode.data.name != 'root') {
                            pathStr = (pathStr == "") ? curNode.data.name : curNode.data.name + '.' + pathStr;
                            curNode = curNode.parent;
                        }
                        addBookmarkedChart({
                            type: "non-attribute",
                            data: d.data,
                            images: images.filter(image => d.data.imageInfo.find(item => item.imageId == image.imageId)),
                            title: pathStr + " - " + String(d.data.count) + " images"
                        });
                    });

                // Load and append the local SVG
                d3.xml('/bookmark.svg').then(svgData => {
                    const importedNode = document.importNode(svgData.documentElement, true);
                    const svg = d3.select(importedNode).attr('width', 15).attr('height', 15);
                    storeButtonForNonAttrNodes.node().appendChild(importedNode);
                });
            })

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

    // update the rects when highlightTreeNodes changes
    useEffect(() => {
        if (!data || data == {}) { return null; }
        const g = d3.select(svgRef.current).select('g');
        g.selectAll('.node').filter(d => d.data.type == 'attribute')
            .each(function (d) {
                console.log(d);
                if (!d || !d.data || !d.data.imageInfo) return;
                let isHighlighted = false;
                d.data.imageInfo.forEach(item => {
                    if (item.batch == highlightTreeNodes.batch && item.imageId == highlightTreeNodes.imageId) {
                        isHighlighted = true;
                    }
                })
                if (isHighlighted) {
                    d3.select(this).attr('stroke-width', 4)
                } else {
                    d3.select(this).attr('stroke-width', 1)
                }
            });
    }, [highlightTreeNodes]);

    // update the stacked bar chart when groups change
    useEffect(() => {
        if (!data || data == {}) { return null; }
        const g = d3.select(svgRef.current).select('g');
        let nodes = g.selectAll('.node');
        const chartGroup = d3.select(svgRef.current).selectAll('.chart-group');
        if (!chartGroup) return;
        chartGroup.selectAll('*').remove();
        createStackedBarchart(nodes);
    }, [groups, customColors]);

    return (
        <>
            <svg ref={svgRef}></svg>
            <div className="context-menu" ref={contextMenuRef}>
                <div className="context-menu-item" onClick={() => { setIsEditModalOpen(true); }}>Edit</div>
                <div className="context-menu-item" onClick={() => { setIsAddModalOpen(true); }}>Add a child</div>
                <div className="context-menu-item">Delete</div>
            </div>
            <div className="context-menu" ref={contextMenuRef2}>
                <div className="context-menu-item" onClick={() => { setIsRelabelModalOpen(true); }}>Relabel</div>
                <div className="context-menu-item">Delete</div>
            </div>
            <ModalTreeEdit
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleEdit}
                nodeData={contextMenuData}
            />
            <ModalTreeAdd
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSave={handleAdd}
                prompts={prompts}
                colorScale={colorScale}
                groups={groups}
                images={images}
            />
            <ModalTreeRelabel
                isOpen={isRelabelModalOpen}
                onClose={() => setIsRelabelModalOpen(false)}
                onSave={handleRelabel}
            />
            <style jsx>{`
                .context-menu {
                    display: none;
                    position: absolute;
                    background-color: white;
                    border: 1px solid #ccc;
                    box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);
                    z-index: 10;
                }
                .context-menu-item {
                    padding: 8px 12px;
                    cursor: pointer;
                }
                .context-menu-item:hover {
                    background-color: #f0f0f0;
                }
            `}</style>
        </>
    );
};

export default TreeView;