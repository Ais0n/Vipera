import React, { useEffect, useState } from 'react';
import Heatmap from './Heatmap';
import BarChart from './BarChart';
import { Image, Switch, Popover, Button } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import axios from 'axios';

const SuggestPromotion = ({ prompt, graphSchema, dataForPromotion, handleSuggestionButtonClick }) => {
    const _handleSuggestionButtonClick2 = () => {
        // handleSuggestionButtonClick({ "path": ["Foreground", "doctor"], "replaceValue": "doctor", "newValue": "nurse" });
        handleSuggestionButtonClick(suggestionMetaData, 'promote');
    }

    const [suggestionMetaData, setSuggestionMetaData] = useState({});

    const updateSuggestion = () => {
        axios.post('/api/suggest-promotion', {
            prompt: prompt,
            schema: graphSchema
        }).then((response) => {
            // console.log(response)
            setSuggestionMetaData(response.data.res);
        }).catch((error) => {
            console.error(error);
        });
    }

    // in useeffect, send a http request
    useEffect(() => {
        updateSuggestion();
    }, []);

    return (
        <>
            <div>
                <h4 className='suggestion-itemTitle' style={{"display": "inline-block"}}>Promotion</h4>
                <SyncOutlined onClick={updateSuggestion} style={{"display": "inline-block", "margin": "auto 5px", "cursor": "pointer"}}/>
            </div>
            {Object.keys(suggestionMetaData).length === 0 ? <div>Loading...</div> :
                <>
                    <div className="suggestion-text">
                        <p><i>Want to see the results of <b> {suggestionMetaData.newNodeName} </b> apart from <b>{suggestionMetaData.oldNodeName}</b>?</i></p>
                    </div>
                    {/* <div className='graphNode'>Occupations / gender</div>
                    <div className="barchart">
                        <Heatmap data={dataForPromotion} />
                    </div> */}
                    <div className="suggestion-toolbar">
                        <Button
                            className="suggestion-button"
                            onClick={_handleSuggestionButtonClick2}
                            type="primary"
                        >
                            Update my prompt
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

export default SuggestPromotion;