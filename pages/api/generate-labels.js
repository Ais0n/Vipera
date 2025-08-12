import { readFile } from "node:fs/promises";
import Replicate from "replicate";
import path from 'path';
import axios from 'axios';
import JSON5 from 'json5';
import * as Utils from '../../utils.js';
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

export const config = {
    api: {
        responseLimit: false,
        timeout: 120000, // 120 seconds
    },
};

export default async function handler(req, res) {
    // throw new Error("");
    if (req.method === 'GET') {
        let _path = req.query.path;
        let schema = req.query.schema;
        let label_dir = req.query.label_dir;
        let candidateValues = req.query.candidate_values;
        let userFeedback = req.query.feedback;
        try {
            let image, imageBase64;
            // check if the path is a local path or a url
            if (_path.startsWith('http')) {
                image = await axios.get(_path, { responseType: 'arraybuffer' });
                imageBase64 = Buffer.from(image.data).toString('base64');
            } else {
                imageBase64 = (await readFile(path.join(process.cwd(), 'public', _path))).toString('base64');
            }
            let imageData = `data:image/jpeg;base64,${imageBase64}`;
            let result = await generateLabel(imageData, schema, candidateValues, userFeedback);
            // change result to lower case
            result = JSON.parse(JSON.stringify(result).toLowerCase());

            // Note: Label saving is disabled when NEXT_PUBLIC_SAVE_MODE is true
            // Labels will not be saved to preserve storage and only save images and initial scene graph

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

async function generateLabel(imageData, schema, candidateValues, userFeedback) {
    let maxTries = 10;

    for (let i = 0; i < maxTries; i++) {
        try {
            const input = `Given the image, finish the label tree based on the provided schema. Specifically, for each leaf node, generate a label according to the scene in the image. Replace ONLY the placeholders ('...' or 'Choose from candidate values ...') with the generated label. All labels must be strings, and should NOT be numbers, booleans, or arrays. If a specific node (no matter if it is a leaf or not) is not present in the image, replace the node value (subtree) with the object {'EXIST': 'no'}. Output the results in JSON. Make sure the output strictly follows the provided schema without altering its structure. Do not include any placeholders in the final output. Schema: ${schema}${userFeedback ? '. Additional user feedback: ' + userFeedback : ''}`

            console.log("input:", input);

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
            console.log("output:", output);
            // Find the JSON part from the output
            let start = output.indexOf('{');
            if (start == -1) {
                output = '{' + output + '}';
                output = JSON5.parse(output);
            } else {
                // find the last '}'
                let lastIndex = output.lastIndexOf('}');
                output = output.substring(start, lastIndex + 1);
                // count the number of '{' and '}'
                let countLeft = 0, countRight = 0;
                for (let j = 0; j < output.length; j++) {
                    if (output[j] == '{') {
                        countLeft++;
                    } else if (output[j] == '}') {
                        countRight++;
                    }
                }
                if (countLeft > countRight) {
                    let diff = countLeft - countRight;
                    for (let j = 0; j < diff; j++) {
                        output += '}';
                    }
                }
                // parse the output
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
                if (typeof output === 'string') {
                    output = JSON5.parse(output);
                }
            }
            modifyOutput(output);
            return output;
        } catch (error) {
            console.log(error);
            if (i == maxTries - 1) {
                throw error;
            }
        }
    }
}

const modifyOutput = (output) => {
    let keys = Object.keys(output);
    for (let key of keys) {
        if (Array.isArray(output[key])) {
            let label = output[key][0];
            output[key] = label;
        } else if (typeof output[key] === 'object') {
            modifyOutput(output[key]);
        }
    }
}

