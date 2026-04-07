// API endpoint to expose default LLM settings to the frontend.
// The frontend Settings modal reads these defaults and lets users override them.

import { DEFAULT_MODEL, DEFAULT_MODEL_VISION, DEFAULT_BASE_URL } from './llm.js';

export default function handler(req, res) {
    if (req.method === 'GET') {
        return res.status(200).json({
            defaultModel: DEFAULT_MODEL,
            defaultModelVision: DEFAULT_MODEL_VISION,
            defaultBaseURL: DEFAULT_BASE_URL,
            hasServerKey: !!process.env.NEXT_OPENROUTER_KEY,
            saveMode: process.env.NEXT_PUBLIC_SAVE_MODE === 'true',
            llmEnabled: process.env.NEXT_PUBLIC_LLM_ENABLED !== 'false',
        });
    }
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
}
