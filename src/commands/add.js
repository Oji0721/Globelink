const { SlashCommandBuilder } = require('discord.js');
const { addPoints } = require('../utils/pointsManager');
const createEmbed = require('../utils/embedBuilder');
const numeral = require('numeral');
const config = require('../config/config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add')
        .setDescription('Add points to a user.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to add points to')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('points')
                .setDescription('Number of points to add')
                .setRequired(true)),
    async execute(interaction) {
        const member = interaction.member;
        const allowedRoles = config.allowedRoles;

        const hasPermission = member.roles.cache.some(role => allowedRoles.includes(role.id));
        if (!hasPermission) {
            const embed = createEmbed(
                'Permission Denied',
                'You do not have permission to use this command.',
                [],
                0xFF0000
            );
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const targetUser = interaction.options.getUser('user');
        const points = interaction.options.getInteger('points');

        if (points < 0) {
            const embed = createEmbed(
                'Invalid Points',
                'Points to add must be a positive number.',
                [],
                0xFF0000
            );
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const newBalance = addPoints(targetUser.id, points);
        const formattedBalance = numeral(newBalance).format('0,0');

        const embed = createEmbed(
            'Points Added',
            `${numeral(points).format('0,0')} points added to ${targetUser}.`,
            [{ name: 'New Balance', value: formattedBalance }],
            0x00FF00
        );
        await interaction.reply({ embeds: [embed] });

        const logsChannelId = config.logsChannelId;
        const client = interaction.client;
        const logsChannel = await client.channels.fetch(logsChannelId);
        if (logsChannel) {
            const logEmbed = createEmbed(
                'Points Log',
                `${interaction.user} added ${numeral(points).format('0,0')} points to ${targetUser}.`,
                [{ name: 'New Balance', value: formattedBalance }]
            );
            await logsChannel.send({ embeds: [logEmbed] });
        }
    }
};
