import React, { useState, useRef, useEffect } from 'react';
import { Button, Tooltip, Input } from 'antd';
import { DeleteOutlined, EditOutlined, RightOutlined, DownOutlined } from '@ant-design/icons';

const PromptManager = ({ prompts, colorScale, changeColor, handlePromptClick, groups, setGroups }) => {
    const [draggedItem, setDraggedItem] = useState(null);
    const [highlightedGroup, setHighlightedGroup] = useState(null);
    const [highlightedItem, setHighlightedItem] = useState(null);
    const [editingGroupIndex, setEditingGroupIndex] = useState(null);
    const [expandedGroups, setExpandedGroups] = useState(groups.map(() => true));
    const contentRefs = useRef([]);

    const toggleGroup = (groupIndex) => {
        const newExpanded = [...expandedGroups];
        newExpanded[groupIndex] = !newExpanded[groupIndex];
        setExpandedGroups(newExpanded);
    };

    const handleDragStart = (e, index) => {
        setDraggedItem(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const groupIndex = groups.findIndex(group => group.items.includes(index));
        if (groupIndex !== -1) {
            setHighlightedGroup(groupIndex);
            setHighlightedItem(null);
        } else {
            setHighlightedGroup(null);
            setHighlightedItem(index);
        }
    };

    const handleDragLeave = () => {
        setHighlightedGroup(null);
        setHighlightedItem(null);
    };

    const handleDrop = (e, index) => {
        e.preventDefault();
        const droppedIndex = draggedItem;
        const updatedGroups = [...groups];

        if (droppedIndex === null || droppedIndex === index) {
            return; // Prevent dropping to the same item
        }

        const existingGroupIndex = groups.findIndex(group => group.items.includes(droppedIndex));
        if (existingGroupIndex !== -1) {
            updatedGroups[existingGroupIndex].items = updatedGroups[existingGroupIndex].items.filter(item => item !== droppedIndex);
            if (updatedGroups[existingGroupIndex].items.length === 0) {
                updatedGroups.splice(existingGroupIndex, 1);
                setExpandedGroups(prev => {
                    const newExpanded = [...prev];
                    newExpanded.splice(existingGroupIndex, 1);
                    return newExpanded;
                });
            }
        }

        const groupIndex = groups.findIndex(group => group.items.includes(index));
        if (groupIndex !== -1) {
            updatedGroups[groupIndex].items.push(droppedIndex);
        } else {
            const newGroup = { name: `Group ${updatedGroups.length + 1}`, items: [droppedIndex, index], color: colorScale(droppedIndex + 1) };
            updatedGroups.push(newGroup);
            setExpandedGroups(prev => [...prev, true]);
        }

        setGroups(updatedGroups);
        setDraggedItem(null);
        setHighlightedGroup(null);
        setHighlightedItem(null);
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
    }

    const handleGroupDelete = (groupIndex) => {
        const updatedGroups = [...groups];
        updatedGroups.splice(groupIndex, 1);
        setGroups(updatedGroups);
    };

    const handleGroupRename = (groupIndex) => {
        setEditingGroupIndex(groupIndex);
    };

    const handleGroupNameChange = (e, groupIndex) => {
        const updatedGroups = [...groups];
        updatedGroups[groupIndex].name = e.target.value;
        setGroups(updatedGroups);
    };

    const handleGroupNameSave = (groupIndex) => {
        setEditingGroupIndex(null);
    };

    const handleContainerDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const existingGroupIndex = groups.findIndex(group => group.items.includes(draggedItem));
        if (existingGroupIndex !== -1) {
            setHighlightedGroup(null);
            setHighlightedItem(null);
        }
    };

    const handleContainerDrop = (e) => {
        e.preventDefault();
        const droppedIndex = draggedItem;
        const existingGroupIndex = groups.findIndex(group => group.items.includes(droppedIndex));

        if (existingGroupIndex !== -1) {
            const updatedGroups = [...groups];
            updatedGroups[existingGroupIndex].items = updatedGroups[existingGroupIndex].items.filter(item => item !== droppedIndex);
            // Remove group if it becomes empty
            if (updatedGroups[existingGroupIndex].items.length === 0) {
                updatedGroups.splice(existingGroupIndex, 1);
                setExpandedGroups(prev => {
                    const newExpanded = [...prev];
                    newExpanded.splice(existingGroupIndex, 1);
                    return newExpanded;
                });
            }
            setGroups(updatedGroups);
        }

        setDraggedItem(null);
        setHighlightedGroup(null);
        setHighlightedItem(null);
    };

    const handleContainerDragLeave = () => {
        setHighlightedGroup(null);
        setHighlightedItem(null);
    }

    return (
        <div>
            <h2 style={{ margin: '15px auto' }}>Prompts</h2>
            <div className='prompt-items' onDragOver={handleContainerDragOver} onDrop={handleContainerDrop} onDragLeave={handleContainerDragLeave}>
                {groups.map((group, groupIndex) => (
                    <div
                        key={groupIndex}
                        className={`group ${highlightedGroup === groupIndex ? 'highlighted' : ''}`}
                    >
                        <div className="group-header" onClick={() => toggleGroup(groupIndex)}>
                            {expandedGroups[groupIndex] ? (
                                <DownOutlined style={{ cursor: 'pointer', marginRight: '8px' }} />
                            ) : (
                                <RightOutlined style={{ cursor: 'pointer', marginRight: '8px' }} />
                            )}
                            {editingGroupIndex === groupIndex ? (
                                <Input
                                    value={group.name}
                                    onChange={(e) => handleGroupNameChange(e, groupIndex)}
                                    onBlur={() => handleGroupNameSave(groupIndex)}
                                    autoFocus
                                />
                            ) : (
                                <div className="group-name">{group.name}</div>
                            )}
                        </div>
                        <Tooltip title="Delete Group">
                            <div className="group-delete" onClick={() => handleGroupDelete(groupIndex)}>
                                <DeleteOutlined />
                            </div>
                        </Tooltip>
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
                                    className={`prompt-item ${draggedItem === promptIndex ? 'dragged' : ''} ${highlightedItem === promptIndex ? 'highlighted' : ''}`}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, promptIndex)}
                                    onDragOver={(e) => handleDragOver(e, promptIndex)}
                                    onDragLeave={handleDragLeave}
                                    onDragEnd={handleDragEnd}
                                    onDrop={(e) => handleDrop(e, promptIndex)}
                                    onBlur={handleDragLeave}
                                    style={{ 'paddingLeft': '23px' }}
                                >
                                    <input
                                        className='prompt-item-color'
                                        type="color"
                                        value={colorScale(promptIndex + 1)}
                                        onChange={(e) => changeColor(e.target.value, promptIndex + 1)}
                                    />
                                    <div
                                        className='prompt-item-text'
                                        onClick={() => handlePromptClick(promptIndex + 1)}
                                    >
                                        {prompts[promptIndex]}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                {prompts.map((prompt, index) => (
                    !groups.some(group => group.items.includes(index)) && (
                        <div
                            key={index}
                            className={`prompt-item ${draggedItem === index ? 'dragged' : ''} ${highlightedItem === index ? 'highlighted' : ''}`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragLeave={handleDragLeave}
                            onDragEnd={handleDragEnd}
                            onDrop={(e) => handleDrop(e, index)}
                        >
                            <input
                                className='prompt-item-color'
                                type="color"
                                value={colorScale(index + 1)}
                                onChange={(e) => changeColor(e.target.value, index + 1)}
                            />
                            <div
                                className='prompt-item-text'
                                onClick={() => handlePromptClick(index + 1)}
                            >
                                {prompt}
                            </div>
                        </div>
                    )
                ))}
            </div>
            <style jsx>{`
                .prompt-items {
                    display: flex;
                    flex-direction: column;
                    height: 200px;
                    overflow-y: scroll;
                    padding: auto 20px;
                }
                .prompt-item {
                    border-radius: 5px;
                    position: relative;
                    cursor: pointer;
                }
                .prompt-item.highlighted {
                    border-color: #1890ff;
                    box-shadow: 0 0 10px rgba(24, 144, 255, 0.5);
                }
                .prompt-item-color {
                    display: inline-block;
                    width: 20px;
                    height: 22px;
                    -webkit-appearance: none;
                    -moz-appearance: none;
                    appearance: none;
                    background-color: transparent;
                    border: none;
                    cursor: pointer;
                    margin-right: 5px;
                }
                .prompt-item-color::-webkit-color-swatch {
                    border-radius: 50%;
                }
                .prompt-item-color::-moz-color-swatch {
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
                .group.highlighted {
                    border-color: #1890ff;
                    box-shadow: 0 0 10px rgba(24, 144, 255, 0.5);
                }
                .group-delete {
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    cursor: pointer;
                    color: #ff4d4f;
                }
                .group-content {
                    overflow: hidden;
                }
                .dragged {
                    opacity: 0.5;
                }
            `}</style>
        </div>
    );
};

export default PromptManager;