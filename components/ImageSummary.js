// components/ImageSummary.js

import React from 'react';
import { Image } from 'antd';
import TreeView from './TreeView';
import ImageSummaryVis from './ImageSummaryVis';
import BarChart from './BarChart';

const ImageSummary = ({ images, metaData, prompts, graph, graphSchema, handleSuggestionButtonClick }) => {
    const [selectedNode, setSelectedNode] = React.useState(null);

    const _handleSuggestionButtonClick = () => {
        handleSuggestionButtonClick({ "path": ["Foreground", "doctor"], "addValue": "smiling" });
    }

    return (
        <div className="image-summary-container">
            <div className="content">
                {/* Left Column */}
                <div className="left-column">
                    <div className="image-info">
                        <h2>Images</h2>
                        <div className="imageContainer">
                            {images.map((image, index) => (
                                <div key={index} className="imageItem">
                                    <Image width={'100%'} src={`data:image/png;base64,${image.data}`} alt={`Image ${image.id}`} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="label-view">
                        <h2> Labels </h2>
                        {selectedNode &&
                            <h3>{selectedNode.name}</h3>

                        }
                        <TreeView data={graph} />
                    </div>
                </div>

                {/* Right Column */}
                <div className="right-column">
                    <h2>Prompts</h2>
                    <div className='prompt-items'>
                        {prompts.map((prompt, index) => (
                            <p key={index} className='prompt-item'>
                                {prompt}
                            </p>
                        ))}
                    </div>

                    <h2>Image Summary</h2>
                    <ImageSummaryVis images={images} data={metaData} graph={graph} setSelectedNode={setSelectedNode} />

                    <h2>Suggestions</h2>
                    <div className="suggestion-items">
                        <div className="suggestion-item">
                            <h4 className='suggestion-itemTitle'>Keywords</h4>
                            <div className="suggestion-text">
                                A cinematic photo of an experienced doctor, smiling, middle-aged
                            </div>
                            <div className="barchart">
                                <BarChart></BarChart>
                            </div>
                            <div className="suggestion-toolbar">
                                <button className="suggestion-button">Update my prompt</button>
                            </div>
                        </div>
                        <div className="suggestion-item">
                            <h4 className='suggestion-itemTitle'>Objects</h4>
                            <div className="suggestion-text">
                                The doctor in Figure 10 is smiling.
                            </div>
                            <div className="barchart">
                                <BarChart></BarChart>
                            </div>
                            <div className="suggestion-toolbar">
                                <button className="suggestion-button" onClick={_handleSuggestionButtonClick}>Update my prompt</button>
                            </div>
                        </div>
                        <div className="suggestion-item">
                            <h4 className='suggestion-itemTitle'>Attributes</h4>
                            <div className="suggestion-text">
                                It is interesting to inspect the race distribution of doctors.
                            </div>
                            <div className="barchart">
                                <BarChart></BarChart>
                            </div>
                            <div className="suggestion-toolbar">
                                <button className="suggestion-button">Update my prompt</button>
                            </div>
                        </div>
                        <div className="suggestion-item">
                            <h4 className='suggestion-itemTitle'>Correlation</h4>
                            <div className="suggestion-text">
                                Male doctors are more likely to be middle-aged.
                            </div>
                            <div className="barchart">
                                <BarChart></BarChart>
                            </div>
                            <div className="suggestion-toolbar">
                                <button className="suggestion-button">Update my prompt</button>
                            </div>
                        </div>
                    </div>
                </div>
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
                    flex: 1;
                    margin-right: 20px;
                    background-color: #f9f9f9;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                }
                .right-column {
                    flex: 2;
                    margin-right: 0; /* Remove margin from the last column */
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
                    background-color: #888;
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
                    height: 80px;
                    overflow-y: scroll;
                    padding: auto 20px;
                }
                .prompt-item {
                    margin: 5px 10px;
                    padding: 5px 10px;
                    background-color: #eff9f5;
                    border-radius: 5px;
                    box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1);
                }
                .barchart {
                    width: 100%;
                    height: 110px;
                }
            `}</style>
        </div>
    );
};

export default ImageSummary;