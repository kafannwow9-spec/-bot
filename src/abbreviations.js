import { safeReadJSON, safeWriteJSON } from './utils.js';
import path from 'path';

const abbrevPath = path.resolve('abbreviations.json');

/**
 * Retrieves the current abbreviations data.
 * @returns {object} - The abbreviations data object.
 */
export function getAbbreviations() {
    return safeReadJSON(abbrevPath, {});
}

/**
 * Saves the abbreviations data.
 * @param {object} data - The abbreviations data object to save.
 * @returns {boolean} - True if successful, false otherwise.
 */
export function saveAbbreviations(data) {
    return safeWriteJSON(abbrevPath, data);
}

export function addAbbreviation(alias, commandName) {
    const data = getAbbreviations();
    data[alias.toLowerCase()] = commandName;
    saveAbbreviations(data);
}

export function removeAbbreviation(alias) {
    const data = getAbbreviations();
    delete data[alias.toLowerCase()];
    saveAbbreviations(data);
}
