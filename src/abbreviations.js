import fs from 'fs';
import path from 'path';

const abbrevPath = path.resolve('abbreviations.json');

export function getAbbreviations() {
    if (!fs.existsSync(abbrevPath)) return {};
    try {
        return JSON.parse(fs.readFileSync(abbrevPath, 'utf-8'));
    } catch (e) {
        return {};
    }
}

export function saveAbbreviations(data) {
    fs.writeFileSync(abbrevPath, JSON.stringify(data, null, 2));
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
