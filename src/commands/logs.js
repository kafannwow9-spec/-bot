import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ContainerBuilder } from 'discord.js';
import { getLogs } from '../logger.js';

export const data = new SlashCommandBuilder()
    .setName('logs')
    .setDescription('عرض سجلات البوت')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
        option.setName('type')
            .setDescription('نوع السجل')
            .setRequired(false)
            .addChoices(
                { name: 'التايم أوت', value: 'timeout' },
                { name: 'التحذيرات', value: 'warn' },
                { name: 'البان', value: 'ban' },
                { name: 'الرسائل والإيمبد', value: 'send' }
            ));

export async function execute(interaction) {
    const typeFilter = interaction.options.getString('type');
    const allLogs = getLogs();
    const guildLogs = allLogs[interaction.guildId] || [];

    const filteredLogs = typeFilter 
        ? guildLogs.filter(l => l.type === typeFilter || (typeFilter === 'timeout' && l.type === 'untimeout') || (typeFilter === 'warn' && l.type === 'unwarn') || (typeFilter === 'ban' && l.type === 'unban'))
        : guildLogs;

    if (filteredLogs.length === 0) {
        return interaction.reply({ content: 'لا تــوجـد سـجـلات مـسـجـلـة.', flags: MessageFlags.Ephemeral });
    }

    // Get last 10 logs
    const lastLogs = filteredLogs.slice(-10).reverse();

    const container = new ContainerBuilder();
    
    container.addTextDisplayComponents((text) => 
        text.setContent(`**__ســجـلات الـنـظــام__**`)
    );

    for (const log of lastLogs) {
        container.addSeparatorComponents((s) => s);
        
        let logText = '';
        const time = new Date(log.timestamp).toLocaleString('ar-EG', { timeZone: 'UTC' });

        if (log.type === 'timeout' || log.type === 'untimeout') {
            const action = log.type === 'timeout' ? 'إعـطــاء تــايـم' : 'إزالـة تــايـم';
            logText = `مــعــلـومـــات الـتــايـم\n` +
                      `- الإجــراء: ${action}\n` +
                      `- الإداري: <@${log.adminId}>\n` +
                      `- الـعـضـو: <@${log.targetId}>\n` +
                      (log.duration ? `- الـمـدة: ${log.duration}\n` : '') +
                      `- الـسـبـب: ${log.reason}\n` +
                      `- الـوقــت: ${time}`;
        } else if (log.type === 'warn' || log.type === 'unwarn') {
            const action = log.type === 'warn' ? 'تـحـذيـر' : 'إزالـة تـحـذيـر';
            logText = `مــعــلـومـــات الـتـحـذيــر\n` +
                      `- الإجــراء: ${action}\n` +
                      `- الإداري: <@${log.adminId}>\n` +
                      `- الـعـضـو: <@${log.targetId}>\n` +
                      `- الـسـبـب: ${log.reason}\n` +
                      `- الـوقــت: ${time}`;
        } else if (log.type === 'ban' || log.type === 'unban') {
            const action = log.type === 'ban' ? 'بــان' : 'إزالـة بــان';
            logText = `مــعــلـومـــات الـبــان\n` +
                      `- الإجــراء: ${action}\n` +
                      `- الإداري: <@${log.adminId}>\n` +
                      `- الـعـضـو: <@${log.targetId}>\n` +
                      `- الـسـبـب: ${log.reason}\n` +
                      `- الـوقــت: ${time}`;
        } else if (log.type === 'send') {
            logText = `مــعــلـومـــات الإرســال\n` +
                      `- الإداري: <@${log.adminId}>\n` +
                      `- الـنـوع: ${log.type === 'message' ? 'رسالة' : 'إيمبد'}\n` +
                      `- الـمـحـتـوى: ${log.content.substring(0, 100)}${log.content.length > 100 ? '...' : ''}\n` +
                      `- الـوقــت: ${time}`;
        }

        container.addTextDisplayComponents((text) => text.setContent(logText));
    }

    await interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
    });
}
