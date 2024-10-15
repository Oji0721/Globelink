const fs = require('fs');
const path = require('path');
const config = require('../config/config.json');

const pointsFilePath = path.resolve(__dirname, '../../', config.pointsFilePath);
let userPoints = {};

if (fs.existsSync(pointsFilePath)) {
    userPoints = JSON.parse(fs.readFileSync(pointsFilePath, 'utf8'));
} else {
    const dataDir = path.dirname(pointsFilePath);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(pointsFilePath, JSON.stringify({}, null, 2));
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

module.exports = {
    addPoints,
    subtractPoints,
    getPoints,
    ensureUserExists,
    userPoints,
    savePoints
};
