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

    // Proxy API requests to server C
    // server.use('/a1pi', createProxyMiddleware({
    //     target: 'http://127.0.0.1:5001',
    //     changeOrigin: true,
    //     // secure: false,
    //     pathRewrite: {
    //         '^/api': '', // Remove /api prefix when forwarding to target
    //     },
    //     onProxyReq: (proxyReq, req, res) => {
    //         console.log('Proxying request:', req.path);
    //     },
    //     onProxyRes: (proxyRes, req, res) => {
    //         console.log('Received response from target:', proxyRes.statusCode);
    //     },
    //     onError: (err, req, res) => {
    //         console.error('Proxy error:', err);
    //         res.status(500).send('Proxy error');
    //     },
    // }));

    // server.use('/a2pi', createProxyMiddleware({
    //     target: 'http://10.8.11.5:5002',
    //     changeOrigin: true,
    //     // secure: false,
    //     pathRewrite: {
    //         '^/a2pi': '', // Remove /a2pi prefix when forwarding to target
    //     },
    //     onProxyReq: (proxyReq, req, res) => {
    //         console.log('Proxying request:', req.path);
    //     },
    //     onProxyRes: (proxyRes, req, res) => {
    //         console.log('Received response from target:', proxyRes.statusCode);
    //     },
    //     onError: (err, req, res) => {
    //         console.error('Proxy error:', err);
    //         res.status(500).send('Proxy error');
    //     },
    // }));

    server.all('*', (req, res) => {
        return handle(req, res);
    });

    const port = process.env.PORT || 8801;
    server.listen(port, (err) => {
        if (err) throw err;
        console.log(`> Ready on http://localhost:${port}`);
    });
});