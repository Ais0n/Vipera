import React, { useEffect, useState } from 'react';
import { Modal, Input, Button, Image } from 'antd';
import { RedoOutlined, CloseOutlined } from '@ant-design/icons';
import * as Utils from '../utils.js';

const ModalReview = ({ isOpen, onClose, onSave, images, metaData, graph }) => {
    const [selectedImages, setSelectedImages] = useState([]);
    const [selectedLabels, setSelectedLabels] = useState([]);
    const [textAreaValue, setTextAreaValue] = useState('');

    const handleChange = (e) => {
        setTextAreaValue(e.target.value);
    };

    useEffect(() => {
        if (isOpen) {
            selectRandomImages();
        }
    }, [isOpen, images, graph]);

    const selectRandomImages = () => {
        let _selectedImages = [];
        if (images.length <= 3) {
            setSelectedImages(images);
            _selectedImages = images;
        } else {
            const randomIndices = new Set();
            while (randomIndices.size < 3) {
                randomIndices.add(Math.floor(Math.random() * images.length));
            }
            const selected = Array.from(randomIndices).map(index => images[index]);
            setSelectedImages(selected);
            _selectedImages = selected;
        }

        // Calculate labels
        const labels = _selectedImages.map(image => {
            return Utils.getImageMetadata(graph, image.batch, image.imageId);
        });
        setSelectedLabels(labels);
    };

    const handleSave = () => {
        const updatedMetaData = selectedImages.map((image, index) => ({
            image,
            label: metaData[index]?.label || '',
        }));
        onSave(updatedMetaData);
        onClose();
    };

    const handleLabelChange = (index, value) => {
        const updatedMetaData = [...metaData];
        updatedMetaData[index].label = value;
        onSave(updatedMetaData);
    };

    return (
        isOpen && (
            <div className='modalContainer'>
                <div className="icons">
                    <RedoOutlined onClick={selectRandomImages}/>
                    <CloseOutlined onClick={onClose}/>
                </div>
                {selectedImages.length > 0 ? <div className="imageGallery">
                    {selectedImages.map((image, index) => (
                        <div key={index} className="imageItem">
                            <Image width={'100%'} src={`data:image/png;base64,${image.data}`} alt={`Image ${image.imageId}`} />
                            {selectedLabels[index] && Object.keys(selectedLabels[index]).length > 0 && (
                                <div className="labelContainer">
                                    {Object.keys(selectedLabels[index]).map((key) => (
                                        <div key={key} className="labelItem">
                                            <b>{key}:</b>
                                            <Input
                                                defaultValue={selectedLabels[index][key].value}
                                                onChange={(e) => handleLabelChange(index, e.target.value)}
                                                className="labelInput"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div> : <i>No images available. Please generate images first.</i>}
                <div className="comments">
                    <h3 style={{'float': 'left'}}> Comments for the LLM (optional) </h3>
                    <Input.TextArea 
                        placeholder="Briefly describe your expectations for the LLMs here."
                        value={textAreaValue}
                        onChange={handleChange}
                    ></Input.TextArea>
                </div>
                <Button type="primary" onClick={handleSave}>Save</Button>
                <style jsx>{`
                    .modalContainer {
                        position: relative;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        margin: 20px auto;
                        width: 80%;
                        max-width: 800px;
                        max-height: 600px;
                        overflow-y: scroll;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                        background: white;
                    }
                    .imageGallery {
                        display: flex;
                        flex-wrap: wrap;
                        justify-content: center;
                        gap: 15px;
                        margin-top: 20px;
                    }
                    .imageItem {
                        width: 240px;
                        border-radius: 5px;
                        overflow: hidden;
                        box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1);
                        background: #f9f9f9;
                    }
                    .labelContainer {
                        padding: 10px;
                    }
                    .labelItem {
                        display: flex;
                        align-items: center;
                        margin: 5px 0;
                    }
                    .labelInput {
                        margin-left: 5px;
                        flex-grow: 1;
                    }
                    .icons {
                        position: absolute;
                        top: 10px;
                        right: 10px;
                        cursor: pointer;
                    }
                    .comments {
                        margin-top: 20px;
                        margin-bottom: 20px;
                        width: 100%;
                    }
                `}</style>
            </div>
        )
    );
};

export default ModalReview;