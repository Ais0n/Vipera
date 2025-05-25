import React, { useEffect, useState } from 'react';
import { Image, Switch, Popover, Button, Tooltip, Tag, Popconfirm, Input, Space, Select, Checkbox, Row, Col } from 'antd';
import { SyncOutlined, InfoCircleOutlined, BulbOutlined, PlusOutlined } from '@ant-design/icons';
import { FixedSizeList } from 'react-window';
import axios from 'axios';
import { removeUnderscoreFields } from '../utils';

const SuggestComparison = ({ images, prompts, graphSchema, handleSuggestionButtonClick }) => {
    const [image1Index, setImage1Index] = useState(0);
    const [image2Index, setImage2Index] = useState(1);
    const [suggestionMetaData, setSuggestionMetaData] = useState({});
    const [keywordViewMetaData, setKeywordViewMetaData] = useState([]); // selectedKeywords to be displayed
    const [selectedKeywords, setSelectedKeywords] = useState([]); // selectedKeywords selected by the user
    const [abortController, setAbortController] = useState(null);
    const [customInputValue, setCustomInputValue] = useState('');
    const [selectedFigureIndices, setSelectedFigureIndices] = useState([]);

    const content = (index) => (images && index < images.length) ? (
        <div>
            <Image width={200} src={`data:image/png;base64,${images[index].data}`} alt={`Image ${images[index].imageId}`} />
        </div>
    ) : "No images available";

    const _handleSuggestionButtonClick2 = () => {
        handleSuggestionButtonClick(suggestionMetaData, 'external');
    }

    const handleApplyKeywords = () => {
        setSuggestionMetaData({});
        updateSuggestion();   
    }

    const updateSuggestion = () => {
        if (images.length <= 1) return;
        
        if (abortController) {
            abortController.abort();
        }

        const controller = new AbortController();
        setAbortController(controller);

        // Filter keywords of "Figure X" format
        const keywordImageIndices = [];
        selectedKeywords.forEach((keyword, index) => {
            const match = keyword.match(/Figure\s*(\d+)/);
            if (match) {
                const imageIndex = parseInt(match[1], 10) - 1; // Convert to zero-based index
                if (imageIndex >= 0 && imageIndex < images.length) {
                    keywordImageIndices.push(imageIndex);
                }
            }
        });
        // Remove duplicates
        const uniqueKeywordImageIndices = [...new Set(keywordImageIndices)];
        // Randomly select two different images
        let _image1Index = -1, _image2Index = -1;
        if (uniqueKeywordImageIndices.length == 0) {
            // If no keywords are selected, randomly select two different images
            _image1Index = Math.floor(Math.random() * images.length);
            _image2Index = Math.floor(Math.random() * images.length);
            while (_image1Index === _image2Index) {
                _image2Index = Math.floor(Math.random() * images.length);
            }
        } else if (uniqueKeywordImageIndices.length == 1) {
            // If only one keyword is selected, use that image, and randomly select another from the rest
            _image1Index = uniqueKeywordImageIndices[0];
            _image2Index = Math.floor(Math.random() * images.length);
            while (_image1Index === _image2Index) {
                _image2Index = Math.floor(Math.random() * images.length);
            }
        } else {
            // If multiple keywords are selected, randomly select two different images from the selected ones
            _image1Index = uniqueKeywordImageIndices[Math.floor(Math.random() * uniqueKeywordImageIndices.length)];
            _image2Index = uniqueKeywordImageIndices[Math.floor(Math.random() * uniqueKeywordImageIndices.length)];
            while (_image1Index === _image2Index) {
                _image2Index = uniqueKeywordImageIndices[Math.floor(Math.random() * uniqueKeywordImageIndices.length)];
            }
        }
        console.log("image1Index: ", _image1Index, " image2Index: ", _image2Index);

        const path1 = images[_image1Index].path;
        const path2 = images[_image2Index].path;

        let selectedNonFigureKeywords = selectedKeywords.filter(keyword => !keyword.startsWith('Figure'));

        axios.post('/api/suggest-comparison', {
            path1: path1,
            path2: path2,
            keywords: selectedNonFigureKeywords,
            schema: removeUnderscoreFields(graphSchema)
        }, {
            signal: controller.signal
        }).then((response) => {
            setSuggestionMetaData(response.data.res);
            setImage1Index(_image1Index);
            setImage2Index(_image2Index);
        }).catch((error) => {
            if (axios.isCancel(error)) {
                console.log('Request canceled:', error.message);
            } else {
                console.error(error);
            }
        }).finally(() => {
            setAbortController(null);
        });
    }

    const generateInitialKeywords = () => {
        axios.post('/api/suggest-keyword', {
            prompts: prompts,
            schema: removeUnderscoreFields(graphSchema)
        }).then((response) => {
            const res = response.data.res;
            if (!res instanceof Array) {
                console.error("Response is not an array: ", res);
                return;
            }
            // generate 1 random keyword in the format of "Figure X"
            let maxAttempts = 10;
            while (maxAttempts > 0) {
                let randomIndex = Math.floor(Math.random() * images.length);
                let randomKeyword = `Figure ${randomIndex + 1}`;
                if (!res.includes(randomKeyword)) {
                    res.push(randomKeyword);
                    break;
                }
                maxAttempts--;
            }
            setKeywordViewMetaData(res);
        }).catch((error) => {
            console.error(error);
        });
    }

    const handleRefresh = () => {
        setSuggestionMetaData({});
        updateSuggestion();
    }

    const handleKeywordClick = (keyword) => {
        if (selectedKeywords.includes(keyword)) {
            setSelectedKeywords(selectedKeywords.filter(k => k !== keyword));
        } else {
            setSelectedKeywords([...selectedKeywords, keyword]);
        }
    }

    const handleAddCustomKeyword = () => {
        if (customInputValue.trim()) {
            const newKeyword = customInputValue.trim();
            if (!keywordViewMetaData.includes(newKeyword)) {
                setKeywordViewMetaData([...keywordViewMetaData, newKeyword]);
            }
            if (!selectedKeywords.includes(newKeyword)) {
                setSelectedKeywords([...selectedKeywords, newKeyword]);
            }
            setCustomInputValue('');
        }
    };

    const handleThumbnailCheck = (index, checked) => {
        if (checked) {
            setSelectedFigureIndices(prev => [...prev, index]);
        } else {
            setSelectedFigureIndices(prev => prev.filter(i => i !== index));
        }
    };

    const handleAddKeyword = () => {
        if (customInputValue && customInputValue.trim() !== '') {
            const newKeyword = customInputValue.trim();
            if (!selectedKeywords.includes(newKeyword)) {
                setKeywordViewMetaData(prev => [...prev, newKeyword]);
                setSelectedKeywords(prev => [...prev, newKeyword]);
            }
            setCustomInputValue('');
        }
        if (selectedFigureIndices.length > 0) {
            handleAddSelectedFigures();
        }
    }

    const handleAddSelectedFigures = () => {
        const newKeywords = selectedFigureIndices
            .map(index => `Figure ${index + 1}`)
            .filter(tag => !selectedKeywords.includes(tag));

        if (newKeywords.length > 0) {
            setKeywordViewMetaData(prev => [...prev, ...newKeywords]);
            setSelectedKeywords(prev => [...prev, ...newKeywords]);
        }

        setSelectedFigureIndices([]); // Clear selection after adding
    };

    const ThumbnailRow = ({ index, style, image, isChecked, onCheck }) => (
        <div style={style}>
            <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <Checkbox
                    checked={isChecked}
                    onChange={(e) => onCheck(index, e.target.checked)}
                    style={{ position: 'absolute', top: '2px', right: '2px', zIndex: 1 }}
                />
                <Image
                    width={60}
                    height={60}
                    src={`data:image/png;base64,${image.data}`}
                    alt={`Thumbnail ${index + 1}`}
                    preview={false}
                    style={{
                        cursor: 'pointer',
                        objectFit: 'cover',
                        borderRadius: '4px',
                        border: isChecked ? '2px solid #1890ff' : 'none'
                    }}
                />
            </div>
        </div>
    );

    const ThumbnailList = ({ images, selectedIndices, onCheck }) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '8px' }}>
            {images.map((image, index) => (
                <div key={index} style={{ width: '60px' }}>
                    <ThumbnailRow
                        index={index}
                        style={{ width: '100%', height: '100%' }}
                        image={image}
                        isChecked={selectedIndices.includes(index)}
                        onCheck={onCheck}
                    />
                </div>
            ))}
        </div>
    );

    const dropdownContent = (
        <div style={{ padding: 8, width: 300, background: '#fff' }}>
            <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 'bold' }}>Add Custom Keyword</div>
                <Space.Compact style={{ width: '100%' }}>
                    <Input
                        placeholder="Enter new keyword"
                        value={customInputValue}
                        onChange={(e) => setCustomInputValue(e.target.value)}
                        onPressEnter={handleAddCustomKeyword}
                    />
                </Space.Compact>
            </div>

            <div>
                <div style={{ fontWeight: 'bold' }}>Select Figures</div>
                <ThumbnailList
                    images={images}
                    selectedIndices={selectedFigureIndices}
                    onCheck={handleThumbnailCheck}
                />
            </div>
        </div>
    );

    useEffect(() => {
        return () => {
            if (abortController) {
                abortController.abort();
            }
        };
    }, [abortController]);

    useEffect(() => {
        if (prompts instanceof Array && prompts.length > 0 && graphSchema) {
            updateSuggestion();
        }
    }, []);

    useEffect(() => {
        // console.log("triggered, ", suggestionMetaData);
        if (suggestionMetaData && Object.keys(suggestionMetaData).length > 0) {
            setKeywordViewMetaData([]);
            setSelectedKeywords([]);
            generateInitialKeywords();
        }
    }, [suggestionMetaData])

    return (
        <>
            <div className="suggestion-item">
                {Object.keys(suggestionMetaData).length === 0 ? <div>Loading...</div> :
                    <>
                        <div className="suggestion-text">
                            <div className="suggestion-text-left">
                                <SyncOutlined onClick={handleRefresh} style={{ display: "inline-block", margin: "auto 5px", cursor: "pointer" }} />
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
            </div>
            <div className="suggestion-item">
                {Object.keys(keywordViewMetaData).length === 0 ? <div>Loading...</div> :
                    <>
                        <div className="suggestion-text">
                            <div className="suggestion-text-left">
                                <BulbOutlined style={{ display: "inline-block", margin: "auto 5px", cursor: "pointer" }} />
                            </div>
                            <div className="suggestion-text-right">
                                <div style={{ fontWeight: "bold" }}>
                                    Want more targeted suggestions? Pick a topic:
                                </div>
                            </div>
                        </div>

                        <div className="suggestion-tags">
                            {keywordViewMetaData.map((keyword, index) => (
                                <Tag 
                                    key={index}
                                    color={selectedKeywords.includes(keyword) ? "processing" : "default"} 
                                    style={{ cursor: 'pointer' }} 
                                    onClick={() => handleKeywordClick(keyword)}
                                >
                                    {keyword}
                                </Tag>
                            ))}
                            <Popconfirm
                                title={dropdownContent}
                                onConfirm={handleAddKeyword}
                                okText="Add"
                                cancelText="Cancel"
                                icon={null}
                            >
                                <Tag style={{ cursor: 'pointer', background: '#fafafa' }}>
                                    <PlusOutlined /> Add
                                </Tag>
                            </Popconfirm>
                            <Tag style={{ cursor: 'pointer', background: '#fafafa' }} onClick={handleRefresh}>
                                <SyncOutlined /> Refresh
                            </Tag>
                        </div>
                        
                        <div className="suggestion-toolbar">
                            <Button
                                className="suggestion-button"
                                onClick={handleApplyKeywords}
                                type="primary"
                            >
                                Apply
                            </Button>
                        </div>
                    </>}
            </div>
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
                    margin: 8px auto;
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
                    background-color: #1677ff;
                    color: #fff;
                    border: none;
                    border-radius: 5px;
                    padding: 5px 10px;
                    cursor: pointer;
                }
                .suggestion-tags {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: flex-start;
                    align-items: center;
                    margin-top: 10px;
                    gap: 8px;
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
                .thumbnail-container {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    overflow-y: auto;
                    max-height: 200px;
                }
                .thumbnail-item {
                    position: relative;
                    text-align: center;
                }

            `}</style>
        </>
    );
};

export default SuggestComparison;
