import { safeReadJSON, safeWriteJSON } from './utils.js';
import path from 'path';

const logsPath = path.resolve('logs.json');
const configPath = path.resolve('log-config.json');

/**
 * Retrieves the current logs.
 * @returns {object} - The logs object.
 */
export function getLogs() {
    return safeReadJSON(logsPath, {});
}

/**
 * Retrieves the log configuration.
 * @returns {object} - The log configuration object.
 */
export function getLogConfig() {
    return safeReadJSON(configPath, {});
}

/**
 * Saves the logs.
 * @param {object} data - The logs object to save.
 * @returns {boolean} - True if successful, false otherwise.
 */
export function saveLogs(data) {
    return safeWriteJSON(logsPath, data);
}

/**
 * Saves the log configuration.
 * @param {object} data - The log configuration object to save.
 * @returns {boolean} - True if successful, false otherwise.
 */
export function saveLogConfig(data) {
    return safeWriteJSON(configPath, data);
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
