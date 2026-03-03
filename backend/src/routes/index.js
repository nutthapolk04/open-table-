const express = require('express');
const router = express.Router();
const zoneController = require('../controllers/zoneController');
const menuController = require('../controllers/menuController');
const sessionController = require('../controllers/sessionController');

// Zone & Table Routes
router.get('/zones', zoneController.getZones);
router.post('/zones', zoneController.createZone);
router.get('/tables', zoneController.getTables);
router.post('/tables', zoneController.createTable);

// Menu & Category & Tier Routes
router.get('/categories', menuController.getCategories);
router.post('/categories', menuController.createCategory);
router.get('/tiers', menuController.getTiers);
router.post('/tiers', menuController.createTier);
router.post('/menus', menuController.createMenu);

// Session & Order Routes
router.post('/sessions/open', sessionController.openSession);
router.post('/sessions/close', sessionController.closeSession);
router.post('/orders', sessionController.placeOrder);

module.exports = router;
