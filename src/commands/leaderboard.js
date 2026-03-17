import { SlashCommandBuilder, ContainerBuilder, MessageFlags } from 'discord.js';
import { getPoints } from '../points.js';

export const data = new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('عرض توب النقاط')
    .addStringOption(option =>
        option.setName('filter')
            .setDescription('الفترة الزمنية')
            .setRequired(false)
            .addChoices(
                { name: 'يومي', value: 'daily' },
                { name: 'أسبوعي', value: 'weekly' },
                { name: 'شهري', value: 'monthly' }
            ));

export async function execute(interaction) {
    await interaction.deferReply();
    const filter = interaction.options.getString('filter') || 'total';
    const points = getPoints(filter);
    
    const filterLabels = {
        total: 'الكل',
        daily: 'اليومي',
        weekly: 'الأسبوعي',
        monthly: 'الشهري'
    };

    // Sort points and get top 10
    const sortedPoints = Object.entries(points)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

    if (sortedPoints.length === 0) {
        return interaction.editReply({ content: 'لا يوجد نقاط مسجلة لهذه الفترة.' });
    }

    const embed = new EmbedBuilder()
        .setTitle(`**🏆 تـوب الـنــقـاط (${filterLabels[filter]})**`)
        .setColor(0x2f3136);

    let description = '';
    for (let i = 0; i < sortedPoints.length; i++) {
        const [userId, userPoints] = sortedPoints[i];
        const rank = i + 1;
        
        description += `${rank}. <@${userId}> — \`${userPoints}\` <:Points:1482767197972463749>\n`;

        if (i < sortedPoints.length - 1) {
            description += `————————————————\n`;
        }
    }

    embed.setDescription(description);

    try {
        await interaction.editReply({
            embeds: [embed]
        });
    } catch (error) {
        console.error('Error sending leaderboard:', error);
        await interaction.editReply({ 
            content: 'حدث خطأ أثناء عرض لوحة المتصدرين.'
        });
    }
}
