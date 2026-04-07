import axios from 'axios';
import { createCanvas, loadImage } from 'canvas';
import path from 'path';
import fs from 'fs';
import { createLLMClient, getModel, extractLLMConfig, parseJSONFromLLM } from './llm.js';
import JSON5 from 'json5';

const getImageData = async (imagePath) => {
    if (imagePath.startsWith('http')) {
        const response = await axios.get(imagePath, { responseType: 'arraybuffer' });
        return Buffer.from(response.data);
    } else {
        try {
            const fullPath = path.join(process.cwd(), 'public', imagePath);
            return await fs.promises.readFile(fullPath);
        } catch (fsError) {
            throw new Error(`Image not found at ${imagePath}`);
        }
    }
};

const mergeImages = async (imgData1, imgData2) => {
    const img1 = await loadImage(imgData1);
    const img2 = await loadImage(imgData2);
    const canvas = createCanvas(Math.max(img1.width, img2.width), img1.height + img2.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img1, 0, 0);
    ctx.drawImage(img2, 0, img1.height);
    return canvas.toBuffer('image/png');
};

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { path1, path2, keywords, schema } = req.body;
        const llmConfig = extractLLMConfig(req);
        try {
            const imageData1 = await getImageData(path1);
            const imageData2 = await getImageData(path2);
            const mergedImageBuffer = await mergeImages(imageData1, imageData2);
            const imageData = `data:image/png;base64,${mergedImageBuffer.toString('base64')}`;

            const result = await suggestComparison(imageData, keywords, schema, llmConfig);
            return res.status(200).json({ res: result });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Image processing failed' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

async function suggestComparison(imageData, keywords, schema, llmConfig) {
    const openai = createLLMClient(llmConfig);
    const model = getModel(llmConfig, { vision: true });
    const maxTries = 5;

    for (let i = 0; i < maxTries; i++) {
        try {
            const prompt = `You are a helpful assistant. Given a tree describing the objects and attributes in an image dataset and two randomly selected images from this dataset, find differences between these two images and suggest an additional node that can be added to the children of an existing node in the tree (the two images should be *significantly different* in terms of the additional node so that the difference is meaningful for auditing; and the node to be added must be *different* from the nodes in the tree). ${keywords.length > 0 ? 'Focus on differences that are relevant to the following user-interested keywords: ' + keywords.join() + '. ' : ''}

Generate a list of candidate values along with the suggested criteria. Include 'others' in the candidate values if you believe the original list is not exhaustive. The list should not be too long (typically 3-5 values including 'others' if applicable).

Output in the JSON form: {'parentNodeName': '...', 'newNodeName': '...', 'candidateValues': ['...', ...], 'explanations': '...'}. For example, if the people in the two images have different genders, you can suggest to add the node 'gender' to the children of 'person', and the candidateValues are ["male", "female"]. For a more open-ended attribute like 'style', you might suggest candidateValues like ["modern", "traditional", "vintage", "others"]. \nSchema: ${JSON5.stringify(schema)}\nYour suggestion (JSON):`;

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
                temperature: 1.2,
                max_tokens: 512,
            });

            let output = response.choices[0].message.content;
            output = parseJSONFromLLM(output);

            if (!output.parentNodeName || !output.newNodeName || !output.candidateValues) {
                throw new Error("Output missing required fields: " + JSON.stringify(output));
            }

            output.parentNodeName = output.parentNodeName.toLowerCase();
            output.newNodeName = output.newNodeName.toLowerCase();
            return output;
        } catch (error) {
            console.error(`suggestComparison attempt ${i + 1}/${maxTries}:`, error.message);
            if (i === maxTries - 1) throw error;
        }
    }
}
