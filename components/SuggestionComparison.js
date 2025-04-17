import React, { useEffect, useState } from 'react';
import Heatmap from './Heatmap';
import BarChart from './BarChart';
import { Image, Switch, Popover, Button, Tooltip } from 'antd';
import { SyncOutlined, InfoCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

const SuggestComparison = ({ images, graphSchema, handleSuggestionButtonClick }) => {
    const [image1Index, setImage1Index] = useState(0);
    const [image2Index, setImage2Index] = useState(1);

    const content = (index) => (images && index < images.length) ? (
        <div>
            <Image width={200} src={`data:image/png;base64,${images[index].data}`} alt={`Image ${images[index].imageId}`} />
        </div>
    ) : "No images available";

    const _handleSuggestionButtonClick2 = () => {
        // handleSuggestionButtonClick({ "path": ["foreground", "doctor"], "replaceValue": "doctor", "newValue": "nurse" });
        handleSuggestionButtonClick(suggestionMetaData, 'external');
    }

    const [suggestionMetaData, setSuggestionMetaData] = useState({});

    const updateSuggestion = () => {
        if (images.length <= 1) return;
        // randomly choose two different images
        let _image1Index = Math.floor(Math.random() * images.length);
        let _image2Index = Math.floor(Math.random() * images.length);
        while (_image1Index === _image2Index) {
            _image2Index = Math.floor(Math.random() * images.length);
        }
        const path1 = images[_image1Index].path;
        const path2 = images[_image2Index].path;
        // axios.post('/api/suggest-comparison', {
        //     path1: path1,
        //     path2: path2,
        //     schema: graphSchema
        // }).then((response) => {
        //     // console.log(response)
        //     setSuggestionMetaData(response.data.res);
        //     setImage1Index(_image1Index);
        //     setImage2Index(_image2Index);
        // }).catch((error) => {
        //     console.error(error);
        // });
    }

    const handleRefresh = () => {
        setSuggestionMetaData({});
        updateSuggestion();
    }

    // in useeffect, send a http request
    useEffect(() => {
        updateSuggestion();
    }, []);

    return (
        <>
            {Object.keys(suggestionMetaData).length === 0 ? <div>Loading...</div> :
                <>
                    <div className="suggestion-text">
                        <div className="suggestion-text-left">
                            <SyncOutlined onClick={handleRefresh} style={{ "display": "inline-block", "margin": "auto 5px", "cursor": "pointer" }} />
                        </div>
                        <div className="suggestion-text-right">
                            <div><i>The objects in <Popover content={content(image1Index)}><u><b>Figure {image1Index + 1}</b></u></Popover> and <Popover content={content(image2Index)}><u><b>Figure {image2Index + 1}</b></u></Popover> are different with respect to the <b>{suggestionMetaData.newNodeName}</b> of the <b>{suggestionMetaData.parentNodeName}</b>.</i> 
                                {suggestionMetaData.explanations && <Tooltip title={suggestionMetaData.explanations}><InfoCircleOutlined style={{color: 'grey'}}/></Tooltip>}
                            </div>
                        </div>
                    </div>
                    <div className="suggestion-preview">
                        <div> <b><i> Add: </i></b> </div>
                        <div className='node'> {suggestionMetaData.parentNodeName} </div>
                        <div> &#x2192; </div>
                        <div className='node'> {suggestionMetaData.newNodeName} </div>
                    </div>
                    {/* <div className='graphNode'>Smiling?</div>
                    <div className="barchart">
                        <BarChart data={dataForComparison}></BarChart>
                    </div> */}
                    <div className="suggestion-toolbar">
                        <Button
                            className="suggestion-button"
                            onClick={_handleSuggestionButtonClick2}
                            type="primary"
                        >
                            Apply to the scene graph
                        </Button>
                    </div>
                </>}
            <style jsx>{`
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
                    display: flex;
                    align-items: center;
                }
                .suggestion-text-left {
                    display: inline-block;
                    width: 20px;
                    margin-right: 10px;
                }
                .suggestion-text-right {
                    display: inline-block;
                    width: calc(100% - 30px);
                }
                .suggestion-preview {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin: 10px 0;
                }
                .node {
                    border: 1px solid #000;
                    border-radius: 5px;
                    padding: 0 5px;
                    margin: 0 10px;
                }
                .suggestion-toolbar {
                    display: flex;
                    justify-content: center;
                    margin-top: 15px;
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
        </>
    );
};

export default SuggestComparison;