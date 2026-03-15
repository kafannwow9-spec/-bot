// يمكنك وضع التوكن و ID البوت هنا إذا لم ترغب في استخدام ملف .env
// ولكن يفضل دائماً استخدام ملف .env للأمان

export const config = {
    token: process.env.DISCORD_TOKEN || "", // ضع التوكن هنا بين العلامتين ""
    clientId: process.env.CLIENT_ID || ""   // ضع ID البوت هنا بين العلامتين ""
};
