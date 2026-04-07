// Constants.js
// Discussion forum credentials - set via environment variables, not hardcoded.

export const Constants = {
    apiKey: process.env.NEXT_PUBLIC_FORUM_API_KEY || "",
    apiUsername: process.env.NEXT_PUBLIC_FORUM_USERNAME || "",
    forumPostUrl: process.env.NEXT_PUBLIC_FORUM_POST_URL || "",
};
