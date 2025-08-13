// components/ImageSummary.js

import React from 'react';
import { Image, Switch, Popover, Button, Input } from 'antd';
import TreeView from './TreeView';
import DrawerView from './Drawer';
import ImageSummaryVis from './ImageSummaryVis';
import SuggestPromotion from './SuggestPromotion';
import SuggestExternal from './SuggestExternal';
import SuggestComparison from './SuggestComparison';
import SuggestComparisonFlat from './SuggestComparisonFlat';
import BookmarkedCharts from './BookmarkedCharts';
import * as Utils from '../utils';
import * as d3 from 'd3';
import Tooltip from './Tooltip';
import ModalLabelEdit from './ModalLabelEdit';
import PromptManager from './PromptManager';
import CriteriaView from './CriteriaView';

const ImageSummary = ({ mode, images, imagesRef, metaData, prompts, graph, setGraph, graphSchema, handleSuggestionButtonClick, switchChecked, setSwitchChecked, handleNodeEdit, handleNodeAdd, handleNodeRelabel, handleLabelEditSave, groups, setGroups, treeUtils, setPromptStr, isGenerating }) => {
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
    const [existingCriteria, setExistingCriteria] = React.useState([]); // For Mode C flat criteria

    const useSceneGraph = (mode == 'B' || mode == 'D');
    const useAIAuditingSupport = (mode == 'C' || mode == 'D');
    const defaultColorScale = Utils.getColorScale;

    // Initialize existing criteria from graphSchema for Mode C
    React.useEffect(() => {
        if (mode === 'C' && graphSchema && Object.keys(graphSchema).length > 0) {
            const criteria = Object.keys(graphSchema).filter(key => !key.startsWith('_')).map(key => key.toLowerCase());
            setExistingCriteria(criteria);
        }
    }, [mode, graphSchema]);

    // Ensure graph has proper structure for Mode C (flat criteria)
    React.useEffect(() => {
        if (mode === 'C' && (!graph || !graph.children)) {
            // Initialize graph with empty children array for Mode C
            setGraph({ 
                name: 'root', 
                children: [], 
                type: 'root',
                count: 0 
            });
        }
    }, [mode, graph, setGraph]);

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


    const _handleSuggestionButtonClickFlat = (suggestion, type) => {
        if (type === 'add-criterion') {
            // For Mode C, add the criterion to existing criteria and handle it appropriately
            const newCriterion = suggestion.criterionName.toLowerCase();
            if (!existingCriteria.includes(newCriterion)) {
                setExistingCriteria(prev => [...prev, newCriterion]);
                
                // Call the original handler for adding the node (it will handle schema and graph updates)
                // For Mode C (flat), useSceneGraph=false means pathToRoot will be empty []
                handleNodeAdd(null, {
                    nodeName: newCriterion,
                    nodeType: 'attribute',
                    candidateValues: (suggestion.candidateValues || []).join(', '),
                    scope: {
                        type: 'auto-extended',
                        images: images.map(img => ({ imageId: img.imageId, batch: img.batch }))
                    }
                }, false); // useSceneGraph=false for Mode C
            }
        } else if (type === 'promote') {
            // For Mode C, "Try out this prompt" should just update the prompt
            // The user can then generate new images with the new prompt
            setPromptStr(suggestion.newPrompt);
        } else {
            // Handle other types
            handleSuggestionButtonClick(suggestion, type);
        }
    }

    const handleImageHover = (e, d) => {
        console.log(e, d);
        let imageMetadata = Utils.getImageMetadata(graph, d.batch, d.imageId);
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
        setContextMenuData({ index, data: images[index], metaData: metaData.find(item => item.metaData.batch == images[index].batch && item.metaData.imageId == images[index].imageId) });
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
                    
                    
                    {/* Modes C and D: Show AI auditing support */}
                    {useAIAuditingSupport && <>
                        <div style={{ 'margin': '10px' }}><i>Features below are powered by GPT-5 and may contain errors.</i></div>
                        <h2>Audit Analysis Support</h2>
                        
                        {/* Mode C: Use flat comparison component */}
                        {mode === 'C' ? (
                            <SuggestComparisonFlat 
                                prompts={prompts} 
                                images={imagesRef.current}
                                existingCriteria={existingCriteria}
                                handleSuggestionButtonClick={_handleSuggestionButtonClickFlat}
                                isGenerating={isGenerating}
                            />
                        ) : (
                            /* Mode D: Use original scene graph-based component */
                            <SuggestComparison 
                                prompts={prompts} 
                                images={imagesRef.current} 
                                graphSchema={graphSchema} 
                                handleSuggestionButtonClick={handleSuggestionButtonClick}
                                isGenerating={isGenerating}
                            />
                        )}

                        <h2>Prompt Suggestion</h2>
                        <SuggestPromotion 
                            prompt={prompts[prompts.length - 1]} 
                            graphSchema={mode === 'C' ? graphSchema : graphSchema} 
                            priorPrompts={prompts} 
                            dataForPromotion={dataForPromotion} 
                            handleSuggestionButtonClick={mode === 'C' ? _handleSuggestionButtonClickFlat : handleSuggestionButtonClick}
                            mode={mode}
                        />
                    </>}
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
                            onSave={handleLabelEditSave} nodeData={contextMenuData} graphSchema={graphSchema} />
                    </div>
                    {/* Scene Graph for Modes B and D */}
                    {useSceneGraph && <div className="label-view">
                        <div style={{ "display": "flex", "alignItems": "center", "justifyContent": "space-between" }}>
                            <h2 style={{ "margin": 0 }}>Scene Graph</h2>
                            <i>Generated by GPT-5 and may contain errors.</i>
                        </div>
                        <TreeView images={images} data={graph} handleBarHover={handleBarHover} handleNodeHover={handleNodeHover} handleNodeEdit={handleNodeEdit} handleNodeAdd={handleNodeAdd} handleNodeRelabel={handleNodeRelabel} addBookmarkedChart={addBookmarkedChart} colorScale={colorScale} highlightTreeNodes={highlightTreeNodes} groups={groups} customColors={customColors} prompts={prompts} treeUtils={treeUtils} />
                    </div>}
                    
                    {/* Modes A and C: Show criteria view in scene graph position */}
                    {(mode === 'A' || mode === 'C') && (
                        <div className="label-view">
                            <CriteriaView graph={graph} graphSchema={graphSchema} prompts={prompts} colorScale={colorScale} groups={groups} images={images} handleBarHover={handleBarHover} addBookmarkedChart={addBookmarkedChart} treeUtils={treeUtils} handleNodeAdd={handleNodeAdd} handleNodeEdit={handleNodeEdit} handleNodeRelabel={handleNodeRelabel}></CriteriaView>
                        </div>
                    )}
                </div>
            </div>

            {/* Criteria view hidden for Mode D */}

            <div className="notebook">
                <div>
                    <h2 style={{ "margin": 0, 'display': 'inline-block' }}>Notes</h2>
                    <Button style={{ 'display': 'inline-block', 'marginLeft': '15px' }} onClick={exportToHTML}> Export </Button>
                </div>
                <BookmarkedCharts bookmarkedCharts={bookmarkedCharts} colorScale={colorScale} comments={comments} setComments={setComments} priorPrompts={prompts} />
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
                .criteria-in-left-column {
                    margin-top: 20px;
                    border-top: 1px solid #e0e0e0;
                    padding-top: 15px;
                }
                .right-column {
                    flex: 2;
                    margin-right: 0; /* Remove margin from the last column */
                }
                .notebook {
                    margin-top: 20px;
                    padding: 10px 20px 15px 20px;
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