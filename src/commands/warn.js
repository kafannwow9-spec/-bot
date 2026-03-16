import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { hasModPermission } from '../config.js';
import { addPoints } from '../points.js';

const warningsPath = path.resolve('warnings.json');

function getWarnings() {
    if (!fs.existsSync(warningsPath)) return {};
    try {
        return JSON.parse(fs.readFileSync(warningsPath, 'utf-8'));
    } catch (e) {
        return {};
    }
}

function saveWarnings(warnings) {
    fs.writeFileSync(warningsPath, JSON.stringify(warnings, null, 2));
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
    const target = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason');

    const warnings = getWarnings();
    if (!warnings[target.id]) warnings[target.id] = [];

    const warning = {
        id: Date.now().toString(),
        reason,
        moderator: interaction.user.tag,
        timestamp: new Date().toLocaleString('ar-EG')
    };

    warnings[target.id].push(warning);
    saveWarnings(warnings);
    addPoints(interaction.user.id, 1);

    await interaction.reply(`**لــقـد تــم تــحـذيـر <@${target.id}> <:warn:1482744209000894657>**`);
}
