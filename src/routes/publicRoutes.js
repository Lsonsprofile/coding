/**
 * Public routes (no authentication required for viewing).
 * Comment actions require login (middleware applied on those routes).
 */

const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');
const commentController = require('../controllers/commentController');
const { requireAuth } = require('../middleware/auth');
const accountController = require('../controllers/accountController');

router.get('/lessons', lessonController.listLessons);
router.get('/lesson/:slug', lessonController.viewLesson);

// Comments – must be logged in
router.post('/lesson/:slug/comments', requireAuth, commentController.createComment);
router.post('/comments/:id/delete', requireAuth, commentController.deleteComment);


// Account
router.get('/account', requireAuth, accountController.showAccount);
router.post('/account', requireAuth, accountController.updateAccount);

module.exports = router;

