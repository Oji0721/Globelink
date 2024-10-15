const { Collection } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error executing that command.', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'There was an error executing that command.', ephemeral: true });
                }
            }
        } else if (interaction.isButton()) {
            const embed = interaction.message.embeds[0];
            if (!embed || !embed.title) return;
            const titleMatch = embed.title.match(/Page (\d+)\/(\d+)/);
            if (!titleMatch) return;
            let page = parseInt(titleMatch[1]);
            const totalPages = parseInt(titleMatch[2]);
            if (interaction.customId === 'previous') page--;
            if (interaction.customId === 'next') page++;
            const config = require('../config/config.json');
            const { userPoints } = require('../utils/pointsManager');
            const users = Object.keys(userPoints).map(userId => ({
                userId,
                points: userPoints[userId].points
            })).sort((a, b) => b.points - a.points);
            const perPage = 10;
            const start = (page - 1) * perPage;
            const leaderboard = users.slice(start, start + perPage).map((user, index) => {
                return `${start + index + 1}. <@${user.userId}> - ${numeral(user.points).format('0,0')} points`;
            }).join('\n') || 'No users with points yet.';
            const createEmbed = require('../utils/embedBuilder');
            const numeral = require('numeral');
            const newEmbed = createEmbed(
                `Leaderboard - Page ${page}/${totalPages}`,
                leaderboard
            );
            const row = {
                components: [
                    {
                        type: 2,
                        style: 1,
                        label: 'Previous',
                        custom_id: 'previous',
                        disabled: page === 1
                    },
                    {
                        type: 2,
                        style: 1,
                        label: 'Next',
                        custom_id: 'next',
                        disabled: page === totalPages
                    }
                ]
            };
            await interaction.update({ embeds: [newEmbed], components: [row] });
        }
    }
};
