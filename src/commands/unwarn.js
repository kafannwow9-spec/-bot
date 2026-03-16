import { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, ComponentType, MessageFlags } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { hasModPermission } from '../config.js';
import { addLog } from '../logger.js';

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
    .setName('unwarn')
    .setDescription('إزالة تحذير عن عضو')
    .addUserOption(option => 
        option.setName('target')
            .setDescription('العضو')
            .setRequired(true));

export async function execute(interaction) {
    if (!hasModPermission(interaction.member, interaction.guildId)) {
        return interaction.reply({ content: 'ليس لديك صلاحية استخدام هذا الأمر.', flags: MessageFlags.Ephemeral });
    }
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const target = interaction.options.getUser('target');
    const warnings = getWarnings();

    if (!warnings[target.id] || warnings[target.id].length === 0) {
        return interaction.editReply({ content: 'هذا العضو ليس لديه أي تحذيرات.' });
    }

    const options = warnings[target.id].map((w, index) => ({
        label: `تحذير ${index + 1}`,
        description: w.reason.substring(0, 50),
        value: w.id
    }));

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('remove_warning')
        .setPlaceholder('اختر التحذير المراد إزالته')
        .addOptions(options);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const response = await interaction.editReply({
        content: `تحذيرات \`${target.username}\`:`,
        components: [row]
    });

    const collector = response.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 30000
    });

    collector.on('collect', async i => {
        if (i.customId === 'remove_warning') {
            try {
                const warningId = i.values[0];
                const currentWarnings = getWarnings();
                currentWarnings[target.id] = currentWarnings[target.id].filter((w) => w.id !== warningId);
                saveWarnings(currentWarnings);

                addLog(i.guild, 'unwarn', {
                    adminId: i.user.id,
                    targetId: target.id,
                    reason: 'إزالة تحذير'
                });

                await i.update({ content: `**تــم إزالـة الـتــحـذيـر عــن <@${target.id}> <:un:1482744683741319330>**`, components: [] });
            } catch (error) {
                console.error('Error updating unwarn interaction:', error);
            }
        }
    });
}
