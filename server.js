const { createProxyMiddleware } = require('http-proxy-middleware');
// import { createProxyMiddleware } from 'http-proxy-middleware';
const express = require('express');
// import express from 'express';
const next = require('next');
// import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = express();

    // Log all requests for debugging
    server.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
    });

    // Serve public assets first (SVGs, images, etc.)
    server.use(express.static('public'));

    // Let Next.js handle everything else (including _next/static)
    server.all('*', (req, res) => {
        return handle(req, res);
    });

    const port = process.env.PORT || 8801;
    server.listen(port, (err) => {
        if (err) throw err;
        console.log(`> Ready on http://localhost:${port}`);
    });
});