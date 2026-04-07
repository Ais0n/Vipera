import React, { useState, useEffect } from 'react';
import { Tour, Button } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

const ONBOARDING_KEY = 'vipera_onboarding_completed';

const OnboardingTour = ({ searchBarRef, headerRef }) => {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        // Show tour on first visit
        const completed = localStorage.getItem(ONBOARDING_KEY);
        if (!completed) {
            // Small delay to let the page render
            const timer = setTimeout(() => setOpen(true), 800);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setOpen(false);
        localStorage.setItem(ONBOARDING_KEY, 'true');
    };

    const steps = [
        {
            title: 'Welcome to Vipera!',
            description: (
                <div>
                    <p>Vipera helps you systematically audit text-to-image AI models for biases, stereotypes, and unexpected behaviors.</p>
                    <p>This quick tour will walk you through the key features. You can restart it anytime from the <b>?</b> button.</p>
                </div>
            ),
            target: null, // Center of screen
        },
        {
            title: 'Step 1: Enter a Prompt',
            description: (
                <div>
                    <p>Start by typing a text prompt (e.g., "a cinematic photo of a doctor") and clicking <b>Generate</b>.</p>
                    <p>Vipera will generate multiple images using Stable Diffusion and automatically analyze them.</p>
                </div>
            ),
            target: () => searchBarRef?.current,
            placement: 'bottom',
        },
        {
            title: 'Step 2: Analyze Results',
            description: (
                <div>
                    <p>After generation, you'll see:</p>
                    <ul style={{ paddingLeft: 20 }}>
                        <li><b>Scene Graph</b> — a hierarchical view of objects and attributes found in images</li>
                        <li><b>Image Grid</b> — all generated images with labels</li>
                        <li><b>Distribution Charts</b> — statistical breakdowns of attributes across images</li>
                    </ul>
                </div>
            ),
            target: null,
        },
        {
            title: 'Step 3: Add Auditing Criteria',
            description: (
                <div>
                    <p>Vipera uses AI to suggest new auditing criteria by comparing pairs of images. You can also:</p>
                    <ul style={{ paddingLeft: 20 }}>
                        <li>Add criteria manually via the scene graph</li>
                        <li>Use keyword-guided suggestions</li>
                        <li>Edit or relabel AI-generated labels</li>
                    </ul>
                </div>
            ),
            target: null,
        },
        {
            title: 'Step 4: Explore & Document',
            description: (
                <div>
                    <p>Use <b>Prompt Suggestions</b> to explore related scenarios, and <b>Bookmark</b> interesting charts to build an audit report.</p>
                    <p>Try different system modes (A-D) via <b>Mode</b> in the header for varying levels of AI assistance.</p>
                </div>
            ),
            target: () => headerRef?.current,
            placement: 'bottom',
        },
        {
            title: 'Configure LLM Settings',
            description: (
                <div>
                    <p>Click <b>Settings</b> in the header to configure the AI model and API key used for analysis.</p>
                    <p>By default, Vipera uses Gemini via OpenRouter. You can switch to other models or provide your own API key.</p>
                </div>
            ),
            target: () => headerRef?.current,
            placement: 'bottom',
        },
    ];

    return (
        <>
            <Tour
                open={open}
                onClose={handleClose}
                steps={steps}
                indicatorsRender={(current, total) => (
                    <span>{current + 1} / {total}</span>
                )}
            />
            <Button
                type="text"
                shape="circle"
                icon={<QuestionCircleOutlined />}
                onClick={() => setOpen(true)}
                style={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    zIndex: 1000,
                    width: 40,
                    height: 40,
                    fontSize: 20,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    background: 'white',
                }}
                title="Show guided tour"
            />
        </>
    );
};

export default OnboardingTour;
