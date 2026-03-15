import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import ms from 'ms';
import { hasModPermission } from '../config.js';
import { addPoints } from '../points.js';

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
        return interaction.reply({ content: 'ليس لديك صلاحية استخدام هذا الأمر.', ephemeral: true });
    }
    const target = interaction.options.getUser('target');
    const durationStr = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason') || 'لا يوجد سبب';

    const member = await interaction.guild?.members.fetch(target.id);
    if (!member) return interaction.reply({ content: 'العضو غير موجود.', ephemeral: true });

    const duration = ms(durationStr);
    if (!duration || duration < 5000 || duration > 2419200000) {
        return interaction.reply({ content: 'مدة غير صالحة. يجب أن تكون بين 5 ثوانٍ و 28 يوماً.', ephemeral: true });
    }

    try {
        await member.timeout(duration, reason);
        addPoints(interaction.user.id, 1);
        await interaction.reply(`**تــم إعـطــاء وقــت مــسـتــقـطــع لـ**<@${target.id}> <:Timeout:1482741555516407990>`);
    } catch (error) {
        return interaction.reply({ content: 'لا يمكنني إعطاء وقت مستقطع لهذا العضو.', ephemeral: true });
    }
}
