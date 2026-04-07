const express = require('express');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = express();

    // Serve public assets under basePath in production, root in dev
    if (!dev) {
        server.use('/vipera', express.static('public'));
    } else {
        server.use(express.static('public'));
    }

    // Let Next.js handle everything else (including _next/static)
    server.all('*', (req, res) => {
        return handle(req, res);
    });

    const port = process.env.PORT || 8803;
    server.listen(port, (err) => {
        if (err) throw err;
        console.log(`> Ready on http://localhost:${port}`);
    });
});
