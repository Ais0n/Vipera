// components/ImageSummary.js

import React from 'react';
import { Image, Switch, Popover, Button, Input, message } from 'antd';
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
    const [generalNotes, setGeneralNotes] = React.useState(''); // State to hold general notes
    const [existingCriteria, setExistingCriteria] = React.useState([]); // For Mode C flat criteria
    const [messageApi, contextHolder] = message.useMessage();

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
        // Show success message based on the type of bookmark
        if (data.type === 'non-attribute' && data.images) {
            messageApi.success(`Image bookmarked successfully!`);
        } else if (data.type === 'bar') {
            messageApi.success(`Bar chart bookmarked successfully!`);
        } else if (data.type === 'scatterplot') {
            messageApi.success(`Scatterplot bookmarked successfully!`);
        } else {
            messageApi.success(`Chart bookmarked successfully!`);
        }
    };

    const handleDeleteBookmark = (index) => {
        setBookmarkedCharts(prev => prev.filter((_, i) => i !== index));
        // Remove associated comment when deleting bookmark
        setComments(prev => {
            const newComments = { ...prev };
            delete newComments[index];
            // Shift down comments for items that come after the deleted index
            Object.keys(newComments).forEach(key => {
                const keyNum = parseInt(key);
                if (keyNum > index) {
                    newComments[keyNum - 1] = newComments[keyNum];
                    delete newComments[keyNum];
                }
            });
            return newComments;
        });
        messageApi.success('Note removed successfully!');
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
        // Generate prompts section with styling similar to PromptManager
        const promptsHTML = prompts.map((prompt, index) => {
            const color = colorScale(index + 1);
            const groupIndex = groups.findIndex(group => group.items.includes(index));
            const groupName = groupIndex !== -1 ? groups[groupIndex].name : '';
            return `
                <div style="margin-bottom: 10px;">
                    <div style="display: flex; align-items: center;">
                        <div style="width: 20px; height: 20px; background-color: ${color}; border-radius: 50%; margin-right: 10px;"></div>
                        <div style="font-weight: bold; margin-right: 10px;">Prompt ${index + 1}${groupName ? ` (${groupName})` : ''}:</div>
                    </div>
                    <div style="margin-left: 30px; padding: 5px 0;">${prompt}</div>
                </div>
            `;
        }).join('');

        // Generate images section with styling similar to ImageSummary imageContainer
        const imagesHTML = images.map((image) => {
            const color = colorScale(image.batch);
            return `
                <div style="display: inline-block; width: 80px; height: 80px; margin: 5px; border-radius: 5px; border-top: 7px solid ${color}; box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    <img src="data:image/png;base64,${image.data}" alt="Image ${image.imageId}" style="width: 100%; height: 100%; object-fit: cover;" />
                </div>
            `;
        }).join('');

        const chartsHTML = bookmarkedCharts.map((_data, index) => {
            const title = _data.title ? `<h3>${_data.title}</h3>` : '';
            const comment = comments[index] ? `<p>${comments[index]}</p>` : '';
            
            // Handle SVG charts (only for bar charts and scatterplots, not for non-attribute bookmarks)
            let chartSection = '';
            if (_data.type !== 'non-attribute') {
                const svg = document.getElementById(`chart-${index}`).innerHTML;
                chartSection = `<div>${svg}</div>`;
            }
            
            // Handle images for non-attribute bookmarks (object nodes and direct image bookmarks)
            let imagesSection = '';
            if (_data.type === 'non-attribute' && _data.images && _data.images.length > 0) {
                const bookmarkImagesHTML = _data.images.map((image) => {
                    const color = colorScale(image.batch);
                    return `
                        <div style="display: inline-block; width: 80px; height: 80px; margin: 5px; border-radius: 5px; border-top: 7px solid ${color}; box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1); overflow: hidden;">
                            <img src="data:image/png;base64,${image.data}" alt="Image ${image.imageId}" style="width: 100%; height: 100%; object-fit: cover;" />
                        </div>
                    `;
                }).join('');
                
                imagesSection = `
                    <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px; padding: 10px; background-color: #f9f9f9; border-radius: 5px;">
                        <div style="width: 100%; font-size: 14px; font-weight: bold; margin-bottom: 5px;">Associated Images (${_data.images.length})</div>
                        ${bookmarkImagesHTML}
                    </div>
                `;
            }
            
            return `<div style="margin-bottom: 40px;">${title}${chartSection}${imagesSection}${comment}</div>`;
        }).join('');

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Audit Report</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        max-width: 1200px; 
                        margin: 0 auto; 
                        padding: 20px; 
                    }
                    h1, h2 { 
                        color: #333; 
                        border-bottom: 2px solid #ddd; 
                        padding-bottom: 10px; 
                    }
                    h3 { margin: 20px 0 10px; }
                    p { margin: 0 0 20px; }
                    .section { 
                        margin-bottom: 40px; 
                        padding: 20px; 
                        background-color: #f9f9f9; 
                        border-radius: 8px; 
                    }
                    .images-grid { 
                        display: flex; 
                        flex-wrap: wrap; 
                        gap: 5px; 
                        max-height: 400px; 
                        overflow-y: auto; 
                    }
                </style>
            </head>
            <body>
                <h1>Audit Report</h1>
                
                <div class="section">
                    <h2>Prompts</h2>
                    ${promptsHTML}
                </div>
                
                <div class="section">
                    <h2>Generated Images (${images.length} total)</h2>
                    <div class="images-grid">
                        ${imagesHTML}
                    </div>
                </div>
                
                <div class="section">
                    <h2>Analysis Charts and Notes</h2>
                    ${generalNotes ? `<div style="margin-bottom: 30px; padding: 15px; background-color: #fff; border-radius: 5px; border-left: 4px solid #1677ff;"><h3 style="margin-top: 0;">General Notes</h3><p style="white-space: pre-wrap;">${generalNotes}</p></div>` : ''}
                    ${chartsHTML}
                </div>
            </body>
            </html>
        `;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'audit_report.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="image-summary-container" onClick={closeContextMenu}>
            {contextHolder}
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
                                messageApi={messageApi}
                            />
                        ) : (
                            /* Mode D: Use original scene graph-based component */
                            <SuggestComparison 
                                prompts={prompts} 
                                images={imagesRef.current} 
                                graphSchema={graphSchema} 
                                handleSuggestionButtonClick={handleSuggestionButtonClick}
                                isGenerating={isGenerating}
                                messageApi={messageApi}
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
                            messageApi={messageApi}
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
                                <Image.PreviewGroup
                                    preview={{
                                        toolbarRender: (originalNode, info) => {
                                            const { current } = info;
                                            const currentImage = images[current];
                                            return (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {originalNode}
                                                    {/* Bookmark Button */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            addBookmarkedChart({ 
                                                                type: 'non-attribute', 
                                                                images: [currentImage], 
                                                                title: `Image ${currentImage.imageId} (Batch ${currentImage.batch})` 
                                                            });
                                                        }}
                                                        style={{
                                                            background: '#52c41a',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            color: 'white',
                                                            padding: '6px 12px',
                                                            cursor: 'pointer',
                                                            fontSize: '14px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px'
                                                        }}
                                                    >
                                                        📌 Bookmark
                                                    </button>
                                                </div>
                                            );
                                        }
                                    }}
                                >
                                    {images.map((image, index) => (
                                        <div key={index} className={"imageItem" + (hoveredImageIds.includes(image.imageId) ? ' hoveredImage' : '')} style={{ 'borderTop': '7px solid ' + colorScale(image.batch) }}>
                                            <Image 
                                                width={'100%'} 
                                                src={`data:image/png;base64,${image.data}`} 
                                                alt={`Image ${image.imageId}`} 
                                                onMouseEnter={(e) => { handleImageHover(e, image) }} 
                                                onMouseLeave={handleImageHoverLeave} 
                                                onContextMenu={(e) => openContextMenu(e, index)}
                                            />
                                        </div>
                                    ))}
                                </Image.PreviewGroup>
                                <Tooltip {...imageTooltip} />
                                {contextMenuPos && <div className="context-menu" style={contextMenuPos}>
                                    <div className="context-menu-item" onClick={() => { setIsLabelModalOpen(true); closeContextMenu(); }}>Edit</div>
                                    <div className="context-menu-item" onClick={() => { 
                                        addBookmarkedChart({ 
                                            type: 'non-attribute', 
                                            images: [contextMenuData.data], 
                                            title: `Image ${contextMenuData.data.imageId} (Batch ${contextMenuData.data.batch})` 
                                        }); 
                                        closeContextMenu(); 
                                    }}>Bookmark Image</div>
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
                <BookmarkedCharts bookmarkedCharts={bookmarkedCharts} colorScale={colorScale} comments={comments} setComments={setComments} priorPrompts={prompts} generalNotes={generalNotes} setGeneralNotes={setGeneralNotes} onDeleteBookmark={handleDeleteBookmark} />
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