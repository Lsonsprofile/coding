/**
 * Express application configuration.
 * This file creates and configures the Express app but does NOT start the server.
 * That responsibility belongs to server.js so that the app can be required
 * by tests without listening on a port.
 *
 * Architecture: Routes -> Controllers -> Database -> EJS Views
 */

const path = require('path');
const express = require('express');
const session = require('express-session');
const methodOverride = require('method-override');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

// Load environment variables as early as possible
dotenv.config();

const publicRoutes = require('./src/routes/publicRoutes');
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

const app = express();

// ---------------------------------------------------------------------------
// Security & request parsing middleware
// ---------------------------------------------------------------------------
app.use(helmet({
  contentSecurityPolicy: false, // Temporarily disabled for development; tighten later
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride('_method')); // Support PUT/DELETE via forms

// ---------------------------------------------------------------------------
// Static files
// ---------------------------------------------------------------------------
app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------------------------------------------------------
// View engine
// ---------------------------------------------------------------------------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ---------------------------------------------------------------------------
// Session configuration (must come before any routes that use req.session)
// ---------------------------------------------------------------------------
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-only-insecure-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  },
  // Note: For production we will later add a Mongo-backed session store.
  // For now the default MemoryStore is acceptable in development.
}));

// ---------------------------------------------------------------------------
// Make session user available to all views (res.locals)
// ---------------------------------------------------------------------------
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.isAuthenticated = Boolean(req.session.user);
  res.locals.isAdmin = req.session.user && req.session.user.role === 'admin';
  next();
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.get('/', (req, res) => {
  res.render('public/home', {
    title: 'Web Development Learning Platform',
    pageTitle: 'Home',
  });
});

app.get('/about', (req, res) => {
  res.render('public/about', {
    title: 'About – Web Development Learning Platform',
    pageTitle: 'About',
  });
});

app.get('/contact', (req, res) => {
  res.render('public/contact', {
    title: 'Contact – Web Development Learning Platform',
    pageTitle: 'Contact',
  });
});

// Public lesson routes (list + single lesson by slug)
app.use(publicRoutes);

// Authentication routes (register, login, logout)
app.use(authRoutes);

// Admin routes (protected by requireAuth + requireAdmin)
app.use('/admin', adminRoutes);

// ---------------------------------------------------------------------------
// 404 handler (must be after all other routes)
// ---------------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).render('public/404', {
    title: 'Page Not Found',
    pageTitle: '404',
  });
});

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).render('public/500', {
    title: 'Server Error',
    pageTitle: 'Error',
    message: process.env.NODE_ENV === 'production'
      ? 'Something went wrong. Please try again later.'
      : err.message,
  });
});

module.exports = app;
