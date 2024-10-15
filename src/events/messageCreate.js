const config = require('../config/config.json');
const { addPoints } = require('../utils/pointsManager');

module.exports = {
    name: 'messageCreate',
    execute(message) {
        if (message.author.bot) return;

        const discordId = message.author.id;
        const messageLength = message.content.length;
        let pointsToAdd = 0;

        const speakingPoints = config.speakingPoints;

        if (messageLength > speakingPoints.mediumLength) {
            pointsToAdd = speakingPoints.long;
        } else if (messageLength > speakingPoints.shortLength) {
            pointsToAdd = speakingPoints.medium;
        } else if (messageLength > 0) {
            pointsToAdd = speakingPoints.short;
        }

        if (config.doublePoints) {
            pointsToAdd *= 2;
        }

        if (pointsToAdd > 0) {
            addPoints(discordId, pointsToAdd);
        }
    }
};
