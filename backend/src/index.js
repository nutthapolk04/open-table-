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

        // Create Buffet Tiers
        const tierStandard = await prisma.buffetTier.create({
            data: { name: 'Standard', price: 299, duration: 90, description: 'Basic buffet' }
        });
        const tierPremium = await prisma.buffetTier.create({
            data: { name: 'Premium', price: 499, duration: 120, description: 'Premium selection' }
        });

        // Create Menus
        await prisma.menu.create({
            data: {
                name: 'Wagyu Beef Wellington', nameTh: 'วากิวบีฟเวลลิงตัน',
                description: 'Succulent Wagyu beef wrapped in mushroom duxelles and puff pastry.',
                image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop',
                categoryId: catMeat.id,
                buffetTiers: { connect: [{ id: tierPremium.id }] }
            }
        });
        await prisma.menu.create({
            data: {
                name: 'Crispy Pork Belly', nameTh: 'หมูกรอบสไตล์กูร์เมต์',
                description: 'Double-cooked pork belly with a honey balsamic glaze.',
                image: 'https://images.unsplash.com/photo-1606471191009-63994c53433b?q=80&w=800&auto=format&fit=crop',
                categoryId: catMeat.id,
                buffetTiers: { connect: [{ id: tierStandard.id }, { id: tierPremium.id }] }
            }
        });
        await prisma.menu.create({
            data: {
                name: 'Premium Beef Sirloin', nameTh: 'เนื้อสันนอกพรีเมียม',
                description: 'Prime cut beef sirloin grilled to perfection.',
                image: 'https://images.unsplash.com/photo-1558030006-450675393462?q=80&w=800&auto=format&fit=crop',
                categoryId: catMeat.id,
                buffetTiers: { connect: [{ id: tierPremium.id }] }
            }
        });
        await prisma.menu.create({
            data: {
                name: 'Garden Fresh Medley', nameTh: 'เมนูผักสวนรักธรรมชาติ',
                description: 'Seasonal organic vegetables from local farms.',
                image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=800&auto=format&fit=crop',
                categoryId: catVeg.id,
                buffetTiers: { connect: [{ id: tierStandard.id }, { id: tierPremium.id }] }
            }
        });
        await prisma.menu.create({
            data: {
                name: 'Grilled Asparagus', nameTh: 'หน่อไม้ฝรั่งย่าง',
                description: 'Fresh asparagus with garlic butter and parmesan.',
                image: 'https://images.unsplash.com/photo-1515516969-d4008cc6241a?q=80&w=800&auto=format&fit=crop',
                categoryId: catVeg.id,
                buffetTiers: { connect: [{ id: tierStandard.id }, { id: tierPremium.id }] }
            }
        });
        await prisma.menu.create({
            data: {
                name: 'Fine Mineral Water', nameTh: 'น้ำแร่ธรรมชาติ',
                description: 'Naturally filtered volcanic mineral water.',
                image: 'https://images.unsplash.com/photo-1560023907-5f339617ea30?q=80&w=800&auto=format&fit=crop',
                price: 20, categoryId: catDrink.id
            }
        });
        await prisma.menu.create({
            data: {
                name: 'Thai Iced Tea', nameTh: 'ชาไทยเย็น',
                description: 'Classic Thai iced tea with condensed milk.',
                image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=800&auto=format&fit=crop',
                price: 45, categoryId: catDrink.id
            }
        });
        await prisma.menu.create({
            data: {
                name: 'Fresh Coconut Water', nameTh: 'น้ำมะพร้าวสด',
                description: 'Chilled fresh young coconut water.',
                image: 'https://images.unsplash.com/photo-1525385133512-2f3bdd585a94?q=80&w=800&auto=format&fit=crop',
                price: 35, categoryId: catDrink.id
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
