import React, { useEffect, useState } from 'react';
import { Modal, Input, Button } from 'antd';

const ModalTreeRelabel = ({ isOpen, onClose, onSave }) => {
    const [nodeName, setNodeName] = useState('');

    // useEffect(() => {
    //     if (nodeData) {
    //         setNodeName(nodeData.data.name);
    //     }
    // }, [nodeData]);

    const handleSave = () => {
        onSave(nodeName);
        onClose();
    };

    return (
        <Modal
            title="Enter candidate values (Optional)"
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
                placeholder="Leave empty for no candidate values"
            />
        </Modal>
    );
};

export default ModalTreeRelabel;