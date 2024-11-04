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
            let file_path = path.join(process.cwd(), 'public', _path);
            // check if the file exists
            if (!fs.existsSync(file_path)) {
                return res.status(200).json({ res: null });
            } else {
                let data = await readFile(file_path, 'utf-8');
                return res.status(200).json({ res: JSON5.parse(data.toLowerCase()) });
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

