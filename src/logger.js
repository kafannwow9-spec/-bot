import fs from 'fs';
import path from 'path';

const logsPath = path.resolve('logs.json');

export function getLogs() {
    if (!fs.existsSync(logsPath)) return {};
    try {
        return JSON.parse(fs.readFileSync(logsPath, 'utf-8'));
    } catch (e) {
        return {};
    }
}

export function saveLogs(data) {
    fs.writeFileSync(logsPath, JSON.stringify(data, null, 2));
}

export function addLog(guildId, type, details) {
    const data = getLogs();
    if (!data[guildId]) data[guildId] = [];
    
    data[guildId].push({
        type,
        timestamp: new Date().toISOString(),
        ...details
    });

    // Keep only last 100 logs per guild to save space
    if (data[guildId].length > 100) {
        data[guildId].shift();
    }

    saveLogs(data);
}
