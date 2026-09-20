/**
 * Admin controllers – dashboard, pages list, create, edit, content blocks.
 */

const pageModel = require('../models/pageModel');
const userModel = require('../models/userModel');
const {
  sanitizeText,
  sanitizeBlockData,
  normalizeSlug,
  isValidObjectId,
  sanitizeInteger,
  cleanString,
} = require('../utils/sanitize');
const { getDb } = require('../db/connect');
const {
  COMPONENT_TYPES,
  COMPONENT_REGISTRY,
} = require('../data/componentRegistry');
const settingsModel = require('../models/settingsModel');

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
async function dashboard(req, res, next) {
  try {
    const db = getDb();

    const [
      totalPages,
      publishedPages,
      draftPages,
      totalUsers,
      totalComments,
    ] = await Promise.all([
      db.collection('pages').countDocuments(),
      db.collection('pages').countDocuments({ status: 'published' }),
      db.collection('pages').countDocuments({ status: 'draft' }),
      db.collection('users').countDocuments(),
      db.collection('comments').countDocuments().catch(() => 0),
    ]);

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      pageTitle: 'Dashboard',
      stats: {
        totalPages,
        publishedPages,
        draftPages,
        totalUsers,
        totalComments,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Pages list
// ---------------------------------------------------------------------------
async function listPages(req, res, next) {
  try {
    const pages = await pageModel.findAllPages();

    res.render('admin/pages', {
      title: 'Manage Pages',
      pageTitle: 'Pages',
      pages,
      success: req.query.success || null,
    });
  } catch (err) {
    next(err);
  }
}

async function homeEditor(req, res, next) {
  try {
    const home = (await pageModel.findAllPages()).find(
      (page) => page.slug === 'home'
    );

    if (!home) {
      return res.redirect('/admin/pages/create');
    }

    res.redirect('/admin/pages/' + home._id + '/edit');
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Create page
// ---------------------------------------------------------------------------
function showCreatePage(req, res) {
  res.render('admin/page-form', {
    title: 'Create Page',
    pageTitle: 'Create Page',
    page: null,
    error: null,
    formData: {},
    isEdit: false,
  });
}

async function createPage(req, res, next) {
  try {
    const title = cleanString(req.body.title, 200);
    const slug = normalizeSlug(req.body.slug, title);

    const errors = [];

    if (!title || title.length < 3) {
      errors.push('Title is required (min 3 characters).');
    }

    if (!slug) {
      errors.push('Slug is required.');
    }

    if (await pageModel.slugExists(slug)) {
      errors.push('That slug is already in use.');
    }

    if (errors.length > 0) {
      return res.status(400).render('admin/page-form', {
        title: 'Create Page',
        pageTitle: 'Create Page',
        page: null,
        error: errors.join(' '),
        formData: req.body,
        isEdit: false,
      });
    }

    const page = await pageModel.createPage({
      title,
      slug,
      description: cleanString(req.body.description, 500),
      category: cleanString(req.body.category, 100),
      weekNumber: req.body.weekNumber,
      status: req.body.status === 'published' ? 'published' : 'draft',
      seoTitle: cleanString(req.body.seoTitle, 200),
      seoDescription: cleanString(req.body.seoDescription, 300),
      showHeader: req.body.showHeader === 'true',
      showFooter: req.body.showFooter === 'true',
      showSidebar: req.body.showSidebar === 'true',
      createdBy: req.session.user._id,
    });

    res.redirect(
      '/admin/pages/' + page._id + '/edit?success=created'
    );
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Edit page (metadata + content blocks)
// ---------------------------------------------------------------------------
async function showEditPage(req, res, next) {
  try {
    const page = await pageModel.findById(req.params.id);

    if (!page) {
      return res.status(404).render('public/404', {
        title: 'Page Not Found',
        pageTitle: '404',
      });
    }

    let contentBlocks = [];
    let flatBlocks = [];

    try {
      contentBlocks =
        (await pageModel.findContentByPageId(page._id, {
          onlyVisible: false,
          asTree: true,
        })) || [];
    } catch (e) {
      console.error('showEditPage tree error:', e.message);
      contentBlocks = [];
    }

    try {
      flatBlocks =
        (await pageModel.findContentByPageId(page._id, {
          onlyVisible: false,
          asTree: false,
        })) || [];
    } catch (e) {
      console.error('showEditPage flat error:', e.message);
      flatBlocks = [];
    }

    res.render('admin/page-edit', {
      title: 'Edit: ' + page.title,
      pageTitle: 'Edit Page',
      page,
      contentBlocks,
      flatBlocks,
      componentRegistry: COMPONENT_REGISTRY,
      success: req.query.success || null,
      error: null,
    });
  } catch (err) {
    next(err);
  }
}

async function updatePage(req, res, next) {
  try {
    const id = req.params.id;
    const title = cleanString(req.body.title, 200);
    const slug = normalizeSlug(req.body.slug, title);

    const errors = [];

    if (!title || title.length < 3) {
      errors.push('Title is required.');
    }

    if (!slug) {
      errors.push('Slug is required.');
    }

    if (await pageModel.slugExists(slug, id)) {
      errors.push('That slug is already in use.');
    }

    if (errors.length > 0) {
      const page = await pageModel.findById(id);

      let contentBlocks = [];

      try {
        contentBlocks =
          (await pageModel.findContentByPageId(id, {
            onlyVisible: false,
            asTree: true,
          })) || [];
      } catch (e) {
        contentBlocks = [];
      }

      return res.status(400).render('admin/page-edit', {
        title: 'Edit: ' + ((page && page.title) || 'Page'),
        pageTitle: 'Edit Page',
        page: page || {
          _id: id,
          title: title,
          slug: slug,
        },
        contentBlocks,
        flatBlocks: [],
        componentRegistry: COMPONENT_REGISTRY,
        success: null,
        error: errors.join(' '),
      });
    }

    await pageModel.updatePage(id, {
      title,
      slug,
      description: cleanString(req.body.description, 500),
      category: cleanString(req.body.category, 100),
      weekNumber: req.body.weekNumber,
      status: req.body.status,
      seoTitle: cleanString(req.body.seoTitle, 200),
      seoDescription: cleanString(req.body.seoDescription, 300),
      showHeader: req.body.showHeader !== 'false',
      showFooter: req.body.showFooter !== 'false',
      showSidebar: req.body.showSidebar === 'true',
    });

    res.redirect(
      '/admin/pages/' + id + '/edit?success=updated'
    );
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Publish / Unpublish / Delete
// ---------------------------------------------------------------------------
async function publishPage(req, res, next) {
  try {
    const page = await pageModel.setStatus(
      req.params.id,
      'published'
    );

    await syncPageNavigation(page, true);

    res.redirect('/admin/pages?success=published');
  } catch (err) {
    next(err);
  }
}

async function unpublishPage(req, res, next) {
  try {
    const page = await pageModel.setStatus(
      req.params.id,
      'draft'
    );

    await syncPageNavigation(page, false);

    res.redirect('/admin/pages?success=unpublished');
  } catch (err) {
    next(err);
  }
}

async function deletePage(req, res, next) {
  try {
    const page = await pageModel.findById(req.params.id);

    await pageModel.deletePage(req.params.id);

    if (page && page.slug) {
      const header = await settingsModel.getHeader();

      const navItems =
        Array.isArray(header && header.navItems)
          ? header.navItems
          : [];

      // Home may previously have been stored as either "/" or "/home".
      const pageUrls =
        page.slug === 'home'
          ? ['/', '/home']
          : ['/' + page.slug];

      const filteredNavItems = navItems.filter(
        (item) => !pageUrls.includes(item.url)
      );

      if (filteredNavItems.length !== navItems.length) {
        await settingsModel.saveHeader({
          ...(header || {}),
          navItems: filteredNavItems,
        });
      }
    }

    res.redirect('/admin/pages?success=deleted');
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Page navigation synchronization
// ---------------------------------------------------------------------------
async function syncPageNavigation(page, shouldInclude) {
  if (!page || !page.slug) {
    return;
  }

  const header = await settingsModel.getHeader();

  const navItems =
    Array.isArray(header && header.navItems)
      ? header.navItems
      : [];

  // Home is always the root URL.
  const pageUrl =
    page.slug === 'home'
      ? '/'
      : '/' + page.slug;

  // Remove old versions of this page from navigation first.
  //
  // For Home we remove BOTH:
  //   /
  //   /home
  //
  // This prevents duplicate Home links if /home was created previously.
  const urlsToRemove =
    page.slug === 'home'
      ? ['/', '/home']
      : [pageUrl];

  const withoutPage = navItems.filter(
    (item) => !urlsToRemove.includes(item.url)
  );

  const nextItems = shouldInclude
    ? [
        ...withoutPage,
        {
          label: page.title,
          url: pageUrl,
          type: 'link',
        },
      ]
    : withoutPage;

  await settingsModel.saveHeader({
    ...(header || {}),
    navItems: nextItems,
  });
}

// ---------------------------------------------------------------------------
// Content block operations
// ---------------------------------------------------------------------------
async function addContentBlock(req, res, next) {
  try {
    const pageId = req.params.id;

    let type = String(req.body.type || 'text').trim();

    if (!COMPONENT_TYPES.has(type)) {
      type = 'text';
    }

    const parentId = req.body.parentId || null;

    await pageModel.createContentBlock(pageId, {
      type,
      data: {},
      visible: true,
      parentId,
    });

    res.redirect(
      '/admin/pages/' + pageId + '/edit?success=block-added'
    );
  } catch (err) {
    next(err);
  }
}

async function updateContentBlock(req, res, next) {
  try {
    const blockId = req.params.blockId;
    const pageId = req.params.id;

    if (
      !isValidObjectId(blockId) ||
      !isValidObjectId(pageId)
    ) {
      return res.status(400).redirect('/admin/pages');
    }

    const data = sanitizeBlockData(req.body);

    await pageModel.updateContentBlock(blockId, { data });

    res.redirect(
      '/admin/pages/' + pageId + '/edit?success=block-updated'
    );
  } catch (err) {
    next(err);
  }
}

async function deleteContentBlock(req, res, next) {
  try {
    const pageId = req.params.id;

    await pageModel.deleteContentBlock(req.params.blockId);

    res.redirect(
      '/admin/pages/' + pageId + '/edit?success=block-deleted'
    );
  } catch (err) {
    next(err);
  }
}

async function duplicateContentBlock(req, res, next) {
  try {
    const pageId = req.params.id;

    await pageModel.duplicateContentBlock(
      req.params.blockId
    );

    res.redirect(
      '/admin/pages/' + pageId + '/edit?success=block-duplicated'
    );
  } catch (err) {
    next(err);
  }
}

async function moveContentBlock(req, res, next) {
  try {
    const pageId = req.params.id;

    const direction =
      req.body.direction === 'up'
        ? 'up'
        : 'down';

    await pageModel.moveContentBlock(
      req.params.blockId,
      direction
    );

    res.redirect(
      '/admin/pages/' + pageId + '/edit?success=block-moved'
    );
  } catch (err) {
    next(err);
  }
}

async function moveContentBlockToParent(req, res, next) {
  try {
    const pageId = req.params.id;
    const parentId = req.body.parentId || null;

    const ok = await pageModel.moveContentBlockToParent(
      req.params.blockId,
      parentId,
      req.body.order
    );

    if (!ok) {
      return res.status(400).json({
        error: 'Invalid parent or move.',
      });
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function wrapContentBlocks(req, res, next) {
  try {
    const pageId = req.params.id;

    const ids = Array.isArray(req.body.ids)
      ? req.body.ids
      : String(req.body.ids || '')
          .split(',')
          .filter(Boolean);

    const wrapper = await pageModel.wrapContentBlocks(ids, {
      pageId,
      type: req.body.type || 'column',
      data: {
        display: req.body.display || 'grid',
        columns: req.body.columns || 2,
        gap: req.body.gap || '1.5rem',
      },
    });

    if (!wrapper) {
      return res.status(400).json({
        error: 'Select sibling blocks to wrap.',
      });
    }

    res.json({
      ok: true,
      id: wrapper._id.toString(),
    });
  } catch (err) {
    next(err);
  }
}

async function duplicateContentSubtree(req, res, next) {
  try {
    const id = await pageModel.duplicateContentSubtree(
      req.params.blockId,
      req.body.parentId
    );

    if (!id) {
      return res.status(404).json({
        error: 'Block not found.',
      });
    }

    res.json({
      ok: true,
      id: id.toString(),
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
async function listUsers(req, res, next) {
  try {
    let users = [];

    try {
      users = await userModel.findAllUsers();
    } catch (e) {
      console.error('listUsers error:', e.message);
      users = [];
    }

    res.render('admin/users', {
      title: 'Manage Users',
      pageTitle: 'Users',
      users: users || [],
      success: req.query.success || null,
      currentUserId:
        req.session.user && req.session.user._id,
    });
  } catch (err) {
    next(err);
  }
}

async function setUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const role =
      req.body.role === 'admin'
        ? 'admin'
        : 'user';

    // Prevent removing own admin role
    if (
      id === req.session.user._id &&
      role !== 'admin'
    ) {
      return res.redirect(
        '/admin/users?success=cannot-demote-self'
      );
    }

    await userModel.updateUserRole(id, role);

    res.redirect(
      '/admin/users?success=role-updated'
    );
  } catch (err) {
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;

    if (id === req.session.user._id) {
      return res.redirect(
        '/admin/users?success=cannot-delete-self'
      );
    }

    await userModel.deleteUser(id);

    res.redirect(
      '/admin/users?success=deleted'
    );
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Duplicate page
// ---------------------------------------------------------------------------
async function duplicatePage(req, res, next) {
  try {
    const copy = await pageModel.duplicatePage(
      req.params.id
    );

    if (!copy) {
      return res.redirect(
        '/admin/pages?success=notfound'
      );
    }

    res.redirect(
      '/admin/pages/' +
        copy._id +
        '/edit?success=duplicated'
    );
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Preview page
// ---------------------------------------------------------------------------
async function previewPage(req, res, next) {
  try {
    const page = await pageModel.findById(req.params.id);

    if (!page) {
      return res.status(404).render('public/404', {
        title: 'Not Found',
        pageTitle: '404',
      });
    }

    const contentBlocks =
      await pageModel.findContentByPageId(page._id, {
        onlyVisible: false,
        asTree: true,
      });

    // Use lesson template for week pages, site-page for others.
    const view =
      page.weekNumber != null
        ? 'public/lesson'
        : 'public/site-page';

    res.render(view, {
      title:
        '[Preview] ' +
        (page.seoTitle || page.title),
      pageTitle: page.title,
      seoDescription:
        page.seoDescription || page.description,
      page,
      contentBlocks,
      comments: [],
      isPlaceholder: false,
      isPreview: true,
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
module.exports = {
  dashboard,
  listPages,
  homeEditor,
  showCreatePage,
  createPage,
  showEditPage,
  updatePage,
  publishPage,
  unpublishPage,
  deletePage,
  addContentBlock,
  updateContentBlock,
  deleteContentBlock,
  duplicateContentBlock,
  moveContentBlock,
  moveContentBlockToParent,
  wrapContentBlocks,
  duplicateContentSubtree,
  listUsers,
  setUserRole,
  deleteUser,
  duplicatePage,
  previewPage,
};