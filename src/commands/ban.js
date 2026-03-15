import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('ban')
    .setDescription('حظر عضو من السيرفر')
    .addUserOption(option => 
        option.setName('target')
            .setDescription('العضو المراد حظره')
            .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export async function execute(interaction) {
    const target = interaction.options.getUser('target');
    const member = await interaction.guild?.members.fetch(target.id);

    if (!member) {
        return interaction.reply({ content: 'لم يتم العثور على هذا العضو.', ephemeral: true });
    }

    if (!member.bannable) {
        return interaction.reply({ content: 'لا يمكنني حظر هذا العضو (ربما رتبته أعلى مني).', ephemeral: true });
    }

    await member.ban();
    await interaction.reply(`**لــقـد تـم حــظـر #${target.username} مــن الــسـيرفـر <:ban:1482739850611523737> ! **`);
}
