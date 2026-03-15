import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('فك الوقت المستقطع عن عضو')
    .addUserOption(option => 
        option.setName('target')
            .setDescription('العضو')
            .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('target');
    const member = await interaction.guild?.members.fetch(target!.id);

    if (!member) return interaction.reply({ content: 'العضو غير موجود.', ephemeral: true });

    try {
        await member.timeout(null);
        await interaction.reply(`**تــم فــك الـتـايــم اوت عـن **__#${target?.username}__ <:Talk:1482742623218307173>`);
    } catch (error) {
        return interaction.reply({ content: 'حدث خطأ أثناء فك التايم أوت.', ephemeral: true });
    }
}
