require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Socket.IO Logic
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join-session', (sessionId) => {
        socket.join(`session-${sessionId}`);
        console.log(`Socket joined session-${sessionId}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Attach io to app for use in routes
app.set('io', io);
app.set('prisma', prisma);

// Real-time time updates
setInterval(async () => {
    try {
        const activeSessions = await prisma.session.findMany({
            where: { status: 'ACTIVE' },
            include: { tier: true }
        });

        for (const session of activeSessions) {
            const startTime = new Date(session.startTime).getTime();
            const durationMs = (session.tier?.duration || 90) * 60 * 1000;
            const now = new Date().getTime();
            const elapsed = now - startTime;
            const remaining = Math.max(0, durationMs - elapsed);

            // Format as HH:MM:SS
            const hours = Math.floor(remaining / 3600000);
            const minutes = Math.floor((remaining % 3600000) / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            const timeLeft = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

            io.to(`session-${session.id}`).emit('time-update', { sessionId: session.id, timeLeft, remainingMs: remaining });

            // Auto-close session if time is up (Optional, but good for demo)
            // if (remaining <= 0) {
            //     await prisma.session.update({ where: { id: session.id }, data: { status: 'CLOSED', endTime: new Date() } });
            //     await prisma.table.update({ where: { id: session.tableId }, data: { status: 'CLEANING' } });
            // }
        }
    } catch (error) {
        console.error('Time update error:', error);
    }
}, 1000);

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
