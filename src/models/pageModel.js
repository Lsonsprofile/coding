/**
 * Page data-access helpers.
 * Uses the official MongoDB driver via getDb().
 * Controllers call these functions; no database logic lives in routes or views.
 */

const { ObjectId } = require('mongodb');
const { getDb } = require('../db/connect');

/**
 * Find all published pages, ordered by weekNumber then title.
 * Used for the public lessons list.
 */
async function findPublishedPages() {
  const db = getDb();
  return db
    .collection('pages')
    .find({ status: 'published' })
    .sort({ weekNumber: 1, title: 1 })
    .toArray();
}

/**
 * Find a single published page by its slug.
 * Returns null if not found or not published.
 */
async function findPublishedBySlug(slug) {
  const db = getDb();
  return db.collection('pages').findOne({
    slug,
    status: 'published',
  });
}

/**
 * Find a page by ID (any status). Used later by admin.
 */
async function findById(id) {
  const db = getDb();
  if (!ObjectId.isValid(id)) return null;
  return db.collection('pages').findOne({ _id: new ObjectId(id) });
}

/**
 * Find all content blocks for a page, ordered by the `order` field.
 * Only returns visible blocks for public views.
 */
async function findContentByPageId(pageId, { onlyVisible = true } = {}) {
  const db = getDb();
  const query = { pageId: new ObjectId(pageId) };
  if (onlyVisible) {
    query.visible = true;
  }
  return db
    .collection('content')
    .find(query)
    .sort({ order: 1 })
    .toArray();
}

module.exports = {
  findPublishedPages,
  findPublishedBySlug,
  findById,
  findContentByPageId,
};
