import React, { useEffect, useState } from 'react';
import { Modal, Input, Button, Radio } from 'antd';

const ModalTreeAdd = ({ isOpen, onClose, onSave }) => {
    const [nodeType, setNodeType] = useState("attribute");
    const [nodeName, setNodeName] = useState('');
    const [candidateValues, setCandidateValues] = useState("");

    const handleSave = () => {
        onSave({ nodeName, nodeType, candidateValues });
        onClose();
    };

    return (
        <>

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
                <div className="modal-tree-add">
                    <div><b>Type</b></div>
                    <Radio.Group onChange={(e) => { setNodeType(e.target.value) }} value={nodeType}>
                        <Radio value={"attribute"}>Attribute</Radio>
                        <Radio value={"object"}>Object</Radio>
                    </Radio.Group>
                    <div><b>Name</b></div>
                    <Input
                        value={nodeName}
                        onChange={(e) => setNodeName(e.target.value)}
                        placeholder="Enter new node name"
                    />
                    <div><b>Candidate Values (Optional)</b></div>
                    <Input
                        value={candidateValues}
                        onChange={(e) => setCandidateValues(e.target.value)}
                        placeholder="Enter candidate values (comma separated)"
                    />
                </div>
            </Modal>
            <style jsx>{`
            .modal-tree-add {
                line-height: 2em;
            }
        `}</style>
        </>
    );
};

export default ModalTreeAdd;