import { readFile } from "node:fs/promises";
import path from 'path';
import axios from 'axios';
import JSON5 from 'json5';

import OpenAI from 'openai';
import process from 'process';
const openai = new OpenAI({
    apiKey: process.env.NEXT_OPENROUTER_KEY,
    baseURL: "https://openrouter.ai/api/v1"
});

export default async function handler(req, res) {
    if (req.method === 'POST') {
        let prompt = req.body.prompt;
        let schema = req.body.schema;
        let priorPrompts = req.body.priorPrompts;
        try {
            let result = await suggest(prompt, schema);
            let suggestedPrompt = await suggestPrompt(prompt, result, priorPrompts);
            result = {...result, newPrompt: suggestedPrompt};
            // let result = {
            //     "oldNodeName": "doctor",
            //     "newNodeName": "nurse",
            //     "newPrompt": "A cinematic photo of a nurse"
            // }
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
            const input = `You are a helpful assistant. Given a tree describing the objects and attributes in the generated images, suggest an additional node that is NOT in the tree and can be added to the same level of one existing node. Output in the JSON form: {'oldNodeName': '...', 'newNodeName': '...'}. For example, if there is a 'tiger' node in the tree, you can suggest to add the node 'zebra' and revise the prompt by replacing the word 'tiger' with 'zebra'. \nSchema: ${JSON5.stringify(graphSchema)}\nYour suggestion (JSON):`
            console.log("input: ", input);
            
            const completion = await openai.chat.completions.create({
                model: "google/gemini-2.5-flash-lite",  
                messages: [
                    { role: "system", content: "You are a helpful assistant." },
                    { role: "user", content: input }
                ],
            });
            
            let output = completion.choices[0].message.content;
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
            }
            if(typeof output === 'string') {
                output = JSON5.parse(output);
            }
            // output = JSON5.parse(output);
            
            // check if the json has the required fields
            if (!output.hasOwnProperty('oldNodeName') || !output.hasOwnProperty('newNodeName')) {
                throw new Error("Output does not have the required fields: " + JSON.stringify(output));
            }
            console.log("return: ", output);
            return output;
        } catch (error) {
            console.log(error);
            if (i == maxTries - 1) {
                throw error;
            }
        }
    }


}

async function suggestPrompt(prompt, suggestion, priorPrompts) {
    let maxTries = 5;
    for (let i = 0; i < maxTries; i++) {
        try {
            const input = `You are a helpful assistant. The user has written a prompt "${prompt}"\nNow the user wants to explore about "${suggestion.newNodeName}" apart from "${suggestion.oldNodeName}". Modify the prompt for the user (do as few modifications as possible), and the new prompt should be different from the users' prior prompts.\nPrior prompts: ${priorPrompts.join(", ")}\nOutput the new prompt in the JSON format: {'newPrompt': '...'} without any other comments.`;
            
            console.log("input: ", input);
            
            const completion = await openai.chat.completions.create({
                model: "google/gemini-2.5-flash-lite",  
                messages: [
                    { role: "system", content: "You are a helpful assistant." },
                    { role: "user", content: input }
                ],
            });
            
            let output = completion.choices[0].message.content;
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
            }
            if(typeof output === 'string') {
                output = JSON5.parse(output);
            }
            // output = JSON5.parse(output);
            
            // check if the json has the required fields
            if (!output.hasOwnProperty('newPrompt')) {
                throw new Error("Output does not have the required fields: " + JSON.stringify(output));
            }
            return output.newPrompt;
        } catch (error) {
            console.log(error);
            if (i == maxTries - 1) {
                throw error;
            }
        }
    }


}



//=> "The number of parameters in a neural network can impact ...