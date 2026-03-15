import fs from 'fs';
import path from 'path';

const configPath = path.resolve('config.json');

export function getConfig() {
    if (!fs.existsSync(configPath)) return {};
    try {
        return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch (e) {
        return {};
    }
}

export function saveConfig(config) {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

export function hasModPermission(member, guildId) {
    const config = getConfig();
    const modRoleId = config[guildId]?.modRoleId;
    
    // Check if member has the specific role
    if (modRoleId && member.roles.cache.has(modRoleId)) {
        return true;
    }
    
    // Fallback to Administrator or ModerateMembers permission
    return member.permissions.has('Administrator') || member.permissions.has('ModerateMembers');
}
