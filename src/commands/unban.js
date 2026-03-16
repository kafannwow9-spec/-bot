import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { addLog } from '../logger.js';

export const data = new SlashCommandBuilder()
    .setName('unban')
    .setDescription('فك الحظر عن عضو')
    .addStringOption(option => 
        option.setName('user_id')
            .setDescription('أيدي المستخدم أو يوزره')
            .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export async function execute(interaction) {
    const userId = interaction.options.getString('user_id');

    try {
        const ban = await interaction.guild?.bans.fetch(userId);
        if (!ban) {
            return interaction.reply({ content: 'هذا المستخدم ليس محظوراً أو الأيدي غير صحيح.', flags: MessageFlags.Ephemeral });
        }

        await interaction.guild?.members.unban(userId);
        addLog(interaction.guildId, 'unban', {
            adminId: interaction.user.id,
            targetId: userId,
            reason: 'فك الحظر'
        });
        await interaction.reply(`**لــقــد تـم فــك الــحـظـر عـن #${ban.user.username} <:Allow:1482740836104929512>**`);
    } catch (error) {
        return interaction.reply({ content: 'حدث خطأ أثناء محاولة فك الحظر. تأكد من الأيدي.', flags: MessageFlags.Ephemeral });
    }
}
