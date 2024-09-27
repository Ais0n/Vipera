import { readFile } from "node:fs/promises";
import Replicate from "replicate";
import path from 'path';
import axios from 'axios';
import JSON5 from 'json5';

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

export default async function handler(req, res) {
    if (req.method === 'GET') {
        let _path = req.query.path;
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
    let maxTries = 5;

    for(let i = 0; i < maxTries; i++) {
        try {
            let output = await replicate.run(
                "yorickvp/llava-13b:80537f9eead1a5bfa72d5ac6ea6414379be41d4d4f6679fd776e9535d1eb58bb",
                {
                  input: {
                    image: imageData,
                    top_p: 1,
                    prompt: "Extract descriptive objects and attributes from the image, and organize them as a tree. Output the tree as a JSON string. Example: {\"Foreground\":{\"doctor\":{\"gender\":\"male\",\"smiling?\":true}},\"Background\":{\"cinematic?\":true}} (You need to replace the objects and values with actual ones from the image)",
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
            return output;
        } catch (error) {
            console.error(error);
            if(i == maxTries - 1) {
                throw error;
            }
        }
    }
}

