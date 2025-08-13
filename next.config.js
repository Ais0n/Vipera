

const isProd = process.env.NODE_ENV === 'production';
const basePath = isProd ? '/demo1' : '';

module.exports = {
    env: {
        MODEL_API_KEY: process.env.MODEL_API_KEY,
    },
    reactStrictMode: false,
    basePath: basePath,
    assetPrefix: basePath,
    trailingSlash: false,
    transpilePackages: [
        "antd",
        "rc-util",
        "@babel/runtime",
        "@ant-design/icons",
        "@ant-design/icons-svg",
        "rc-pagination",
        "rc-picker",
        "rc-tree",
        "rc-table",
    ]
};