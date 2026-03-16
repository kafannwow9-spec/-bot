import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { addLog } from '../logger.js';

export const data = new SlashCommandBuilder()
    .setName('ban')
    .setDescription('حظر عضو من السيرفر')
    .addUserOption(option => 
        option.setName('target')
            .setDescription('العضو المراد حظره')
            .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export async function execute(interaction) {
    await interaction.deferReply();
    const target = interaction.options.getUser('target');
    const member = await interaction.guild?.members.fetch(target.id);

    if (!member) {
        return interaction.editReply({ content: 'لم يتم العثور على هذا العضو.' });
    }

    if (!member.bannable) {
        return interaction.editReply({ content: 'لا يمكنني حظر هذا العضو (ربما رتبته أعلى مني).' });
    }

    await member.ban();
    addLog(interaction.guild, 'ban', {
        adminId: interaction.user.id,
        targetId: target.id,
        reason: 'حظر من السيرفر'
    });
    await interaction.editReply(`**لــقـد تـم حــظـر <@${target.id}> مــن الــسـيرفـر <:ban:1482739850611523737> ! **`);
}
