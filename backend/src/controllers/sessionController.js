const crypto = require('crypto');

exports.openSession = async (req, res) => {
    const prisma = req.app.get('prisma');
    const { tableId, tierId, customerCount } = req.body;
    try {
        const token = crypto.randomBytes(16).toString('hex');
        const sessionData = {
            tableId,
            customerCount,
            token,
            status: 'ACTIVE'
        };

        if (tierId) {
            sessionData.tierId = tierId;
        }

        const session = await prisma.session.create({
            data: sessionData
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

        // Fetch updated session and notify customer app
        const updatedSession = await prisma.session.findUnique({
            where: { id: sessionId },
            include: { table: true, tier: true, orders: { include: { items: { include: { menu: true } } } } }
        });
        io.to(`session-${sessionId}`).emit('session-updated', updatedSession);

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
exports.getSessionById = async (req, res) => {
    const prisma = req.app.get('prisma');
    try {
        const session = await prisma.session.findUnique({
            where: { id: req.params.id },
            include: { table: true, tier: true, orders: { include: { items: { include: { menu: true } } } } }
        });
        if (!session) return res.status(404).json({ error: 'Session not found' });
        res.json(session);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.voidOrderItem = async (req, res) => {
    const prisma = req.app.get('prisma');
    const io = req.app.get('io');
    const { sessionId, menuId, quantity } = req.body;
    try {
        // Find orders for the session
        const orders = await prisma.order.findMany({
            where: { sessionId, status: { in: ['PENDING', 'COOKING', 'SERVED'] } },
            include: { items: true },
            orderBy: { createdAt: 'desc' }
        });

        let remainingToVoid = quantity || 1;
        for (const order of orders) {
            if (remainingToVoid <= 0) break;
            const items = order.items.filter(i => i.menuId === menuId);
            for (const item of items) {
                if (remainingToVoid <= 0) break;
                if (item.quantity <= remainingToVoid) {
                    remainingToVoid -= item.quantity;
                    await prisma.orderItem.delete({ where: { id: item.id } });
                } else {
                    await prisma.orderItem.update({
                        where: { id: item.id },
                        data: { quantity: item.quantity - remainingToVoid }
                    });
                    remainingToVoid = 0;
                }
            }
        }

        const updatedSession = await prisma.session.findUnique({
            where: { id: sessionId },
            include: { table: true, tier: true, orders: { include: { items: { include: { menu: true } } } } }
        });
        io.to(`session-${sessionId}`).emit('session-updated', updatedSession);
        io.emit('order-voided', { sessionId, menuId });

        res.json({ success: true, updatedSession });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateOrderStatus = async (req, res) => {
    const prisma = req.app.get('prisma');
    const io = req.app.get('io');
    const { orderId, status } = req.body;
    try {
        const order = await prisma.order.update({
            where: { id: orderId },
            data: { status },
            include: { session: true }
        });

        // Notify session room
        const updatedSession = await prisma.session.findUnique({
            where: { id: order.sessionId },
            include: { table: true, tier: true, orders: { include: { items: { include: { menu: true } } } } }
        });
        io.to(`session-${order.sessionId}`).emit('session-updated', updatedSession);
        io.emit('order-status-updated', order);

        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.moveSession = async (req, res) => {
    const prisma = req.app.get('prisma');
    const io = req.app.get('io');
    const { sessionId, newTableId } = req.body;
    try {
        const session = await prisma.session.findUnique({ where: { id: sessionId } });
        if (!session) return res.status(404).json({ error: 'Session not found' });

        const oldTableId = session.tableId;

        await prisma.$transaction([
            prisma.session.update({
                where: { id: sessionId },
                data: { tableId: newTableId }
            }),
            prisma.table.update({
                where: { id: oldTableId },
                data: { status: 'CLEANING' }
            }),
            prisma.table.update({
                where: { id: newTableId },
                data: { status: 'OCCUPIED' }
            })
        ]);

        const updatedSession = await prisma.session.findUnique({
            where: { id: sessionId },
            include: { table: true, tier: true, orders: { include: { items: { include: { menu: true } } } } }
        });

        io.to(`session-${sessionId}`).emit('session-updated', updatedSession);
        io.emit('table-moved');

        res.json({ success: true, updatedSession });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.mergeSessions = async (req, res) => {
    const prisma = req.app.get('prisma');
    const io = req.app.get('io');
    const { sourceSessionId, targetSessionId } = req.body;

    if (sourceSessionId === targetSessionId) {
        return res.status(400).json({ error: 'Cannot merge a session into itself' });
    }

    try {
        const sourceSession = await prisma.session.findUnique({ where: { id: sourceSessionId } });
        const targetSession = await prisma.session.findUnique({ where: { id: targetSessionId } });

        if (!sourceSession || !targetSession) {
            return res.status(404).json({ error: 'Session not found' });
        }

        await prisma.$transaction([
            // Move all orders from source to target
            prisma.order.updateMany({
                where: { sessionId: sourceSessionId },
                data: { sessionId: targetSessionId }
            }),
            // Add customer count
            prisma.session.update({
                where: { id: targetSessionId },
                data: { customerCount: targetSession.customerCount + sourceSession.customerCount }
            }),
            // Close source session
            prisma.session.update({
                where: { id: sourceSessionId },
                data: { status: 'CLOSED', endTime: new Date() }
            }),
            // Mark old table as cleaning
            prisma.table.update({
                where: { id: sourceSession.tableId },
                data: { status: 'CLEANING' }
            })
        ]);

        const updatedTargetSession = await prisma.session.findUnique({
            where: { id: targetSessionId },
            include: { table: true, tier: true, orders: { include: { items: { include: { menu: true } } } } }
        });

        io.to(`session-${targetSessionId}`).emit('session-updated', updatedTargetSession);
        io.emit('table-merged');

        res.json({ success: true, updatedTargetSession });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
