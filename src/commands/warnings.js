import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } from 'discord.js';
import { safeReadJSON } from '../utils.js';
import path from 'path';
import { hasModPermission } from '../config.js';

const warningsPath = path.resolve('warnings.json');

function getWarnings() {
    return safeReadJSON(warningsPath, {});
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
        return interaction.reply({ content: 'ليس لديك صلاحية استخدام هذا الأمر.', flags: MessageFlags.Ephemeral });
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
                value: `بواسطة: <@${w.moderatorId || w.moderator}>\nالتاريخ: ${w.timestamp}\nالسبب: ${w.reason}`
            });
        });
    }

    await interaction.reply({ embeds: [embed] });
}
