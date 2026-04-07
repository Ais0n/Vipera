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
            // Parse JSON first, then lowercase only string values (not keys/structure)
            const parsed = JSON5.parse(data);
            lowercaseValues(parsed);
            return res.status(200).json({ res: parsed });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Failed to check labels' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

/**
 * Recursively lowercase only the string leaf values in an object,
 * preserving keys and structure.
 */
function lowercaseValues(obj) {
    if (typeof obj !== 'object' || obj === null) return;
    for (const key of Object.keys(obj)) {
        if (typeof obj[key] === 'string') {
            obj[key] = obj[key].toLowerCase();
        } else if (typeof obj[key] === 'object') {
            lowercaseValues(obj[key]);
        }
    }
}
