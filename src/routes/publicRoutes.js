/**
 * Public routes (no authentication required).
 * Only published content is visible here.
 */

const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');

// Home is still handled in app.js for now; can move later if desired.
router.get('/lessons', lessonController.listLessons);
router.get('/lesson/:slug', lessonController.viewLesson);

// Static-ish pages (already in app.js; keeping here for completeness if we refactor)
// router.get('/about', ...);
// router.get('/contact', ...);

module.exports = router;
