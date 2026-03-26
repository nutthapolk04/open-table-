const express = require('express');
const router = express.Router();
const zoneController = require('../controllers/zoneController');
const menuController = require('../controllers/menuController');
const sessionController = require('../controllers/sessionController');
const debugController = require('../controllers/debugController');
const qrController = require('../controllers/qrController');

// Debug/Admin Routes
router.post('/debug/seed', debugController.runSeed);

// Zone & Table Routes
router.get('/zones', zoneController.getZones);
router.post('/zones', zoneController.createZone);
router.get('/tables', zoneController.getTables);
router.post('/tables', zoneController.createTable);
router.delete('/zones/:id', zoneController.deleteZone);
router.delete('/tables/:id', zoneController.deleteTable);
router.patch('/tables/:id', zoneController.updateTable);
router.patch('/zones/:id', zoneController.updateZone);

// Menu & Category & Tier Routes
router.get('/categories', menuController.getCategories);
router.post('/categories', menuController.createCategory);
router.get('/tiers', menuController.getTiers);
router.post('/tiers', menuController.createTier);
router.post('/menus', menuController.createMenu);
router.patch('/menus/:id/status', menuController.updateMenuStatus);

// Session & Order Routes
router.get('/sessions/:id', sessionController.getSessionById);
router.post('/sessions/open', sessionController.openSession);
router.post('/sessions/close', sessionController.closeSession);
router.post('/orders', sessionController.placeOrder);
router.post('/orders/void', sessionController.voidOrderItem);
router.patch('/orders/status', sessionController.updateOrderStatus);
router.post('/sessions/move', sessionController.moveSession);
router.post('/sessions/merge', sessionController.mergeSessions);
router.get('/tables/:tableId/session/active', sessionController.getActiveSessionByTable);
router.get('/tables/:id/qr-image', qrController.generateTableQR);

router.get('/tiers/:id/menu', menuController.getTierMenu);
router.get('/menus', menuController.getAllMenus);

module.exports = router;
