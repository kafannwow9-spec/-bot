import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { safeReadJSON, safeWriteJSON } from '../utils.js';
import path from 'path';
import { hasModPermission } from '../config.js';
import { addPoints } from '../points.js';
import { addLog } from '../logger.js';

const warningsPath = path.resolve('warnings.json');

function getWarnings() {
    return safeReadJSON(warningsPath, {});
}

function saveWarnings(warnings) {
    return safeWriteJSON(warningsPath, warnings);
}

export const data = new SlashCommandBuilder()
    .setName('warn')
    .setDescription('تحذير عضو')
    .addUserOption(option => 
        option.setName('target')
            .setDescription('العضو')
            .setRequired(true))
    .addStringOption(option => 
        option.setName('reason')
            .setDescription('سبب التحذير')
            .setRequired(true));

export async function execute(interaction) {
    if (!hasModPermission(interaction.member, interaction.guildId)) {
        return interaction.reply({ content: 'ليس لديك صلاحية استخدام هذا الأمر.', flags: MessageFlags.Ephemeral });
    }
    await interaction.deferReply();
    const target = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason');

    const warnings = getWarnings();
    if (!warnings[target.id]) warnings[target.id] = [];

    const warning = {
        id: Date.now().toString(),
        reason,
        moderatorId: interaction.user.id,
        timestamp: new Date().toLocaleString('ar-EG')
    };

    warnings[target.id].push(warning);
    saveWarnings(warnings);
    addPoints(interaction.user.id, 1);
    addLog(interaction.guild, 'warn', {
        adminId: interaction.user.id,
        targetId: target.id,
        reason: reason
    });

    await interaction.editReply(`**لــقـد تــم تــحـذيـر <@${target.id}> <:warn:1482744209000894657>**`);
}
