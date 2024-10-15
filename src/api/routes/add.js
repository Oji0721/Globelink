const express = require('express');
const router = express.Router();
const { addPoints } = require('../../utils/pointsManager');
const numeral = require('numeral');

router.post('/', (req, res) => {
    const { discordId, points } = req.body;
    if (!discordId || typeof points !== 'number') {
        return res.status(400).json({ error: 'Invalid request: discordId and points are required.' });
    }
    if (points < 0) {
        return res.status(400).json({ error: 'Points to add must be a positive number.' });
    }
    const newBalance = addPoints(discordId, points);
    return res.status(200).json({ message: `Added ${numeral(points).format('0,0')} points. New balance: ${numeral(newBalance).format('0,0')} points.` });
});

module.exports = router;
