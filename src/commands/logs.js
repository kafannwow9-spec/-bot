import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ContainerBuilder, ChannelType } from 'discord.js';
import { getLogs, getLogConfig, saveLogConfig } from '../logger.js';

export const data = new SlashCommandBuilder()
    .setName('logs')
    .setDescription('نظام سجلات البوت')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
        subcommand
            .setName('view')
            .setDescription('عرض سجلات البوت السابقة')
            .addStringOption(option =>
                option.setName('type')
                    .setDescription('نوع السجل')
                    .setRequired(false)
                    .addChoices(
                        { name: 'التايم أوت', value: 'timeout' },
                        { name: 'التحذيرات', value: 'warn' },
                        { name: 'البان', value: 'ban' },
                        { name: 'الرسائل والإيمبد', value: 'send' }
                    )))
    .addSubcommand(subcommand =>
        subcommand
            .setName('setup')
            .setDescription('إعداد روم السجلات التلقائية')
            .addStringOption(option =>
                option.setName('type')
                    .setDescription('نوع السجل المراد إعداده')
                    .setRequired(true)
                    .addChoices(
                        { name: 'التايم أوت', value: 'timeout' },
                        { name: 'التحذيرات', value: 'warn' },
                        { name: 'البان', value: 'ban' },
                        { name: 'الرسائل والإيمبد', value: 'send' }
                    ))
            .addChannelOption(option =>
                option.setName('channel')
                    .setDescription('الروم المراد إرسال السجلات إليها')
                    .setRequired(true)
                    .addChannelTypes(ChannelType.GuildText)));

export async function execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'setup') {
        const type = interaction.options.getString('type');
        const channel = interaction.options.getChannel('channel');

        const config = getLogConfig();
        if (!config[interaction.guildId]) config[interaction.guildId] = {};
        
        config[interaction.guildId][type] = channel.id;
        saveLogConfig(config);

        const typeLabels = {
            timeout: 'التايم أوت',
            warn: 'التحذيرات',
            ban: 'البان',
            send: 'الرسائل والإيمبد'
        };

        return interaction.editReply({ 
            content: `تــم إعـداد روم سـجـلات **${typeLabels[type]}** لـتـكـون في <#${channel.id}> بـنـجــاح.`
        });
    }

    if (subcommand === 'view') {
        const typeFilter = interaction.options.getString('type');
        const allLogs = getLogs();
        const guildLogs = allLogs[interaction.guildId] || [];

        const filteredLogs = typeFilter 
            ? guildLogs.filter(l => l.type === typeFilter || (typeFilter === 'timeout' && l.type === 'untimeout') || (typeFilter === 'warn' && l.type === 'unwarn') || (typeFilter === 'ban' && l.type === 'unban'))
            : guildLogs;

        if (filteredLogs.length === 0) {
            return interaction.editReply({ content: 'لا تــوجـد سـجـلات مـسـجـلـة.' });
        }

        const lastLogs = filteredLogs.slice(-10).reverse();
        const container = new ContainerBuilder();
        
        container.addTextDisplayComponents((text) => 
            text.setContent(`**__ســجـلات الـنـظــام__**`)
        );

        for (const log of lastLogs) {
            container.addTextDisplayComponents((text) => text.setContent('————————————————'));
            
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
                          `- الـنـوع: ${log.sendType === 'message' ? 'رسالة' : 'إيمبد'}\n` +
                          `- الـمـحـتـوى: ${log.content.substring(0, 100)}${log.content.length > 100 ? '...' : ''}\n` +
                          `- الـوقــت: ${time}`;
            }

            if (logText) {
                container.addTextDisplayComponents((text) => text.setContent(logText));
            }
        }

        await interaction.editReply({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    }
}
