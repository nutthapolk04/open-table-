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
        const catAddon = await prisma.category.upsert({
            where: { id: 'cat-addon' },
            update: {},
            create: { id: 'cat-addon', name: 'Add-ons' }
        });

        // Create Tiers
        const tierStandard = await prisma.buffetTier.upsert({
            where: { id: 'tier-std' },
            update: {},
            create: { id: 'tier-std', name: 'Standard', price: 299, duration: 90 }
        });
        const tierPremium = await prisma.buffetTier.upsert({
            where: { id: 'tier-prem' },
            update: {},
            create: { id: 'tier-prem', name: 'Premium', price: 499, duration: 120 }
        });

        const baseUrl = process.env.BACKEND_URL || 'http://localhost:3000';

        // Create Menus
        await prisma.menu.upsert({
            where: { id: 'menu-1' },
            update: { image: `${baseUrl}/public/images/wagyu.png` },
            create: {
                id: 'menu-1',
                name: 'Wagyu Beef Wellington',
                nameTh: 'วากิวบีฟเวลลิงตัน',
                price: 0,
                categoryId: catMeat.id,
                image: `${baseUrl}/public/images/wagyu.png`,
                buffetTiers: { connect: [{ id: tierPremium.id }] }
            }
        });

        await prisma.menu.upsert({
            where: { id: 'menu-2' },
            update: { image: `${baseUrl}/public/images/pork_belly.png` },
            create: {
                id: 'menu-2',
                name: 'Crispy Pork Belly',
                nameTh: 'หมูกรอบสไตล์กูร์เมต์',
                price: 0,
                categoryId: catMeat.id,
                image: `${baseUrl}/public/images/pork_belly.png`,
                buffetTiers: { connect: [{ id: tierStandard.id }, { id: tierPremium.id }] }
            }
        });

        await prisma.menu.upsert({
            where: { id: 'menu-3' },
            update: { image: `${baseUrl}/public/images/water.png` },
            create: {
                id: 'menu-3',
                name: 'Mineral Water',
                nameTh: 'น้ำแร่',
                price: 20,
                categoryId: catDrink.id,
                image: `${baseUrl}/public/images/water.png`
            }
        });

        await prisma.menu.upsert({
            where: { id: 'menu-4' },
            update: { image: `${baseUrl}/public/images/salad.png` },
            create: {
                id: 'menu-4',
                name: 'Garden Fresh Medley',
                nameTh: 'ผักสวนรักธรรมชาติ',
                price: 0,
                categoryId: catVeg.id,
                image: `${baseUrl}/public/images/salad.png`,
                buffetTiers: { connect: [{ id: tierStandard.id }, { id: tierPremium.id }] }
            }
        });

        await prisma.menu.upsert({
            where: { id: 'menu-5' },
            update: { image: `${baseUrl}/public/images/truffle_sauce.png` },
            create: {
                id: 'menu-5',
                name: 'Extra Truffle Sauce',
                nameTh: 'ซอสทรัฟเฟิลพิเศษ',
                price: 59,
                categoryId: catAddon.id,
                image: `${baseUrl}/public/images/truffle_sauce.png`
            }
        });

        // Ensure demo session for Vercel demo URL
        const firstTable = await prisma.table.findFirst();
        if (firstTable) {
            await prisma.session.upsert({
                where: { id: 'demo' },
                update: { status: 'ACTIVE' },
                create: {
                    id: 'demo',
                    tableId: firstTable.id,
                    tierId: tierStandard.id,
                    customerCount: 2,
                    token: 'demo-token',
                    status: 'ACTIVE'
                }
            });
        }

        res.json({ message: 'Production data seeded successfully (Upserted)' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
