import http from 'http';
import dotenv from 'dotenv';
import { startBot } from './src/bot.js';

dotenv.config();

const PORT = 3000;

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
        <html>
            <head>
                <title>Discord Bot Status</title>
                <style>
                    body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #2c2f33; color: white; }
                    .container { text-align: center; padding: 2rem; background: #23272a; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    h1 { color: #7289da; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Discord Moderator Bot</h1>
                    <p>البوت يعمل الآن بنجاح!</p>
                    <p>تأكد من وضع التوكن و ID البوت في الإعدادات.</p>
                </div>
            </body>
        </html>
    `);
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Web server running on port ${PORT}`);
    
    const token = process.env.DISCORD_TOKEN;
    const clientId = process.env.CLIENT_ID;

    if (token && clientId) {
        startBot(token, clientId).catch(console.error);
    } else {
        console.warn('DISCORD_TOKEN or CLIENT_ID is missing in environment variables.');
    }
});
