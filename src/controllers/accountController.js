/**
 * User account – validated name updates only.
 */

const userModel = require('../models/userModel');
const { cleanString, isValidObjectId } = require('../utils/sanitize');
const { getDb } = require('../db/connect');
const { ObjectId } = require('mongodb');

async function showAccount(req, res, next) {
  try {
    if (!req.session.user || !isValidObjectId(req.session.user._id)) {
      return res.redirect('/login');
    }
    const user = await userModel.findById(req.session.user._id);
    if (!user) return res.redirect('/login');

    res.render('public/account', {
      title: 'My Account',
      pageTitle: 'My Account',
      user,
      success: req.query.success || null,
      error: null,
    });
  } catch (err) {
    next(err);
  }
}

async function updateAccount(req, res, next) {
  try {
    if (!req.session.user || !isValidObjectId(req.session.user._id)) {
      return res.redirect('/login');
    }

    const name = cleanString(req.body.name, 100);
    const user = await userModel.findById(req.session.user._id);

    if (!name || name.length < 2) {
      return res.status(400).render('public/account', {
        title: 'My Account',
        pageTitle: 'My Account',
        user,
        success: null,
        error: 'Name must be at least 2 characters.',
      });
    }

    const db = getDb();
    await db.collection('users').updateOne(
      { _id: new ObjectId(req.session.user._id) },
      { $set: { name, updatedAt: new Date() } }
    );

    req.session.user.name = name;
    res.redirect('/account?success=updated');
  } catch (err) {
    next(err);
  }
}

module.exports = { showAccount, updateAccount };
