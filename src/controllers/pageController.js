/**
 * Public site pages from CMS (home, about, contact, and any other slug).
 *
 * Rendering rules:
 *   - If a published CMS page exists for the slug, render it with its blocks.
 *   - If no page exists:
 *       • 'home'          → render a placeholder home (never redirect guests to login)
 *       • 'about'/'contact' → 404
 *       • any other slug   → render a placeholder site-page (isPlaceholder: true)
 *   - Never redirect an anonymous visitor to /login from a public route.
 */

const pageModel = require('../models/pageModel');

/**
 * Core renderer. Handles all public CMS pages.
 * @param {string} slug - page slug ('home', 'about', 'contact', ...)
 */
async function viewSitePage(slug, req, res, next) {
  try {
    // 1. Try to find a published page for this slug
    let page = null;
    try {
      page = await pageModel.findPublishedBySlug(slug);
    } catch (e) {
      console.error('viewSitePage find error:', e.message);
    }

    // 2. No page → fall back gracefully
    if (!page) {
      if (slug === 'home') {
        return res.status(200).render('public/site-page', {
          title: 'Home',
          pageTitle: 'Home',
          seoDescription: '',
          page: { title: 'Home', slug: 'home', description: '' },
          contentBlocks: [],
          isPlaceholder: true,
        });
      }

      if (slug === 'about' || slug === 'contact') {
        return res.status(404).render('public/404', {
          title: 'Page Not Found',
          pageTitle: '404',
        });
      }

      // Any other slug → placeholder site page
      const fallbackTitle = slug.charAt(0).toUpperCase() + slug.slice(1);
      return res.render('public/site-page', {
        title: fallbackTitle,
        pageTitle: fallbackTitle,
        seoDescription: '',
        page: {
          title: fallbackTitle,
          slug,
          description: '',
        },
        contentBlocks: [],
        isPlaceholder: true,
      });
    }

    // 3. Page found → load its content blocks
    let contentBlocks = [];
    try {
      contentBlocks = await pageModel.findContentByPageId(page._id, {
        onlyVisible: true,
        asTree: true,
      });
    } catch (e) {
      console.error('viewSitePage blocks error:', e.message);
      contentBlocks = [];
    }

    // 4. Render
    return res.render('public/site-page', {
      title: page.seoTitle || page.title,
      pageTitle: page.title,
      seoDescription: page.seoDescription || page.description || '',
      page,
      contentBlocks: contentBlocks || [],
      isPlaceholder: false,
    });
  } catch (err) {
    return next(err);
  }
}

// Named handlers used by app.js
function home(req, res, next)    { return viewSitePage('home', req, res, next); }
function about(req, res, next)   { return viewSitePage('about', req, res, next); }
function contact(req, res, next) { return viewSitePage('contact', req, res, next); }

module.exports = { home, about, contact, viewSitePage };