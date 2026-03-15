import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import fs from 'fs';
import path from 'path';

const warningsPath = path.resolve('warnings.json');

function getWarnings() {
    if (!fs.existsSync(warningsPath)) return {};
    return JSON.parse(fs.readFileSync(warningsPath, 'utf-8'));
}

function saveWarnings(warnings: any) {
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
            .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason');

    const warnings = getWarnings();
    if (!warnings[target!.id]) warnings[target!.id] = [];

    const warning = {
        id: Date.now().toString(),
        reason,
        moderator: interaction.user.tag,
        timestamp: new Date().toLocaleString('ar-EG')
    };

    warnings[target!.id].push(warning);
    saveWarnings(warnings);

    await interaction.reply(`**لــقـد تــم تــحـذيـر <@${target?.id}> <:warn:1482744209000894657>**`);
}
