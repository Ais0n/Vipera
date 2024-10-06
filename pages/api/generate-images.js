import fs from 'fs';
import path from 'path';
// import { generateImage } from '../../API/genImage'; // Make sure this function is defined
import Replicate from "replicate";
import axios from 'axios';

const replicate = new Replicate({
    auth: process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN,
});

export default async function handler(req, res) {
    if (req.method === 'GET') {
        let { prompt, num_outputs, image_ids } = req.query;
        console.log(num_outputs)
        // num_outputs = 4
        num_outputs = parseInt(num_outputs);
        image_ids = image_ids.split('|');
        let output_dir = path.join(process.cwd(), 'public', 'temp_images', prompt.replace(/ /g, '_'));

        try {
            const imagePath = await generateImage(prompt, num_outputs);
            // read the images from the paths and save them to output_dir
            let promises = image_ids.map(async (image_id, index) => {
                let response = await axios.get(imagePath[index], { responseType: 'arraybuffer' });
                let imageBuffer = Buffer.from(response.data);
                let image_path = path.join(output_dir, `${image_id}.png`);
                fs.writeFileSync(image_path, imageBuffer);
            });
            Promise.all(promises);
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
    return output
}