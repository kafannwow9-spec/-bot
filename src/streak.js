import { safeReadJSON, safeWriteJSON } from './utils.js';
import path from 'path';

const streakPath = path.resolve('streak.json');

/**
 * Retrieves the current streak data.
 * @returns {object} - The streak data object.
 */
export function getStreakData() {
    return safeReadJSON(streakPath, {});
}

/**
 * Saves the streak data.
 * @param {object} data - The streak data object to save.
 * @returns {boolean} - True if successful, false otherwise.
 */
export function saveStreakData(data) {
    return safeWriteJSON(streakPath, data);
}

export function updateStreak(guildId, userId, messageChannelId) {
    const data = getStreakData();
    if (!data[guildId]) data[guildId] = { channelId: null, users: {} };
    
    const guildData = data[guildId];
    if (!guildData.channelId) return null; // No streak channel set
    
    // Check if the message was sent in the designated streak channel
    if (messageChannelId !== guildData.channelId) return null;

    const today = new Date().toISOString().split('T')[0];
    const userStreak = guildData.users[userId] || { 
        count: 0, 
        shields: 3, 
        lastDate: null,
        lastShieldReset: today 
    };

    // Check for shield regeneration (every 14 days)
    if (userStreak.lastShieldReset) {
        const lastReset = new Date(userStreak.lastShieldReset);
        const todayObj = new Date(today);
        const diffTime = Math.abs(todayObj - lastReset);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 14) {
            if (userStreak.shields < 3) {
                userStreak.shields = 3;
                userStreak.lastShieldReset = today;
            } else {
                // If shields are already full, just push the reset date forward
                // so the 14-day cycle continues from today
                userStreak.lastShieldReset = today;
            }
        }
    } else {
        userStreak.lastShieldReset = today;
    }

    if (userStreak.lastDate === today) return null; // Already counted today

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let status = 'updated';

    if (!userStreak.lastDate) {
        // First time
        userStreak.count = 1;
        userStreak.shields = 3;
        userStreak.lastDate = today;
        status = 'started';
    } else if (userStreak.lastDate === yesterdayStr) {
        // Consecutive day
        userStreak.count++;
        userStreak.lastDate = today;
        status = 'updated';
    } else {
        // Missed days
        const lastDateObj = new Date(userStreak.lastDate);
        const todayObj = new Date(today);
        const diffTime = Math.abs(todayObj - lastDateObj);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) - 1;

        userStreak.shields -= diffDays;
        
        if (userStreak.shields < 0) {
            userStreak.count = 1;
            userStreak.shields = 3;
            userStreak.lastShieldReset = today;
            status = 'reset';
        } else {
            status = 'shield_used';
        }
        userStreak.lastDate = today;
    }

    guildData.users[userId] = userStreak;
    const saved = saveStreakData(data);

    if (!saved) {
        console.warn(`[Streak] Failed to save streak for user ${userId} in guild ${guildId}. Skipping message to prevent spam.`);
        return null;
    }

    // Return streak info to send message
    return {
        count: userStreak.count,
        shields: userStreak.shields,
        status,
        channelId: guildData.channelId
    };
}
