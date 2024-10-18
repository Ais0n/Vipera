import { readFile } from "node:fs/promises";
import Replicate from "replicate";
import path from 'path';
import axios from 'axios';
import JSON5 from 'json5';
import * as Utils from '../../utils.js';
import fs from 'fs';

const replicate = new Replicate({
    auth: process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN,
});

export default async function handler(req, res) {
    if (req.method === 'GET') {
        let _path = req.query.path;
        let schema = req.query.schema;
        let label_dir = req.query.label_dir;
        let candidateValues = req.query.candidate_values;
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
            let result = await generateLabel(imageData, schema, candidateValues);
            // change result to lower case
            result = JSON.parse(JSON.stringify(result).toLowerCase());

            // save result to label_dir
            if(label_dir) {
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
                    fs.writeFileSync(file_path, JSON.stringify(contents));
                    resolve();
                });
                promise.then(() => {
                    console.log('Saved label to label_dir');
                });
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

async function generateLabel(imageData, schema, candidateValues) {
    let maxTries = 10;

    for(let i = 0; i < maxTries; i++) {
        try {
            let output = await replicate.run(
                "yorickvp/llava-13b:80537f9eead1a5bfa72d5ac6ea6414379be41d4d4f6679fd776e9535d1eb58bb",
                {
                  input: {
                    image: imageData,
                    top_p: 1,
                    // prompt: `Given the image, finish the label tree based on the provided schema. Specifically, for each leaf node whose corresponding value is an array in the schema, generate a label that describes the object or attribute in the image, and replace the array with the generated label. If all candidate values in the array cannot describe the image, replace the array with a label that you think is appropriate. Schema: ${schema}`,
                    prompt: `Given the image, finish the label tree based on the provided schema. Specifically, for each leaf node, generate a label according to the scene in the image, and replace the value "..." with the generated label (only numbers, strings, or boolean values accepted${candidateValues ? '. You are required to choose from the following values: ' + candidateValues : ', undefined'}). Output the results in JSON. Schema: ${schema}`,
                    max_tokens: 1024,
                    temperature: 0.6
                  }
                }
              );
            output = output.join("");
            console.log(output);
            // find the json part from the output
            let start = output.indexOf('{');
            let end = output.lastIndexOf('}');
            if(start == -1 || end == -1) {
                output = '{' + output + '}';
            } else {
                output = output.substring(start, end + 1);
            }
            output = JSON5.parse(output);
            modifyOutput(output);
            return output;
        } catch (error) {
            console.log(error);
            if(i == maxTries - 1) {
                throw error;
            }
        }
    }
}

const modifyOutput = (output) => {
    let keys = Object.keys(output);
    for(let key of keys) {
        if(Array.isArray(output[key])) {
            let label = output[key][0];
            output[key] = label;
        } else if(typeof output[key] === 'object') {
            modifyOutput(output[key]);
        }
    }
}

