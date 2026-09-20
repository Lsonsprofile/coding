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

// Required on Render / reverse proxies so secure cookies and req.ip work
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}


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
  name: 'webdev.sid', // custom name instead of default connect.sid
  secret: process.env.SESSION_SECRET || 'dev-only-insecure-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,                               // not accessible from JS
    sameSite: 'lax',                              // mitigates CSRF
    maxAge: 1000 * 60 * 60 * 24 * 7,              // 7 days
  },
  // Note: For production we will later add a Mongo-backed session store.
  // For now the default MemoryStore is acceptable in development.
}));

// ---------------------------------------------------------------------------
// Make session user available to all views (res.locals)
// ---------------------------------------------------------------------------
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.currentUser = req.session.user || null;
  res.locals.isAuthenticated = Boolean(req.session.user);
  res.locals.isAdmin = Boolean(req.session.user && req.session.user.role === 'admin');
  // Safe defaults so EJS never hits "X is not defined"
  res.locals.comments = res.locals.comments || [];
  res.locals.contentBlocks = res.locals.contentBlocks || [];
  res.locals.pages = res.locals.pages || [];
  res.locals.success = res.locals.success || null;
  res.locals.error = res.locals.error || null;
  res.locals.commentError = res.locals.commentError || null;
  res.locals.isPreview = false;
  res.locals.isPlaceholder = false;
  res.locals.seoDescription = res.locals.seoDescription || '';
  next();
});

// Load editable header/footer for all views (never fail the request)
const settingsModel = require('./src/models/settingsModel');
const pageModel = require('./src/models/pageModel');
app.use(async (req, res, next) => {
  try {
    const [header, footer, pages] = await Promise.all([
      settingsModel.getHeader(),
      settingsModel.getFooter(),
      pageModel.findAllPages(),
    ]);
    const validSlugs = new Set((pages || []).filter((page) => page.status === 'published').map((page) => page.slug));
    res.locals.adminPageCount = (pages || []).length;
    res.locals.publishedPageCount = validSlugs.size;
    const storedHeader = header || settingsModel.DEFAULTS.header;
    const navItems = (storedHeader.navItems || [])
      .filter((item) => item.url && validSlugs.has(item.url === '/' ? 'home' : item.url.slice(1)))
      .map((item) => item.type === 'dropdown'
        ? { ...item, children: (item.children || []).filter((child) => child.url === '/' || validSlugs.has(String(child.url || '').replace(/^\//, ''))) }
        : item)
      .filter((item) => item.type !== 'dropdown' || item.children.length > 0)
      .filter((item, index, items) => items.findIndex((candidate) => candidate.url === item.url) === index);
    res.locals.siteHeader = { ...storedHeader, navItems };
    res.locals.siteFooter = footer || settingsModel.DEFAULTS.footer;
  } catch (e) {
    console.error('Settings load error:', e.message);
    res.locals.siteHeader = settingsModel.DEFAULTS.header;
    res.locals.siteFooter = settingsModel.DEFAULTS.footer;
  }
  next();
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
const pageController = require('./src/controllers/pageController');

// Site pages driven by CMS (edit in Admin → Pages, slugs: home, about, contact)
app.get('/', pageController.home);
app.get('/home', (req, res) => res.redirect(301, '/'));
app.get('/about', pageController.about);
app.get('/contact', pageController.contact);

// Optional contact form POST (simple thank-you for now)
app.post('/contact', (req, res) => {
  res.render('public/site-page', {
    title: 'Message received',
    pageTitle: 'Contact',
    page: { title: 'Thank you', slug: 'contact', description: 'Your message has been received. We will get back to you soon.' },
    contentBlocks: [],
    isPlaceholder: false,
  });
});

// Health check for Render / uptime monitors
app.get('/health', (req, res) => {
  res.status(200).json({ ok: true, env: process.env.NODE_ENV || 'development' });
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
