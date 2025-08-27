import React, { useEffect, useState } from 'react';
import { Image, Switch, Popover, Button } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import axios from 'axios';
import { removeUnderscoreFields } from '../utils';

const SuggestExternal = ({ prompt, graphSchema, dataForExternalKnowledge, handleSuggestionButtonClick }) => {
    const [suggestionMetaData, setSuggestionMetaData] = useState({});
    const [isApplying, setIsApplying] = useState(false); // Track if suggestion is being applied
    const [isApplied, setIsApplied] = useState(false); // Track if suggestion has been applied
    
    const _handleSuggestionButtonClick2 = () => {
        setIsApplying(true);
        // handleSuggestionButtonClick({ "path": ["foreground", "doctor"], "replaceValue": "doctor", "newValue": "nurse" });
        handleSuggestionButtonClick(suggestionMetaData, "external");
        // Set to applied state
        setTimeout(() => {
            setIsApplying(false);
            setIsApplied(true);
        }, 1000);
    }

    const updateSuggestion = () => {
        axios.post('/api/suggest-external', {
            prompt: prompt,
            schema: removeUnderscoreFields(graphSchema)
        }).then((response) => {
            // console.log(response)
            setSuggestionMetaData(response.data.res);
            // Reset loading state when suggestion is updated
            setIsApplying(false);
            setIsApplied(false); // Reset applied state when new suggestion loads
        }).catch((error) => {
            console.error(error);
            // Reset loading state on error
            setIsApplying(false);
            setIsApplied(false);
        });
    }

    // in useeffect, send a http request
    useEffect(() => {
        updateSuggestion();
    }, []);

    return (
        <>
            <div>
                <h4 className='suggestion-itemTitle' style={{"display": "inline-block"}}>External Knowledge</h4>
                <SyncOutlined onClick={updateSuggestion} style={{"display": "inline-block", "margin": "auto 5px", "cursor": "pointer"}}/>
            </div>
            {Object.keys(suggestionMetaData).length === 0 ? <div>Loading...</div> :
                <>
                    <div className="suggestion-text">
                        <p><i>It is interesting to inspect the <b> {suggestionMetaData.newNodeName} </b> of <b>{suggestionMetaData.parentNodeName}</b>.</i></p>
                    </div>
                    {/* <div className='graphNode'>Race</div>
                    <div className="barchart">
                        <BarChart data={dataForExternalKnowledge}></BarChart>
                    </div> */}
                    <div className="suggestion-toolbar">
                        <Button
                            className="suggestion-button"
                            onClick={_handleSuggestionButtonClick2}
                            type="primary"
                            disabled={isApplying || isApplied}
                            loading={isApplying}
                        >
                            {isApplying ? 'Applying...' : isApplied ? 'Applied' : 'Update the labels'}
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

export default SuggestExternal;