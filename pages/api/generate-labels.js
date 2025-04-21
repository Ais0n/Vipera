import { readFile } from "node:fs/promises";
import Replicate from "replicate";
import path from 'path';
import axios from 'axios';
import JSON5 from 'json5';
import * as Utils from '../../utils.js';
import fs from 'fs';
import { fal } from "@fal-ai/client";

fal.config({
  credentials: process.env.NEXT_FAL_AI_KEY
});

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

            // save result to label_dir
            if (label_dir && process.env.SAVE_MODE == 'true') {
                let promise = new Promise(async (resolve, reject) => {
                    let file_path = path.join(process.cwd(), 'public', label_dir);
                    // read the existing file
                    let data = {};
                    if (fs.existsSync(file_path)) {
                        data = await readFile(file_path, 'utf-8');
                        data = JSON5.parse(data.toLowerCase());
                    } else {
                        fs.mkdirSync(path.dirname(file_path), { recursive: true });
                    }
                    let contents = Utils.mergeMetadata(data, result);
                    contents = Utils.repairDataWithSchema(contents, JSON.parse(schema));
                    fs.writeFileSync(file_path, JSON.stringify(contents));
                    resolve();
                });
                promise.then(() => {
                    console.log('Saved label to label_dir');
                });
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

async function generateLabel(imageData, schema, candidateValues, userFeedback) {
    let maxTries = 10;

    for (let i = 0; i < maxTries; i++) {
        try {
            const input = {
                image_url: imageData,
                top_p: 1,
                // prompt: `Given the image, finish the label tree based on the provided schema. Specifically, for each leaf node whose corresponding value is an array in the schema, generate a label that describes the object or attribute in the image, and replace the array with the generated label. If all candidate values in the array cannot describe the image, replace the array with a label that you think is appropriate. Schema: ${schema}`,
                prompt: `Given the image, finish the label tree based on the provided schema. Specifically, for each leaf node, generate a label according to the scene in the image, and replace the placeholder value '...' or 'Choose from candidate values ...' with the generated label (For placeholders of the latter type, choose one from the given values). All labels must be strings, and should NOT be numbers, booleans, or arrays. If a specific node (no matter if it is a leaf or not) is not present in the image, replace the node value (subtree) with the object {'EXIST': 'no'}. Output the results in JSON. Your output should *NOT* include the placeholder '...'. Schema: ${schema}${userFeedback ? '. Additional user feedback: ' + userFeedback : ''}`,
                max_tokens: 1024,
                temperature: 0.8
            };
            const {request_id} = await fal.queue.submit("fal-ai/llava-next", {
                input: input,
                webhookUrl: "https://optional.webhook.url/for/results",
              });
            
            let status;
            do {
                status = await fal.queue.status("fal-ai/llava-next", { requestId: request_id, logs: true });
                // console.log(status);
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds
            } while (status.status !== 'COMPLETED');

            // Fetch the result
            let { data: output } = await fal.queue.result("fal-ai/llava-next", { requestId: request_id });
            output = output.output;

            console.log("input:", input.prompt);
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

