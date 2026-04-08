import { readFile } from "node:fs/promises";
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { createLLMClient, getModel, extractLLMConfig, parseJSONFromLLM } from './llm.js';

export const config = {
    api: {
        responseLimit: false,
        timeout: 120000,
    },
};

export default async function handler(req, res) {
    if (req.method === 'GET') {
        const _path = req.query.path;
        const schema = req.query.schema;
        const userFeedback = req.query.feedback;
        const labelDir = req.query.label_dir;
        const saveMode = req.query.saveMode;
        const isSaveMode = saveMode !== undefined ? saveMode === 'true' : process.env.NEXT_PUBLIC_SAVE_MODE === 'true';
        const llmConfig = extractLLMConfig(req);
        try {
            let imageBase64;
            if (_path.startsWith('http')) {
                const image = await axios.get(_path, { responseType: 'arraybuffer' });
                imageBase64 = Buffer.from(image.data).toString('base64');
            } else {
                imageBase64 = (await readFile(path.join(process.cwd(), 'public', _path))).toString('base64');
            }
            const imageData = `data:image/jpeg;base64,${imageBase64}`;
            let result = await generateLabel(imageData, schema, userFeedback, llmConfig);
            // Normalize to lowercase
            result = JSON.parse(JSON.stringify(result).toLowerCase());

            // Save labels to disk if save mode is enabled
            if (labelDir && isSaveMode) {
                const filePath = path.join(process.cwd(), 'public', labelDir);
                if (filePath.startsWith(path.join(process.cwd(), 'public'))) {
                    const dir = path.dirname(filePath);
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }
                    fs.writeFileSync(filePath, JSON.stringify(result));
                }
            }

            return res.status(200).json({ res: result });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Label generation failed' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

async function generateLabel(imageData, schema, userFeedback, llmConfig) {
    const openai = createLLMClient(llmConfig);
    const model = getModel(llmConfig, { vision: true });
    const maxTries = 5;

    for (let i = 0; i < maxTries; i++) {
        try {
            const prompt = `Given the image, finish the label tree based on the provided schema. Specifically, for each leaf node, generate a label according to the scene in the image. Replace ONLY the placeholders ('...' or 'Choose from candidate values ...') with the generated label. All labels must be strings, and should NOT be numbers, booleans, or arrays. If a specific node (no matter if it is a leaf or not) is not present in the image, replace the node value (subtree) with the object {'EXIST': 'no'}. Output the results in JSON. Make sure the output strictly follows the provided schema without altering its structure. Do not include any placeholders in the final output. Schema: ${schema}${userFeedback ? '. Additional user feedback: ' + userFeedback : ''}`;

            const response = await openai.chat.completions.create({
                model,
                messages: [
                    { role: "system", content: "You are a helpful assistant. Respond with JSON only, no explanation." },
                    {
                        role: "user",
                        content: [
                            { type: "image_url", image_url: { url: imageData } },
                            { type: "text", text: prompt },
                        ]
                    }
                ],
                max_tokens: 1024,
                temperature: 0.2,
            });

            let output = response.choices[0].message.content;
            output = parseJSONFromLLM(output);
            modifyOutput(output);
            return output;
        } catch (error) {
            console.error(`generateLabel attempt ${i + 1}/${maxTries}:`, error.message);
            if (i === maxTries - 1) throw error;
        }
    }
}

const modifyOutput = (output) => {
    for (const key of Object.keys(output)) {
        if (Array.isArray(output[key])) {
            output[key] = output[key][0];
        } else if (typeof output[key] === 'object' && output[key] !== null) {
            modifyOutput(output[key]);
        }
    }
};
