import React, { useEffect, useState } from 'react';
import { Modal, Input, Button } from 'antd';
import * as Utils from '../utils';

const ModalLabelEdit = ({ isOpen, onClose, onSave, nodeData, graphSchema }) => {
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (nodeData && nodeData.metaData) {
            let {batch, metaData, ...initialFormData} = nodeData.metaData;
            initialFormData = Utils.removeRedundantFields(initialFormData, graphSchema);
            setFormData(initialFormData);
        }
    }, [nodeData, isOpen]);

    const handleInputChange = (key, value) => {
        const keys = key.split('.');
        const updatedFormData = { ...formData };

        let current = updatedFormData;
        for (let i = 0; i < keys.length; i++) {
            if (i === keys.length - 1) {
                current[keys[i]] = value;
            } else {
                current[keys[i]] = { ...current[keys[i]] };
                current = current[keys[i]];
            }
        }

        setFormData(updatedFormData);
    };

    const renderInputs = (data, parentKey = '') => {
        return Object.entries(data).map(([key, value]) => {
            const fieldKey = parentKey ? `${parentKey}.${key}` : key;

            if (typeof value === 'object' && value !== null) {
                return Object.keys(value).length > 0 && (
                    <div key={fieldKey} style={{ marginLeft: '16px' }}>
                        <label style={{ display: 'inline-block', marginRight: '8px' }}>{key}:</label>
                        {renderInputs(value, fieldKey)}
                    </div>
                );
            }

            return (
                <div key={fieldKey} style={{ marginLeft: '16px', display: 'flex', alignItems: 'center' }}>
                    <label style={{ marginRight: '8px' }}>{key}:</label>
                    <Input
                        value={value}
                        onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                        style={{ flex: 1 }} // Makes the input take the remaining space
                    />
                </div>
            );
        });
    };


    const handleSave = () => {
        const updatedData = { ...nodeData, metaData: formData };
        onSave(updatedData);
        onClose();
    };

    return (
        <Modal
            title="Edit Labels"
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
        >
            {formData && renderInputs(formData)}
        </Modal>
    );
};

export default ModalLabelEdit;