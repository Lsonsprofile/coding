/**
 * User data-access helpers.
 * Uses the official MongoDB driver. Controllers call these functions.
 */

const { ObjectId } = require('mongodb');
const { getDb } = require('../db/connect');

/**
 * Find a user by email (case-insensitive).
 * Used during login and registration uniqueness checks.
 */
async function findByEmail(email) {
  const db = getDb();
  return db.collection('users').findOne({
    email: email.toLowerCase().trim(),
  });
}

/**
 * Find a user by ID.
 */
async function findById(id) {
  const db = getDb();
  if (!ObjectId.isValid(id)) return null;
  return db.collection('users').findOne({ _id: new ObjectId(id) });
}

/**
 * Create a new user.
 * Expects passwordHash already computed by the controller.
 */
async function createUser({ name, email, passwordHash, role = 'user' }) {
  const db = getDb();
  const now = new Date();

  const doc = {
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    role, // 'user' or 'admin'
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection('users').insertOne(doc);
  return { _id: result.insertedId, ...doc };
}

module.exports = {
  findByEmail,
  findById,
  createUser,
};
