import { readFile } from "node:fs/promises";
import path from 'path';
import axios from 'axios';
import JSON5 from 'json5';

import Replicate from "replicate";
const replicate = new Replicate({
    auth: process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN,
});

export default async function handler(req, res) {
    if (req.method === 'POST') {
        // let prompt = req.body.prompt;
        let schema = req.body.schema;
        try {
            let result = await suggest(schema);
            return res.status(200).json({ res: result });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Graph generation failed' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

async function suggest(graphSchema) {
    let maxTries = 5;
    for (let i = 0; i < maxTries; i++) {
        try {
            const input = {
                top_k: 0,
                top_p: 0.9,
                prompt: `You are a helpful assistant. Given a tree describing the objects and attributes in an image dataset, suggest an additional node that can be added to the children of one existing node, and provide some candidate label values. Output in the JSON form: {'parentNodeName': '...', 'newNodeName': '...', candidateValues: ['...', ...]}. For example, if the user mentions a person and there is a 'person' node in the tree, you can suggest to add the node 'race', and the candidate values can be ['white', 'black', 'asian']. \nSchema: ${JSON5.stringify(graphSchema)}\nYour suggestion (JSON only):`,
                max_tokens: 512,
                min_tokens: 0,
                temperature: 0.6,
                length_penalty: 1,
                stop_sequences: "<|end_of_text|>",
                prompt_template: "{prompt}",
                presence_penalty: 1.15,
                log_performance_metrics: false
              };

            let output = "";
            for await (const event of replicate.stream("meta/meta-llama-3-70b", { input })) {
                output += event.toString();
            };

            console.log("input: ", input.prompt)
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
            // output = JSON5.parse(output);
            
            // check if the json has the required fields
            if (!output.hasOwnProperty('parentNodeName') || !output.hasOwnProperty('newNodeName') || !output.hasOwnProperty('candidateValues')) {
                throw new Error("Output does not have the required fields: " + JSON.stringify(output));
            }
            return output;
        } catch (error) {
            console.log(error);
            if (i == maxTries - 1) {
                throw error;
            }
        }
    }


}




//=> "The number of parameters in a neural network can impact ...