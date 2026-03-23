import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { client, startBot } from './src/bot.js';
import { getAbbreviations, addAbbreviation, removeAbbreviation } from './src/abbreviations.js';
import { getStreakData, saveStreakData } from './src/streak.js';
import { getLogs } from './src/logger.js';
import { PermissionFlagsBits } from 'discord.js';

dotenv.config();

const app = express();
const PORT = 3000;
const GUILD_ID = '1477677044790722791';

// Passport setup
passport.serializeUser((user: any, done) => done(null, user));
passport.deserializeUser((user: any, done) => done(null, user));

const callbackUrl = process.env.DISCORD_CALLBACK_URL || `${process.env.APP_URL}/auth/callback`;

passport.use(new DiscordStrategy({
    clientID: process.env.CLIENT_ID!,
    clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    callbackURL: callbackUrl,
    scope: ['identify', 'guilds']
}, (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
}));

app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'bot-dashboard-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,
        sameSite: 'none',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// Auth Middleware
const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ error: 'Unauthorized' });
};

// Check Admin Permission Middleware
const isAdmin = async (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Unauthorized' });
    
    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        const member = await guild.members.fetch(req.user.id).catch(() => null);
        
        if (member && member.permissions.has(PermissionFlagsBits.Administrator)) {
            return next();
        }
        res.status(403).json({ error: 'Forbidden: You must be an administrator in the target guild.' });
    } catch (error) {
        console.error('Error checking admin permissions:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Auth Routes
app.get('/auth/discord', passport.authenticate('discord'));
app.get('/auth/callback', passport.authenticate('discord', {
    failureRedirect: '/'
}), (req, res) => {
    res.redirect('/');
});

app.get('/api/user', (req: any, res) => {
    if (req.isAuthenticated()) {
        res.json(req.user);
    } else {
        res.status(401).json({ error: 'Not logged in' });
    }
});

app.get('/api/logout', (req: any, res) => {
    req.logout(() => {
        res.redirect('/');
    });
});

// Bot API Routes
app.get('/api/bot/status', isAuthenticated, isAdmin, (req, res) => {
    res.json({
        ready: client.isReady(),
        guilds: client.guilds.cache.size,
        users: client.users.cache.size,
        uptime: client.uptime
    });
});

app.get('/api/abbreviations', isAuthenticated, isAdmin, (req, res) => {
    res.json(getAbbreviations());
});

app.post('/api/abbreviations', isAuthenticated, isAdmin, (req, res) => {
    const { alias, commandName } = req.body;
    if (!alias || !commandName) return res.status(400).json({ error: 'Missing alias or commandName' });
    addAbbreviation(alias, commandName);
    res.json({ success: true });
});

app.delete('/api/abbreviations/:alias', isAuthenticated, isAdmin, (req, res) => {
    removeAbbreviation(req.params.alias);
    res.json({ success: true });
});

app.get('/api/streak', isAuthenticated, isAdmin, (req, res) => {
    const data = getStreakData();
    res.json(data[GUILD_ID] || { channelId: null, users: {} });
});

app.post('/api/streak/config', isAuthenticated, isAdmin, (req, res) => {
    const { channelId } = req.body;
    const data = getStreakData();
    if (!data[GUILD_ID]) data[GUILD_ID] = { channelId: null, users: {} };
    data[GUILD_ID].channelId = channelId;
    saveStreakData(data);
    res.json({ success: true });
});

app.get('/api/logs', isAuthenticated, isAdmin, (req, res) => {
    const logs = getLogs();
    res.json(logs[GUILD_ID] || []);
});

// Vite middleware setup
async function startServer() {
    if (process.env.NODE_ENV !== 'production') {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: 'spa',
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://localhost:${PORT}`);
        
        const token = process.env.DISCORD_TOKEN;
        const clientId = process.env.CLIENT_ID;

        if (token && clientId) {
            startBot(token, clientId).catch(console.error);
        } else {
            console.warn('DISCORD_TOKEN or CLIENT_ID is missing in environment variables.');
        }
    });
}

startServer();
