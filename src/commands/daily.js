const { SlashCommandBuilder } = require('discord.js');
const { addPoints, savePoints } = require('../utils/pointsManager');
const createEmbed = require('../utils/embedBuilder');
const numeral = require('numeral');
const config = require('../config/config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Claim your daily points.'),
    async execute(interaction) {
        const userId = interaction.user.id;
        const currentTime = Date.now();
        const userData = require('../utils/pointsManager').userPoints[userId] || {};

        const lastDaily = userData.lastDaily || 0;
        const dayInMs = 24 * 60 * 60 * 1000;

        if (currentTime - lastDaily >= dayInMs) {
            const randomPoints = Math.floor(Math.random() * 21) + 80;
            addPoints(userId, randomPoints);
            require('../utils/pointsManager').userPoints[userId].lastDaily = currentTime;
            savePoints();

            const embed = createEmbed(
                'Daily Points',
                `You have received ${numeral(randomPoints).format('0,0')} points for today.`,
                [],
                0x00FF00
            );
            await interaction.reply({ embeds: [embed] });
        } else {
            const embed = createEmbed(
                'Daily Points',
                `You have already claimed your daily points. Please try again later.`,
                [],
                0xFF0000
            );
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
