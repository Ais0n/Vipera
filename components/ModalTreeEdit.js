import React, { useEffect, useState } from 'react';
import { Modal, Input, Button } from 'antd';

const ModalTreeEdit = ({ isOpen, onClose, onSave, nodeData }) => {
    const [nodeName, setNodeName] = useState(nodeData ? nodeData.data.name : '');

    useEffect(() => {
        if (nodeData) {
            setNodeName(nodeData.data.name);
        }
    }, [nodeData]);

    const handleSave = () => {
        onSave(nodeName);
        onClose();
    };

    return (
        <Modal
            title="Edit Node Name"
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
            <Input
                value={nodeName}
                onChange={(e) => setNodeName(e.target.value)}
                placeholder="Enter new node name"
            />
        </Modal>
    );
};

export default ModalTreeEdit;