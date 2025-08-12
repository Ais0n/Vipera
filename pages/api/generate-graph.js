import { readFile } from "node:fs/promises";
import Replicate from "replicate";
import path from 'path';
import axios from 'axios';
import JSON5 from 'json5';
import fs from 'fs';
// import { fal } from "@fal-ai/client";

// fal.config({
//   credentials: process.env.NEXT_FAL_AI_KEY
// });
import OpenAI from 'openai';
import process from 'process';
const openai = new OpenAI({
    apiKey: process.env.NEXT_OPENROUTER_KEY,
    baseURL: "https://openrouter.ai/api/v1"
});

export default async function handler(req, res) {
    if (req.method === 'GET') {
        let _path = req.query.path;
        let image_dir = req.query.image_dir;
        try {
            let image, imageBase64;
            // check if the path is a local path or a url
            if (_path.startsWith('http')) {
                image = await axios.get(_path, { responseType: 'arraybuffer' });
                imageBase64 = Buffer.from(image.data).toString('base64');
            } else {
                imageBase64 = (await readFile(path.join(process.cwd(), 'public', _path))).toString('base64');
            }
            let input = `data:image/jpeg;base64,${imageBase64}`;
            let result = await generateGraph(input);

            // save result to image_dir
            if (image_dir && process.env.NEXT_PUBLIC_SAVE_MODE == 'true') {
                let file_path = path.join(process.cwd(), 'public', image_dir);
                // create the path if doesn't exist
                if (!fs.existsSync(file_path)) {
                    fs.mkdirSync(path.dirname(file_path), { recursive: true });
                }
                fs.writeFileSync(file_path, JSON.stringify(result));
                console.log("Graph saved to: ", file_path);
            }
            
            return res.status(200).json({ res: result});
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Graph generation failed' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

async function generateGraph(imageData) {
    let maxTries = 10;

    for(let i = 0; i < maxTries; i++) {
        try {
            const input = "What physical objects or notable features (that can be used to understand/evaluate an image) are in the foreground and background of the image? Output the objects as a JSON string. Do not include more than 5 objects. Keep the objects' names concise. Example: {\"foreground\":[\"obj1\", \"obj2\", ...],\"background\":[\"obj1\", ...]}";

            console.log("input: ", input);
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
                model: 'openai/gpt-5-mini',
                messages: messages,
            });
    
            let output = response.choices[0].message.content;
            console.log("output: ", output);

            // check if the output is valid
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

            // check the schema
            if (!output.hasOwnProperty('foreground') || !output.hasOwnProperty('background') || !Array.isArray(output.foreground) || !Array.isArray(output.background)) {
                throw new Error("Output does not have the required fields: " + JSON.stringify(output));
            }
            return output;
        } catch (error) {
            console.log(error);
            if(i == maxTries - 1) {
                throw error;
            }
        }
    }
}

