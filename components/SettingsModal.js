import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, Typography, Divider, Tag, Space, Alert } from 'antd';

const { Text } = Typography;

const MODEL_OPTIONS = [
    { value: 'google/gemini-3.1-flash-lite-preview', label: 'Gemini 3.1 Flash Lite (text, default)' },
    { value: 'google/gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite (vision, default)' },
    { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'openai/gpt-4o', label: 'GPT-4o' },
    { value: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4' },
];

const SettingsModal = ({ open, onClose, llmConfig, setLlmConfig }) => {
    const [localConfig, setLocalConfig] = useState(llmConfig);
    const [serverInfo, setServerInfo] = useState(null);

    useEffect(() => {
        setLocalConfig(llmConfig);
    }, [llmConfig, open]);

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/settings`)
            .then(r => r.json())
            .then(setServerInfo)
            .catch(() => {});
    }, []);

    const handleOk = () => {
        setLlmConfig(localConfig);
        onClose();
    };

    const hasServerKey = serverInfo?.hasServerKey;

    return (
        <Modal
            title="Settings"
            open={open}
            onOk={handleOk}
            onCancel={onClose}
            okText="Save"
            width={520}
        >
            <Divider orientation="left" plain>LLM Configuration</Divider>

            {hasServerKey && !localConfig.apiKey && (
                <Alert
                    message="Using server-configured API key"
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                />
            )}

            {!hasServerKey && !localConfig.apiKey && (
                <Alert
                    message="No API key configured. Enter your OpenRouter API key below, or set NEXT_OPENROUTER_KEY on the server."
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                />
            )}

            <div style={{ marginBottom: 16 }}>
                <Text strong>API Key</Text>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
                    Your OpenRouter API key. Get one at{' '}
                    <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer">openrouter.ai/keys</a>.
                    {hasServerKey ? ' Leave empty to use the server default.' : ''}
                </Text>
                <Input.Password
                    placeholder={hasServerKey ? "Using server default" : "sk-or-v1-..."}
                    value={localConfig.apiKey || ''}
                    onChange={e => setLocalConfig({ ...localConfig, apiKey: e.target.value || undefined })}
                />
            </div>

            <div style={{ marginBottom: 16 }}>
                <Text strong>Text Model</Text>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
                    Used for text-only tasks (prompt suggestions, keywords, notes).
                </Text>
                <Select
                    style={{ width: '100%' }}
                    value={localConfig.model || serverInfo?.defaultModel || 'google/gemini-3.1-flash-lite-preview'}
                    onChange={value => setLocalConfig({ ...localConfig, model: value })}
                    options={MODEL_OPTIONS}
                    showSearch
                    allowClear
                    placeholder="Default: Gemini 3.1 Flash Lite"
                />
            </div>

            <div style={{ marginBottom: 16 }}>
                <Text strong>Vision Model</Text>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
                    Used for image analysis tasks (scene graph, labeling, image comparison).
                </Text>
                <Select
                    style={{ width: '100%' }}
                    value={localConfig.modelVision || serverInfo?.defaultModelVision || 'google/gemini-2.5-flash-lite'}
                    onChange={value => setLocalConfig({ ...localConfig, modelVision: value })}
                    options={MODEL_OPTIONS}
                    showSearch
                    allowClear
                    placeholder="Default: Gemini 2.5 Flash Lite"
                />
            </div>

            <div style={{ marginBottom: 16 }}>
                <Text strong>Base URL</Text>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
                    OpenRouter-compatible API endpoint. Only change if using a custom proxy.
                </Text>
                <Input
                    placeholder="https://openrouter.ai/api/v1"
                    value={localConfig.baseURL || ''}
                    onChange={e => setLocalConfig({ ...localConfig, baseURL: e.target.value || undefined })}
                />
            </div>

            <Space style={{ marginTop: 8 }}>
                <Tag color="blue">Text: {localConfig.model || serverInfo?.defaultModel || 'gemini-3.1-flash-lite-preview'}</Tag>
                <Tag color="green">Vision: {localConfig.modelVision || serverInfo?.defaultModelVision || 'gemini-2.5-flash-lite'}</Tag>
            </Space>
        </Modal>
    );
};

export default SettingsModal;
