import React, { useEffect, useState } from 'react';
import HighlightedText from './HighlightedText';
import { Image, Switch, Popover, Button } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import axios from 'axios';
import { getLeafNodes } from '../utils';
import ModalTreeAdd from './ModalTreeAdd';

const CriteriaView = ({ data, prompts = [], colorScale, groups, images }) => {
    const nodes = getLeafNodes(data);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isRelabelModalOpen, setIsRelabelModalOpen] = useState(false);
    const handleAdd = () => { };
    const handleEdit = () => { };
    return (
        <>
            <div style={{ "marginBottom": "10px" }}>
                <h2 style={{ "margin": 0, "display": "inline-block" }}>Criteria</h2>
                <Button style={{ 'display': 'inline-block', 'marginLeft': '15px' }} onClick={(e) => { setIsAddModalOpen(true); }}>Add</Button>
            </div>
            <div className="suggestion-item">
                {!data || data == {} ? ("No data available.") : (
                    <div className="suggestion-text">
                        {nodes.forEach((node, index) => {
                            <div className="suggestion-text-left">
                                <span className="graphNode">{node.name}</span>

                            </div>
                        })}
                    </div>
                )}
                <ModalTreeAdd
                    isOpen={isAddModalOpen | isEditModalOpen}
                    modalType={isAddModalOpen ? 'add' : 'edit'}
                    onClose={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                    onSave={isAddModalOpen ? handleAdd : handleEdit}
                    prompts={prompts}
                    colorScale={colorScale}
                    groups={groups}
                    images={images}
                    contextMenuData={null}
                    treeUtils={()=>{}}
                    useSceneGraph={false}
                />

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
        </>
    );
};

export default CriteriaView;