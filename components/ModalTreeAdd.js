import React, { useEffect, useState } from 'react';
import { Modal, Input, Button, Radio } from 'antd';

const ModalTreeAdd = ({ isOpen, onClose, onSave }) => {
    const [nodeType, setNodeType] = useState("attribute");
    const [nodeName, setNodeName] = useState('');

    const handleSave = () => {
        onSave({nodeName, nodeType});
        onClose();
    };

    return (
        <Modal
            title="Add Node"
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
            <Radio.Group onChange={(e) => {setNodeType(e.target.value)}} value={nodeType}>
                <Radio value={"attribute"}>Attribute</Radio>
                <Radio value={"object"}>Object</Radio>
            </Radio.Group>
            {/* <div>Name</div> */}
            <Input
                value={nodeName}
                onChange={(e) => setNodeName(e.target.value)}
                placeholder="Enter new node name"
            />
            {/* <div>Label Values</div> */}
        </Modal>
    );
};

export default ModalTreeAdd;