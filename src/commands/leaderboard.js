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
        return interaction.reply({ content: 'لا يوجد نقاط مسجلة لهذه الفترة.', ephemeral: true });
    }

    const container = new ContainerBuilder();
    // Removed setAccentColor as requested

    // Add Title
    container.addTextDisplayComponents((text) => 
        text.setContent(`**🏆 تـوب الـنــقـاط (${filterLabels[filter]})**`)
    );

    container.addSeparatorComponents((s) => s);

    // Add users
    for (let i = 0; i < sortedPoints.length; i++) {
        const [userId, userPoints] = sortedPoints[i];
        const rank = i + 1;
        
        container.addTextDisplayComponents((text) => 
            text.setContent(`${rank}. <@${userId}> — \`${userPoints}\` <:Points:1482767197972463749>`)
        );

        // Add separator after each user except the last one
        if (i < sortedPoints.length - 1) {
            container.addSeparatorComponents((s) => s);
        }
    }

    try {
        await interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    } catch (error) {
        console.error('Error sending leaderboard:', error);
        // Fallback to normal embed if Components V2 fails (e.g. library version issue)
        await interaction.reply({ 
            content: 'حدث خطأ أثناء عرض لوحة المتصدرين. قد يكون إصدار المكتبة لا يدعم المكونات الجديدة.',
            ephemeral: true 
        });
    }
}
