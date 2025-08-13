

module.exports = {
    env: {
        MODEL_API_KEY: process.env.MODEL_API_KEY,
    },
    reactStrictMode: false,
    basePath: process.env.NODE_ENV === 'production' ? '/demo1' : '',
    assetPrefix: process.env.NODE_ENV === 'production' ? '/demo1' : '',
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