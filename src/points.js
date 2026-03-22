import { safeReadJSON, safeWriteJSON } from './utils.js';
import path from 'path';

const pointsLogPath = path.resolve('points_log.json');

/**
 * Retrieves the current points data.
 * @returns {Array} - The points log array.
 */
export function getPointsLog() {
    return safeReadJSON(pointsLogPath, []);
}

/**
 * Saves the points data.
 * @param {Array} log - The points log array to save.
 * @returns {boolean} - True if successful, false otherwise.
 */
export function savePointsLog(log) {
    return safeWriteJSON(pointsLogPath, log);
}

export function addPoints(userId, amount) {
    const log = getPointsLog();
    log.push({
        userId,
        amount,
        timestamp: Date.now()
    });
    savePointsLog(log);
}

export function clearUserPoints(userId) {
    let log = getPointsLog();
    log = log.filter(entry => entry.userId !== userId);
    savePointsLog(log);
}

export function getPoints(filter = 'total') {
    const log = getPointsLog();
    const now = Date.now();
    let startTime = 0;

    if (filter === 'daily') startTime = now - 24 * 60 * 60 * 1000;
    else if (filter === 'weekly') startTime = now - 7 * 24 * 60 * 60 * 1000;
    else if (filter === 'monthly') startTime = now - 30 * 24 * 60 * 60 * 1000;

    const pointsMap = {};
    log.forEach(entry => {
        if (filter === 'total' || entry.timestamp >= startTime) {
            pointsMap[entry.userId] = (pointsMap[entry.userId] || 0) + entry.amount;
        }
    });

    return pointsMap;
}
