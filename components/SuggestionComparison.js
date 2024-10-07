import React, { useEffect, useState } from 'react';
import Heatmap from './Heatmap';
import BarChart from './BarChart';
import { Image, Switch, Popover, Button } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import axios from 'axios';

const SuggestComparison = ({ images, graphSchema, handleSuggestionButtonClick }) => {
    const [image1Index, setImage1Index] = useState(0);
    const [image2Index, setImage2Index] = useState(1);

    const content = (index) => (images && index < images.length) ? (
        <div>
          <Image width={200} src={`data:image/png;base64,${images[index].data}`} alt={`Image ${images[index].id}`} />
        </div>
      ) : "No images available";

    const _handleSuggestionButtonClick2 = () => {
        // handleSuggestionButtonClick({ "path": ["Foreground", "doctor"], "replaceValue": "doctor", "newValue": "nurse" });
        handleSuggestionButtonClick(suggestionMetaData, 'external');
    }

    const [suggestionMetaData, setSuggestionMetaData] = useState({});

    const updateSuggestion = () => {
        if(images.length <= 1) return;
        // randomly choose two different images
        let _image1Index = Math.floor(Math.random() * images.length);
        let _image2Index = Math.floor(Math.random() * images.length);
        while (_image1Index === _image2Index) {
            _image2Index = Math.floor(Math.random() * images.length);
        }
        const path1 = images[_image1Index].path;
        const path2 = images[_image2Index].path;
        axios.post('/api/suggest-comparison', {
            path1: path1,
            path2: path2,
            schema: graphSchema
        }).then((response) => {
            // console.log(response)
            setSuggestionMetaData(response.data.res);
            setImage1Index(_image1Index);
            setImage2Index(_image2Index);
        }).catch((error) => {
            console.error(error);
        });

    }

    // in useeffect, send a http request
    useEffect(() => {
        updateSuggestion();
    }, [graphSchema]);

    return (
        <>
            <div>
                <h4 className='suggestion-itemTitle' style={{"display": "inline-block"}}>Comparison</h4>
                <SyncOutlined onClick={updateSuggestion} style={{"display": "inline-block", "margin": "auto 5px", "cursor": "pointer"}}/>
            </div>
            {Object.keys(suggestionMetaData).length === 0 ? <div>Loading...</div> :
                <>
                    <div className="suggestion-text">
                        <p><i>The objects in <Popover content={content(image1Index)}><u><b>Figure {image1Index + 1}</b></u></Popover> and <Popover content={content(image2Index)}><u><b>Figure {image2Index + 1}</b></u></Popover> are different with respect to the <b>{suggestionMetaData.newNodeName}</b> of the <b>{suggestionMetaData.parentNodeName}</b>.</i></p>
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
                            Update the labels
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