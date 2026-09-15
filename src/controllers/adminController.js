/**
 * Admin dashboard controller.
 * Only accessible to users with role === 'admin'.
 */

const { getDb } = require('../db/connect');

/**
 * GET /admin
 * Simple dashboard with basic counts.
 */
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
      db.collection('comments').countDocuments().catch(() => 0), // comments collection may not exist yet
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

module.exports = {
  dashboard,
};
