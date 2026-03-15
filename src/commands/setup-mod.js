import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getConfig, saveConfig } from '../config.js';

export const data = new SlashCommandBuilder()
    .setName('setup-mod')
    .setDescription('تحديد الرتبة المسؤولة عن أوامر التايم والتحذير')
    .addRoleOption(option => 
        option.setName('role')
            .setDescription('الرتبة')
            .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
    const role = interaction.options.getRole('role');
    const config = getConfig();
    
    if (!config[interaction.guildId]) config[interaction.guildId] = {};
    config[interaction.guildId].modRoleId = role.id;
    
    saveConfig(config);
    
    await interaction.reply(`**تــم تــحـديـد رتـبـة <@&${role.id}> كـرتـبـة مـسـؤولـة عـن الإدارة!**`);
}
