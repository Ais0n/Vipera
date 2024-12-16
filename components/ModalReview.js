import React, { useEffect, useState } from 'react';
import { Modal, Input, Button, Image, message } from 'antd';
import { RedoOutlined, CloseOutlined } from '@ant-design/icons';
import * as Utils from '../utils.js';

const ModalReview = ({ isOpen, onClose, onSave, images, metaData, graph }) => {
    const [selectedImages, setSelectedImages] = useState([]);
    const [selectedLabels, setSelectedLabels] = useState([]);
    const [textAreaValue, setTextAreaValue] = useState('');
    const [messageApi, contextHolder] = message.useMessage();
    const [updatedMetaData, setUpdatedMetaData] = useState();

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
        let labels = _selectedImages.map(image => {
            // return Utils.getImageMetadata(graph, image.batch, image.imageId);
            console.log(metaData, image)
            let imageMetaData = metaData.find(item => item.metaData.batch === image.batch && item.metaData.imageId === image.imageId);
            console.log(imageMetaData);
            if(imageMetaData) {
                let {metaData, batch, ...cleanedImageMetadata} = imageMetaData;
                return renderLabels(cleanedImageMetadata);
            } else {
                return undefined;
            }
        });
        setSelectedLabels(labels);
    };

    const renderLabels = (imageMetaData) => {
        // needed: path, name, value
        let res = [];
        const traverse = (node, path) => {
            let keys = Object.keys(node);
            for (let key of keys) {
                let newPath = path == '' ? key : path + '.' + key;
                if (typeof (node[key]) !== 'object') {
                    res.push({ path: newPath, value: node[key], name: key });
                } else {
                    traverse(node[key], newPath);
                }
            }
        }
        traverse(imageMetaData, '');
        Utils.uniqueName(res);
        return res;
    }

    const handleSave = () => {
        // const updatedMetaData = selectedImages.map((image, index) => ({
        //     image,
        //     label: metaData[index]?.label || '',
        // }));
        // messageApi.warning('There are some issues with this feature. They will be fixed in hours.');
        onSave({updatedMetaData: updatedMetaData ? updatedMetaData : metaData, textAreaValue});
        onClose();
    };

    const handleLabelChange = (index, path, value) => {
        let newMetadata = Utils.deepClone(updatedMetaData);
        let tmp = newMetadata[index];
        let keys = path.split('.');
        keys.forEach((key, i) => {
            if (i === keys.length - 1) {
                tmp[key] = value;
            } else {
                tmp = tmp[key];
            }
        });
        setUpdatedMetaData(newMetadata);
    };

    return (
        isOpen && (
            <div className='modalContainer'>
                <div className="icons">
                    <RedoOutlined onClick={selectRandomImages} />
                    <CloseOutlined onClick={onClose} />
                </div>
                {selectedImages.length > 0 ? <div className="imageGallery">
                    {selectedImages.map((image, index) => (
                        <div key={index} className="imageItem">
                            <Image width={'100%'} src={`data:image/png;base64,${image.data}`} alt={`Image ${image.imageId}`} />
                            {selectedLabels[index] && selectedLabels[index].length > 0 && (
                                <div className="labelContainer">
                                    {selectedLabels[index].map((item) => item && (
                                        <div key={String(index) + String(item.path)} className="labelItem">
                                            <b>{item.name}:</b>
                                            <Input
                                                defaultValue={item.value}
                                                onChange={(e) => handleLabelChange(index, item.path, e.target.value)}
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
                    <h3 style={{ 'float': 'left' }}> Comments for the LLM (optional) </h3>
                    <Input.TextArea
                        placeholder="Briefly describe your expectations for the LLMs here."
                        value={textAreaValue}
                        onChange={handleChange}
                    ></Input.TextArea>
                </div>
                {contextHolder}
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