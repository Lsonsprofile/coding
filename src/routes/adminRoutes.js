/**
 * Admin routes – all protected by requireAuth + requireAdmin.
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Every route in this file requires login + admin role
router.use(requireAuth, requireAdmin);

router.get('/', adminController.dashboard);

// Future routes will go here:
// router.get('/pages', ...)
// router.get('/pages/create', ...)
// etc.

module.exports = router;
