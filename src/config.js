import { safeReadJSON, safeWriteJSON } from './utils.js';
import path from 'path';

const configPath = path.resolve('config.json');

/**
 * Retrieves the current configuration.
 * @returns {object} - The configuration object.
 */
export function getConfig() {
    return safeReadJSON(configPath, {});
}

/**
 * Saves the configuration.
 * @param {object} config - The configuration object to save.
 * @returns {boolean} - True if successful, false otherwise.
 */
export function saveConfig(config) {
    return safeWriteJSON(configPath, config);
}

/**
 * Checks if a member has moderation permissions.
 * @param {object} member - The guild member object.
 * @param {string} guildId - The ID of the guild.
 * @returns {boolean} - True if the member has permissions, false otherwise.
 */
export function hasModPermission(member, guildId) {
    if (!member) return false;
    
    // Check for Administrator permission first
    if (member.permissions.has('Administrator')) return true;

    const config = getConfig();
    const modRoleId = config[guildId]?.modRoleId;

    if (modRoleId && member.roles.cache.has(modRoleId)) {
        return true;
    }
    
    // Fallback to ModerateMembers permission
    return member.permissions.has('ModerateMembers');
}
