exports.getZones = async (req, res) => {
    const prisma = req.app.get('prisma');
    try {
        const zones = await prisma.zone.findMany({
            include: {
                tables: {
                    include: {
                        sessions: {
                            where: { status: 'ACTIVE' }
                        }
                    }
                }
            }
        });
        res.json(zones);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createZone = async (req, res) => {
    const prisma = req.app.get('prisma');
    const { name } = req.body;
    try {
        const zone = await prisma.zone.create({
            data: { name }
        });
        res.json(zone);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createTable = async (req, res) => {
    const prisma = req.app.get('prisma');
    const { number, zoneId, seats } = req.body;
    try {
        const table = await prisma.table.create({
            data: { number, zoneId, seats: seats ? parseInt(seats) : 4 }
        });
        res.json(table);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getTables = async (req, res) => {
    const prisma = req.app.get('prisma');
    try {
        const tables = await prisma.table.findMany({
            include: {
                zone: true,
                sessions: {
                    where: { status: 'ACTIVE' },
                    include: {
                        orders: {
                            include: { items: { include: { menu: true } } }
                        }
                    }
                }
            }
        });
        res.json(tables);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
