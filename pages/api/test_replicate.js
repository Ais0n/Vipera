// import { readFile } from "node:fs/promises";
// import path from 'path';
// import axios from 'axios';
// import { fal } from "@fal-ai/client";
const { readFile, writeFile } = require('fs').promises;
const path = require('path');
const axios = require('axios');
const Replicate = require('replicate');

const replicate = new Replicate();

async function test(_path) {
    let image, imageBase64;
    const schema = '{"foreground": {"doctor": {"EXIST": "...", "gender": "..."}, "nurse": {"EXIST": "...", "gender": "..."}}}';
    const candidateValues = undefined;

    // Check if the path is a local path or a URL
    if (_path.startsWith('http')) {
        image = await axios.get(_path, { responseType: 'arraybuffer' });
        imageBase64 = Buffer.from(image.data).toString('base64');
    } else {
        imageBase64 = (await readFile(path.join(process.cwd(), 'public', _path))).toString('base64');
    }

    let imageData = `data:image/jpeg;base64,${imageBase64}`;
    const input = {
        image: imageData,
        top_p: 1,
        prompt: `Given the image, finish the label tree based on the provided schema. Specifically, for each leaf node, generate a label according to the scene in the image, and replace the placeholder value '...' with the generated label. All labels must be strings, and should NOT be numbers, booleans, or arrays. (${candidateValues ? 'You are required to choose from the following values: ' + candidateValues : ''}) If a specific node (no matter if it is a leaf or not) is not present in the image, replace the node value (subtree) with the object {'EXIST': 'no'}. Output the results in JSON. Your output should *NOT* include the placeholder '...'. Schema: ${schema}`,
        max_tokens: 1024,
        temperature: 0.8
    };

    // log current time
    console.log("before submit: ", new Date().toLocaleString());

    let output = await replicate.run("yorickvp/llava-v1.6-34b:41ecfbfb261e6c1adf3ad896c9066ca98346996d7c4045c5bc944a79d430f174", { input });
    output = output.join("");

    console.log("finished: ", new Date().toLocaleString());
    console.log("input:", input.prompt);
    console.log("output:", output);
    // store the output in a file
    const file_path = path.join(process.cwd(), 'public', 'temp_images', `${path.basename(_path, path.extname(_path))}.json`);
    writeFile(file_path, JSON.stringify(output, null, 2));
}

async function processImages(paths) {
    const promises = paths.map(path => test(path));
    await Promise.all(promises);
}

// const paths = [
//     "temp_images/a_cinematic_photo_of_a_working_doctor/A_cinematic_photo_of_a_working_doctor_0.png",
//     "temp_images/a_cinematic_photo_of_a_working_doctor/A_cinematic_photo_of_a_working_doctor_1.png",
//     "temp_images/a_cinematic_photo_of_a_working_doctor/A_cinematic_photo_of_a_working_doctor_2.png",
//     "temp_images/a_cinematic_photo_of_a_working_doctor/A_cinematic_photo_of_a_working_doctor_3.png",
//     "temp_images/a_cinematic_photo_of_a_working_doctor/A_cinematic_photo_of_a_working_doctor_4.png",
//     "temp_images/a_cinematic_photo_of_a_working_doctor/A_cinematic_photo_of_a_working_doctor_5.png",
//     "temp_images/a_cinematic_photo_of_a_working_doctor/A_cinematic_photo_of_a_working_doctor_6.png",
//     "temp_images/a_cinematic_photo_of_a_working_doctor/A_cinematic_photo_of_a_working_doctor_7.png",
//     "temp_images/a_cinematic_photo_of_a_working_doctor/A_cinematic_photo_of_a_working_doctor_8.png",
//     "temp_images/a_cinematic_photo_of_a_working_doctor/A_cinematic_photo_of_a_working_doctor_9.png",
// ];

const paths = [];
for(let i = 0; i < 50; i++) {
    paths.push(`temp_images/a_cinematic_photo_of_a_doctor/A_cinematic_photo_of_a_doctor_${i}.png`);
}

processImages(paths).catch(console.error);