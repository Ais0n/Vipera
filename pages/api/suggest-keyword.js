import { readFile } from "node:fs/promises";
import path from 'path';
import axios from 'axios';
import JSON5 from 'json5';

import OpenAI from 'openai';
const openai = new OpenAI({
    apiKey: process.env.NEXT_OPENROUTER_KEY,
    baseURL: "https://openrouter.ai/api/v1"
});

export default async function handler(req, res) {
    if (req.method === 'POST') {
        let prompts = req.body.prompts;
        let schema = req.body.schema;
        try {
            let result = await suggest(prompts, schema);
            return res.status(200).json({ res: result });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Suggest keywords failed' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

async function suggest(prompts, graphSchema) {
    let maxTries = 5;
    for (let i = 0; i < maxTries; i++) {
        try {
            const input = `You are auditing a generative text-to-image model, and you have tried the following prompts and auditing criteria. Please suggest potential auditing directions in the form of keywords (5-7 keywords; Keep each keyword in one word if possible and no more than 2 words).\nPrompts (from oldest to latest): ${JSON5.stringify(prompts)}\nCriteria: ${JSON5.stringify(graphSchema)}\nThe keywords should include both those that encourage further insights into existing directions and those that inspire unexplored avenues. Output your suggested keywords in a comma-separated format and put them in '\\boxed{}'. Your suggestion:`;

            console.log("input: ", input)
            
            const completion = await openai.chat.completions.create({
                model: "google/gemini-2.5-flash-lite",  
                messages: [
                    { role: "system", content: "You are a helpful assistant." },
                    { role: "user", content: input }
                ],
                temperature: 1.1, // Higher temperature for more diverse keyword suggestions
            });
            
            let output = completion.choices[0].message.content;
            console.log("output: ", output);

            // check if \box{} is in the output
            let start = output.indexOf('\\boxed{');
            if (start == -1) {
                throw new Error("Output does not have the required fields: " + JSON.stringify(output));
            }
            let end = output.indexOf('}', start);
            if (end == -1) {
                throw new Error("Output does not have the required fields: " + JSON.stringify(output));
            }
            output = output.trim().substring(start + 7, end);
            
            // Check if the output is in the comma-separated string format
            if (!output || !output.includes(',')) {
                throw new Error("Output is not in the expected comma-separated format: " + JSON.stringify(output));
            }

            // Optionally, you can split and trim each keyword
            const keywords = output.split(',').map(keyword => keyword.trim());
            return keywords;
        } catch (error) {
            console.log(error);
            if (i == maxTries - 1) {
                throw error;
            }
        }
    }


}




//=> "The number of parameters in a neural network can impact ...