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
        let prompt = req.body.prompt;
        let schema = req.body.schema;
        try {
            let result = await suggest(prompt, schema);
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

async function suggest(prompt, graphSchema) {
    let maxTries = 5;
    for (let i = 0; i < maxTries; i++) {
        try {
            const input = {
                top_k: 0,
                top_p: 0.9,
                prompt: `You are a helpful assistant. Given a user's prompt and a tree describing the objects and attributes in the generated images, suggest an additional node that can be added to the same level of one existing node, and provide a revised prompt. Output in the JSON form: {'oldNodeName': '...', 'newNodeName': '...', 'newPrompt': '...'}. For example, if the user mentions tigers and there is a 'tiger' node in the tree, you can suggest to add the node 'zebra' and revise the prompt by replacing the word 'tiger' with 'zebra'. \nUser's prompt: ${prompt}\nSchema: ${JSON5.stringify(graphSchema)}\nYour suggestion (JSON):`,
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
            if (!output.hasOwnProperty('oldNodeName') || !output.hasOwnProperty('newNodeName') || !output.hasOwnProperty('newPrompt')) {
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