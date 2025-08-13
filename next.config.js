

const isProd = process.env.NODE_ENV === 'production';
// Remove basePath since Apache proxy strips the /demo1 prefix
const basePath = '';

module.exports = {
    env: {
        NEXT_PUBLIC_REPLICATE_API_TOKEN: process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN,
        NEXT_PUBLIC_OPENROUTER_KEY: process.env.NEXT_PUBLIC_OPENROUTER_KEY,
        NEXT_FAL_AI_KEY: process.env.NEXT_FAL_AI_KEY,
        NEXT_ALI_KEY: process.env.NEXT_ALI_KEY,
        NEXT_PUBLIC_SAVE_MODE: process.env.NEXT_PUBLIC_SAVE_MODE,
        NEXT_PUBLIC_LLM_ENABLED: process.env.NEXT_PUBLIC_LLM_ENABLED,
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