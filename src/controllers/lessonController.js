/**
 * Public lesson controller.
 * Handles listing published lessons and rendering a single lesson by slug.
 * All data comes from MongoDB via the page model.
 */

const pageModel = require('../models/pageModel');

/**
 * GET /lessons
 * List all published lessons, grouped or sorted by weekNumber.
 */
async function listLessons(req, res, next) {
  try {
    const pages = await pageModel.findPublishedPages();

    res.render('public/lessons', {
      title: 'Lessons – Web Development Learning Platform',
      pageTitle: 'Lessons',
      pages,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /lesson/:slug
 * Render a single published lesson with all its visible content blocks.
 */
async function viewLesson(req, res, next) {
  try {
    const { slug } = req.params;

    const page = await pageModel.findPublishedBySlug(slug);
    if (!page) {
      return res.status(404).render('public/404', {
        title: 'Lesson Not Found',
        pageTitle: '404',
      });
    }

    const contentBlocks = await pageModel.findContentByPageId(page._id, {
      onlyVisible: true,
    });

    res.render('public/lesson', {
      title: page.seoTitle || page.title,
      pageTitle: page.title,
      seoDescription: page.seoDescription || page.description,
      page,
      contentBlocks,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listLessons,
  viewLesson,
};
