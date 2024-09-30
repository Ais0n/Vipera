import fs from 'fs';
import path from 'path';
// import { generateImage } from '../../API/genImage'; // Make sure this function is defined
import Replicate from "replicate";

const replicate = new Replicate({
    auth: process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN,
});

export default async function handler(req, res) {
    console.log(process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN, replicate)
    if (req.method === 'GET') {
        let { prompt, num_outputs } = req.query;
        console.log(num_outputs)
        // num_outputs = 4
        num_outputs = parseInt(num_outputs);

        try {
            const imagePath = await generateImage(prompt, num_outputs);
            return res.status(200).json({ image_path: imagePath});
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Image generation failed' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

async function generateImage(prompt, num_outputs) {
    const output = await replicate.run(
        "stability-ai/stable-diffusion:ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4",
        {
            input: {
                width: 768,
                height: 768,
                prompt: prompt,
                scheduler: "K_EULER",
                num_outputs: num_outputs,
                guidance_scale: 7.5,
                num_inference_steps: 50
            }
        }
    );
    console.log(output);
    return output
}