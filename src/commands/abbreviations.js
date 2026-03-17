import { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    ContainerBuilder, 
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

export function createAbbreviationsContainer(abbrevs) {
    const commandNames = ['ban', 'unban', 'timeout', 'untimeout', 'warn', 'unwarn', 'warnings', 'points', 'leaderboard'];
    const container = new ContainerBuilder()
        .setAccentColor(0x0099ff);

    container.addTextDisplayComponents((text) => 
        text.setContent('**مــشـغـل الأوامــر <:Operator:1482800316821803262>**')
    );

    container.addTextDisplayComponents((text) => text.setContent('————————————————'));

    commandNames.forEach((cmd, index) => {
        const cmdAbbrevs = Object.entries(abbrevs)
            .filter(([, target]) => target === cmd)
            .map(([alias]) => `- ** ${alias} **`)
            .join('\n') || 'لا يوجد أوامر بعد';

        container.addTextDisplayComponents((text) => 
            text.setContent(`** ${cmd} **\n${cmdAbbrevs}`)
        );

        if (index < commandNames.length - 1) {
            container.addTextDisplayComponents((text) => text.setContent('————————————————'));
        }
    });

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('add_abbrev_select')
        .setPlaceholder('اختر أمر لإضافة مشغل له')
        .addOptions(commandNames.map(cmd => ({ label: cmd, value: cmd })));

    container.addActionRowComponents((row) => row.setComponents(selectMenu));
    return container;
}

export async function execute(interaction) {
    const abbrevs = getAbbreviations();
    const container = createAbbreviationsContainer(abbrevs);

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

    const row = new ActionRowBuilder().addComponents(editBtn, deleteBtn);

    await interaction.reply({
        components: [container, row],
        flags: MessageFlags.IsComponentsV2
    });
}
