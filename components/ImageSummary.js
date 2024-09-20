// components/ImageSummary.js

import React from 'react';
import { Image, Switch, Popover, Button } from 'antd';
import TreeView from './TreeView';
import ImageSummaryVis from './ImageSummaryVis';
import Heatmap from './Heatmap';
import BarChart from './BarChart';

const ImageSummary = ({ images, metaData, prompts, graph, graphSchema, handleSuggestionButtonClick }) => {
    const [selectedNode, setSelectedNode] = React.useState(null);
    const [switchChecked, setSwitchChecked] = React.useState(true);

    const content = (index) => (images && index < images.length) ? (
        <div>
          <Image width={200} src={`data:image/png;base64,${images[index].data}`} alt={`Image ${images[index].id}`} />
        </div>
      ) : "No images available";

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


    return (
        <div className="image-summary-container">
            <div className="content">
                {/* Left Column */}
                <div className="left-column">
                    <div className="image-info">
                        <div style={{ "display": "flex", "gap": "15px", "margin": "15px auto", "alignItems": "center" }}>
                            <h2 style={{ "margin": 0 }}>Images</h2>
                            <Switch checked={switchChecked} onChange={setSwitchChecked} checkedChildren={"Summary"} unCheckedChildren={"List"} size={"large"} />
                        </div>
                        {switchChecked ?
                            <ImageSummaryVis images={images} data={metaData} graph={graph} setSelectedNode={setSelectedNode} />
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
                                <div></div>
                                <div style={{"font-weight": "bold", 'display': 'inline'}}>Prompt {index + 1}: </div> 
                                {prompt}
                            </p>
                        ))}
                    </div>

                    <h2>Suggestions</h2>
                    <div className="suggestion-items">
                        <div className="suggestion-item">
                            <h4 className='suggestion-itemTitle'>Promotion</h4>
                            <div className="suggestion-text">
                                <p>A cinematic photo of a <b>doctor</b> -- <i>wanted to see other occupations?</i></p>
                            </div>
                            <div className='graphNode'>Occupations / gender</div>
                            <div className="barchart">
                                <Heatmap data={dataForPromotion}></Heatmap>
                            </div>
                            <div className="suggestion-toolbar">
                                <Button className="suggestion-button" onClick={_handleSuggestionButtonClick2} disabled={true}>Update my prompt</Button>
                            </div>
                        </div>
                        <div className="suggestion-item">
                            <h4 className='suggestion-itemTitle'>Comparison</h4>
                            <div className="suggestion-text">
                                <p>The doctor in <Popover content={content(7)}><u><b>Figure 8</b></u></Popover> is smiling, while the one in <Popover content={content(0)}><u><b>Figure 1</b></u></Popover> is not.</p>
                            </div>
                            <div className='graphNode'>Smiling?</div>
                            <div className="barchart">
                                <BarChart data={dataForComparison}></BarChart>
                            </div>
                            <div className="suggestion-toolbar">
                                <Button className="suggestion-button" type="primary" onClick={_handleSuggestionButtonClick}>Update my prompt</Button>
                            </div>
                        </div>
                        <div className="suggestion-item">
                            <h4 className='suggestion-itemTitle'>External knowledge</h4>
                            <div className="suggestion-text">
                                It is interesting to inspect the race distribution of doctors.
                            </div>
                            <div className='graphNode'>Race</div>
                            <div className="barchart">
                                <BarChart data={dataForExternalKnowledge}></BarChart>
                            </div>
                            <div className="suggestion-toolbar">
                                <Button className="suggestion-button" disabled={true}>Update my prompt</Button>
                            </div>
                        </div>
                        {prompts.length > 1 && <div className="suggestion-item">
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
                        </div>}
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
                    background-color: #eff9f5;
                    border-radius: 5px;
                    box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1);
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