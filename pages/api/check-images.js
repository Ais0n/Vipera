import path from 'path';
import fs from 'fs';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        const _path = req.query.path;
        try {
            const dir = path.join(process.cwd(), 'public', _path);
            // Prevent path traversal
            if (!dir.startsWith(path.join(process.cwd(), 'public'))) {
                return res.status(400).json({ error: 'Invalid path' });
            }
            if (!fs.existsSync(dir)) {
                if (process.env.NEXT_PUBLIC_SAVE_MODE === 'true') {
                    fs.mkdirSync(dir, { recursive: true });
                }
                return res.status(200).json({ res: null });
            }
            let files = fs.readdirSync(dir).sort();
            files = files.filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));
            return res.status(200).json({ res: files });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Failed to check images' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
