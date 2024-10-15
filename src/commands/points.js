const { SlashCommandBuilder } = require('discord.js');
const { getPoints } = require('../utils/pointsManager');
const createEmbed = require('../utils/embedBuilder');
const numeral = require('numeral');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('points')
        .setDescription('Check a user\'s points balance.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to check points for')
                .setRequired(false)),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const points = getPoints(targetUser.id);
        const formattedPoints = numeral(points).format('0,0');

        const embed = createEmbed(
            'Points Balance',
            `${targetUser} has ${formattedPoints} points.`
        );
        await interaction.reply({ embeds: [embed] });
    }
};
