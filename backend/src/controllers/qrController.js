const QRCode = require('qrcode');
const prisma = require('@prisma/client');

exports.generateTableQR = async (req, res) => {
    const prisma = req.app.get('prisma');
    const { id } = req.params;
    const { type } = req.query; // 'session' or 'permanent'
    
    try {
        const table = await prisma.table.findUnique({
            where: { id },
            include: { 
                sessions: { where: { status: 'ACTIVE' } },
                zone: true
            }
        });

        if (!table) return res.status(404).json({ error: 'Table not found' });

        let url = '';
        const frontendUrl = process.env.VITE_CUSTOMER_FRONTEND_URL || 'http://localhost:5173';

        if (type === 'permanent') {
            url = `${frontendUrl}/table/fixed/${table.id}`;
        } else {
            const activeSession = table.sessions[0];
            if (!activeSession) return res.status(400).json({ error: 'No active session for this table' });
            url = `${frontendUrl}/table/${activeSession.id}`;
        }

        // Generate QR Code as Buffer
        const qrBuffer = await QRCode.toBuffer(url, {
            errorCorrectionLevel: 'H',
            margin: 1,
            width: 400,
            color: {
                dark: '#0f172a',
                light: '#ffffff'
            }
        });

        res.set('Content-Type', 'image/png');
        res.send(qrBuffer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
