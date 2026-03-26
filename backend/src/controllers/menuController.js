exports.getCategories = async (req, res) => {
    const prisma = req.app.get('prisma');
    try {
        const categories = await prisma.category.findMany({
            include: { menus: true }
        });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createCategory = async (req, res) => {
    const prisma = req.app.get('prisma');
    const { name } = req.body;
    try {
        const category = await prisma.category.create({
            data: { name }
        });
        res.json(category);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getTiers = async (req, res) => {
    const prisma = req.app.get('prisma');
    try {
        const tiers = await prisma.buffetTier.findMany({
            include: { menus: true }
        });
        res.json(tiers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createTier = async (req, res) => {
    const prisma = req.app.get('prisma');
    const { name, price, description } = req.body;
    try {
        const tier = await prisma.buffetTier.create({
            data: { name, price, description }
        });
        res.json(tier);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createMenu = async (req, res) => {
    const prisma = req.app.get('prisma');
    const { name, price, description, categoryId, buffetTierIds } = req.body;
    try {
        const menu = await prisma.menu.create({
            data: {
                name,
                price,
                description,
                categoryId,
                buffetTiers: {
                    connect: buffetTierIds?.map(id => ({ id })) || []
                }
            }
        });
        res.json(menu);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getTierMenu = async (req, res) => {
    const prisma = req.app.get('prisma');
    try {
        const tier = await prisma.buffetTier.findUnique({
            where: { id: req.params.id },
            include: {
                menus: {
                    include: { category: true }
                }
            }
        });
        if (!tier) return res.status(404).json({ error: 'Tier not found' });
        res.json(tier.menus);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateMenuStatus = async (req, res) => {
    const prisma = req.app.get('prisma');
    const { id } = req.params;
    const { status } = req.body;
    try {
        const menu = await prisma.menu.update({
            where: { id },
            data: { status }
        });
        res.json(menu);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAllMenus = async (req, res) => {
    const prisma = req.app.get('prisma');
    try {
        const menus = await prisma.menu.findMany({
            include: { category: true }
        });
        res.json(menus);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
