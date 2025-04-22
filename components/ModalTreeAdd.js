import React, { useEffect, useState, useRef } from 'react';
import { Modal, Input, Button, Radio, Tooltip, Checkbox, Image } from 'antd';
import { SyncOutlined, InfoCircleOutlined, RightOutlined, DownOutlined } from '@ant-design/icons';
import * as Utils from '../utils.js';

const ModalTreeAdd = ({ isOpen, modalType, onClose, onSave, prompts = [], groups, colorScale, images, contextMenuData, treeUtils }) => {
    const [nodeType, setNodeType] = useState("attribute");
    const [nodeName, setNodeName] = useState('');
    const [candidateValues, setCandidateValues] = useState('');
    const [selectedPrompts, setSelectedPrompts] = useState([]);
    const [expandedGroups, setExpandedGroups] = useState(groups.map(() => true));
    const [selectedImageIds, setSelectedImageIds] = useState([]);
    const contentRefs = useRef([]);

    const toggleGroup = (groupIndex) => {
        const newExpanded = [...expandedGroups];
        newExpanded[groupIndex] = !newExpanded[groupIndex];
        setExpandedGroups(newExpanded);
    };

    useEffect(() => {
        // if (prompts.length > 0) {
        //     setSelectedPrompts(prompts.map((_, index) => index));
        // }
        console.log(contextMenuData);
        if(contextMenuData) {
            let imageInfo = contextMenuData.data.imageInfo;
            setSelectedImageIds(Array.from(new Set(imageInfo.map(image => image.imageId))));
            setSelectedPrompts(Array.from(new Set(imageInfo.map(image => image.batch - 1))));
            if (modalType == "edit") {
                setNodeName(contextMenuData.data.name);
                setNodeType(contextMenuData.data.type);
                let schemaNode = treeUtils.getSchemaNodeFromTreeNode(contextMenuData);
                console.log(schemaNode);
                setCandidateValues(Utils.deepClone(schemaNode._candidateValues) || '');
            } else {
                setNodeName('');
                setNodeType('attribute');
                setCandidateValues('');
            }
        }
    }, [contextMenuData, modalType]);

    const handleSave = () => {
        // check if nodeName is empty
        if (nodeName.trim() === "") {
            alert("Node name cannot be empty");
            return;
        }
        // check if scope is empty
        if (selectedImageIds.length === 0) {
            alert("Please select at least one image for the scope");
            return;
        }

        onSave({ nodeName, nodeType, candidateValues, scope: selectedImageIds });
        onClose();
        setNodeName('');
        setNodeType("attribute");
        setCandidateValues('');
        setSelectedPrompts([]);
    };

    const promptAllChecked = selectedPrompts.length === prompts.length; // whether all prompts are selected
    const promptIndeterminate = !promptAllChecked && selectedPrompts.length > 0; // whether some prompts are selected

    return (
        <>

            <Modal
                title="Add Node"
                open={isOpen}
                onCancel={onClose}
                footer={[
                    <Button key="cancel" onClick={onClose}>
                        Cancel
                    </Button>,
                    <Button key="submit" type="primary" onClick={handleSave}>
                        Save
                    </Button>
                ]}
                width={800}
            >
                <div className="modal-tree-add">
                    <div><b>Type</b><Tooltip title={"An attribute node denotes an auditing criteria that will be used to label the images for evaluation. An object node denotes an object in the images and will NOT directly be used for evaluation."}><InfoCircleOutlined style={{ color: 'grey', 'marginLeft': '5px' }} /></Tooltip></div>
                    <Radio.Group onChange={(e) => { setNodeType(e.target.value) }} value={nodeType}>
                        <Radio value={"attribute"}>Attribute</Radio>
                        <Radio value={"object"}>Object</Radio>
                    </Radio.Group>
                    <div><b>Name</b></div>
                    <Input
                        value={nodeName}
                        onChange={(e) => setNodeName(e.target.value)}
                        placeholder="Enter new node name"
                    />
                    <div><b>Candidate Values (Optional)</b><Tooltip title={"You may create a list of candidate values for labeling."}><InfoCircleOutlined style={{ color: 'grey', 'marginLeft': '5px' }} /></Tooltip></div>
                    <Input
                        value={candidateValues}
                        onChange={(e) => {setCandidateValues(e.target.value)}}
                        placeholder="Enter candidate values (comma separated)"
                    />
                    <>
                        <div><b>Scope</b><Tooltip title="Select the prompts on which you want to evaluate with the criteria."><InfoCircleOutlined style={{ color: 'grey', marginLeft: '5px' }} /></Tooltip></div>
                        <div style={{ display: 'flex', gap: '8px', flexDirection: 'row' }}>
                            <div className="prompts-checkbox-group">
                                {/* 新增全选复选框 */}
                                <Checkbox
                                    indeterminate={promptIndeterminate}
                                    checked={promptAllChecked}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedPrompts(prompts.map((_, index) => index));
                                        } else {
                                            setSelectedPrompts([]);
                                        }
                                    }}
                                >
                                    Select All
                                </Checkbox>
                                {groups.map((group, groupIndex) => (
                                    <div
                                        key={groupIndex}
                                        className={`group}`}
                                    >
                                        <div className="group-header" onClick={() => toggleGroup(groupIndex)}>
                                            {expandedGroups[groupIndex] ? (
                                                <DownOutlined style={{ cursor: 'pointer', marginRight: '8px' }} />
                                            ) : (
                                                <RightOutlined style={{ cursor: 'pointer', marginRight: '8px' }} />
                                            )}
                                            <div className="group-name">{group.name}</div>
                                        </div>
                                        <div
                                            className="group-content"
                                            style={{
                                                height: expandedGroups[groupIndex] ? contentRefs.current[groupIndex]?.scrollHeight : 0,
                                                transition: 'height 0.3s ease',
                                                overflow: 'hidden',
                                            }}
                                            ref={el => contentRefs.current[groupIndex] = el}
                                        >
                                            {group.items.map((promptIndex) => (
                                                <div
                                                    key={promptIndex}
                                                    className={"prompt-item"}
                                                    style={{ 'paddingLeft': '23px' }}
                                                >
                                                    <span
                                                        className="prompt-item-color"
                                                        style={{ backgroundColor: colorScale(promptIndex + 1) }}
                                                    />
                                                    <Checkbox
                                                        checked={selectedPrompts.includes(promptIndex)}
                                                        onChange={(e) => {
                                                            const checked = e.target.checked;
                                                            setSelectedPrompts(prev =>
                                                                checked ? [...prev, promptIndex] : prev.filter(i => i !== promptIndex)
                                                            );
                                                            setSelectedImageIds(prev =>
                                                                checked ? [...prev, ...images.filter(image => image.batch === promptIndex + 1).map(image => image.imageId)] :
                                                                    prev.filter(id => !images.some(image => image.imageId === id && image.batch === promptIndex + 1))
                                                            );
                                                        }}
                                                    >
                                                        <div
                                                            className='prompt-item-text'
                                                        >
                                                            {prompts[promptIndex]}
                                                        </div>
                                                    </Checkbox>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {prompts.map((prompt, index) => (
                                    !groups.some(group => group.items.includes(index)) && (
                                        <div className='prompt-item' key={"modal-pitem-" + String(index)}>
                                            <span
                                                className="prompt-item-color"
                                                style={{ backgroundColor: colorScale(index + 1) }}
                                            />
                                            <Checkbox
                                                checked={selectedPrompts.includes(index)}
                                                onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    setSelectedPrompts(prev =>
                                                        checked ? [...prev, index] : prev.filter(i => i !== index)
                                                    );
                                                    setSelectedImageIds(prev =>
                                                        checked ? [...prev, ...images.filter(image => image.batch === index + 1).map(image => image.imageId)] :
                                                            prev.filter(id => !images.some(image => image.imageId === id && image.batch === index + 1))
                                                    );
                                                }}
                                            >
                                                <div className="prompt-item-text">
                                                    {prompt}
                                                </div>
                                            </Checkbox>
                                        </div>)
                                ))}
                            </div>
                            <div className="imageContainer">
                                {images.map((image, index) => (
                                    <div key={index} className="imageItem" style={{ borderTop: '7px solid ' + colorScale(image.batch) }}>
                                        <div className="image-checkbox-wrapper">
                                            <Checkbox
                                                className="image-checkbox"
                                                checked={selectedImageIds.includes(image.imageId)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedImageIds([...selectedImageIds, image.imageId]);
                                                    } else {
                                                        setSelectedImageIds(selectedImageIds.filter(id => id !== image.imageId));
                                                    }
                                                }}
                                            />
                                        </div>
                                        <Image
                                            width={'100%'}
                                            src={`data:image/png;base64,${image.data}`}
                                            alt={`Image ${image.imageId}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                </div>
            </Modal>
            <style jsx>{`
            .modal-tree-add {
                line-height: 2em;
            }
            .prompts-checkbox-group {
                max-height: 200px;
                overflow-y: auto;
                flex: 1;
                // padding-left: 8px;
                // border: 1px solid #d9d9d9;
                // border-radius: 2px;
            }
            .prompt-item {
                display: flex;
                align-items: center;
                gap: 8px;
                margin: 4px 0;
            }
            .color-block {
                width: 16px;
                height: 16px;
                border-radius: 50%;
                flex-shrink: 0;
            }
            .prompt-item.highlighted {
                border-color: #1890ff;
                box-shadow: 0 0 10px rgba(24, 144, 255, 0.5);
            }
            .prompt-item-color {
                display: inline-block;
                width: 12px;
                height: 12px;
                -webkit-appearance: none;
                -moz-appearance: none;
                appearance: none;
                background-color: transparent;
                border: none;
                cursor: pointer;
                margin-right: 5px;
                border-radius: 50%;
            }
            .prompt-item-text {
                padding-left: 5px;
                line-height: 2.2em;
                border-radius: 5px;
                display: inline-block;
            }
            .group {
                border-radius: 8px;
                position: relative;
            }
            .group-header {
                display: flex;
                line-height: 2.2em;
            }
            .group-name {
                flex: 1;
                font-weight: bold;
                font-size: 16px;
                margin-left: 5px;
                user-select: none;
            }
            .group-content {
                overflow: hidden;
            }
            .imageContainer {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                max-height: 300px;
                overflow-y: scroll;
                flex: 1;
            }

            .imageItem {
                width: 60px;
                height: 60px;
                border-radius: 5px;
                overflow: hidden;
                box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1);
                position: relative;
            }

            .image-checkbox-wrapper {
                position: absolute;
                top: 0px; /* Adjust as needed */
                right: 0px; /* Adjust as needed */
                z-index: 1;
                padding: 0px;
            }
                
            .ant-checkbox-wrapper + .ant-checkbox-wrapper {
                margin-left: 8px;
            }
        `}</style>
        </>
    );
};

export default ModalTreeAdd;