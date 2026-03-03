const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Clear existing data
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.session.deleteMany();
    await prisma.menu.deleteMany();
    await prisma.category.deleteMany();
    await prisma.buffetTier.deleteMany();
    await prisma.table.deleteMany();
    await prisma.zone.deleteMany();

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
        data: { name: 'Standard', price: 299, description: 'Basic buffet' }
    });
    const tierPremium = await prisma.buffetTier.create({
        data: { name: 'Premium', price: 499, description: 'Premium selection' }
    });

    // Create Menus
    const beef = await prisma.menu.create({
        data: {
            name: 'Wagyu Beef',
            categoryId: catMeat.id,
            buffetTiers: { connect: [{ id: tierPremium.id }] }
        }
    });

    const pork = await prisma.menu.create({
        data: {
            name: 'Pork Belly',
            categoryId: catMeat.id,
            buffetTiers: { connect: [{ id: tierStandard.id }, { id: tierPremium.id }] }
        }
    });

    const water = await prisma.menu.create({
        data: {
            name: 'Drinking Water',
            price: 20,
            categoryId: catDrink.id
        }
    });

    console.log('Seed data created successfully');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
