const crypto = require('crypto');

exports.openSession = async (req, res) => {
    const prisma = req.app.get('prisma');
    const { tableId, tierId, customerCount } = req.body;
    try {
        const token = crypto.randomBytes(16).toString('hex');
        const session = await prisma.session.create({
            data: {
                tableId,
                tierId,
                customerCount,
                token,
                status: 'ACTIVE'
            }
        });

        // Update table status
        await prisma.table.update({
            where: { id: tableId },
            data: { status: 'OCCUPIED' }
        });

        res.json(session);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.placeOrder = async (req, res) => {
    const prisma = req.app.get('prisma');
    const io = req.app.get('io');
    const { sessionId, items } = req.body;
    try {
        const order = await prisma.order.create({
            data: {
                sessionId,
                status: 'PENDING',
                items: {
                    create: items.map(item => ({
                        menuId: item.menuId,
                        quantity: item.quantity,
                        note: item.note
                    }))
                }
            },
            include: { items: { include: { menu: true } } }
        });

        // Notify POS and Kitchen
        io.emit('new-order', order);

        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.closeSession = async (req, res) => {
    const prisma = req.app.get('prisma');
    const { sessionId } = req.body;
    try {
        const session = await prisma.session.update({
            where: { id: sessionId },
            data: { status: 'CLOSED', endTime: new Date() }
        });

        await prisma.table.update({
            where: { id: session.tableId },
            data: { status: 'CLEANING' }
        });

        res.json(session);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
