import axios from 'axios';
import { createCanvas, loadImage } from 'canvas';
import path from 'path';
import fs from 'fs';
import { createLLMClient, getModel, extractLLMConfig, parseJSONFromLLM } from './llm.js';

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

const MAX_WIDTH = 512;

const mergeImages = async (imgData1, imgData2) => {
    const img1 = await loadImage(imgData1);
    const img2 = await loadImage(imgData2);

    // Resize each image to fit within MAX_WIDTH, preserving aspect ratio
    const scale1 = img1.width > MAX_WIDTH ? MAX_WIDTH / img1.width : 1;
    const scale2 = img2.width > MAX_WIDTH ? MAX_WIDTH / img2.width : 1;
    const w1 = Math.round(img1.width * scale1);
    const h1 = Math.round(img1.height * scale1);
    const w2 = Math.round(img2.width * scale2);
    const h2 = Math.round(img2.height * scale2);

    const canvas = createCanvas(Math.max(w1, w2), h1 + h2);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img1, 0, 0, w1, h1);
    ctx.drawImage(img2, 0, h1, w2, h2);
    return canvas.toBuffer('image/jpeg', { quality: 0.7 });
};

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { path1, path2, keywords, existingCriteria } = req.body;
        const llmConfig = extractLLMConfig(req);
        try {
            const imageData1 = await getImageData(path1);
            const imageData2 = await getImageData(path2);
            const mergedImageBuffer = await mergeImages(imageData1, imageData2);
            const imageData = `data:image/jpeg;base64,${mergedImageBuffer.toString('base64')}`;

            const result = await suggestComparisonFlat(imageData, keywords, existingCriteria, llmConfig);
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

async function suggestComparisonFlat(imageData, keywords, existingCriteria, llmConfig) {
    const openai = createLLMClient(llmConfig);
    const model = getModel(llmConfig, { vision: true });
    const maxTries = 5;

    for (let i = 0; i < maxTries; i++) {
        try {
            const existingCriteriaList = existingCriteria && existingCriteria.length > 0
                ? existingCriteria.join(', ')
                : 'None';

            const prompt = `You are a helpful assistant. Given two randomly selected images from a dataset, find differences between these two images and suggest a new auditing criterion that can help distinguish between them (the two images should be *significantly different* in terms of the new criterion so that the difference is meaningful for auditing; and the criterion must be *different* from the existing criteria). ${keywords.length > 0 ? 'Focus on differences that are relevant to the following user-interested keywords: ' + keywords.join() + '. ' : ''}

Existing criteria: ${existingCriteriaList}

Generate a list of candidate values along with the suggested criteria. Include 'others' in the candidate values if you believe the original list is not exhaustive. The list should not be too long (typically 3-5 values including 'others' if applicable).

Output in the JSON form: {'criterionName': '...', 'candidateValues': ['...', ...], 'explanations': '...'}. For example, if the people in the two images have different genders, you can suggest the criterion 'gender' with candidateValues ["male", "female"]. For a more open-ended attribute like 'style', you might suggest candidateValues like ["modern", "traditional", "vintage", "others"]. The criterion name should be concise and descriptive.

Your suggestion (JSON):`;

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

            if (!output.criterionName || !output.candidateValues) {
                throw new Error("Output missing required fields: " + JSON.stringify(output));
            }

            output.criterionName = output.criterionName.toLowerCase();
            return output;
        } catch (error) {
            console.error(`suggestComparisonFlat attempt ${i + 1}/${maxTries}:`, error.message);
            if (i === maxTries - 1) throw error;
        }
    }
}
