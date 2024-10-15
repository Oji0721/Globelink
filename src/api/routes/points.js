const express = require('express');
const router = express.Router();
const { getPoints } = require('../../utils/pointsManager');
const numeral = require('numeral');

router.get('/', (req, res) => {
    const { discordId } = req.query;
    if (!discordId) {
        return res.status(400).json({ error: 'Invalid request: discordId is required.' });
    }
    const balance = getPoints(discordId);
    return res.status(200).json({ discordId, balance: numeral(balance).format('0,0') });
});

module.exports = router;
