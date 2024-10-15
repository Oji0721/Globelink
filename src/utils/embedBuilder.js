const { EmbedBuilder } = require('discord.js');

function createEmbed(title, description, fields = [], color = 0x3498DB) {
    return new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .addFields(fields)
        .setColor(color);
}

module.exports = createEmbed;
