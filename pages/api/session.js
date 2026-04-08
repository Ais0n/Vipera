import crypto from 'crypto';

export default function handler(req, res) {
    if (req.method === 'GET') {
        const forwarded = req.headers['x-forwarded-for'];
        const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress || 'unknown';
        const userId = crypto.createHash('sha256').update(ip).digest('hex').substring(0, 12);
        return res.status(200).json({ userId });
    }
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
}
