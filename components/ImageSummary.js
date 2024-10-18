// components/ImageSummary.js

import React from 'react';
import { Image, Switch, Popover, Button } from 'antd';
import TreeView from './TreeView';
import DrawerView from './Drawer';
import ImageSummaryVis from './ImageSummaryVis';
import Heatmap from './Heatmap';
import BarChart from './BarChart';
import SuggestPromotion from './SuggestPromotion';
import SuggestExternal from './SuggestExternal';
import SuggestComparison from './SuggestionComparison';
import BookmarkedCharts from './BookmarkedCharts';
import * as d3 from 'd3';

const ImageSummary = ({ images, metaData, prompts, graph, graphSchema, handleSuggestionButtonClick, switchChecked, setSwitchChecked, handleNodeEdit, handleNodeAdd }) => {
    const [hoveredImageIds, setHoveredImageIds] = React.useState([]);
    const [unselectedPrompts, setUnselectedPrompts] = React.useState([]);
    const [bookmarkedCharts, setBookmarkedCharts] = React.useState([]);

    const defaultColorScale = d3.scaleOrdinal(d3.schemeCategory10);

    const colorScale = (batch) => { 
        if(unselectedPrompts.includes(batch)) {
            return 'gray';
        } else {
            return defaultColorScale(batch - 1);
        }
    }

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
        handleSuggestionButtonClick({ "path": ["Foreground", "doctor"], "addValue": "smiling" });
    }

    const _handleSuggestionButtonClick2 = () => {
        handleSuggestionButtonClick({ "path": ["Foreground", "doctor"], "replaceValue": "doctor", "newValue": "nurse" });
    }

    const dataForPromotion = [
        { category: 'Doctor',values: { 'male': 0.8, 'female': 0.1, 'others': 0.1 } },
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
        console.log(data.imageId);
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


    return (
        <div className="image-summary-container">
            <div className="content">
                {/* Left Column */}
                <div className="left-column">
                    <h2>Prompts</h2>
                    <div className='prompt-items'>
                        {prompts.map((prompt, index) => (
                            <div key={index} className='prompt-item' style={{'backgroundColor': colorScale(index + 1)}} onClick={(e) => handlePromptClick(index + 1)}>
                                <div style={{"fontWeight": "bold", 'display': 'inline'}}>Prompt {index + 1}:</div> 
                                {prompt}
                            </div>
                        ))}
                    </div>
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
                            <SuggestPromotion prompt={prompts[prompts.length - 1]} graphSchema={graphSchema} dataForPromotion={dataForPromotion} handleSuggestionButtonClick={handleSuggestionButtonClick}></SuggestPromotion>
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
                            <ImageSummaryVis images={images} data={metaData} graph={graph} graphSchema={graphSchema} hoveredImageIds={hoveredImageIds} addBookmarkedChart={addBookmarkedChart} colorScale={colorScale}/>
                            :
                            <div className="imageContainer">
                                {images.map((image, index) => (
                                    <div key={index} className="imageItem">
                                        <Image width={'100%'} src={`data:image/png;base64,${image.data}`} alt={`Image ${image.id}`} />
                                    </div>
                                ))}
                            </div>
                        }
                    </div>
                    <div className="label-view">
                        <div style={{ "display": "flex", "alignItems": "center", "justifyContent": "space-between" }}>
                            <h2 style={{ "margin": 0 }}>Scene Graph</h2>
                            <i>Generated using LLaVA v1.6 and may contain errors.</i>
                        </div>
                        <TreeView data={graph} handleBarHover={handleBarHover} handleNodeHover={handleNodeHover} handleNodeEdit={handleNodeEdit} handleNodeAdd={handleNodeAdd} addBookmarkedChart={addBookmarkedChart} colorScale={colorScale}/>
                    </div>
                </div>
            </div>

            <div className="notebook">
                <h2 style={{ "margin": 0 }}>Notes</h2>
                <BookmarkedCharts bookmarkedCharts={bookmarkedCharts} colorScale={colorScale} />
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
                    display: flex;
                    cursor: pointer;
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
            `}</style>
        </div>
    );
};

export default ImageSummary;