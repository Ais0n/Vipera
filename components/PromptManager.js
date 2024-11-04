import React, { useState } from 'react';
import { Button, Tooltip, Input, Modal } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';

const PromptManager = ({ prompts, colorScale, changeColor, handlePromptClick, groups, setGroups }) => {
    const [draggedItem, setDraggedItem] = useState(null);
    const [highlightedGroup, setHighlightedGroup] = useState(null);
    const [highlightedItem, setHighlightedItem] = useState(null);
    const [editingGroupIndex, setEditingGroupIndex] = useState(null);

    const handleDragStart = (e, index) => {
        setDraggedItem(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        // Check if the dragged item is over a group or an individual item
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

        // If the dragged item is already in a group, remove it first
        const existingGroupIndex = groups.findIndex(group => group.items.includes(droppedIndex));
        if (existingGroupIndex !== -1) {
            updatedGroups[existingGroupIndex].items = updatedGroups[existingGroupIndex].items.filter(item => item !== droppedIndex);
        }

        // Add the dragged item to the new location (group or individual item)
        const groupIndex = groups.findIndex(group => group.items.includes(index));
        if (groupIndex !== -1) {
            updatedGroups[groupIndex].items.push(droppedIndex);
        } else {
            const newGroup = { name: `Group ${updatedGroups.length + 1}`, items: [droppedIndex, index], color: colorScale(droppedIndex + 1) };
            updatedGroups.push(newGroup);
        }

        // Update the color of the items in the new group
        // updatedGroups.forEach((group, i) => {
        //     group.items.forEach(item => {
        //         changeColor(group.color, item + 1);
        //     });
        // });

        setGroups(updatedGroups);
        setDraggedItem(null);
        setHighlightedGroup(null);
        setHighlightedItem(null);
    };

    const handleGroupDelete = (groupIndex) => {
        const updatedGroups = [...groups];
        const deletedGroup = updatedGroups.splice(groupIndex, 1)[0];

        // Restore the original colors of the items in the deleted group
        // deletedGroup.items.forEach(item => {
        //     changeColor(colorScale(item + 1, false), item + 1);
        // });

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

    return (
        <div>
            <h2 style={{ "margin": '15px auto' }}>Prompts</h2>
            <div className='prompt-items'>
                {groups.map((group, groupIndex) => (
                    <div
                        key={groupIndex}
                        className={`group ${highlightedGroup === groupIndex ? 'highlighted' : ''}`}
                        onDragOver={(e) => handleDragOver(e, group.items[0])}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, group.items[0])}
                    >
                        <div className="group-header">
                            {editingGroupIndex === groupIndex ? (
                                <Input
                                    value={group.name}
                                    onChange={(e) => handleGroupNameChange(e, groupIndex)}
                                    onBlur={() => handleGroupNameSave(groupIndex)}
                                    autoFocus
                                />
                            ) : (
                                <h3 style={{margin: '5px 5px'}}>
                                    {group.name}
                                    <Tooltip title="Rename Group">
                                        <EditOutlined
                                            className="group-rename-icon"
                                            onClick={() => handleGroupRename(groupIndex)}
                                        />
                                    </Tooltip>
                                </h3>
                            )}
                        </div>
                        <Tooltip title="Delete Group">
                            <div className="group-delete" onClick={() => handleGroupDelete(groupIndex)}>
                                <DeleteOutlined />
                            </div>
                        </Tooltip>
                        {group.items.map((promptIndex) => (
                            <div
                                key={promptIndex}
                                className={`prompt-item ${draggedItem === promptIndex ? 'dragged' : ''} ${highlightedItem === promptIndex ? 'highlighted' : ''}`}
                                draggable
                                onDragStart={(e) => handleDragStart(e, promptIndex)}
                                onDragOver={(e) => handleDragOver(e, promptIndex)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, promptIndex)}
                                onDragEnd={(e) => setHighlightedItem(null)}
                            >
                                <input
                                    className='prompt-item-color'
                                    type="color"
                                    value={colorScale(promptIndex + 1)}
                                    onChange={(e) => changeColor(e.target.value, promptIndex + 1)}
                                ></input>
                                <div
                                    className='prompt-item-text'
                                    style={{ 'backgroundColor': colorScale(promptIndex + 1) }}
                                    onClick={(e) => handlePromptClick(promptIndex + 1)}
                                >
                                    Prompt {promptIndex + 1}: {prompts[promptIndex]}
                                </div>
                            </div>
                        ))}
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
                            onDrop={(e) => handleDrop(e, index)}
                        >
                            <input
                                className='prompt-item-color'
                                type="color"
                                value={colorScale(index + 1)}
                                onChange={(e) => changeColor(e.target.value, index + 1)}
                            ></input>
                            <div
                                className='prompt-item-text'
                                style={{ 'backgroundColor': colorScale(index + 1) }}
                                onClick={(e) => handlePromptClick(index + 1)}
                            >
                                Prompt {index + 1}: {prompt}
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
                margin: 8px 10px;
                padding: 5px 10px;
                color: white;
                border-radius: 5px;
                box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1);
                position: relative;
                cursor: pointer;
            }
            .prompt-item.highlighted {
                border-color: #1890ff;
                box-shadow: 0 0 10px rgba(24, 144, 255, 0.5);
            }
            .prompt-item-color {
                display: inline-block;
                width: 18px;
                height: 20px;
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
                font-weight: bold;
                padding: 5px 10px;
                border-radius: 5px;
                width: calc(100% - 45px);
                display: inline-block;
            }
            .group {
                // border: 1px solid #ccc;
                border-radius: 8px;
                box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1);
                padding: 10px;
                margin: 5px 10px;
                position: relative;
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
            .dragged {
                opacity: 0.5;
            }
            `}</style>
        </div>
    );
};

export default PromptManager;