/**
 * Authentication controller.
 * Handles registration, login and logout.
 * Password hashing is done with bcryptjs (pure JS).
 */

const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');

const SALT_ROUNDS = 12;

/**
 * GET /register
 */
function showRegister(req, res) {
  // If already logged in, redirect away
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('auth/register', {
    title: 'Register – Web Development Learning Platform',
    pageTitle: 'Register',
    error: null,
    formData: {},
  });
}

/**
 * POST /register
 */
async function register(req, res, next) {
  try {
    const { name, email, password, passwordConfirm } = req.body;

    // Basic server-side validation
    const errors = [];
    if (!name || name.trim().length < 2) {
      errors.push('Name must be at least 2 characters.');
    }
    if (!email || !email.includes('@')) {
      errors.push('A valid email address is required.');
    }
    if (!password || password.length < 8) {
      errors.push('Password must be at least 8 characters.');
    }
    if (password !== passwordConfirm) {
      errors.push('Passwords do not match.');
    }

    if (errors.length > 0) {
      return res.status(400).render('auth/register', {
        title: 'Register – Web Development Learning Platform',
        pageTitle: 'Register',
        error: errors.join(' '),
        formData: { name, email },
      });
    }

    // Check if email already exists
    const existing = await userModel.findByEmail(email);
    if (existing) {
      return res.status(400).render('auth/register', {
        title: 'Register – Web Development Learning Platform',
        pageTitle: 'Register',
        error: 'An account with that email already exists.',
        formData: { name, email },
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user (first user can be made admin later if desired)
    const user = await userModel.createUser({
      name,
      email,
      passwordHash,
      role: 'user',
    });

    // Log the user in immediately after registration
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

/**
 * GET /login
 */
function showLogin(req, res) {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('auth/login', {
    title: 'Login – Web Development Learning Platform',
    pageTitle: 'Login',
    error: null,
    formData: {},
  });
}

/**
 * POST /login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).render('auth/login', {
        title: 'Login – Web Development Learning Platform',
        pageTitle: 'Login',
        error: 'Email and password are required.',
        formData: { email },
      });
    }

    const user = await userModel.findByEmail(email);
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

    // Successful login – store minimal user info in session
    req.session.user = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    // Redirect to the page they originally wanted, or home
    const redirectTo = req.session.returnTo || '/';
    delete req.session.returnTo;
    res.redirect(redirectTo);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /logout
 */
function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destroy error:', err);
    }
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
