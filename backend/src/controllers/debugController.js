const { PrismaClient } = require('@prisma/client');

exports.runSeed = async (req, res) => {
    const prisma = req.app.get('prisma');
    try {
        // Clear existing data (optional, but good for reset)
        // For safety, let's only add if empty or just merge

        // Create Categories
        const catMeat = await prisma.category.upsert({
            where: { id: 'cat-meat' },
            update: {},
            create: { id: 'cat-meat', name: 'Meats' }
        });
        const catVeg = await prisma.category.upsert({
            where: { id: 'cat-veg' },
            update: {},
            create: { id: 'cat-veg', name: 'Vegetables' }
        });
        const catDrink = await prisma.category.upsert({
            where: { id: 'cat-drink' },
            update: {},
            create: { id: 'cat-drink', name: 'Drinks' }
        });

        // Create Tiers
        const tierStandard = await prisma.buffetTier.upsert({
            where: { id: 'tier-std' },
            update: {},
            create: { id: 'tier-std', name: 'Standard', price: 299, duration: 90 }
        });

        // Create Menus
        await prisma.menu.upsert({
            where: { id: 'menu-1' },
            update: {},
            create: {
                id: 'menu-1',
                name: 'Wagyu Beef Wellington',
                nameTh: 'วากิวบีฟเวลลิงตัน',
                price: 0,
                categoryId: catMeat.id,
                image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop',
                buffetTiers: { connect: [{ id: tierStandard.id }] }
            }
        });

        await prisma.menu.upsert({
            where: { id: 'menu-2' },
            update: {},
            create: {
                id: 'menu-2',
                name: 'Crispy Pork Belly',
                nameTh: 'หมูกรอบสไตล์กูร์เมต์',
                price: 0,
                categoryId: catMeat.id,
                image: 'https://images.unsplash.com/photo-1606471191009-63994c53433b?q=80&w=800&auto=format&fit=crop',
                buffetTiers: { connect: [{ id: tierStandard.id }] }
            }
        });

        await prisma.menu.upsert({
            where: { id: 'menu-3' },
            update: {},
            create: {
                id: 'menu-3',
                name: 'Mineral Water',
                nameTh: 'น้ำแร่',
                price: 20,
                categoryId: catDrink.id,
                image: 'https://images.unsplash.com/photo-1560023907-5f339617ea30?q=80&w=800&auto=format&fit=crop'
            }
        });

        res.json({ message: 'Production data seeded successfully (Upserted)' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
