import JSON5 from 'json5';
import { createLLMClient, getModel, extractLLMConfig, parseJSONFromLLM } from './llm.js';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { prompt, schema, priorPrompts } = req.body;
        const llmConfig = extractLLMConfig(req);
        try {
            const result = await suggest(prompt, schema, llmConfig);
            const suggestedPrompt = await suggestPrompt(prompt, result, priorPrompts, llmConfig);
            return res.status(200).json({ res: { ...result, newPrompt: suggestedPrompt } });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Prompt suggestion failed' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

async function suggest(prompt, graphSchema, llmConfig) {
    const openai = createLLMClient(llmConfig);
    const model = getModel(llmConfig, { vision: false });
    const maxTries = 5;

    for (let i = 0; i < maxTries; i++) {
        try {
            const input = `You are a helpful assistant. Given a tree describing the objects and attributes in the generated images, suggest an additional node that is NOT in the tree and can be added to the same level of one existing node. Output in the JSON form: {'oldNodeName': '...', 'newNodeName': '...'}. For example, if there is a 'tiger' node in the tree, you can suggest to add the node 'zebra' and revise the prompt by replacing the word 'tiger' with 'zebra'. \nSchema: ${JSON5.stringify(graphSchema)}\nYour suggestion (JSON):`;

            const completion = await openai.chat.completions.create({
                model,
                messages: [
                    { role: "system", content: "You are a helpful assistant. Respond with JSON only, no explanation." },
                    { role: "user", content: input }
                ],
                temperature: 1.1,
                max_tokens: 256,
            });

            let output = completion.choices[0].message.content;
            output = parseJSONFromLLM(output);

            if (!output.oldNodeName || !output.newNodeName) {
                throw new Error("Output missing required fields: " + JSON.stringify(output));
            }
            return output;
        } catch (error) {
            console.error(`suggest attempt ${i + 1}/${maxTries}:`, error.message);
            if (i === maxTries - 1) throw error;
        }
    }
}

async function suggestPrompt(prompt, suggestion, priorPrompts, llmConfig) {
    const openai = createLLMClient(llmConfig);
    const model = getModel(llmConfig, { vision: false });
    const maxTries = 5;

    for (let i = 0; i < maxTries; i++) {
        try {
            const input = `You are a helpful assistant. The user has written a prompt "${prompt}"\nNow the user wants to explore about "${suggestion.newNodeName}" apart from "${suggestion.oldNodeName}". Modify the prompt for the user (do as few modifications as possible), and the new prompt should be different from the users' prior prompts.\nPrior prompts: ${priorPrompts.join(", ")}\nOutput the new prompt in the JSON format: {'newPrompt': '...'} without any other comments.`;

            const completion = await openai.chat.completions.create({
                model,
                messages: [
                    { role: "system", content: "You are a helpful assistant. Respond with JSON only, no explanation." },
                    { role: "user", content: input }
                ],
                temperature: 1.1,
                max_tokens: 256,
            });

            let output = completion.choices[0].message.content;
            output = parseJSONFromLLM(output);

            if (!output.newPrompt) {
                throw new Error("Output missing required fields: " + JSON.stringify(output));
            }
            return output.newPrompt;
        } catch (error) {
            console.error(`suggestPrompt attempt ${i + 1}/${maxTries}:`, error.message);
            if (i === maxTries - 1) throw error;
        }
    }
}
