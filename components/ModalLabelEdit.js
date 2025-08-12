import React, { useEffect, useState } from 'react';
import { Modal, Input, Button } from 'antd';
import * as Utils from '../utils';

const ModalLabelEdit = ({ isOpen, onClose, onSave, nodeData, graphSchema }) => {
    const [formData, setFormData] = useState({});

    // Helper function to repair data by adding missing attribute fields only
    const repairDataForEditing = (data, schema) => {
        const result = Utils.deepClone(data);
        
        const traverse = (curNode, schemaNode, path = []) => {
            if (typeof schemaNode !== 'object' || schemaNode === null) return;
            
            Object.keys(schemaNode).forEach(key => {
                // Skip schema metadata fields
                if (key.startsWith('_')) return;
                
                if (schemaNode[key]._nodeType === 'attribute') {
                    // This is an attribute node - ensure it has a value
                    if (!curNode[key] || (typeof curNode[key] === 'object' && Object.keys(curNode[key]).length === 0)) {
                        curNode[key] = {exist: "no"};
                    }
                } else if (schemaNode[key]._nodeType === 'object') {
                    // This is an object node - ensure it exists and traverse
                    if (!curNode[key]) {
                        curNode[key] = {};
                    }
                    traverse(curNode[key], schemaNode[key], [...path, key]);
                }
            });
        };
        
        traverse(result, schema);
        return result;
    };

    useEffect(() => {
        if (nodeData && nodeData.metaData) {
            console.log('ModalLabelEdit - nodeData:', nodeData);
            console.log('ModalLabelEdit - graphSchema:', graphSchema);
            
            let {batch, metaData, ...initialFormData} = nodeData.metaData;
            console.log('ModalLabelEdit - initialFormData before repair:', initialFormData);
            
            // Use our custom repair function instead of the generic one
            initialFormData = repairDataForEditing(initialFormData, graphSchema);
            console.log('ModalLabelEdit - initialFormData after custom repair:', initialFormData);
            
            // Then remove redundant fields, but keep the structure
            initialFormData = Utils.removeRedundantFields(initialFormData, graphSchema);
            console.log('ModalLabelEdit - initialFormData after removeRedundant:', initialFormData);
            
            setFormData(initialFormData);
        }
    }, [nodeData, isOpen]);

    const handleInputChange = (key, value) => {
        const keys = key.split('.');
        const updatedFormData = { ...formData };

        let current = updatedFormData;
        for (let i = 0; i < keys.length; i++) {
            if (i === keys.length - 1) {
                // If the new value is empty or "no", set it as {"exist": "no"}
                // Otherwise, set it as the string value
                if (value === '' || value === 'no') {
                    current[keys[i]] = {"exist": "no"};
                } else {
                    current[keys[i]] = value;
                }
            } else {
                current[keys[i]] = { ...current[keys[i]] };
                current = current[keys[i]];
            }
        }

        setFormData(updatedFormData);
    };

    const renderInputs = (data, parentKey = '') => {
        console.log('renderInputs called with data:', data, 'parentKey:', parentKey);
        
        if (!data || typeof data !== 'object') {
            console.log('renderInputs: data is not an object, returning null');
            return null;
        }
        
        return Object.entries(data).map(([key, value]) => {
            const fieldKey = parentKey ? `${parentKey}.${key}` : key;
            console.log('Processing field:', key, 'value:', value, 'fieldKey:', fieldKey);

            if (typeof value === 'object' && value !== null) {
                // Special case: if the object only contains "exist" property, treat it as an attribute field
                const objectKeys = Object.keys(value);
                console.log('Object keys for', key, ':', objectKeys);
                
                if (objectKeys.length === 1 && (objectKeys[0] === 'exist' || objectKeys[0] === 'EXIST')) {
                    console.log('Rendering input for attribute field:', key);
                    return (
                        <div key={fieldKey} style={{ marginLeft: '16px', display: 'flex', alignItems: 'center' }}>
                            <label style={{ marginRight: '8px' }}>{key}:</label>
                            <Input
                                value={value[objectKeys[0]] === 'no' ? '' : value[objectKeys[0]]}
                                onChange={(e) => handleInputChange(fieldKey, e.target.value || 'no')}
                                style={{ flex: 1 }}
                                placeholder="Enter value or leave empty if not applicable"
                            />
                        </div>
                    );
                }
                
                // Special case: empty object that should be treated as an attribute field
                // Check if this field is an attribute in the schema
                const getSchemaField = (schemaPath) => {
                    const pathParts = schemaPath.split('.');
                    let current = graphSchema;
                    for (const part of pathParts) {
                        if (current && current[part]) {
                            current = current[part];
                        } else {
                            return null;
                        }
                    }
                    return current;
                };
                
                const schemaField = getSchemaField(fieldKey);
                if (objectKeys.length === 0 && schemaField && schemaField._nodeType === 'attribute') {
                    console.log('Rendering input for empty attribute field:', key);
                    return (
                        <div key={fieldKey} style={{ marginLeft: '16px', display: 'flex', alignItems: 'center' }}>
                            <label style={{ marginRight: '8px' }}>{key}:</label>
                            <Input
                                value=""
                                onChange={(e) => handleInputChange(fieldKey, e.target.value || 'no')}
                                style={{ flex: 1 }}
                                placeholder="Enter value or leave empty if not applicable"
                            />
                        </div>
                    );
                }
                
                // Regular object rendering
                console.log('Rendering nested object for:', key);
                return Object.keys(value).length > 0 && (
                    <div key={fieldKey} style={{ marginLeft: '16px' }}>
                        <label style={{ display: 'inline-block', marginRight: '8px' }}>{key}:</label>
                        {renderInputs(value, fieldKey)}
                    </div>
                );
            }

            console.log('Rendering regular input for:', key);
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