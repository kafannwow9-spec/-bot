import { Client, GatewayIntentBits, Collection, REST, Routes, ActivityType, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, StringSelectMenuBuilder, PermissionFlagsBits, MessageFlags, EmbedBuilder, ContainerBuilder } from 'discord.js';
import * as ban from './commands/ban.js';
import * as unban from './commands/unban.js';
import * as timeout from './commands/timeout.js';
import * as untimeout from './commands/untimeout.js';
import * as warn from './commands/warn.js';
import * as unwarn from './commands/unwarn.js';
import * as warnings from './commands/warnings.js';
import * as setupMod from './commands/setup-mod.js';
import * as points from './commands/points.js';
import * as leaderboard from './commands/leaderboard.js';
import * as abbreviations from './commands/abbreviations.js';
import * as streak from './commands/streak.js';
import * as topstreak from './commands/topstreak.js';
import * as send from './commands/send.js';
import * as logs from './commands/logs.js';
import * as pointsSetup from './commands/points-setup.js';
import { getAbbreviations, addAbbreviation, removeAbbreviation } from './abbreviations.js';
import { updateStreak } from './streak.js';
import ms from 'ms';

async function updateAbbreviationsMessage(interaction) {
    try {
        const abbrevs = getAbbreviations();
        const container = abbreviations.createAbbreviationsContainer(abbrevs);
        
        // The original message is interaction.message
        if (interaction.message) {
            await interaction.message.edit({
                components: [container, interaction.message.components[1]],
                flags: MessageFlags.IsComponentsV2
            });
        }
    } catch (error) {
        console.error('Error updating abbreviations message:', error);
    }
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const commands = new Collection();
const commandList = [ban, unban, timeout, untimeout, warn, unwarn, warnings, setupMod, points, leaderboard, abbreviations, streak, topstreak, send, logs, pointsSetup];

for (const command of commandList) {
    commands.set(command.data.name, command);
}

export async function startBot(token, clientId) {
    client.once('ready', () => {
        console.log(`Logged in as ${client.user?.tag}!`);
        client.user.setActivity('made by b9r2', { type: ActivityType.Playing });
    });

    client.on('error', error => {
        console.error('Discord client error:', error);
    });

    process.on('unhandledRejection', error => {
        console.error('Unhandled promise rejection:', error);
    });

    process.on('uncaughtException', error => {
        console.error('Uncaught exception:', error);
    });

    client.on('interactionCreate', async interaction => {
        if (interaction.isChatInputCommand()) {
            const command = commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'حدث خطأ أثناء تنفيذ الأمر!', flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.reply({ content: 'حدث خطأ أثناء تنفيذ الأمر!', flags: MessageFlags.Ephemeral });
                }
            }
        } else if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'add_abbrev_select') {
                if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                    return interaction.reply({ content: 'فقط المسؤولين يمكنهم استخدام هذا.', flags: MessageFlags.Ephemeral });
                }
                const cmdName = interaction.values[0];
                const modal = new ModalBuilder()
                    .setCustomId(`modal_add_abbrev_${cmdName}`)
                    .setTitle(`إضافة مشغل للأمر ${cmdName}`);

                const input = new TextInputBuilder()
                    .setCustomId('abbrev_input')
                    .setLabel('المشغل (مثال: tm)')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                modal.addComponents(new ActionRowBuilder().addComponents(input));
                await interaction.showModal(modal);
            } else if (interaction.customId === 'delete_abbrev_select') {
                if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                    return interaction.reply({ content: 'فقط المسؤولين يمكنهم استخدام هذا.', flags: MessageFlags.Ephemeral });
                }
                const alias = interaction.values[0];
                removeAbbreviation(alias);
                await interaction.reply({ content: `تم إزالة المشغل \`${alias}\` بنجاح.`, flags: MessageFlags.Ephemeral });
                await updateAbbreviationsMessage(interaction);
            } else if (interaction.customId === 'edit_abbrev_select') {
                if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                    return interaction.reply({ content: 'فقط المسؤولين يمكنهم استخدام هذا.', flags: MessageFlags.Ephemeral });
                }
                const alias = interaction.values[0];
                const modal = new ModalBuilder()
                    .setCustomId(`modal_edit_abbrev_${alias}`)
                    .setTitle(`تعديل المشغل ${alias}`);

                const input = new TextInputBuilder()
                    .setCustomId('abbrev_new_input')
                    .setLabel('المشغل الجديد')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setValue(alias);

                modal.addComponents(new ActionRowBuilder().addComponents(input));
                await interaction.showModal(modal);
            } else if (interaction.customId === 'topstreak_page_select') {
                await interaction.deferUpdate();
                const page = parseInt(interaction.values[0]);
                const { embed, row } = await topstreak.createTopStreakEmbed(interaction.client, interaction.guildId, page, interaction.user.id);
                if (embed) {
                    const components = [];
                    if (row) components.push(row);
                    await interaction.editReply({
                        embeds: [embed],
                        components
                    });
                }
            }
        } else if (interaction.isButton()) {
            if (interaction.customId === 'delete_abbrev_btn') {
                if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                    return interaction.reply({ content: 'فقط المسؤولين يمكنهم استخدام هذا.', flags: MessageFlags.Ephemeral });
                }
                const abbrevs = getAbbreviations();
                const options = Object.keys(abbrevs).map(alias => ({ label: alias, value: alias }));
                if (options.length === 0) return interaction.reply({ content: 'لا يوجد مشغلات مضافة بعد.', flags: MessageFlags.Ephemeral });

                const menu = new StringSelectMenuBuilder()
                    .setCustomId('delete_abbrev_select')
                    .setPlaceholder('اختر مشغل لحذفه')
                    .addOptions(options);

                await interaction.reply({ components: [new ActionRowBuilder().addComponents(menu)], flags: MessageFlags.Ephemeral });
            } else if (interaction.customId === 'edit_abbrev_btn') {
                if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                    return interaction.reply({ content: 'فقط المسؤولين يمكنهم استخدام هذا.', flags: MessageFlags.Ephemeral });
                }
                const abbrevs = getAbbreviations();
                const options = Object.keys(abbrevs).map(alias => ({ label: alias, value: alias }));
                if (options.length === 0) return interaction.reply({ content: 'لا يوجد مشغلات مضافة بعد.', flags: MessageFlags.Ephemeral });

                const menu = new StringSelectMenuBuilder()
                    .setCustomId('edit_abbrev_select')
                    .setPlaceholder('اختر مشغل لتعديله')
                    .addOptions(options);

                await interaction.reply({ components: [new ActionRowBuilder().addComponents(menu)], flags: MessageFlags.Ephemeral });
            }
        } else if (interaction.isModalSubmit()) {
            if (interaction.customId.startsWith('modal_add_abbrev_')) {
                const cmdName = interaction.customId.replace('modal_add_abbrev_', '');
                const alias = interaction.fields.getTextInputValue('abbrev_input');
                addAbbreviation(alias, cmdName);
                await interaction.reply({ content: `تم إضافة المشغل \`${alias}\` للأمر \`${cmdName}\` بنجاح.`, flags: MessageFlags.Ephemeral });
                await updateAbbreviationsMessage(interaction);
            } else if (interaction.customId.startsWith('modal_edit_abbrev_')) {
                const oldAlias = interaction.customId.replace('modal_edit_abbrev_', '');
                const newAlias = interaction.fields.getTextInputValue('abbrev_new_input');
                const abbrevs = getAbbreviations();
                const cmdName = abbrevs[oldAlias];
                removeAbbreviation(oldAlias);
                addAbbreviation(newAlias, cmdName);
                await interaction.reply({ content: `تم تعديل المشغل من \`${oldAlias}\` إلى \`${newAlias}\` بنجاح.`, flags: MessageFlags.Ephemeral });
                await updateAbbreviationsMessage(interaction);
            }
        }
    });

    client.on('messageCreate', async message => {
        if (message.author.bot || !message.guild) return;

        // Streak Logic
        const streakResult = updateStreak(message.guildId, message.author.id);
        if (streakResult) {
            const sendStreak = async () => {
                try {
                    let channel = message.guild.channels.cache.get(streakResult.channelId);
                    if (!channel) {
                        channel = await message.guild.channels.fetch(streakResult.channelId).catch(() => null);
                    }
                    
                    if (channel) {
                        const fullShield = '<:shield:1483070889124827250>';
                        const usedShield = '<:Shield:1483070891196809316>';
                        
                        const shieldsDisplay = usedShield.repeat(3 - streakResult.shields) + fullShield.repeat(streakResult.shields);
                        const usedCount = 3 - streakResult.shields;

                        const embed = new EmbedBuilder()
                            .setTitle('**__تــحــديـث الـســتـريـك<:Streak:1483068555514744902> __**')
                            .setDescription(`- **<:Streak:1483068555514744902>  — ${streakResult.count}**\n- **( ${shieldsDisplay} ) — ${usedCount}**`)
                            .setColor(0x00ff00);

                        await channel.send({
                            content: `<@${message.author.id}>`,
                            embeds: [embed]
                        });
                    }
                } catch (err) {
                    console.error('Error sending streak message:', err);
                }
            };
            sendStreak();
        }

        const args = message.content.split(/\s+/);
        const firstArg = args.shift();
        if (!firstArg) return;

        const abbrevs = getAbbreviations();
        const cmdName = abbrevs[firstArg.toLowerCase()];
        if (!cmdName) return;

        console.log(`Executing text command: ${cmdName} for alias: ${firstArg}`);

        const command = commands.get(cmdName);
        if (!command) return;

        // Create a mock interaction
        const mockInteraction = {
            id: message.id,
            user: message.author,
            member: message.member,
            guild: message.guild,
            guildId: message.guildId,
            channel: message.channel,
            replied: false,
            deferred: false,
            isRepliable: () => true,
            options: {
                getUser: (name) => {
                    const mention = message.mentions.users.first();
                    if (mention) return mention;
                    const id = args.find(a => /^\d+$/.test(a));
                    if (id) return client.users.cache.get(id);
                    return null;
                },
                getMember: async (name) => {
                    const user = mockInteraction.options.getUser(name);
                    if (!user) return null;
                    return await message.guild.members.fetch(user.id);
                },
                getString: (name) => {
                    if (name === 'duration') {
                        // Find first arg that looks like a duration (not a mention/ID)
                        // A duration usually ends with s, m, h, d, w
                        return args.find(a => /^\d+[smhdw]$/.test(a)) || args.find(a => !a.startsWith('<@') && !/^\d+$/.test(a)) || args[0];
                    }
                    if (name === 'reason') {
                        // Everything after the user and duration
                        const userArg = args.find(a => a.startsWith('<@') || /^\d+$/.test(a));
                        const durationArg = args.find(a => /^\d+[smhdw]$/.test(a));
                        
                        let reasonArgs = [...args];
                        if (userArg) {
                            const idx = reasonArgs.indexOf(userArg);
                            if (idx !== -1) reasonArgs.splice(idx, 1);
                        }
                        if (durationArg) {
                            const idx = reasonArgs.indexOf(durationArg);
                            if (idx !== -1) reasonArgs.splice(idx, 1);
                        }
                        return reasonArgs.join(' ') || null;
                    }
                    if (name === 'filter') return args[0];
                    return args[0];
                },
                getInteger: (name) => parseInt(args.find(a => /^\d+$/.test(a))) || 0,
                getNumber: (name) => parseFloat(args.find(a => /^-?\d*\.?\d+$/.test(a))) || 0,
                getBoolean: (name) => args.includes('true') || args.includes('yes')
            },
            reply: async (options) => {
                mockInteraction.replied = true;
                if (typeof options === 'string') {
                    return message.reply(options);
                }
                return message.reply(options);
            },
            deferReply: async (options) => {
                mockInteraction.deferred = true;
                return; // No-op for text commands
            },
            editReply: async (options) => {
                return message.reply(options);
            },
            followUp: async (options) => {
                return message.reply(options);
            }
        };

        try {
            await command.execute(mockInteraction);
        } catch (error) {
            console.error('Error executing text command:', error);
        }
    });

    // Register Slash Commands
    const rest = new REST({ version: '10' }).setToken(token);

    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(
            Routes.applicationCommands(clientId),
            { body: commandList.map(c => c.data.toJSON()) },
        );
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }

    await client.login(token);

    client.on('guildCreate', async (guild) => {
        const allowedGuildId = '1477677044790722791';
        if (guild.id !== allowedGuildId) {
            try {
                // Try to find who added the bot
                const auditLogs = await guild.fetchAuditLogs({ limit: 1, type: 28 }).catch(() => null); // BOT_ADD
                if (auditLogs) {
                    const entry = auditLogs.entries.first();
                    if (entry) {
                        const user = entry.executor;
                        await user.send('اخخ ياسراق ياحرامي يامنقولي تحاول تسرق البوت ترا البوت مخصص فقط لسيرفر https://discord.gg/kRy3kmmGaj').catch(() => null);
                    }
                }
                await guild.leave();
            } catch (error) {
                console.error('Error leaving unauthorized guild:', error);
            }
        }
    });

    client.on('guildMemberUpdate', async (oldMember, newMember) => {
        const oldTimeout = oldMember.communicationDisabledUntilTimestamp;
        const newTimeout = newMember.communicationDisabledUntilTimestamp;

        if (oldTimeout === newTimeout) return;

        const { addLog } = await import('./logger.js');

        // Case 1: Timeout removed or expired
        if (oldTimeout && !newTimeout) {
            let adminId = 'System';
            let reason = 'انتهاء مدة التايم أوت تلقائياً';

            try {
                const auditLogs = await newMember.guild.fetchAuditLogs({ limit: 1, type: 24 }).catch(() => null);
                if (auditLogs) {
                    const entry = auditLogs.entries.first();
                    if (entry && entry.target.id === newMember.id) {
                        const change = entry.changes.find(c => c.key === 'communication_disabled_until');
                        if (change && change.old && !change.new && Date.now() - entry.createdTimestamp < 5000) {
                            if (entry.executor.id === client.user.id) return;
                            adminId = entry.executor.id;
                            reason = 'إزالة التايم أوت يدوياً';
                        }
                    }
                }
            } catch (e) {}

            addLog(newMember.guild, 'untimeout', {
                adminId,
                targetId: newMember.id,
                reason
            });
        }
        // Case 2: Timeout added or updated
        else if (newTimeout) {
            let adminId = 'System';
            let reason = 'إعطاء تايم أوت يدوياً';
            let duration = null;

            try {
                const auditLogs = await newMember.guild.fetchAuditLogs({ limit: 1, type: 24 }).catch(() => null);
                if (auditLogs) {
                    const entry = auditLogs.entries.first();
                    if (entry && entry.target.id === newMember.id) {
                        const change = entry.changes.find(c => c.key === 'communication_disabled_until');
                        if (change && change.new && Date.now() - entry.createdTimestamp < 5000) {
                            if (entry.executor.id === client.user.id) return;
                            adminId = entry.executor.id;
                            reason = entry.reason || 'إعطاء تايم أوت يدوياً';
                            
                            const diff = new Date(change.new).getTime() - Date.now();
                            if (diff > 0) {
                                duration = ms(diff, { long: true });
                            }
                        }
                    }
                }
            } catch (e) {}

            addLog(newMember.guild, 'timeout', {
                adminId,
                targetId: newMember.id,
                reason,
                duration
            });
        }
    });
}
