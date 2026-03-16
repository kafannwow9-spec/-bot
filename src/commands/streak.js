import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { getStreakData, saveStreakData } from '../streak.js';

export const data = new SlashCommandBuilder()
    .setName('streak')
    .setDescription('إعداد نظام الستريك وتحديد الروم')
    .addChannelOption(option => 
        option.setName('channel')
            .setDescription('الروم الذي سيتم إرسال تحديثات الستريك فيه')
            .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const data = getStreakData();
    
    if (!data[interaction.guildId]) data[interaction.guildId] = { channelId: null, users: {} };
    data[interaction.guildId].channelId = channel.id;
    
    saveStreakData(data);
    
    await interaction.reply({
        content: `**تــم تــحـديـد روم الـسـتـريـك: <#${channel.id}>**`,
        flags: MessageFlags.Ephemeral
    });
}
