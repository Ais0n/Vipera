

const isProd = process.env.NODE_ENV === 'production';
const basePath = isProd ? '/vipera' : '';

module.exports = {
    env: {
        NEXT_PUBLIC_SAVE_MODE: process.env.NEXT_PUBLIC_SAVE_MODE,
        NEXT_PUBLIC_LLM_ENABLED: process.env.NEXT_PUBLIC_LLM_ENABLED,
        NEXT_PUBLIC_FORUM_API_KEY: process.env.NEXT_PUBLIC_FORUM_API_KEY,
        NEXT_PUBLIC_FORUM_USERNAME: process.env.NEXT_PUBLIC_FORUM_USERNAME,
        NEXT_PUBLIC_FORUM_POST_URL: process.env.NEXT_PUBLIC_FORUM_POST_URL,
        PORT: process.env.PORT || 8803
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