const express = require('express');
const bodyParser = require('body-parser');
const addRoute = require('./routes/add');
const subtractRoute = require('./routes/subtract');
const pointsRoute = require('./routes/points');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.use('/api/add', addRoute);
app.use('/api/subtract', subtractRoute);
app.use('/api/points', pointsRoute);

app.get('/', (req, res) => {
    res.send('Discord Bot API is running.');
});

app.listen(PORT, () => {
    console.log(`API server is running on http://localhost:${PORT}`);
});
