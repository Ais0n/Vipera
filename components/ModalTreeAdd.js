import React, { useEffect, useState } from 'react';
import { Modal, Input, Button, Radio, Tooltip } from 'antd';
import { SyncOutlined, InfoCircleOutlined } from '@ant-design/icons';

const ModalTreeAdd = ({ isOpen, onClose, onSave }) => {
    const [nodeType, setNodeType] = useState("attribute");
    const [nodeName, setNodeName] = useState('');
    const [candidateValues, setCandidateValues] = useState("");

    const handleSave = () => {
        onSave({ nodeName, nodeType, candidateValues });
        onClose();
        setNodeName('');
        setNodeType("attribute");
        setCandidateValues("");
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
                    <div><b>Type</b><Tooltip title={"An attribute node denotes an auditing criteria that will be used to label the images for evaluation. An object node denotes an object in the images and will NOT directly be used for evaluation."}><InfoCircleOutlined style={{color: 'grey', 'marginLeft': '5px'}}/></Tooltip></div>
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
                    <div><b>Candidate Values (Optional)</b><Tooltip title={"You may create a list of candidate values for labeling."}><InfoCircleOutlined style={{color: 'grey', 'marginLeft': '5px'}}/></Tooltip></div>
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