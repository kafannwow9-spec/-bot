import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { addPoints, clearUserPoints } from '../points.js';

export const data = new SlashCommandBuilder()
    .setName('points-setup')
    .setDescription('إعداد نقاط الأعضاء (للمسؤولين فقط)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
        option.setName('action')
            .setDescription('الإجراء المراد تنفيذه')
            .setRequired(true)
            .addChoices(
                { name: 'إضافة نقاط', value: 'add' },
                { name: 'إزالة نقاط', value: 'remove' },
                { name: 'تصفير نقاط', value: 'reset' }
            ))
    .addUserOption(option =>
        option.setName('target')
            .setDescription('العضو المستهدف')
            .setRequired(true))
    .addIntegerOption(option =>
        option.setName('amount')
            .setDescription('عدد النقاط (مطلوب للإضافة والإزالة)')
            .setRequired(false));

export async function execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const action = interaction.options.getString('action');
    const target = interaction.options.getUser('target');
    const amount = interaction.options.getInteger('amount');

    if ((action === 'add' || action === 'remove') && (amount === null || amount === undefined)) {
        return interaction.editReply({ 
            content: 'يجب تحديد عدد النقاط عند الإضافة أو الإزالة.'
        });
    }

    if ((action === 'add' || action === 'remove') && amount <= 0) {
        return interaction.editReply({ 
            content: 'يجب أن يكون عدد النقاط أكبر من صفر.'
        });
    }

    try {
        if (action === 'add') {
            addPoints(target.id, amount);
            await interaction.editReply({ 
                content: `تـم إضافة \`${amount}\` نقطة لـ \`${target.username}\` بـنـجـاح.`
            });
        } else if (action === 'remove') {
            addPoints(target.id, -amount);
            await interaction.editReply({ 
                content: `تـم إزالة \`${amount}\` نقطة من \`${target.username}\` بـنـجـاح.`
            });
        } else if (action === 'reset') {
            clearUserPoints(target.id);
            await interaction.editReply({ 
                content: `تـم تصفير نقاط \`${target.username}\` بـنـجـاح.`
            });
        }
    } catch (error) {
        console.error('Error in points-setup:', error);
        await interaction.editReply({ 
            content: 'حدث خطأ أثناء تنفيذ العملية.'
        });
    }
}
