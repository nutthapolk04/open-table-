const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN || "*"
}));
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (req.method === 'POST' || req.method === 'PATCH') {
        console.log('Body:', JSON.stringify(req.body, null, 2));
    }
    next();
});

// Routes
const routes = require('./routes');
const path = require('path');
app.use('/public', express.static(path.join(__dirname, '../public')));
app.use('/api', routes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

module.exports = app;
