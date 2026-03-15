import fs from 'fs';
import path from 'path';

const pointsPath = path.resolve('points.json');

export function getPoints() {
    if (!fs.existsSync(pointsPath)) return {};
    try {
        return JSON.parse(fs.readFileSync(pointsPath, 'utf-8'));
    } catch (e) {
        return {};
    }
}

export function savePoints(points) {
    fs.writeFileSync(pointsPath, JSON.stringify(points, null, 2));
}

export function addPoints(userId, amount) {
    const points = getPoints();
    if (!points[userId]) points[userId] = 0;
    points[userId] += amount;
    savePoints(points);
}
