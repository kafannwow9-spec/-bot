import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getPoints } from '../points.js';

export const data = new SlashCommandBuilder()
    .setName('points')
    .setDescription('عرض عدد نقاطك أو نقاط عضو آخر')
    .addUserOption(option => 
        option.setName('target')
            .setDescription('العضو المراد عرض نقاطه')
            .setRequired(false));

export async function execute(interaction) {
    const target = interaction.options.getUser('target') || interaction.user;
    const points = getPoints();
    const userPoints = points[target.id] || 0;

    const embed = new EmbedBuilder()
        .setColor(0x0099ff) // Blue color
        .setDescription(`**عــدد نــقـاطـك هـو \`${userPoints}\` <:Points:1482767197972463749>**`);

    if (target.id !== interaction.user.id) {
        embed.setDescription(`**عــدد نــقـاط <@${target.id}> هـو \`${userPoints}\` <:Points:1482767197972463749>**`);
    }

    await interaction.reply({ embeds: [embed] });
}
