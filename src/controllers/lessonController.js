/**
 * Public lesson controller.
 */

const pageModel = require('../models/pageModel');
const commentModel = require('../models/commentModel');

async function listLessons(req, res, next) {
  try {
    let pages = [];
    try {
      pages = await pageModel.findPublishedPages();
    } catch (e) {
      console.error('listLessons pages error:', e.message);
    }

    res.render('public/lessons', {
      title: 'Lessons – Web Development Learning Platform',
      pageTitle: 'Lessons',
      pages: pages || [],
    });
  } catch (err) {
    next(err);
  }
}

async function viewLesson(req, res, next) {
  try {
    const { slug } = req.params;

    const page = await pageModel.findPublishedBySlug(slug);
    if (!page) {
      return res.redirect('/login');
    }

    let contentBlocks = [];
    try {
      contentBlocks = await pageModel.findContentByPageId(page._id, {
        onlyVisible: true,
        asTree: true,
      });
    } catch (e) {
      console.error('contentBlocks error:', e.message);
      contentBlocks = [];
    }

    let comments = [];
    try {
      comments = await commentModel.findByPageId(page._id, { status: 'visible' });
    } catch (e) {
      console.error('comments error:', e.message);
      comments = [];
    }

    res.render('public/lesson', {
      title: page.seoTitle || page.title,
      pageTitle: page.title,
      seoDescription: page.seoDescription || page.description || '',
      page,
      contentBlocks: contentBlocks || [],
      comments: comments || [],
      commentError: req.query.error || null,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listLessons,
  viewLesson,
};
