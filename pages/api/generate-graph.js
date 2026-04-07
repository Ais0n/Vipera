import { readFile } from "node:fs/promises";
import path from 'path';
import axios from 'axios';
import fs from 'fs';
import { createLLMClient, getModel, extractLLMConfig, parseJSONFromLLM } from './llm.js';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        const _path = req.query.path;
        const image_dir = req.query.image_dir;
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
            const result = await generateGraph(imageData, llmConfig);

            // Save initial scene graph if save mode is enabled
            if (image_dir && process.env.NEXT_PUBLIC_SAVE_MODE === 'true') {
                const file_path = path.join(process.cwd(), 'public', image_dir);
                if (!fs.existsSync(file_path)) {
                    fs.mkdirSync(path.dirname(file_path), { recursive: true });
                    fs.writeFileSync(file_path, JSON.stringify(result));
                }
            }

            return res.status(200).json({ res: result });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Graph generation failed' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

async function generateGraph(imageData, llmConfig) {
    const openai = createLLMClient(llmConfig);
    const model = getModel(llmConfig, { vision: true });
    const maxTries = 5;

    for (let i = 0; i < maxTries; i++) {
        try {
            const prompt = "What physical objects or notable features (that can be used to understand/evaluate an image) are in the foreground and background of the image? Output the objects as a JSON string. Do not include more than 5 objects. Keep the objects' names concise. Example: {\"foreground\":[\"obj1\", \"obj2\", ...],\"background\":[\"obj1\", ...]}";

            const response = await openai.chat.completions.create({
                model,
                messages: [
                    { role: "system", content: "You are a helpful assistant." },
                    {
                        role: "user",
                        content: [
                            { type: "image_url", image_url: { url: imageData } },
                            { type: "text", text: prompt },
                        ]
                    }
                ],
            });

            let output = response.choices[0].message.content;
            output = parseJSONFromLLM(output);

            if (!output.foreground || !output.background || !Array.isArray(output.foreground) || !Array.isArray(output.background)) {
                throw new Error("Output missing required fields: " + JSON.stringify(output));
            }
            return output;
        } catch (error) {
            console.error(`generateGraph attempt ${i + 1}/${maxTries}:`, error.message);
            if (i === maxTries - 1) throw error;
        }
    }
}
