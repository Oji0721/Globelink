const express = require('express');
const router = express.Router();
const { subtractPoints } = require('../../utils/pointsManager');
const numeral = require('numeral');

router.post('/', (req, res) => {
    const { discordId, points } = req.body;
    if (!discordId || typeof points !== 'number') {
        return res.status(400).json({ error: 'Invalid request: discordId and points are required.' });
    }
    if (points < 0) {
        return res.status(400).json({ error: 'Points to subtract must be a positive number.' });
    }
    const newBalance = subtractPoints(discordId, points);
    return res.status(200).json({ message: `Subtracted ${numeral(points).format('0,0')} points. New balance: ${numeral(newBalance).format('0,0')} points.` });
});

module.exports = router;
