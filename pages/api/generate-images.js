import fs from 'fs';
import path from 'path';
// import { generateImage } from '../../API/genImage'; // Make sure this function is defined
import Replicate from "replicate";
import axios from 'axios';

const replicate = new Replicate({
    auth: process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN,
});

export default async function handler(req, res) {
    // throw new Error("");
    if (req.method === 'GET') {
        let { prompt, imageId } = req.query;
        let output_dir = path.join(process.cwd(), 'public', 'temp_images', prompt.replace(/ /g, '_'));

        try {
            const imagePath = await generateImage(prompt);
            let newPath = "";
            // read the images from the paths and save them to output_dir
            let response = await axios.get(imagePath[0], { responseType: 'arraybuffer' });
            let imageBuffer = Buffer.from(response.data);
            if(process.env.SAVE_MODE == 'true') {
                let image_path = path.join(output_dir, `${imageId}.png`);
                fs.writeFileSync(image_path, imageBuffer);
                newPath = '/temp_images/' + prompt.replace(/ /g, '_') + `/${imageId}.png`;
            } else {
                newPath = imagePath[0];
            }
            return res.status(200).json({ image_path: newPath });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Image generation failed' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

async function generateImage(prompt) {
    // const output = await replicate.run(
    //     "stability-ai/stable-diffusion:ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4",
    //     {
    //         input: {
    //             width: 768,
    //             height: 768,
    //             prompt: prompt,
    //             scheduler: "K_EULER",
    //             num_outputs: num_outputs,
    //             guidance_scale: 7.5,
    //             num_inference_steps: 50
    //         }
    //     }
    // );
    const input = {
        width: 768,
        height: 768,
        prompt: prompt,
        refine: "expert_ensemble_refiner",
        apply_watermark: false,
        num_inference_steps: 25
    };
    const output = await replicate.run("stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc", { input });
    console.log(output);
    return output;
}