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
    await interaction.deferReply();
    const userId = interaction.options.getString('user_id');

    try {
        const ban = await interaction.guild?.bans.fetch(userId);
        if (!ban) {
            return interaction.editReply({ content: 'هذا المستخدم ليس محظوراً أو الأيدي غير صحيح.' });
        }

        await interaction.guild?.members.unban(userId);
        addLog(interaction.guild, 'unban', {
            adminId: interaction.user.id,
            targetId: userId,
            reason: 'فك الحظر'
        });
        await interaction.editReply(`**لــقــد تـم فــك الــحـظـر عـن <@${userId}> <:Allow:1482740836104929512>**`);
    } catch (error) {
        return interaction.editReply({ content: 'حدث خطأ أثناء محاولة فك الحظر. تأكد من الأيدي.' });
    }
}
