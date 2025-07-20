import React, { useEffect, useState } from 'react';
import HighlightedText from './HighlightedText';
import { Image, Switch, Popover, Button } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import axios from 'axios';
import { removeUnderscoreFields } from '../utils';

const SuggestPromotion = ({ prompt, graphSchema, dataForPromotion, handleSuggestionButtonClick, priorPrompts }) => {
    const _handleSuggestionButtonClick2 = () => {
        // handleSuggestionButtonClick({ "path": ["foreground", "doctor"], "replaceValue": "doctor", "newValue": "nurse" });
        handleSuggestionButtonClick(suggestionMetaData, 'promote');
    }

    const [suggestionMetaData, setSuggestionMetaData] = useState({});

    const updateSuggestion = () => {
        if (process.env.NEXT_PUBLIC_LLM_ENABLED == 'false') {
            setSuggestionMetaData({});
            return;
        }
        
        axios.post('/api/suggest-promotion', {
            prompt: prompt,
            schema: removeUnderscoreFields(graphSchema),
            priorPrompts: priorPrompts,
        }).then((response) => {
            // console.log(response)
            setSuggestionMetaData(response.data.res);
        }).catch((error) => {
            console.error(error);
        });
    }

    const handleRefresh = () => {
        setSuggestionMetaData({});
        updateSuggestion();
    }

    // in useeffect, send a http request
    useEffect(() => {
        updateSuggestion();
    }, [priorPrompts]);

    return (
        <div className="suggestion-item">
            {Object.keys(suggestionMetaData).length === 0 ? <div>Loading...</div> :
                <>

                    <div className="suggestion-text">
                        <div className="suggestion-text-left">
                            <SyncOutlined onClick={handleRefresh} style={{ "display": "inline-block", "margin": "auto 5px", "cursor": "pointer" }} />
                        </div>
                        <div className="suggestion-text-right">
                            <p><i>Want to see the results of <b> {suggestionMetaData.newNodeName} </b> apart from <b>{suggestionMetaData.oldNodeName}</b>?</i></p>
                        </div>
                    </div>
                    {/* <div className='graphNode'>Occupations / gender</div>
                    <div className="barchart">
                        <Heatmap data={dataForPromotion} />
                    </div> */}
                    <div className="suggestion-preview">
                        <div> <b> <i> New prompt:</i>  </b> </div>
                        <HighlightedText raw={suggestionMetaData.newPrompt} oldWord={suggestionMetaData.oldNodeName} newWord={suggestionMetaData.newNodeName} />
                    </div>
                    <div className="suggestion-toolbar">
                        <Button
                            className="suggestion-button"
                            onClick={_handleSuggestionButtonClick2}
                            type="primary"
                        >
                            Try out this prompt
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
        </div>
    );
};

export default SuggestPromotion;