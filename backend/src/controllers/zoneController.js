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
            },
            orderBy: { createdAt: 'asc' }
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
            },
            orderBy: [
                { zone: { createdAt: 'asc' } },
                { number: 'asc' }
            ]
        });
        res.json(tables);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateTable = async (req, res) => {
    const prisma = req.app.get('prisma');
    const io = req.app.get('io');
    const { id } = req.params;
    const { number, seats, status } = req.body;
    try {
        const table = await prisma.table.update({
            where: { id },
            data: {
                number,
                seats: seats ? parseInt(seats) : undefined,
                status: status || undefined
            }
        });

        // Notify all clients that table status changed
        if (io) io.emit('table-status-updated', table);

        res.json(table);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteTable = async (req, res) => {
    const prisma = req.app.get('prisma');
    const { id } = req.params;
    try {
        const table = await prisma.table.findUnique({ where: { id } });
        if (!table) return res.status(404).json({ error: 'Table not found' });

        if (table.status !== 'FREE') {
            return res.status(400).json({ error: 'Cannot delete table while it is occupied or being cleaned.' });
        }

        await prisma.table.delete({ where: { id } });
        res.json({ message: 'Table deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteZone = async (req, res) => {
    const prisma = req.app.get('prisma');
    const { id } = req.params;
    const { force } = req.query;

    try {
        const zone = await prisma.zone.findUnique({
            where: { id },
            include: { tables: true }
        });

        if (!zone) return res.status(404).json({ error: 'Zone not found' });

        // RESTRICTION: Cannot delete zone if any table is occupied or cleaning
        if (zone.tables.some(t => t.status !== 'FREE')) {
            return res.status(400).json({ 
                error: 'Cannot delete zone because some tables are currently occupied or being cleaned.' 
            });
        }

        if (zone.tables.length > 0 && force !== 'true') {
            return res.status(400).json({
                error: 'Zone has tables. Use force=true to delete all empty tables and the zone.',
                hasTables: true
            });
        }

        if (force === 'true') {
            // Delete all tables in zone first (already checked they are FREE)
            await prisma.table.deleteMany({ where: { zoneId: id } });
        }

        await prisma.zone.delete({ where: { id } });
        res.json({ message: 'Zone deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateZone = async (req, res) => {
    const prisma = req.app.get('prisma');
    const { id } = req.params;
    const { name, isActive } = req.body;
    try {
        const zone = await prisma.zone.update({
            where: { id },
            data: { 
                name: name || undefined,
                isActive: isActive !== undefined ? isActive : undefined
            }
        });
        res.json(zone);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
