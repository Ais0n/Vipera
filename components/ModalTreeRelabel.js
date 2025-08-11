import React, { useEffect, useState } from 'react';
import { Modal, Input, Button, Radio, Space, Typography } from 'antd';

const { Text } = Typography;

const ModalTreeRelabel = ({ isOpen, onClose, onSave, contextMenuData }) => {
    const [newCandidateValues, setNewCandidateValues] = useState('');
    const [relabelMode, setRelabelMode] = useState(1);

    useEffect(() => {
        if (isOpen && contextMenuData && contextMenuData._candidateValues) {
            setNewCandidateValues(contextMenuData._candidateValues.join(', '));
        } else if (isOpen) {
            setNewCandidateValues('');
        }
    }, [isOpen, contextMenuData]);

    // Reset relabel mode to 1 if option 2 becomes unavailable
    useEffect(() => {
        if (relabelMode === 2 && !hasCandidateValueChanges()) {
            setRelabelMode(1);
        }
    }, [newCandidateValues, contextMenuData, relabelMode]);

    // Check if there are changes to candidate values
    const hasCandidateValueChanges = () => {
        if (!contextMenuData || !contextMenuData._candidateValues) {
            return newCandidateValues.trim() !== '';
        }
        const originalValues = contextMenuData._candidateValues.join(', ');
        return originalValues !== newCandidateValues;
    };

    const handleSave = () => {
        onSave({
            newCandidateValues,
            relabelMode
        });
        onClose();
    };

    const handleCancel = () => {
        setNewCandidateValues('');
        setRelabelMode(1);
        onClose();
    };

    return (
        <Modal
            title="Relabel Images"
            open={isOpen}
            onCancel={handleCancel}
            footer={[
                <Button key="cancel" onClick={handleCancel}>
                    Cancel
                </Button>,
                <Button key="submit" type="primary" onClick={handleSave}>
                    Relabel
                </Button>
            ]}
        >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                <div>
                    <Text strong>Candidate Values:</Text>
                    <Input
                        value={newCandidateValues}
                        onChange={(e) => setNewCandidateValues(e.target.value)}
                        placeholder="Enter comma-separated values (e.g., male, female, other)"
                        style={{ marginTop: 8 }}
                    />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        Leave empty to use no candidate values
                    </Text>
                </div>

                <div>
                    <Text strong>Relabeling Mode:</Text>
                    <Radio.Group 
                        value={relabelMode} 
                        onChange={(e) => setRelabelMode(e.target.value)}
                        style={{ marginTop: 8, display: 'block' }}
                    >
                        <Space direction="vertical">
                            <Radio value={1}>
                                <Text>Relabel all images within scope using the specified criterion</Text>
                                <br />
                                <Text type="secondary" style={{ fontSize: '12px', marginLeft: 24 }}>
                                    Relabels all images in the current scope with the new candidate values
                                </Text>
                            </Radio>
                            {hasCandidateValueChanges() && (
                                <Radio value={2}>
                                    <Text>Relabel only images affected by candidate value changes</Text>
                                    <br />
                                    <Text type="secondary" style={{ fontSize: '12px', marginLeft: 24 }}>
                                        Only relabels images whose labels might be influenced by the candidate value changes
                                    </Text>
                                </Radio>
                            )}
                        </Space>
                    </Radio.Group>
                </div>
            </Space>
        </Modal>
    );
};

export default ModalTreeRelabel;