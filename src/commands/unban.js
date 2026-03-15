import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

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
            return interaction.reply({ content: 'هذا المستخدم ليس محظوراً أو الأيدي غير صحيح.', ephemeral: true });
        }

        await interaction.guild?.members.unban(userId);
        await interaction.reply(`**لــقــد تـم فــك الــحـظـر عـن #${ban.user.username} <:Allow:1482740836104929512>**`);
    } catch (error) {
        return interaction.reply({ content: 'حدث خطأ أثناء محاولة فك الحظر. تأكد من الأيدي.', ephemeral: true });
    }
}
