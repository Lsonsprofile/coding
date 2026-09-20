/**
 * Authentication controller – validated & sanitized inputs.
 */

const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');
const pageModel = require('../models/pageModel');
const {
  sanitizeText,
  cleanString,
  isValidEmail,
  normalizeEmail,
} = require('../utils/sanitize');

const SALT_ROUNDS = 12;

async function getAuthenticatedLanding(user) {
  if (user && user.role === 'admin') return '/admin';
  const pages = (await pageModel.findAllPages()).filter((page) => page.status === 'published');
  return pages.length > 0 ? '/' : '/account';
}

async function showRegister(req, res, next) {
  if (req.session.user) {
    try { return res.redirect(await getAuthenticatedLanding(req.session.user)); } catch (error) { return next(error); }
  }
  res.render('auth/register', {
    title: 'Register – Web Development Learning Platform',
    pageTitle: 'Register',
    error: null,
    formData: {},
  });
}

async function register(req, res, next) {
  try {
    const name = sanitizeText(req.body.name, 100);
    const email = normalizeEmail(req.body.email);
    const password = cleanString(req.body.password, 128);
    const passwordConfirm = cleanString(req.body.passwordConfirm, 128);

    const errors = [];
    if (!name || name.length < 2) errors.push('Name must be at least 2 characters.');
    if (!isValidEmail(email)) errors.push('A valid email address is required.');
    if (!password || password.length < 8) errors.push('Password must be at least 8 characters.');
    if (password.length > 128) errors.push('Password is too long.');
    if (password !== passwordConfirm) errors.push('Passwords do not match.');

    if (errors.length > 0) {
      return res.status(400).render('auth/register', {
        title: 'Register – Web Development Learning Platform',
        pageTitle: 'Register',
        error: errors.join(' '),
        formData: { name, email },
      });
    }

    const existing = await userModel.findByEmail(email);
    if (existing) {
      return res.status(400).render('auth/register', {
        title: 'Register – Web Development Learning Platform',
        pageTitle: 'Register',
        error: 'An account with that email already exists.',
        formData: { name, email },
      });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await userModel.createUser({
      name,
      email,
      passwordHash,
      role: 'user',
    });

    req.session.user = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    res.redirect('/');
  } catch (err) {
    next(err);
  }
}

async function showLogin(req, res, next) {
  if (req.session.user) {
    try { return res.redirect(await getAuthenticatedLanding(req.session.user)); } catch (error) { return next(error); }
  }
  res.render('auth/login', {
    title: 'Login – Web Development Learning Platform',
    pageTitle: 'Login',
    error: null,
    formData: {},
  });
}

async function login(req, res, next) {
  try {
    const email = normalizeEmail(req.body.email);
    const password = cleanString(req.body.password, 128);

    if (!isValidEmail(email) || !password) {
      return res.status(400).render('auth/login', {
        title: 'Login – Web Development Learning Platform',
        pageTitle: 'Login',
        error: 'Email and password are required.',
        formData: { email },
      });
    }

    const user = await userModel.findByEmail(email);
    // Generic message – do not reveal whether email exists
    if (!user) {
      return res.status(401).render('auth/login', {
        title: 'Login – Web Development Learning Platform',
        pageTitle: 'Login',
        error: 'Invalid email or password.',
        formData: { email },
      });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).render('auth/login', {
        title: 'Login – Web Development Learning Platform',
        pageTitle: 'Login',
        error: 'Invalid email or password.',
        formData: { email },
      });
    }

    req.session.user = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const redirectTo = req.session.returnTo || await getAuthenticatedLanding(req.session.user);
    delete req.session.returnTo;
    res.redirect(redirectTo);
  } catch (err) {
    next(err);
  }
}

function logout(req, res) {
  req.session.destroy((err) => {
    if (err) console.error('Session destroy error:', err);
    res.redirect('/');
  });
}

module.exports = {
  showRegister,
  register,
  showLogin,
  login,
  logout,
};
