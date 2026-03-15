import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { hasModPermission } from '../config.js';

const warningsPath = path.resolve('warnings.json');

function getWarnings() {
    if (!fs.existsSync(warningsPath)) return {};
    try {
        return JSON.parse(fs.readFileSync(warningsPath, 'utf-8'));
    } catch (e) {
        return {};
    }
}

export const data = new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('عرض تحذيرات عضو')
    .addUserOption(option => 
        option.setName('target')
            .setDescription('العضو')
            .setRequired(true));

export async function execute(interaction) {
    if (!hasModPermission(interaction.member, interaction.guildId)) {
        return interaction.reply({ content: 'ليس لديك صلاحية استخدام هذا الأمر.', ephemeral: true });
    }
    const target = interaction.options.getUser('target');
    const warnings = getWarnings();

    const userWarnings = warnings[target.id] || [];

    const embed = new EmbedBuilder()
        .setAuthor({ name: target.username, iconURL: target.displayAvatarURL() })
        .setTitle(`تحذيرات ${target.username}`)
        .setColor(0xff0000);

    if (userWarnings.length === 0) {
        embed.setDescription('لا يوجد تحذيرات لهذا العضو.');
    } else {
        userWarnings.forEach((w, index) => {
            embed.addFields({
                name: `تحذير #${index + 1}`,
                value: `بواسطة: ${w.moderator}\nالتاريخ: ${w.timestamp}\nالسبب: ${w.reason}`
            });
        });
    }

    await interaction.reply({ embeds: [embed] });
}
