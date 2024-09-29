import axios from 'axios';
import JSON5 from 'json5';
import { createCanvas, loadImage } from 'canvas'; // Ensure you install 'canvas' package
import Replicate from "replicate";

const replicate = new Replicate({
    auth: process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN,
});

const getImageData = async (imagePath) => {
    if (imagePath.startsWith('http')) {
        const response = await axios.get(imagePath, { responseType: 'arraybuffer' });
        return Buffer.from(response.data);
    } else {
        return await fs.promises.readFile(imagePath);
    }
};

const mergeImages = async (imgData1, imgData2) => {
    const img1 = await loadImage(imgData1);
    const img2 = await loadImage(imgData2);

    const canvas = createCanvas(Math.max(img1.width, img2.width), img1.height + img2.height);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(img1, 0, 0);
    ctx.drawImage(img2, 0, img1.height);

    return canvas.toBuffer('image/png'); // Return buffer instead of saving to file
};

const convertImageToBase64 = (imageBuffer) => {
    return `data:image/png;base64,${imageBuffer.toString('base64')}`;
};

export default async function handler(req, res) {
    if (req.method === 'POST') {
        let { path1, path2, schema } = req.body;
        try {
            // Get image data as buffers
            const imageData1 = await getImageData(path1);
            const imageData2 = await getImageData(path2);

            // Combine the two images
            const mergedImageBuffer = await mergeImages(imageData1, imageData2);

            // Convert merged image to Base64
            const imageData = convertImageToBase64(mergedImageBuffer);

            let result = await suggestComparison(imageData, schema);
            return res.status(200).json({ res: result });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Image processing failed' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

async function suggestComparison(imageData, schema) {
    let maxTries = 5;

    for (let i = 0; i < maxTries; i++) {
        try {
            let output = await replicate.run(
                "yorickvp/llava-13b:80537f9eead1a5bfa72d5ac6ea6414379be41d4d4f6679fd776e9535d1eb58bb",
                {
                    input: {
                        image: imageData,
                        top_p: 1,
                        prompt: `You are a helpful assistant. Given a tree describing the objects and attributes in an image dataset and two randomly selected images from this dataset, find differences between these two images and suggest an additional node that can be added to the children of an existing node in the tree (the two images should be different in terms of the additional node).  Output in the JSON form: {'parentNodeName': '...', 'newNodeName': '...', 'candidateValues': ['...', ...]}. For example, if the people in the two images have different genders, you can suggest to add the node 'gender' to the children of 'person', and the candidateValues are ["male", "female"]. \nSchema: ${JSON5.stringify(schema)}\nYour suggestion (JSON):`,
                        max_tokens: 1024,
                        temperature: 0.6
                    }
                }
            );

            output = output.join("");
            console.log(output);
            // Find the JSON part from the output
            let start = output.indexOf('{');
            let end = output.lastIndexOf('}');
            if (start === -1 || end === -1) {
                output = '{' + output + '}';
            } else {
                output = output.substring(start, end + 1);
            }
            output = JSON5.parse(output);
            return output;
        } catch (error) {
            console.error(error);
            if (i === maxTries - 1) {
                throw error;
            }
        }
    }
}