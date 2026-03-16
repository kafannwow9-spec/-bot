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
    const target = interaction.options.getUser('target');
    const member = await interaction.guild?.members.fetch(target.id);

    if (!member) {
        return interaction.reply({ content: 'لم يتم العثور على هذا العضو.', flags: MessageFlags.Ephemeral });
    }

    if (!member.bannable) {
        return interaction.reply({ content: 'لا يمكنني حظر هذا العضو (ربما رتبته أعلى مني).', flags: MessageFlags.Ephemeral });
    }

    await member.ban();
    addLog(interaction.guildId, 'ban', {
        adminId: interaction.user.id,
        targetId: target.id,
        reason: 'حظر من السيرفر'
    });
    await interaction.reply(`**لــقـد تـم حــظـر #${target.username} مــن الــسـيرفـر <:ban:1482739850611523737> ! **`);
}
