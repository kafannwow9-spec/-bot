import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('broadcast')
    .setDescription('إرسال رسالة جماعية إلى الخاص (DMs)')
    .addStringOption(option =>
        option.setName('target')
            .setDescription('الفئة المستهدفة')
            .setRequired(true)
            .addChoices(
                { name: 'أونلاين (Online)', value: 'online' },
                { name: 'أوفلاين (Offline)', value: 'offline' },
                { name: 'الكل (All)', value: 'all' }
            ))
    .addStringOption(option =>
        option.setName('message')
            .setDescription('الرسالة التي تريد إرسالها')
            .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
    const target = interaction.options.getString('target');
    const message = interaction.options.getString('message');

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
        // Fetch all members to ensure we have the latest presence data
        const members = await interaction.guild.members.fetch({ withPresences: true });
        
        let targetMembers = [];

        if (target === 'all') {
            targetMembers = members.filter(m => !m.user.bot);
        } else if (target === 'online') {
            targetMembers = members.filter(m => !m.user.bot && (m.presence?.status === 'online' || m.presence?.status === 'idle' || m.presence?.status === 'dnd'));
        } else if (target === 'offline') {
            targetMembers = members.filter(m => !m.user.bot && (!m.presence || m.presence.status === 'offline'));
        }

        if (targetMembers.size === 0) {
            return interaction.editReply({ content: 'لم يتم العثور على أعضاء في هذه الفئة.' });
        }

        let successCount = 0;
        let failCount = 0;

        await interaction.editReply({ content: `جاري بدء الإرسال إلى ${targetMembers.size} عضو...` });

        for (const [id, member] of targetMembers) {
            try {
                await member.send(message);
                successCount++;
            } catch (error) {
                console.error(`Failed to send DM to ${member.user.tag}:`, error.message);
                failCount++;
            }
            // Small delay to avoid hitting rate limits too hard
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        await interaction.editReply({ 
            content: `**تـم الانـتـهــاء مـن الإرسـال <:Allow:1482740836104929512>**\n- تـم الإرسـال لـ: \`${successCount}\` عضو\n- فـشـل الإرسـال لـ: \`${failCount}\` عضو (غالباً بسبب إغلاق الخاص)` 
        });

    } catch (error) {
        console.error('Error in broadcast command:', error);
        await interaction.editReply({ content: 'حدث خطأ أثناء محاولة الإرسال الجماعي.' });
    }
}
