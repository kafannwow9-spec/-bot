import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, EmbedBuilder } from 'discord.js';
import { addLog } from '../logger.js';

export const data = new SlashCommandBuilder()
    .setName('send')
    .setDescription('إرسال رسالة أو إيمبد')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
        option.setName('type')
            .setDescription('نوع الإرسال')
            .setRequired(true)
            .addChoices(
                { name: 'رسالة عادية', value: 'message' },
                { name: 'إيمبد', value: 'embed' }
            ))
    .addStringOption(option =>
        option.setName('content')
            .setDescription('محتوى الرسالة')
            .setRequired(true));

export async function execute(interaction) {
    const type = interaction.options.getString('type');
    const content = interaction.options.getString('content');

    try {
        if (type === 'message') {
            await interaction.channel.send(content);
        } else {
            const embed = new EmbedBuilder()
                .setDescription(content)
                .setColor(0x2f3136);
            await interaction.channel.send({ embeds: [embed] });
        }

        addLog(interaction.guild, 'send', {
            adminId: interaction.user.id,
            adminTag: interaction.user.tag,
            sendType: type,
            content,
            channelId: interaction.channelId
        });

        await interaction.reply({ content: 'تــم الإرســال بـنـجــاح.', flags: MessageFlags.Ephemeral });
    } catch (error) {
        console.error('Error in send command:', error);
        await interaction.reply({ content: 'حـدث خـطـأ أثـنـاء الإرسـال.', flags: MessageFlags.Ephemeral });
    }
}
