require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const chatRoutes = require('./routes/chat');
const conversationRoutes = require('./routes/conversations');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/chat', chatRoutes);
app.use('/api/conversations', conversationRoutes);

app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'Curalink API',
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error('[Error]', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
});

// ─── MongoDB + Server Start ───────────────────────────────────────────────────
mongoose
    .connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
    })
    .then(() => {
        console.log('[MongoDB] Connected:', process.env.MONGO_URI);
        app.listen(PORT, () => {
            console.log(`[Server] Curalink API running on http://localhost:${PORT}`);
            console.log(`[Server] Health: http://localhost:${PORT}/api/health`);
        });
    })
    .catch((err) => {
        console.error('[MongoDB] Connection failed:', err.message);
        console.warn('[Server] Starting without MongoDB (conversations will not persist)...');
        app.listen(PORT, () => {
            console.log(`[Server] Curalink API running (no DB) on http://localhost:${PORT}`);
        });
    });

module.exports = app;
