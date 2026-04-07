

const isProd = process.env.NODE_ENV === 'production';
// Remove basePath since Apache proxy strips the /demo1 prefix
const basePath = '';

module.exports = {
    env: {
        NEXT_PUBLIC_SAVE_MODE: process.env.NEXT_PUBLIC_SAVE_MODE,
        NEXT_PUBLIC_LLM_ENABLED: process.env.NEXT_PUBLIC_LLM_ENABLED,
        NEXT_PUBLIC_FORUM_API_KEY: process.env.NEXT_PUBLIC_FORUM_API_KEY,
        NEXT_PUBLIC_FORUM_USERNAME: process.env.NEXT_PUBLIC_FORUM_USERNAME,
        NEXT_PUBLIC_FORUM_POST_URL: process.env.NEXT_PUBLIC_FORUM_POST_URL,
        PORT: process.env.PORT || 8801
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