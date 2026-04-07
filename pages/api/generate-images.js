import fs from 'fs';
import path from 'path';
import Replicate from "replicate";
import axios from 'axios';

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

export default async function handler(req, res) {
    if (req.method === 'GET') {
        const { prompt, imageId } = req.query;
        const output_dir = path.join(process.cwd(), 'public', 'temp_images', prompt.toLowerCase().replace(/ /g, '_'));

        try {
            const imagePath = await generateImage(prompt);
            let newPath = "";
            const response = await axios.get(imagePath[0], { responseType: 'arraybuffer' });
            const imageBuffer = Buffer.from(response.data);

            if (process.env.NEXT_PUBLIC_SAVE_MODE === 'true') {
                if (!fs.existsSync(output_dir)) {
                    fs.mkdirSync(output_dir, { recursive: true });
                }
                const image_path = path.join(output_dir, `${imageId}.png`);
                fs.writeFileSync(image_path, imageBuffer);
                newPath = '/temp_images/' + prompt.toLowerCase().replace(/ /g, '_') + `/${imageId}.png`;
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
    const input = {
        width: 768,
        height: 768,
        prompt: prompt,
        refine: "expert_ensemble_refiner",
        apply_watermark: false,
        num_inference_steps: 25
    };
    const output = await replicate.run(
        "stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc",
        { input }
    );
    return output;
}
