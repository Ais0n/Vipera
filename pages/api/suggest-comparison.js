import axios from 'axios';
import JSON5 from 'json5';
import { createCanvas, loadImage } from 'canvas'; // Ensure you install 'canvas' package
import path from 'path';
import Replicate from "replicate";
import fs from 'fs';
import { fal } from "@fal-ai/client";

import OpenAI from 'openai';
import process from 'process';
const openai = new OpenAI({
    apiKey: process.env.NEXT_OPENROUTER_KEY,
    baseURL: "https://openrouter.ai/api/v1"
});

const getImageData = async (imagePath) => {
    if (imagePath.startsWith('http')) {
        const response = await axios.get(imagePath, { responseType: 'arraybuffer' });
        return Buffer.from(response.data);
    } else {
        // get the image path
        // imagePath = `public${imagePath}`;
        // return await fs.promises.readFile(imagePath);
        try {
            imagePath = path.join(process.cwd(), 'public', imagePath);
            return await fs.promises.readFile(imagePath);
        } catch (fsError) {
            console.error(`Error reading image from path ${imagePath}:`, fsError);
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

    return canvas.toBuffer('image/png'); // Return buffer instead of saving to file
};

const convertImageToBase64 = (imageBuffer) => {
    return `data:image/png;base64,${imageBuffer.toString('base64')}`;
};

export default async function handler(req, res) {
    if (req.method === 'POST') {
        let { path1, path2, keywords, schema } = req.body;
        try {
            // Get image data as buffers
            const imageData1 = await getImageData(path1);
            const imageData2 = await getImageData(path2);

            // Combine the two images
            const mergedImageBuffer = await mergeImages(imageData1, imageData2);

            // Convert merged image to Base64
            const imageData = convertImageToBase64(mergedImageBuffer);

            let result = await suggestComparison(imageData, keywords, schema);
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

async function suggestComparison(imageData, keywords, schema) {
    // return {'parentNodeName': 'foreground', 'newNodeName': 'clothing', 'candidateValues': ['coat', 'shirt', 'others']};
    let maxTries = 5;

    for (let i = 0; i < maxTries; i++) {
        try {
            const input = `You are a helpful assistant. Given a tree describing the objects and attributes in an image dataset and two randomly selected images from this dataset, find differences between these two images and suggest an additional node that can be added to the children of an existing node in the tree (the two images should be *significantly different* in terms of the additional node so that the difference is meaningful for auditing; and the node to be added must be *different* from the nodes in the tree). ${keywords.length > 0 ? 'If possible, focus on differences that are relevant to the following user-interested keywords: ' + keywords.join() + '. ' : ''}Output in the JSON form: {'parentNodeName': '...', 'newNodeName': '...', 'candidateValues': ['...', ...], 'explanations': '...'}. For example, if the people in the two images have different genders, you can suggest to add the node 'gender' to the children of 'person', and the candidateValues are ["male", "female"]. \nSchema: ${JSON5.stringify(schema)}\nYour suggestion (JSON):`;
            console.log("input: ", input)

            let messages = [{
                role: "system",
                content: [{
                  type: "text",
                  text: "You are a helpful assistant."
                }]
            },  {
                role: "user",
                content: [
                    { type: "image_url", image_url: { "url": imageData } },
                    { type: "text", text: input },
                ]
            }]

            const response = await openai.chat.completions.create({
                model: 'google/gemini-2.5-flash-lite',
                messages: messages,
            });
    
            let output = response.choices[0].message.content;
            console.log("output: ", output);
            // Find the JSON part from the output
            let start = output.indexOf('{');
            if (start == -1) {
                output = '{' + output + '}';
                output = JSON5.parse(output);
            } else {
                for (let end = output.length - 1; end >= start; end--) {
                    if (output[end] == '}') {
                        let _output = output.substring(start, end + 1);
                        try {
                            _output = JSON5.parse(_output);
                        } catch (error) {
                            continue;
                        }
                        output = _output;
                        break;
                    }
                }
                if(typeof output === 'string') {
                    output = JSON5.parse(output);
                }
            }
            // output = JSON5.parse(output);
            
            // check if the json has the required fields
            if (!output.hasOwnProperty('parentNodeName') || !output.hasOwnProperty('newNodeName') || !output.hasOwnProperty('candidateValues')) {
                throw new Error("Output does not have the required fields: " + JSON.stringify(output));
            }
            
            // Normalize node names to lowercase
            output.parentNodeName = output.parentNodeName.toLowerCase();
            output.newNodeName = output.newNodeName.toLowerCase();
            
            return output;
        } catch (error) {
            console.log(error);
            if (i === maxTries - 1) {
                throw error;
            }
        }
    }
}