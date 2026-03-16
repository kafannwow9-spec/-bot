import fs from 'fs';
import path from 'path';

const logsPath = path.resolve('logs.json');
const configPath = path.resolve('log-config.json');

export function getLogs() {
    if (!fs.existsSync(logsPath)) return {};
    try {
        return JSON.parse(fs.readFileSync(logsPath, 'utf-8'));
    } catch (e) {
        return {};
    }
}

export function getLogConfig() {
    if (!fs.existsSync(configPath)) return {};
    try {
        return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch (e) {
        return {};
    }
}

export function saveLogs(data) {
    fs.writeFileSync(logsPath, JSON.stringify(data, null, 2));
}

export function saveLogConfig(data) {
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
}

export async function addLog(guild, type, details) {
    const guildId = guild.id;
    const data = getLogs();
    if (!data[guildId]) data[guildId] = [];
    
    const timestamp = new Date().toISOString();
    const logEntry = {
        type,
        timestamp,
        ...details
    };

    data[guildId].push(logEntry);

    if (data[guildId].length > 100) {
        data[guildId].shift();
    }

    saveLogs(data);

    // Real-time logging to channel
    const config = getLogConfig();
    const guildConfig = config[guildId];
    if (guildConfig) {
        // Map types to config keys
        let configKey = type;
        if (type === 'untimeout') configKey = 'timeout';
        if (type === 'unwarn') configKey = 'warn';
        if (type === 'unban') configKey = 'ban';

        const channelId = guildConfig[configKey];
        if (channelId) {
            try {
                const channel = await guild.channels.fetch(channelId).catch(() => null);
                if (channel) {
                    const time = new Date(timestamp).toLocaleString('ar-EG', { timeZone: 'UTC' });
                    let logText = '';
                    let title = '';

                    if (type === 'timeout' || type === 'untimeout') {
                        title = 'مــعــلـومـــات الـتــايـم';
                        const action = type === 'timeout' ? 'إعـطــاء تــايـم' : 'إزالـة تــايـم';
                        logText = `- الإجــراء: ${action}\n` +
                                  `- الإداري: <@${details.adminId}>\n` +
                                  `- الـعـضـو: <@${details.targetId}>\n` +
                                  (details.duration ? `- الـمـدة: ${details.duration}\n` : '') +
                                  `- الـسـبـب: ${details.reason}\n` +
                                  `- الـوقــت: ${time}`;
                    } else if (type === 'warn' || type === 'unwarn') {
                        title = 'مــعــلـومـــات الـتـحـذيــر';
                        const action = type === 'warn' ? 'تـحـذيـر' : 'إزالـة تـحـذيـر';
                        logText = `- الإجــراء: ${action}\n` +
                                  `- الإداري: <@${details.adminId}>\n` +
                                  `- الـعـضـو: <@${details.targetId}>\n` +
                                  `- الـسـبـب: ${details.reason}\n` +
                                  `- الـوقــت: ${time}`;
                    } else if (type === 'ban' || type === 'unban') {
                        title = 'مــعــلـومـــات الـبــان';
                        const action = type === 'ban' ? 'بــان' : 'إزالـة بــان';
                        logText = `- الإجــراء: ${action}\n` +
                                  `- الإداري: <@${details.adminId}>\n` +
                                  `- الـعـضـو: <@${details.targetId}>\n` +
                                  `- الـسـبـب: ${details.reason}\n` +
                                  `- الـوقــت: ${time}`;
                    } else if (type === 'send') {
                        title = 'مــعــلـومـــات الإرســال';
                        logText = `- الإداري: <@${details.adminId}>\n` +
                                  `- الـنـوع: ${details.sendType === 'message' ? 'رسالة' : 'إيمبد'}\n` +
                                  `- الـمـحـتـوى: ${details.content}\n` +
                                  `- الـوقــت: ${time}`;
                    }

                    if (logText) {
                        const { EmbedBuilder } = await import('discord.js');
                        const embed = new EmbedBuilder()
                            .setTitle(`**__${title}__**`)
                            .setDescription(logText)
                            .setColor(0x2f3136);
                        await channel.send({ embeds: [embed] });
                    }
                }
            } catch (err) {
                console.error('Error sending real-time log:', err);
            }
        }
    }
}
