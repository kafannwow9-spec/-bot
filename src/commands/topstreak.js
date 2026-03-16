import { SlashCommandBuilder, ContainerBuilder, MessageFlags, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { getStreakData } from '../streak.js';

export const data = new SlashCommandBuilder()
    .setName('topstreak')
    .setDescription('عرض توب الستريك');

export function createTopStreakContainer(guildId, page = 0, currentUserId = null) {
    const data = getStreakData();
    const guildData = data[guildId];
    if (!guildData || !guildData.users || Object.keys(guildData.users).length === 0) {
        return { container: null, row: null };
    }

    const users = Object.entries(guildData.users)
        .map(([id, u]) => ({ id, count: u.count }))
        .sort((a, b) => b.count - a.count);

    const totalPages = Math.ceil(users.length / 10);
    const start = page * 10;
    const end = start + 10;
    const pageUsers = users.slice(start, end);

    const container = new ContainerBuilder();
    
    // Add Title
    container.addTextDisplayComponents((text) => 
        text.setContent('**__تــوب الــسـتــريـك <:Streak:1483068555514744902>__**')
    );
    container.addSeparatorComponents((s) => s);

    for (let i = 0; i < pageUsers.length; i++) {
        const user = pageUsers[i];
        const rank = start + i + 1;
        const isCurrentUser = user.id === currentUserId;
        const content = `#${rank} ~ <@${user.id}> ・<:Streak:1483068555514744902> **${user.count}**`;
        
        container.addTextDisplayComponents((text) => 
            text.setContent(isCurrentUser ? `- **${content}**` : `- ${content}`)
        );

        if (i < pageUsers.length - 1) {
            container.addSeparatorComponents((s) => s);
        }
    }

    // If user not in top 10 and we are on page 0
    const userRank = users.findIndex(u => u.id === currentUserId) + 1;
    if (userRank > 10 && page === 0) {
        const currentUserData = guildData.users[currentUserId];
        if (currentUserData) {
            container.addSeparatorComponents((s) => s);
            container.addTextDisplayComponents((text) => 
                text.setContent(`\n— **<@${currentUserId}> ・<:Streak:1483068555514744902> ${currentUserData.count}**`)
            );
        }
    }

    let row = null;
    if (totalPages > 1) {
        const options = [];
        // Limit to 25 options (Discord limit)
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

    return { container, row };
}

export async function execute(interaction) {
    const { container, row } = createTopStreakContainer(interaction.guildId, 0, interaction.user.id);
    
    if (!container) {
        return interaction.reply({ content: 'لا يوجد بيانات ستريك مسجلة في هذا السيرفر.', flags: MessageFlags.Ephemeral });
    }

    const components = [container];
    if (row) components.push(row);

    await interaction.reply({
        components,
        flags: MessageFlags.IsComponentsV2
    });
}
