// import { readFile } from "node:fs/promises";
// import path from 'path';
// import axios from 'axios';
// import { fal } from "@fal-ai/client";
const { readFile, writeFile } = require('fs').promises;
const path = require('path');
const axios = require('axios');
const { fal } = require("@fal-ai/client");

fal.config({
    credentials: '5904d646-1770-4e46-97e1-c0692db625b3:151049ffef1dc24a2fe6c1c26c982ef5'
});

async function test(_path) {
    let image, imageBase64;
    const schema = '{"foreground": {"doctor": {"EXIST": "yes", "gender": "..."}}}';
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
        image_url: imageData,
        top_p: 1,
        prompt: `Given the image, finish the label tree based on the provided schema. Specifically, for each leaf node, generate a label according to the scene in the image, and replace the placeholder value '...' with the generated label. All labels must be strings, and should NOT be numbers, booleans, or arrays. (${candidateValues ? 'You are required to choose from the following values: ' + candidateValues : ''}) If a specific node (no matter if it is a leaf or not) is not present in the image, replace the node value (subtree) with the object {'EXIST': 'no'}. Output the results in JSON. Your output should *NOT* include the placeholder '...'. Schema: ${schema}`,
        max_tokens: 1024,
        temperature: 0.8
    };

    // log current time
    console.log("before submit: ", new Date().toLocaleString());
    console.log(input.prompt)

    const { request_id } = await fal.queue.submit("fal-ai/llava-next", {
        input: input,
        webhookUrl: "https://optional.webhook.url/for/results",
    });

    console.log("after submit: ", new Date().toLocaleString());

    // Wait for the request to complete
    let status;
    do {
        status = await fal.queue.status("fal-ai/llava-next", { requestId: request_id, logs: true });
        // console.log(status);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds
    } while (status.status !== 'COMPLETED');

    // Fetch the result
    const { data: output } = await fal.queue.result("fal-ai/llava-next", { requestId: request_id });

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
for(let i = 0; i < 1; i++) {
    paths.push(`temp_images/a_cinematic_photo_of_a_doctor/A_cinematic_photo_of_a_doctor_${i}.png`);
}

processImages(paths).catch(console.error);