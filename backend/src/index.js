const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Adjust for production
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Socket.IO Logic
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join-table', (sessionId) => {
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

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
