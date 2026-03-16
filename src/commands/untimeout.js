import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { hasModPermission } from '../config.js';
import { addLog } from '../logger.js';

export const data = new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('فك الوقت المستقطع عن عضو')
    .addUserOption(option => 
        option.setName('target')
            .setDescription('العضو')
            .setRequired(true));

export async function execute(interaction) {
    if (!hasModPermission(interaction.member, interaction.guildId)) {
        return interaction.reply({ content: 'ليس لديك صلاحية استخدام هذا الأمر.', flags: MessageFlags.Ephemeral });
    }
    await interaction.deferReply();
    const target = interaction.options.getUser('target');
    const member = await interaction.guild?.members.fetch(target.id);

    if (!member) return interaction.editReply({ content: 'العضو غير موجود.' });

    try {
        await member.timeout(null);
        addLog(interaction.guild, 'untimeout', {
            adminId: interaction.user.id,
            targetId: target.id,
            reason: 'فك التايم أوت'
        });
        await interaction.editReply(`**تــم فــك الـتـايــم اوت عـن <@${target.id}>** <:Talk:1482742623218307173>`);
    } catch (error) {
        return interaction.editReply({ content: 'حدث خطأ أثناء فك التايم أوت.' });
    }
}
