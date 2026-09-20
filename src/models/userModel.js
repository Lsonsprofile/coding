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


async function findAllUsers() {
  const db = getDb();
  return db
    .collection('users')
    .find({}, { projection: { passwordHash: 0 } })
    .sort({ createdAt: -1 })
    .toArray();
}

async function updateUserRole(id, role) {
  const db = getDb();
  if (!ObjectId.isValid(id)) return null;
  if (!['user', 'admin'].includes(role)) return null;
  return db.collection('users').findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { role, updatedAt: new Date() } },
    { returnDocument: 'after', projection: { passwordHash: 0 } }
  );
}

async function deleteUser(id) {
  const db = getDb();
  if (!ObjectId.isValid(id)) return false;
  const result = await db.collection('users').deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}

module.exports = {
  findByEmail,
  findById,
  createUser,
  findAllUsers,
  updateUserRole,
  deleteUser,
};
