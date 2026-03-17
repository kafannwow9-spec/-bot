import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { getStreakData } from '../streak.js';

export const data = new SlashCommandBuilder()
    .setName('topstreak')
    .setDescription('عرض توب الستريك');

export async function createTopStreakEmbed(client, guildId, page = 0, currentUserId = null) {
    const data = getStreakData();
    const guildData = data[guildId];
    if (!guildData || !guildData.users || Object.keys(guildData.users).length === 0) {
        return { embed: null, row: null };
    }

    const users = Object.entries(guildData.users)
        .map(([id, u]) => ({ id, count: u.count }))
        .sort((a, b) => b.count - a.count);

    const totalPages = Math.ceil(users.length / 10);
    const start = page * 10;
    const end = start + 10;
    const pageUsers = users.slice(start, end);

    const embed = new EmbedBuilder()
        .setTitle('**__تــوب الــسـتــريـك <:Streak:1483068555514744902>__**')
        .setColor(0x2f3136);
    
    let description = '';

    for (let i = 0; i < pageUsers.length; i++) {
        const user = pageUsers[i];
        const rank = start + i + 1;
        const isCurrentUser = user.id === currentUserId;
        
        const content = `#${rank} ~ <@${user.id}> ・<:Streak:1483068555514744902> **${user.count}**`;
        
        description += isCurrentUser ? `- **${content}**\n` : `- ${content}\n`;

        if (i < pageUsers.length - 1) {
            description += `————————————————\n`;
        }
    }

    // If user not in top 10 and we are on page 0
    const userRank = users.findIndex(u => u.id === currentUserId) + 1;
    if (userRank > 10 && page === 0) {
        const currentUserData = guildData.users[currentUserId];
        if (currentUserData) {
            description += `————————————————\n`;
            description += `— <@${currentUserId}> ・<:Streak:1483068555514744902> ${currentUserData.count}`;
        }
    }

    embed.setDescription(description);

    let row = null;
    if (totalPages > 1) {
        const options = [];
        const maxPages = Math.min(totalPages, 25);
        for (let i = 0; i < maxPages; i++) {
            options.push({
                label: `الصفحة ${i + 1}`,
                value: i.toString(),
                default: i === page
            });
        }
        const menu = new StringSelectMenuBuilder()
            .setCustomId('topstreak_page_select')
            .setPlaceholder('اختر صفحة')
            .addOptions(options);
        row = new ActionRowBuilder().addComponents(menu);
    }

    return { embed, row };
}

export async function execute(interaction) {
    await interaction.deferReply();
    const { embed, row } = await createTopStreakEmbed(interaction.client, interaction.guildId, 0, interaction.user.id);
    
    if (!embed) {
        return interaction.editReply({ content: 'لا يوجد بيانات ستريك مسجلة في هذا السيرفر.' });
    }

    const components = [];
    if (row) components.push(row);

    await interaction.editReply({
        embeds: [embed],
        components
    });
}
