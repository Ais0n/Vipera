// Unified LLM client helper
// All API endpoints should use this to create their OpenAI-compatible client.
// Supports per-request overrides via query/body params (apiKey, model, baseURL).

import OpenAI from 'openai';

const DEFAULT_MODEL = 'google/gemini-3.1-flash-lite-preview'; // text-to-text tasks
const DEFAULT_MODEL_VISION = 'google/gemini-2.5-flash-lite';  // image-based tasks (keep original)
const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1';

/**
 * Creates an OpenAI-compatible client using server env vars as defaults,
 * with optional per-request overrides from the user.
 *
 * @param {object} overrides - Optional overrides from req.query or req.body
 * @param {string} overrides.apiKey - User-provided API key
 * @param {string} overrides.baseURL - User-provided base URL
 * @returns {OpenAI} client instance
 */
export function createLLMClient(overrides = {}) {
    const apiKey = overrides.apiKey || process.env.NEXT_OPENROUTER_KEY;
    const baseURL = overrides.baseURL || DEFAULT_BASE_URL;

    if (!apiKey) {
        throw new Error(
            'No LLM API key configured. Set NEXT_OPENROUTER_KEY in your .env file or provide an API key in the Settings panel.'
        );
    }

    return new OpenAI({ apiKey, baseURL });
}

/**
 * Returns the model to use, respecting per-request overrides.
 */
export function getModel(overrides = {}, { vision = false } = {}) {
    return overrides.model || (vision ? DEFAULT_MODEL_VISION : DEFAULT_MODEL);
}

/**
 * Extracts LLM config overrides from a request object.
 * Looks in both query params (GET) and body (POST).
 */
export function extractLLMConfig(req) {
    const source = req.method === 'GET' ? req.query : req.body;
    return {
        apiKey: source?.llmApiKey,
        model: source?.llmModel,
        baseURL: source?.llmBaseURL,
    };
}

/**
 * Parses a JSON object from LLM output text.
 * Handles common LLM response quirks (markdown fences, extra text, etc.)
 */
export function parseJSONFromLLM(text) {
    // Try to find JSON between { and }
    const start = text.indexOf('{');
    if (start === -1) {
        // Wrap and try
        return JSON.parse('{' + text + '}');
    }

    // Find matching closing brace by counting
    let depth = 0;
    let end = -1;
    for (let i = start; i < text.length; i++) {
        if (text[i] === '{') depth++;
        else if (text[i] === '}') {
            depth--;
            if (depth === 0) {
                end = i;
                break;
            }
        }
    }

    if (end === -1) {
        // Try adding missing braces
        let countLeft = 0, countRight = 0;
        for (let i = start; i < text.length; i++) {
            if (text[i] === '{') countLeft++;
            else if (text[i] === '}') countRight++;
        }
        const padded = text.substring(start) + '}'.repeat(countLeft - countRight);
        return JSON.parse(padded);
    }

    return JSON.parse(text.substring(start, end + 1));
}

/**
 * Extracts text from \boxed{...} in LLM output.
 * Handles nested braces properly.
 */
export function parseBoxedFromLLM(text) {
    const marker = '\\boxed{';
    const start = text.indexOf(marker);
    if (start === -1) {
        throw new Error('LLM output does not contain \\boxed{}: ' + text.substring(0, 200));
    }

    let depth = 0;
    let end = -1;
    for (let i = start + marker.length - 1; i < text.length; i++) {
        if (text[i] === '{') depth++;
        else if (text[i] === '}') {
            depth--;
            if (depth === 0) {
                end = i;
                break;
            }
        }
    }

    if (end === -1) {
        // Fall back to first } after \boxed{
        end = text.indexOf('}', start + marker.length);
        if (end === -1) throw new Error('Malformed \\boxed{} in LLM output');
    }

    return text.substring(start + marker.length, end);
}

export { DEFAULT_MODEL, DEFAULT_MODEL_VISION, DEFAULT_BASE_URL };
