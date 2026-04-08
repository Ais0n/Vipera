import JSON5 from 'json5';
import { createLLMClient, getModel, extractLLMConfig } from './llm.js';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { prompts, schema } = req.body;
        const llmConfig = extractLLMConfig(req);
        try {
            const result = await suggest(prompts, schema, llmConfig);
            return res.status(200).json({ res: result });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Suggest keywords failed' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

async function suggest(prompts, graphSchema, llmConfig) {
    const openai = createLLMClient(llmConfig);
    const model = getModel(llmConfig, { vision: false });
    const maxTries = 5;

    for (let i = 0; i < maxTries; i++) {
        try {
            const prompt = `You are auditing a generative text-to-image model, and you have tried the following prompts and auditing criteria. Please suggest potential auditing directions in the form of keywords (5-7 keywords; Keep each keyword in one word if possible and no more than 2 words).\nPrompts (from oldest to latest): ${JSON5.stringify(prompts)}\nCriteria: ${JSON5.stringify(graphSchema)}\nThe keywords should include both those that encourage further insights into existing directions and those that inspire unexplored avenues. Output ONLY a comma-separated list of keywords, nothing else.`;

            const completion = await openai.chat.completions.create({
                model,
                messages: [
                    { role: "system", content: "You are a helpful assistant. Respond concisely with only what is asked." },
                    { role: "user", content: prompt }
                ],
                temperature: 1.1,
                max_tokens: 128,
            });

            const output = completion.choices[0].message.content.trim();

            if (!output) {
                throw new Error("Empty response from LLM");
            }

            // Parse keywords: try comma-separated first, then newline-separated, then single keyword
            let keywords;
            if (output.includes(',')) {
                keywords = output.split(',').map(k => k.trim()).filter(Boolean);
            } else if (output.includes('\n')) {
                keywords = output.split('\n').map(k => k.trim().replace(/^[-*•\d.)\s]+/, '').trim()).filter(Boolean);
            } else {
                keywords = [output.trim()];
            }

            if (keywords.length === 0) {
                throw new Error("No keywords parsed from output: " + output);
            }

            return keywords;
        } catch (error) {
            console.error(`suggestKeyword attempt ${i + 1}/${maxTries}:`, error.message);
            if (i === maxTries - 1) throw error;
        }
    }
}
