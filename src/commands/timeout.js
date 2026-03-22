import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import ms from 'ms';
import { hasModPermission } from '../config.js';
import { addPoints } from '../points.js';
import { addLog } from '../logger.js';

export const data = new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('إعطاء وقت مستقطع لعضو')
    .addUserOption(option => 
        option.setName('target')
            .setDescription('العضو')
            .setRequired(true))
    .addStringOption(option => 
        option.setName('duration')
            .setDescription('المدة (مثال: 1d, 1w, 1m)')
            .setRequired(true))
    .addStringOption(option => 
        option.setName('reason')
            .setDescription('السبب (اختياري)')
            .setRequired(false));

export async function execute(interaction) {
    if (!hasModPermission(interaction.member, interaction.guildId)) {
        return await interaction.reply({ content: 'ليس لديك صلاحية استخدام هذا الأمر.', flags: MessageFlags.Ephemeral });
    }
    await interaction.deferReply();
    const target = interaction.options.getUser('target');
    const durationStr = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason') || 'لا يوجد سبب';

    const member = await interaction.guild?.members.fetch(target.id);
    if (!member) return interaction.editReply({ content: 'العضو غير موجود.' });

    const duration = ms(durationStr);
    if (!duration || duration < 5000 || duration > 2419200000) {
        return interaction.editReply({ content: 'مدة غير صالحة. يجب أن تكون بين 5 ثوانٍ و 28 يوماً.' });
    }

    try {
        await member.timeout(duration, reason);
        addPoints(interaction.user.id, 1);
        addLog(interaction.guild, 'timeout', {
            adminId: interaction.user.id,
            targetId: target.id,
            duration: durationStr,
            reason: reason
        });
        await interaction.editReply(`**تــم إعـطــاء وقــت مــسـتــقـطــع لـ <@${target.id}>** <:Timeout:1482741555516407990>`);
    } catch (error) {
        return interaction.editReply({ content: 'لا يمكنني إعطاء وقت مستقطع لهذا العضو.' });
    }
}
