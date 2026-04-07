import JSON5 from 'json5';
import { createLLMClient, getModel, extractLLMConfig, parseJSONFromLLM } from './llm.js';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const schema = req.body.schema;
        const llmConfig = extractLLMConfig(req);
        try {
            const result = await suggest(schema, llmConfig);
            return res.status(200).json({ res: result });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Suggestion failed' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

async function suggest(graphSchema, llmConfig) {
    const openai = createLLMClient(llmConfig);
    const model = getModel(llmConfig, { vision: false });
    const maxTries = 5;

    for (let i = 0; i < maxTries; i++) {
        try {
            const prompt = `You are a helpful assistant. Given a tree describing the objects and attributes in an image dataset, suggest an additional node that can be added to the children of one existing node, and provide some candidate label values. Output in the JSON form: {'parentNodeName': '...', 'newNodeName': '...', 'candidateValues': ['...', ...]}. For example, if the user mentions a person and there is a 'person' node in the tree, you can suggest to add the node 'race', and the candidate values can be ['white', 'black', 'asian']. \nSchema: ${JSON5.stringify(graphSchema)}\nYour suggestion (JSON only, no other text):`;

            const completion = await openai.chat.completions.create({
                model,
                messages: [
                    { role: "system", content: "You are a helpful assistant. Respond with JSON only, no explanation." },
                    { role: "user", content: prompt }
                ],
                max_tokens: 256,
            });

            let output = completion.choices[0].message.content;
            output = parseJSONFromLLM(output);

            if (!output.parentNodeName || !output.newNodeName || !output.candidateValues) {
                throw new Error("Output missing required fields: " + JSON.stringify(output));
            }
            return output;
        } catch (error) {
            console.error(`suggest attempt ${i + 1}/${maxTries}:`, error.message);
            if (i === maxTries - 1) throw error;
        }
    }
}
