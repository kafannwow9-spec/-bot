import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { hasModPermission } from '../config.js';

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
    const target = interaction.options.getUser('target');
    const member = await interaction.guild?.members.fetch(target.id);

    if (!member) return interaction.reply({ content: 'العضو غير موجود.', flags: MessageFlags.Ephemeral });

    try {
        await member.timeout(null);
        await interaction.reply(`**تــم فــك الـتـايــم اوت عـن **__#${target.username}__ <:Talk:1482742623218307173>`);
    } catch (error) {
        return interaction.reply({ content: 'حدث خطأ أثناء فك التايم أوت.', flags: MessageFlags.Ephemeral });
    }
}
