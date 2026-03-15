import fs from 'fs';
import path from 'path';

const pointsLogPath = path.resolve('points_log.json');

export function getPointsLog() {
    if (!fs.existsSync(pointsLogPath)) return [];
    try {
        return JSON.parse(fs.readFileSync(pointsLogPath, 'utf-8'));
    } catch (e) {
        return [];
    }
}

export function savePointsLog(log) {
    fs.writeFileSync(pointsLogPath, JSON.stringify(log, null, 2));
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
