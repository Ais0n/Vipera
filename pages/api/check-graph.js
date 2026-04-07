import { readFile } from "node:fs/promises";
import path from 'path';
import JSON5 from 'json5';
import fs from 'fs';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        const _path = req.query.path;
        try {
            const file_path = path.join(process.cwd(), 'public', _path);
            // Prevent path traversal
            if (!file_path.startsWith(path.join(process.cwd(), 'public'))) {
                return res.status(400).json({ error: 'Invalid path' });
            }
            if (!fs.existsSync(file_path)) {
                return res.status(200).json({ res: null });
            }
            const data = await readFile(file_path, 'utf-8');
            return res.status(200).json({ res: JSON5.parse(data) });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Failed to check graph' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
