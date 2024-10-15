const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { userPoints } = require('../utils/pointsManager');
const createEmbed = require('../utils/embedBuilder');
const numeral = require('numeral');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Display the points leaderboard.')
        .addIntegerOption(option =>
            option.setName('page')
                .setDescription('Page number to display')
                .setRequired(false)),
    async execute(interaction) {
        const users = Object.keys(userPoints).map(userId => ({
            userId,
            points: userPoints[userId].points
        })).sort((a, b) => b.points - a.points);

        const perPage = 10;
        let page = interaction.options.getInteger('page') || 1;

        const totalPages = Math.ceil(users.length / perPage) || 1;
        if (page > totalPages) page = totalPages;
        if (page < 1) page = 1;

        const start = (page - 1) * perPage;
        const leaderboard = users.slice(start, start + perPage).map((user, index) => {
            return `${start + index + 1}. <@${user.userId}> - ${numeral(user.points).format('0,0')} points`;
        }).join('\n') || 'No users with points yet.';

        const embed = createEmbed(
            `Leaderboard - Page ${page}/${totalPages}`,
            leaderboard
        );

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('previous')
                .setLabel('Previous')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page === 1),
            new ButtonBuilder()
                .setCustomId('next')
                .setLabel('Next')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page === totalPages)
        );

        await interaction.reply({ embeds: [embed], components: [row] });
    }
};
