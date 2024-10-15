const { Client, GatewayIntentBits, REST, Routes, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { token, clientId, guildId, allowedRoles, speakingPoints, logsChannelId, doublePoints } = require('./config.json');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const numeral = require('numeral');  // Import numeral for formatting numbers

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageTyping
    ]
});

const pointsFilePath = './points.json';
let userPoints = {};

if (fs.existsSync(pointsFilePath)) {
    userPoints = JSON.parse(fs.readFileSync(pointsFilePath, 'utf8'));
}

function savePoints() {
    fs.writeFileSync(pointsFilePath, JSON.stringify(userPoints, null, 2));
}

function ensureUserExists(discordId) {
    if (!userPoints[discordId]) {
        userPoints[discordId] = { points: 0, lastDaily: null };
        savePoints();
    }
}

function addPoints(discordId, points) {
    ensureUserExists(discordId);
    userPoints[discordId].points += points;
    savePoints();
    return userPoints[discordId].points;
}

function subtractPoints(discordId, points) {
    ensureUserExists(discordId);
    userPoints[discordId].points -= points;
    savePoints();
    return userPoints[discordId].points;
}

function getPoints(discordId) {
    ensureUserExists(discordId);
    return userPoints[discordId].points;
}

function hasRequiredRole(member) {
    return member.roles.cache.some(role => allowedRoles.includes(role.id));
}

client.embed = (title, description, fields = [], color = 0x3498DB) => {
    return new EmbedBuilder().setTitle(title).setDescription(description).addFields(fields).setColor(color);
};

client.once('ready', () => {
    console.log('Bot is ready!');
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    
    const discordId = message.author.id;
    const messageLength = message.content.length;
    let pointsToAdd = 0;

    if (messageLength > speakingPoints.mediumLength) {
        pointsToAdd = speakingPoints.long;
    } else if (messageLength > speakingPoints.shortLength) {
        pointsToAdd = speakingPoints.medium;
    } else if (messageLength > 0) {
        pointsToAdd = speakingPoints.short;
    }

    if (doublePoints) {
        pointsToAdd *= 2;
    }

    if (pointsToAdd > 0) {
        addPoints(discordId, pointsToAdd);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, member, user, options } = interaction;

    if (commandName === 'add' || commandName === 'subtract') {
        if (!hasRequiredRole(member)) {
            const embed = client.embed(
                'Permission Denied',
                'You do not have permission to use this command.',
                [],
                0xFF0000
            );
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }

    const targetUser = options.getUser('user') || user;
    const discordId = targetUser.id;

    if (commandName === 'add') {
        const points = options.getInteger('points');
        const newBalance = addPoints(discordId, points);
        const formattedBalance = numeral(newBalance).format('0,0');
        const embed = client.embed(
            'Points Added',
            `${numeral(points).format('0,0')} points added to ${targetUser}.`,
            [{ name: 'New Balance', value: formattedBalance }],
            0x00FF00
        );
        await interaction.reply({ embeds: [embed] });

        const logsChannel = await client.channels.fetch(logsChannelId);
        if (logsChannel) {
            const logEmbed = client.embed(
                'Points Log',
                `${user} added ${numeral(points).format('0,0')} points to ${targetUser}.`,
                [{ name: 'New Balance', value: formattedBalance }]
            );
            await logsChannel.send({ embeds: [logEmbed] });
        }

    } else if (commandName === 'subtract') {
        const points = options.getInteger('points');
        const newBalance = subtractPoints(discordId, points);
        const formattedBalance = numeral(newBalance).format('0,0');
        const embed = client.embed(
            'Points Subtracted',
            `${numeral(points).format('0,0')} points subtracted from ${targetUser}.`,
            [{ name: 'New Balance', value: formattedBalance }],
            0xFFA500
        );
        await interaction.reply({ embeds: [embed] });

        const logsChannel = await client.channels.fetch(logsChannelId);
        if (logsChannel) {
            const logEmbed = client.embed(
                'Points Log',
                `${user} subtracted ${numeral(points).format('0,0')} points from ${targetUser}.`,
                [{ name: 'New Balance', value: formattedBalance }]
            );
            await logsChannel.send({ embeds: [logEmbed] });
        }
    } else if (commandName === 'points') {
        const points = getPoints(discordId);
        const formattedPoints = numeral(points).format('0,0');
        const embed = client.embed(
            'Points Balance',
            `${targetUser} has ${formattedPoints} points.`
        );
        await interaction.reply({ embeds: [embed] });
    } else if (commandName === 'daily') {
        const discordId = user.id;
        const currentTime = Date.now();
        const lastDaily = userPoints[discordId].lastDaily || 0;
        const dayInMs = 24 * 60 * 60 * 1000;

        if (currentTime - lastDaily >= dayInMs) {
            const randomPoints = Math.floor(Math.random() * 21) + 80;
            addPoints(discordId, randomPoints);
            userPoints[discordId].lastDaily = currentTime;
            savePoints();
            const embed = client.embed(
                'Daily Points',
                `You have received ${randomPoints} points for today.`
            );
            await interaction.reply({ embeds: [embed] });
        } else {
            const embed = client.embed(
                'Daily Points',
                `You have already claimed your daily points. Please try again later.`,
                [],
                0xFF0000
            );
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    } else if (commandName === 'leaderboard') {
        const users = Object.keys(userPoints).map(userId => ({
            userId,
            points: userPoints[userId].points
        })).sort((a, b) => b.points - a.points);

        const perPage = 10;
        let page = options.getInteger('page') || 1;

        const totalPages = Math.ceil(users.length / perPage);
        if (page > totalPages) page = totalPages;
        if (page < 1) page = 1;

        const start = (page - 1) * perPage;
        const leaderboard = users.slice(start, start + perPage).map((user, index) => {
            return `${start + index + 1}. <@${user.userId}> - ${numeral(user.points).format('0,0')} points`;
        }).join('\n');

        const embed = client.embed(
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
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    const page = parseInt(interaction.message.embeds[0].title.match(/Page (\d+)/)[1]);
    const totalPages = parseInt(interaction.message.embeds[0].title.match(/\/(\d+)/)[1]);

    let newPage = page;
    if (interaction.customId === 'previous') newPage--;
    if (interaction.customId === 'next') newPage++;

    const users = Object.keys(userPoints).map(userId => ({
        userId,
        points: userPoints[userId].points
    })).sort((a, b) => b.points - a.points);

    const perPage = 10;
    const start = (newPage - 1) * perPage;
    const leaderboard = users.slice(start, start + perPage).map((user, index) => {
        return `${start + index + 1}. <@${user.userId}> - ${numeral(user.points).format('0,0')} points`;
    }).join('\n');

    const embed = new EmbedBuilder()
        .setTitle(`Leaderboard - Page ${newPage}/${totalPages}`)
        .setDescription(leaderboard)
        .setColor(0x3498DB);

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('previous')
            .setLabel('Previous')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(newPage === 1),
        new ButtonBuilder()
            .setCustomId('next')
            .setLabel('Next')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(newPage === totalPages)
    );

    await interaction.update({ embeds: [embed], components: [row] });
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/api/add', (req, res) => {
    const { discordId, points } = req.body;
    if (!discordId || typeof points !== 'number') {
        return res.status(400).json({ error: 'Invalid request: discordId and points are required.' });
    }
    const newBalance = addPoints(discordId, points);
    return res.status(200).json({ message: `Added ${numeral(points).format('0,0')} points. New balance: ${numeral(newBalance).format('0,0')} points.` });
});

app.post('/api/subtract', (req, res) => {
    const { discordId, points } = req.body;
    if (!discordId || typeof points !== 'number') {
        return res.status(400).json({ error: 'Invalid request: discordId and points are required.' });
    }
    const newBalance = subtractPoints(discordId, points);
    return res.status(200).json({ message: `Subtracted ${numeral(points).format('0,0')} points. New balance: ${numeral(newBalance).format('0,0')} points.` });
});

app.get('/api/points', (req, res) => {
    const { discordId } = req.query;
    if (!discordId) {
        return res.status(400).json({ error: 'Invalid request: discordId is required.' });
    }
    const balance = getPoints(discordId);
    return res.status(200).json({ discordId, balance: numeral(balance).format('0,0') });
});

app.listen(PORT, () => {
    console.log(`API server is running on http://localhost:${PORT}`);
});