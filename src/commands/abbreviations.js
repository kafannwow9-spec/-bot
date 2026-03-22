import { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    EmbedBuilder, 
    StringSelectMenuBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    MessageFlags,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} from 'discord.js';
import { getAbbreviations } from '../abbreviations.js';

export const data = new SlashCommandBuilder()
    .setName('abbreviations')
    .setDescription('إدارة مشغلات الأوامر الكتابية')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export function createAbbreviationsEmbed(abbrevs) {
    const commandNames = ['ban', 'unban', 'timeout', 'untimeout', 'warn', 'unwarn', 'warnings', 'points', 'leaderboard'];
    const embed = new EmbedBuilder()
        .setTitle('**مــشـغـل الأوامــر <:Operator:1482800316821803262>**')
        .setColor(0x0099ff);

    let description = '';
    commandNames.forEach((cmd, index) => {
        const cmdAbbrevs = Object.entries(abbrevs)
            .filter(([, target]) => target === cmd)
            .map(([alias]) => `\`${alias}\``)
            .join(', ') || 'لا يوجد أوامر بعد';

        description += `** ${cmd} **\n${cmdAbbrevs}\n`;

        if (index < commandNames.length - 1) {
            description += '————————————————\n';
        }
    });

    embed.setDescription(description);
    return embed;
}

export async function execute(interaction) {
    const abbrevs = getAbbreviations();
    const embed = createAbbreviationsEmbed(abbrevs);

    const commandNames = ['ban', 'unban', 'timeout', 'untimeout', 'warn', 'unwarn', 'warnings', 'points', 'leaderboard'];
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('add_abbrev_select')
        .setPlaceholder('اختر أمر لإضافة مشغل له')
        .addOptions(commandNames.map(cmd => ({ label: cmd, value: cmd })));

    const selectRow = new ActionRowBuilder().addComponents(selectMenu);

    const editBtn = new ButtonBuilder()
        .setCustomId('edit_abbrev_btn')
        .setLabel('تعديل مشغل')
        .setEmoji('1482801910665842708')
        .setStyle(ButtonStyle.Secondary);

    const deleteBtn = new ButtonBuilder()
        .setCustomId('delete_abbrev_btn')
        .setLabel('إزالة مشغل')
        .setEmoji('1482801908832931942')
        .setStyle(ButtonStyle.Danger);

    const btnRow = new ActionRowBuilder().addComponents(editBtn, deleteBtn);

    await interaction.reply({
        embeds: [embed],
        components: [selectRow, btnRow],
        flags: MessageFlags.Ephemeral
    });
}
