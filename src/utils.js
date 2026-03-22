import fs from 'fs';
import path from 'path';

/**
 * Safely writes a JSON object to a file using a temporary file and atomic rename.
 * This prevents data corruption during system crashes or disk full errors.
 * @param {string} filePath - The path to the file.
 * @param {object} data - The data to write.
 * @returns {boolean} - True if successful, false otherwise.
 */
export function safeWriteJSON(filePath, data) {
    const tempPath = `${filePath}.tmp`;
    try {
        const jsonString = JSON.stringify(data, null, 2);
        fs.writeFileSync(tempPath, jsonString, 'utf8');
        fs.renameSync(tempPath, filePath);
        return true;
    } catch (error) {
        console.error(`[SafeWrite] Error writing to ${filePath}:`, error);
        // Clean up temp file if it exists
        if (fs.existsSync(tempPath)) {
            try { fs.unlinkSync(tempPath); } catch (e) {}
        }
        return false;
    }
}

/**
 * Safely reads a JSON file.
 * @param {string} filePath - The path to the file.
 * @param {object} defaultValue - The default value to return if the file doesn't exist or is corrupted.
 * @returns {object} - The parsed JSON data or the default value.
 */
export function safeReadJSON(filePath, defaultValue = {}) {
    try {
        if (!fs.existsSync(filePath)) return defaultValue;
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`[SafeRead] Error reading ${filePath}:`, error);
        return defaultValue;
    }
}
