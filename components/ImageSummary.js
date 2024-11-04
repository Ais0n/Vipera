// components/ImageSummary.js

import React from 'react';
import { Image, Switch, Popover, Button, Input } from 'antd';
import TreeView from './TreeView';
import DrawerView from './Drawer';
import ImageSummaryVis from './ImageSummaryVis';
import Heatmap from './Heatmap';
import BarChart from './BarChart';
import SuggestPromotion from './SuggestPromotion';
import SuggestExternal from './SuggestExternal';
import SuggestComparison from './SuggestionComparison';
import BookmarkedCharts from './BookmarkedCharts';
import * as Utils from '../utils';
import * as d3 from 'd3';
import Tooltip from './Tooltip';
import ModalLabelEdit from './ModalLabelEdit';
import PromptManager from './PromptManager';

const ImageSummary = ({ images, metaData, prompts, graph, setGraph, graphSchema, handleSuggestionButtonClick, switchChecked, setSwitchChecked, handleNodeEdit, handleNodeAdd, handleLabelEditSave, groups, setGroups }) => {
    const [hoveredImageIds, setHoveredImageIds] = React.useState([]);
    const [unselectedPrompts, setUnselectedPrompts] = React.useState([]);
    const [bookmarkedCharts, setBookmarkedCharts] = React.useState([]);
    const [highlightTreeNodes, setHighlightTreeNodes] = React.useState([]);
    const [isGroupModalOpen, setIsGroupModalOpen] = React.useState(false);
    const [contextMenuPos, setContextMenuPos] = React.useState(null);
    const [contextMenuData, setContextMenuData] = React.useState({});
    const [isLabelModalOpen, setIsLabelModalOpen] = React.useState(false);
    const [imageTooltip, setImageTooltip] = React.useState({ visible: false, x: 0, y: 0, image: '', data: {} });
    const [customColors, setCustomColors] = React.useState({});
    const [comments, setComments] = React.useState({}); // State to hold comments for each chart

    const defaultColorScale = Utils.getColorScale;

    const colorScale = (batch) => {
        if (unselectedPrompts.includes(batch)) {
            return 'gray';
        } else if (customColors[batch]) {
            return customColors[batch];
        } else {
            // Check if the prompt is part of a group
            const groupIndex = groups.findIndex(group => group.items.includes(batch - 1));
            if (groupIndex !== -1) {
                return groups[groupIndex].color;
            } else {
                return defaultColorScale(batch - 1);
            }
        }
    };

    const handlePromptClick = (promptIndex) => {
        console.log('Prompt clicked:', promptIndex);
        setUnselectedPrompts(prev => {
            if (prev.includes(promptIndex)) {
                return prev.filter(item => item !== promptIndex);
            } else {
                return [...prev, promptIndex];
            }
        });
    };

    const addBookmarkedChart = (data) => {
        setBookmarkedCharts(prev => [...prev, data]);
    };

    const _handleSuggestionButtonClick = () => {
        handleSuggestionButtonClick({ "path": ["foreground", "doctor"], "addValue": "smiling" });
    }

    const _handleSuggestionButtonClick2 = () => {
        handleSuggestionButtonClick({ "path": ["foreground", "doctor"], "replaceValue": "doctor", "newValue": "nurse" });
    }

    const handleImageHover = (e, d) => {
        console.log(e, d);
        let graphMetadata = Utils.getMetaDatafromGraph(graph, d.batch, d.imageId);
        console.log(graphMetadata);
        let imageMetadata = {};
        for (let key in graphMetadata) {
            let values = Object.values(graphMetadata[key]);
            let imageValue = graphMetadata[key][JSON.stringify({ batch: d.batch, imageId: d.imageId })];
            imageMetadata[key] = {
                value: `${key}: ${imageValue}`,
                percentage: values.filter(val => val === imageValue).length / values.length
            }
        }
        setImageTooltip({
            visible: true,
            x: e.pageX + 15,
            y: e.pageY - 28,
            image: d.data,
            data: imageMetadata
        });
        setHighlightTreeNodes({ batch: d.batch, imageId: d.imageId });
    }

    const handleImageHoverLeave = () => {
        setImageTooltip({
            visible: false,
            x: 0,
            y: 0,
            image: '',
            data: {}
        });
        setHighlightTreeNodes({});
    }

    const openContextMenu = (e, index) => {
        e.preventDefault();
        setContextMenuPos({ top: e.pageY, left: e.pageX });
        setContextMenuData({ index, data: images[index], metaData: metaData[index] });
    }

    const closeContextMenu = () => {
        setContextMenuPos(null);
    }

    const dataForPromotion = [
        { category: 'Doctor', values: { 'male': 0.8, 'female': 0.1, 'others': 0.1 } },
        { category: 'Nurse', values: { 'male': 0.3, 'female': 0.6, 'others': 0.1 } },
        { category: 'Firefighter', values: { 'male': 0.9, 'female': 0.05, 'others': 0.05 } },
        { category: 'Policeman', values: { 'male': 0.9, 'female': 0.05, 'others': 0.05 } },
    ]

    const dataForComparison = [
        { category: 'True', value: 0.3 },
        { category: 'False', value: 0.7 },
    ]

    const dataForExternalKnowledge = [
        { category: 'White', value: 0.5 },
        { category: 'Black', value: 0.2 },
        { category: 'Asian', value: 0.1 },
        { category: 'Hispanic', value: 0.1 },
        { category: 'Other', value: 0.1 },
    ]

    const handleBarHover = (data) => {
        if (!data) {
            setHoveredImageIds([]);
            return;
        }
        // console.log(data.imageId);
        setHoveredImageIds(data.imageId);
    }

    const handleNodeHover = (data) => {
        if (!data) {
            setHoveredImageIds([]);
            return;
        }
        let imageIds = [];
        data.forEach(item => {
            imageIds.push(item.imageId);
        });
        setHoveredImageIds(imageIds);
    }

    const changeColor = (color, index) => {
        console.log(color, index);
        setCustomColors(prev => {
            let newColors = { ...prev };
            newColors[index] = color;
            return newColors;
        });
    }

    const exportToHTML = () => {
        const chartsHTML = bookmarkedCharts.map((_data, index) => {
            const title = _data.title ? `<h3>${_data.title}</h3>` : '';
            const svg = document.getElementById(`chart-${index}`).innerHTML;
            const comment = comments[index] ? `<p>${comments[index]}</p>` : '';
            return `<div>${title}<div>${svg}</div>${comment}</div>`;
        }).join('');

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Exported Charts</title>
                <style>
                    body { font-family: Arial, sans-serif; }
                    h3 { margin: 20px 0 10px; }
                    p { margin: 0 0 20px; }
                    div { margin-bottom: 40px; }
                </style>
            </head>
            <body>
                ${chartsHTML}
            </body>
            </html>
        `;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'exported_charts.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="image-summary-container" onClick={closeContextMenu}>
            <div className="content">
                {/* Left Column */}
                <div className="left-column">
                    <PromptManager prompts={prompts} colorScale={colorScale} changeColor={changeColor} handlePromptClick={handlePromptClick} groups={groups} setGroups={setGroups} />
                    <div><i>Features below are powered by LLaVA v1.6 and may contain errors.</i></div>
                    <h2>Audit Analysis Support</h2>
                    <div className="suggestion-items">
                        <div className="suggestion-item">
                            <SuggestComparison images={images} graphSchema={graphSchema} handleSuggestionButtonClick={handleSuggestionButtonClick}></SuggestComparison>
                        </div>
                        {/* <div className="suggestion-item">
                            <SuggestPromotion prompt={prompts[prompts.length - 1]} graphSchema={graphSchema} dataForPromotion={dataForPromotion} handleSuggestionButtonClick={handleSuggestionButtonClick}></SuggestPromotion>
                        </div> */}
                        {/* <div className="suggestion-item">
                            <SuggestExternal prompt={prompts[prompts.length - 1]} graphSchema={graphSchema} dataForExternalKnowledge={dataForExternalKnowledge} handleSuggestionButtonClick={handleSuggestionButtonClick}></SuggestExternal>
                        </div> */}
                        {/* {prompts.length > 1 && <div className="suggestion-item">
                            <h4 className='suggestion-itemTitle'>Correlation</h4>
                            <div className="suggestion-text">
                                Female doctors are more likely to be smiling.
                            </div>
                            <div className='graphNode'>Gender / Smiling?</div>
                            <div className="barchart">
                                <Heatmap></Heatmap>
                            </div>
                            <div className="suggestion-toolbar">
                                <Button className="suggestion-button" disabled={true}>Update the labels</Button>
                            </div>
                        </div>} */}
                    </div>
                    <h2>Prompt Suggestion</h2>
                    <div className="suggestion-items">
                        <div className="suggestion-item">
                            <SuggestPromotion prompt={prompts[prompts.length - 1]} graphSchema={graphSchema} priorPrompts={prompts} dataForPromotion={dataForPromotion} handleSuggestionButtonClick={handleSuggestionButtonClick}></SuggestPromotion>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="right-column">
                    <div className="image-info">
                        <div style={{ "display": "flex", "gap": "15px", "margin": "15px auto", "alignItems": "center", "justifyContent": "space-between" }}>
                            <h2 style={{ "margin": 0 }}>Images</h2>
                            <i>Comparison mode: <Switch checked={switchChecked} onChange={setSwitchChecked} checkedChildren={"On"} unCheckedChildren={"Off"} size={"large"} />
                            </i>
                        </div>
                        {switchChecked ?
                            <ImageSummaryVis images={images} data={metaData} graph={graph} graphSchema={graphSchema} hoveredImageIds={hoveredImageIds} addBookmarkedChart={addBookmarkedChart} colorScale={colorScale} setHighlightTreeNodes={setHighlightTreeNodes} setContextMenuData={setContextMenuData} setIsLabelModalOpen={setIsLabelModalOpen} />
                            :
                            <div className="imageContainer">
                                {images.map((image, index) => (
                                    <div key={index} className={"imageItem" + (hoveredImageIds.includes(image.imageId) ? ' hoveredImage' : '')} style={{ 'borderTop': '7px solid ' + colorScale(image.batch) }}>
                                        <Image width={'100%'} src={`data:image/png;base64,${image.data}`} alt={`Image ${image.imageId}`} onMouseEnter={(e) => { handleImageHover(e, image) }} onMouseLeave={handleImageHoverLeave} onContextMenu={(e) => openContextMenu(e, index)} />
                                    </div>
                                ))}
                                <Tooltip {...imageTooltip} />
                                {contextMenuPos && <div className="context-menu" style={contextMenuPos}>
                                    <div className="context-menu-item" onClick={() => { setIsLabelModalOpen(true) }}>Edit</div>
                                </div>}
                            </div>
                        }
                        <ModalLabelEdit isOpen={isLabelModalOpen} onClose={() => setIsLabelModalOpen(false)}
                            onSave={handleLabelEditSave} nodeData={contextMenuData} graphSchema={graphSchema}/>
                    </div>
                    <div className="label-view">
                        <div style={{ "display": "flex", "alignItems": "center", "justifyContent": "space-between" }}>
                            <h2 style={{ "margin": 0 }}>Scene Graph</h2>
                            <i>Generated by LLaVA v1.6 and may contain errors.</i>
                        </div>
                        <TreeView data={graph} handleBarHover={handleBarHover} handleNodeHover={handleNodeHover} handleNodeEdit={handleNodeEdit} handleNodeAdd={handleNodeAdd} addBookmarkedChart={addBookmarkedChart} colorScale={colorScale} highlightTreeNodes={highlightTreeNodes} groups={groups} customColors={customColors} />
                    </div>
                </div>
            </div>

            <div className="notebook">
                <div>
                    <h2 style={{ "margin": 0, 'display': 'inline-block' }}>Notes</h2>
                    <Button style={{'display': 'inline-block', 'marginLeft': '15px'}} onClick={exportToHTML}> Export </Button>
                </div>
                <BookmarkedCharts bookmarkedCharts={bookmarkedCharts} colorScale={colorScale} comments={comments} setComments={setComments} />
            </div>

            <style jsx>{`
                .image-summary-container {
                    width: 100%;
                    margin: 0 auto;
                }
                .content {
                    display: flex;
                    justify-content: space-between;
                }
                .left-column, .right-column {
                    padding: 0px 20px 15px 20px;
                    border-radius: 8px;
                    flex: 1.2;
                    margin-right: 20px;
                    background-color: #f9f9f9;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                }
                .right-column {
                    flex: 2;
                    margin-right: 0; /* Remove margin from the last column */
                }
                .notebook {
                    margin-top: 20px;
                    padding: 0px 20px 15px 20px;
                    border-radius: 8px;
                    background-color: #f9f9f9;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    display: flex;
                    flex-direction: column;
                }
                h1, h2, h3, h4 {
                    color: #333;
                }
                .image-info, .suggestions {
                    margin-bottom: 20px;
                }
                .suggestion-items {
                    display: flex;
                    flex-direction: row;
                    gap: 20px;
                }
                .suggestion-item {
                    flex: 1;
                    padding: 15px;
                    background-color: #fff;
                    border-radius: 5px;
                    box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1);
                }
                .suggestion-itemTitle {
                    padding: 0;
                    margin: 0;
                }
                .suggestion-text {
                    overflow-y: auto;
                    height: 100px;
                    display: flex;
                    align-items: center;
                }
                .suggestion-toolbar {
                    display: flex;
                    justify-content: center;
                    margin-top: 10px;
                }
                .suggestion-button {
                    // background-color: #888;
                    background-color: #1677ff;
                    color: #fff;
                    border: none;
                    border-radius: 5px;
                    padding: 5px 10px;
                    cursor: pointer;
                }
                .imageContainer {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    max-height: 300px;
                    overflow-y: scroll;
                }
                .imageItem {
                    width: 60px;
                    height: 60px;
                    border-radius: 5px;
                    overflow: hidden;
                    box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1);
                }
                .labelview {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .prompt-items {
                    display: flex;
                    flex-direction: column;
                    // gap: 20px;
                    height: 200px;
                    overflow-y: scroll;
                    padding: auto 20px;
                }
                .prompt-item {
                    margin: 5px 10px;
                    padding: 5px 10px;
                    // background-color: #eff9f5;
                    color: white;
                    border-radius: 5px;
                    box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1);
                    position: relative;
                    cursor: pointer;
                }
                .prompt-item-color {
                    display: inline-block;
                    width: 18px;
                    height: 20px;
                    -webkit-appearance: none;
                    -moz-appearance: none;
                    appearance: none;
                    background-color: transparent;
                    border: none;
                    cursor: pointer;
                    margin-right: 5px;
                }
                .prompt-item-color::-webkit-color-swatch {
                    border-radius: 50%;
                }
                .prompt-item-color::-moz-color-swatch {
                    border-radius: 50%;
                }
                .prompt-item-text {
                    font-weight: bold; 
                    padding: 5px 10px;
                    border-radius: 5px;
                    width: calc(100% - 45px);
                    display: inline-block;
                }
                .barchart {
                    width: 100%;
                    height: 150px;
                }
                .graphNode {
                    text-decoration: underline;
                    display: flex;
                    flex-direction: row;
                    justify-content: center;
                    font-size: 12px;
                }
                .hoveredImage {
                    box-shadow:  0 0 0 4px #1677ff;
                }
                .context-menu {
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
        </div>
    );
};

export default ImageSummary;