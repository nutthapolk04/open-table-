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

// Auto-seed production DB if empty
async function autoSeed() {
    try {
        const categoryCount = await prisma.category.count();
        if (categoryCount > 0) {
            console.log(`DB already has ${categoryCount} categories, skipping seed.`);
            return;
        }
        console.log('DB is empty — running auto-seed...');

        // Create Zones
        const zoneA = await prisma.zone.create({ data: { name: 'Main Hall' } });
        const zoneB = await prisma.zone.create({ data: { name: 'VIP Room' } });

        // Create Tables
        for (let i = 1; i <= 5; i++) {
            await prisma.table.create({ data: { number: `A${i}`, zoneId: zoneA.id } });
        }
        for (let i = 1; i <= 2; i++) {
            await prisma.table.create({ data: { number: `V${i}`, zoneId: zoneB.id } });
        }

        // Create Categories
        const catMeat = await prisma.category.create({ data: { name: 'Meats' } });
        const catVeg = await prisma.category.create({ data: { name: 'Vegetables' } });
        const catDrink = await prisma.category.create({ data: { name: 'Drinks' } });
        const catAddon = await prisma.category.create({ data: { name: 'Add-ons' } });

        // Create Buffet Tiers
        const tierStandard = await prisma.buffetTier.create({
            data: { name: 'Standard', price: 299, duration: 90, description: 'Basic buffet' }
        });
        const tierPremium = await prisma.buffetTier.create({
            data: { name: 'Premium', price: 499, duration: 120, description: 'Premium selection' }
        });

        const baseUrl = process.env.BACKEND_URL || 'http://localhost:3000';

        // Create Menus
        await prisma.menu.create({
            data: {
                name: 'Wagyu Beef Wellington', nameTh: 'วากิวบีฟเวลลิงตัน',
                description: 'Succulent Wagyu beef wrapped in mushroom duxelles and puff pastry.',
                image: `${baseUrl}/public/images/wagyu.png`,
                categoryId: catMeat.id,
                buffetTiers: { connect: [{ id: tierPremium.id }] }
            }
        });
        await prisma.menu.create({
            data: {
                name: 'Crispy Pork Belly', nameTh: 'หมูกรอบสไตล์กูร์เมต์',
                description: 'Double-cooked pork belly with a crunchy skin and honey balsamic glaze.',
                image: `${baseUrl}/public/images/pork_belly.png`,
                categoryId: catMeat.id,
                buffetTiers: { connect: [{ id: tierStandard.id }, { id: tierPremium.id }] }
            }
        });
        await prisma.menu.create({
            data: {
                name: 'Garden Fresh Medley', nameTh: 'เมนูผักสวนรักธรรมชาติ',
                description: 'Seasonal organic vegetables from local farms.',
                image: `${baseUrl}/public/images/salad.png`,
                categoryId: catVeg.id,
                buffetTiers: { connect: [{ id: tierStandard.id }, { id: tierPremium.id }] }
            }
        });
        await prisma.menu.create({
            data: {
                name: 'Fine Mineral Water', nameTh: 'น้ำแร่ธรรมชาติ',
                description: 'Naturally filtered volcanic mineral water.',
                image: `${baseUrl}/public/images/water.png`,
                price: 20, 
                categoryId: catDrink.id
            }
        });

        // Add-ons
        await prisma.menu.create({
            data: {
                name: 'Extra Truffle Sauce', nameTh: 'ซอสทรัฟเฟิลพิเศษ',
                description: 'Rich and aromatic black truffle dipping sauce.',
                image: `${baseUrl}/public/images/truffle_sauce.png`,
                price: 59,
                categoryId: catAddon.id,
                buffetTiers: { connect: [{ id: tierPremium.id }] }
            }
        });

        await prisma.menu.create({
            data: {
                name: 'Soft Boiled Egg', nameTh: 'ไข่ต้มยางมะตูม',
                description: 'Perfectly cooked soft boiled egg.',
                image: '🥚',
                price: 15,
                categoryId: catAddon.id,
                buffetTiers: { connect: [{ id: tierStandard.id }, { id: tierPremium.id }] }
            }
        });

        console.log('Auto-seed completed successfully!');
    } catch (error) {
        console.error('Auto-seed error:', error.message);
    }
}

server.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    await autoSeed();
});
