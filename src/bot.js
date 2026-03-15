import { Client, GatewayIntentBits, Collection, REST, Routes, ActivityType } from 'discord.js';
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

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
    ],
});

const commands = new Collection();
const commandList = [ban, unban, timeout, untimeout, warn, unwarn, warnings, setupMod, points, leaderboard];

for (const command of commandList) {
    commands.set(command.data.name, command);
}

export async function startBot(token, clientId) {
    client.once('ready', () => {
        console.log(`Logged in as ${client.user?.tag}!`);
        client.user.setActivity('made by b9r2', { type: ActivityType.Playing });
    });

    client.on('interactionCreate', async interaction => {
        if (!interaction.isChatInputCommand()) return;

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
