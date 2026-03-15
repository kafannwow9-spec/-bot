import { Client, GatewayIntentBits, Collection, REST, Routes, ActivityType, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, StringSelectMenuBuilder, PermissionFlagsBits } from 'discord.js';
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
import { getAbbreviations, addAbbreviation, removeAbbreviation } from './abbreviations.js';
import ms from 'ms';

async function updateAbbreviationsMessage(interaction) {
    const abbrevs = getAbbreviations();
    const container = abbreviations.createAbbreviationsContainer(abbrevs);
    
    // The original message is interaction.message
    if (interaction.message) {
        await interaction.message.edit({
            components: [container, interaction.message.components[1]],
            flags: MessageFlags.IsComponentsV2
        });
    }
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
    ],
});

const commands = new Collection();
const commandList = [ban, unban, timeout, untimeout, warn, unwarn, warnings, setupMod, points, leaderboard, abbreviations];

for (const command of commandList) {
    commands.set(command.data.name, command);
}

export async function startBot(token, clientId) {
    client.once('ready', () => {
        console.log(`Logged in as ${client.user?.tag}!`);
        client.user.setActivity('made by b9r2', { type: ActivityType.Playing });
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
                    await interaction.followUp({ content: 'حدث خطأ أثناء تنفيذ الأمر!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'حدث خطأ أثناء تنفيذ الأمر!', ephemeral: true });
                }
            }
        } else if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'add_abbrev_select') {
                if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                    return interaction.reply({ content: 'فقط المسؤولين يمكنهم استخدام هذا.', ephemeral: true });
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
                    return interaction.reply({ content: 'فقط المسؤولين يمكنهم استخدام هذا.', ephemeral: true });
                }
                const alias = interaction.values[0];
                removeAbbreviation(alias);
                await interaction.reply({ content: `تم إزالة المشغل \`${alias}\` بنجاح.`, ephemeral: true });
                await updateAbbreviationsMessage(interaction);
            } else if (interaction.customId === 'edit_abbrev_select') {
                if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                    return interaction.reply({ content: 'فقط المسؤولين يمكنهم استخدام هذا.', ephemeral: true });
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
            }
        } else if (interaction.isButton()) {
            if (interaction.customId === 'delete_abbrev_btn') {
                if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                    return interaction.reply({ content: 'فقط المسؤولين يمكنهم استخدام هذا.', ephemeral: true });
                }
                const abbrevs = getAbbreviations();
                const options = Object.keys(abbrevs).map(alias => ({ label: alias, value: alias }));
                if (options.length === 0) return interaction.reply({ content: 'لا يوجد مشغلات مضافة بعد.', ephemeral: true });

                const menu = new StringSelectMenuBuilder()
                    .setCustomId('delete_abbrev_select')
                    .setPlaceholder('اختر مشغل لحذفه')
                    .addOptions(options);

                await interaction.reply({ components: [new ActionRowBuilder().addComponents(menu)], ephemeral: true });
            } else if (interaction.customId === 'edit_abbrev_btn') {
                if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                    return interaction.reply({ content: 'فقط المسؤولين يمكنهم استخدام هذا.', ephemeral: true });
                }
                const abbrevs = getAbbreviations();
                const options = Object.keys(abbrevs).map(alias => ({ label: alias, value: alias }));
                if (options.length === 0) return interaction.reply({ content: 'لا يوجد مشغلات مضافة بعد.', ephemeral: true });

                const menu = new StringSelectMenuBuilder()
                    .setCustomId('edit_abbrev_select')
                    .setPlaceholder('اختر مشغل لتعديله')
                    .addOptions(options);

                await interaction.reply({ components: [new ActionRowBuilder().addComponents(menu)], ephemeral: true });
            }
        } else if (interaction.isModalSubmit()) {
            if (interaction.customId.startsWith('modal_add_abbrev_')) {
                const cmdName = interaction.customId.replace('modal_add_abbrev_', '');
                const alias = interaction.fields.getTextInputValue('abbrev_input');
                addAbbreviation(alias, cmdName);
                await interaction.reply({ content: `تم إضافة المشغل \`${alias}\` للأمر \`${cmdName}\` بنجاح.`, ephemeral: true });
                await updateAbbreviationsMessage(interaction);
            } else if (interaction.customId.startsWith('modal_edit_abbrev_')) {
                const oldAlias = interaction.customId.replace('modal_edit_abbrev_', '');
                const newAlias = interaction.fields.getTextInputValue('abbrev_new_input');
                const abbrevs = getAbbreviations();
                const cmdName = abbrevs[oldAlias];
                removeAbbreviation(oldAlias);
                addAbbreviation(newAlias, cmdName);
                await interaction.reply({ content: `تم تعديل المشغل من \`${oldAlias}\` إلى \`${newAlias}\` بنجاح.`, ephemeral: true });
                await updateAbbreviationsMessage(interaction);
            }
        }
    });

    client.on('messageCreate', async message => {
        if (message.author.bot || !message.guild) return;

        const args = message.content.split(/\s+/);
        const firstArg = args.shift();
        if (!firstArg) return;

        const abbrevs = getAbbreviations();
        const cmdName = abbrevs[firstArg.toLowerCase()];
        if (!cmdName) return;

        const command = commands.get(cmdName);
        if (!command) return;

        // Create a mock interaction
        const mockInteraction = {
            user: message.author,
            member: message.member,
            guild: message.guild,
            guildId: message.guildId,
            channel: message.channel,
            replied: false,
            deferred: false,
            options: {
                getUser: (name) => {
                    const mention = message.mentions.users.first();
                    if (mention) return mention;
                    // Try to find by ID in args
                    const id = args.find(a => /^\d+$/.test(a));
                    if (id) return client.users.cache.get(id);
                    return null;
                },
                getString: (name) => {
                    if (name === 'duration') return args[1] || args[0]; // Simple heuristic
                    if (name === 'reason') return args.slice(2).join(' ') || args.slice(1).join(' ');
                    if (name === 'filter') return args[0];
                    return args[0];
                }
            },
            reply: async (options) => {
                if (typeof options === 'string') {
                    return message.reply(options);
                }
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
}
