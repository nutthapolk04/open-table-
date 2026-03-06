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
        data: { name: 'Standard', price: 299, duration: 90, description: 'Basic buffet' }
    });
    const tierPremium = await prisma.buffetTier.create({
        data: { name: 'Premium', price: 499, duration: 120, description: 'Premium selection' }
    });

    // Create Menus
    const beef = await prisma.menu.create({
        data: {
            name: 'Wagyu Beef Wellington',
            nameTh: 'วากิวบีฟเวลลิงตัน',
            description: 'Succulent Wagyu beef wrapped in mushroom duxelles and puff pastry, served with a red wine reduction.',
            descriptionTh: 'เนื้อวากิวเกรดพรีเมียมห่อด้วยเห็ดดักเซลและแป้งพัฟอบกรอบ เสิร์ฟพร้อมซอสไวน์แดงสูตรเข้มข้น',
            image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop',
            categoryId: catMeat.id,
            buffetTiers: { connect: [{ id: tierPremium.id }] }
        }
    });

    const pork = await prisma.menu.create({
        data: {
            name: 'Crispy Pork Belly',
            nameTh: 'หมูกรอบสไตล์กูร์เมต์',
            description: 'Double-cooked pork belly with a honey balsamic glaze and seasonal microgreens.',
            descriptionTh: 'หมูสามชั้นอบกรอบสองขั้นตอน เคลือบซอสน้ำผึ้งบัลซามิก เสิร์ฟพร้อมผักไมโครกรีนตามฤดูกาล',
            image: 'https://images.unsplash.com/photo-1606471191009-63994c53433b?q=80&w=800&auto=format&fit=crop',
            categoryId: catMeat.id,
            buffetTiers: { connect: [{ id: tierStandard.id }, { id: tierPremium.id }] }
        }
    });

    const water = await prisma.menu.create({
        data: {
            name: 'Fine Mineral Water',
            nameTh: 'น้ำแร่ธรรมชาติบริสุทธิ์',
            description: 'Naturally filtered volcanic mineral water, served chilled.',
            descriptionTh: 'น้ำแร่ธรรมชาติที่ผ่านการกรองจากชั้นหินภูเขาไฟ เสิร์ฟเย็นเพื่อความสดชื่น',
            image: 'https://images.unsplash.com/photo-1560023907-5f339617ea30?q=80&w=800&auto=format&fit=crop',
            price: 20,
            categoryId: catDrink.id
        }
    });

    // Add more variety for better UI demonstration
    await prisma.menu.create({
        data: {
            name: 'Garden Fresh Medley',
            nameTh: 'เมนูผักสวนรักธรรมชาติ',
            description: 'Seasonal organic vegetables sourced from local farms.',
            descriptionTh: 'ผักออร์แกนิคตามฤดูกาล คัดสรรสดใหม่จากฟาร์มท้องถิ่นเพื่อสุขภาพที่ดี',
            image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=800&auto=format&fit=crop',
            categoryId: catVeg.id,
            buffetTiers: { connect: [{ id: tierStandard.id }, { id: tierPremium.id }] }
        }
    });

    // Create Demo Session
    const demoTable = await prisma.table.findFirst({ where: { number: 'A1' } });
    await prisma.session.create({
        data: {
            id: 'demo',
            tableId: demoTable.id,
            tierId: tierStandard.id,
            customerCount: 2,
            token: 'demo-token',
            status: 'ACTIVE'
        }
    });

    // Update table status for demo
    await prisma.table.update({
        where: { id: demoTable.id },
        data: { status: 'OCCUPIED' }
    });

    console.log('Seed data created successfully with demo session');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
