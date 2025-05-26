import { readFile } from "node:fs/promises";
import Replicate from "replicate";
import path from 'path';
import axios from 'axios';
import JSON5 from 'json5';
import fs from 'fs';

const replicate = new Replicate({
    auth: process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN,
});

export default async function handler(req, res) {
    if (req.method === 'GET') {
        let _path = req.query.path;
        try {
            // check if there are images in the path
            let dir = path.join(process.cwd(), 'public', _path);
            if (!fs.existsSync(dir)) {
                // create a new folder
                if(process.env.SAVE_MODE == 'true') fs.mkdirSync(dir, { recursive: true });
                return res.status(200).json({ res: null });
            } else {
                let files = fs.readdirSync(dir);
                // sort the file names
                files = files.sort();
                // filter out non-image files
                files = files.filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));
                return res.status(200).json({ res: files });
            }
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Graph generation failed' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

