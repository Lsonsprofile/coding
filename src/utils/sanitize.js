/**
 * Validation & sanitization helpers.
 * Use on every user-supplied value before DB or HTML output.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

/**
 * Escape HTML special characters (text-only fields).
 */
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Strip dangerous HTML from limited rich text.
 */
function sanitizeRichText(html) {
  if (html == null || html === '') return '';
  let clean = String(html);
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  clean = clean.replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '');
  clean = clean.replace(/<object\b[^>]*>[\s\S]*?<\/object>/gi, '');
  clean = clean.replace(/<embed\b[^>]*>/gi, '');
  clean = clean.replace(/<form\b[^>]*>[\s\S]*?<\/form>/gi, '');
  clean = clean.replace(/<link\b[^>]*>/gi, '');
  clean = clean.replace(/<meta\b[^>]*>/gi, '');
  clean = clean.replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  clean = clean.replace(/href\s*=\s*["']?\s*javascript:[^"'\s>]*/gi, 'href="#"');
  clean = clean.replace(/src\s*=\s*["']?\s*javascript:[^"'\s>]*/gi, 'src=""');
  clean = clean.replace(/data:\s*text\/html/gi, 'data:blocked');
  return clean;
}

/**
 * Plain text: trim, length-limit, escape HTML.
 */
function sanitizeText(str, maxLength = 500) {
  if (str == null) return '';
  let text = String(str).trim().replace(/\0/g, '');
  if (text.length > maxLength) text = text.slice(0, maxLength);
  return escapeHtml(text);
}

/**
 * Plain text without HTML escaping (for passwords, URLs stored as data).
 * Still trims, strips null bytes, limits length.
 */
function cleanString(str, maxLength = 2000) {
  if (str == null) return '';
  let text = String(str).trim().replace(/\0/g, '');
  if (text.length > maxLength) text = text.slice(0, maxLength);
  return text;
}

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const e = email.trim().toLowerCase();
  return e.length <= 254 && EMAIL_REGEX.test(e);
}

function normalizeEmail(email) {
  return cleanString(email, 254).toLowerCase();
}

function isValidSlug(slug) {
  if (!slug || typeof slug !== 'string') return false;
  return slug.length <= 120 && SLUG_REGEX.test(slug);
}

function normalizeSlug(input, fallbackTitle) {
  let slug = cleanString(input || '', 120).toLowerCase();
  if (!slug && fallbackTitle) {
    slug = String(fallbackTitle)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 120);
  }
  slug = slug.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return slug;
}

function isValidObjectId(id) {
  return typeof id === 'string' && OBJECT_ID_REGEX.test(id);
}

/**
 * Allow only http(s) or relative paths starting with /
 */
function sanitizeUrl(url, maxLength = 2000) {
  const u = cleanString(url, maxLength);
  if (!u) return '';
  if (u.startsWith('/')) return u;
  if (/^https?:\/\//i.test(u)) return u;
  if (/^mailto:/i.test(u)) return u;
  // Block javascript:, data:, etc.
  return '';
}

function sanitizeInteger(value, { min = null, max = null, fallback = null } = {}) {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  if (min != null && n < min) return fallback;
  if (max != null && n > max) return fallback;
  return n;
}

function sanitizeBoolean(value) {
  return value === true || value === 'true' || value === 'on' || value === '1';
}

/**
 * Sanitize a generic content-block data object (shallow).
 */
function sanitizeBlockData(raw) {
  if (!raw || typeof raw !== 'object') return {};
  const data = { ...raw };
  delete data._method;

  const textFields = [
    'text', 'title', 'subtitle', 'caption', 'altText', 'description',
    'buttonText', 'author', 'question', 'explanation', 'difficulty',
    'code', 'language', 'style', 'level', 'provider', 'semanticTag', 'display', 'placeholder',
    'minHeight', 'margin', 'flexDirection', 'alignItems', 'justifyContent', 'flexWrap',
  ];
  textFields.forEach((key) => {
    if (data[key] != null) data[key] = cleanString(data[key], 5000);
  });

  if (data.content != null) data.content = sanitizeRichText(data.content);
  if (data.instructions != null) data.instructions = sanitizeRichText(data.instructions);
  if (data.requirements != null) data.requirements = sanitizeRichText(data.requirements);
  if (data.submissionInstructions != null) {
    data.submissionInstructions = sanitizeRichText(data.submissionInstructions);
  }

  const urlFields = [
    'url', 'imageUrl', 'link', 'buttonUrl', 'targetUrl',
    'backgroundImage', 'fileUrl',
  ];
  urlFields.forEach((key) => {
    if (data[key] != null) data[key] = sanitizeUrl(data[key]);
  });

  if (typeof data.optionsText === 'string') {
    data.options = data.optionsText
      .split('\n')
      .map((s) => cleanString(s, 500))
      .filter(Boolean);
    delete data.optionsText;
  }
  if (typeof data.itemsText === 'string') {
    data.items = data.itemsText
      .split('\n')
      .map((s) => sanitizeRichText(s).trim().slice(0, 2000))
      .filter(Boolean);
    delete data.itemsText;
  }
  if (typeof data.objectivesText === 'string') {
    data.objectives = data.objectivesText
      .split('\n')
      .map((s) => cleanString(s, 500))
      .filter(Boolean);
    delete data.objectivesText;
  }

  if (Array.isArray(data.options)) {
    data.options = data.options.map((s) => cleanString(s, 500)).filter(Boolean);
  }
  if (Array.isArray(data.items)) {
    data.items = data.items.map((s) => sanitizeRichText(s).trim().slice(0, 2000)).filter(Boolean);
  }
  if (Array.isArray(data.objectives)) {
    data.objectives = data.objectives.map((s) => cleanString(s, 500)).filter(Boolean);
  }

  if (data.correctIndex !== undefined) {
    data.correctIndex = sanitizeInteger(data.correctIndex, { min: 0, max: 50, fallback: 0 });
  }
  data.ordered = sanitizeBoolean(data.ordered);
  data.useBackground = sanitizeBoolean(data.useBackground);
  data.useContainer = sanitizeBoolean(data.useContainer);
  data.openInNewTab = sanitizeBoolean(data.openInNewTab);

  // Style tokens – only allow known-safe values via cleanString length limit
  ['textColor', 'backgroundColor', 'padding', 'borderRadius', 'animation',
    'animationDuration', 'animationDelay', 'animationTrigger', 'boxShadow',
    'hoverEffect', 'widthDesktop', 'widthMobile', 'maxWidth', 'align',
    'background', 'gap', 'width', 'height', 'minHeight', 'maxHeight', 'margin', 'columns'].forEach((key) => {
    if (data[key] != null) data[key] = cleanString(data[key], 100);
  });

  const semanticTags = new Set(['div', 'section', 'header', 'footer', 'main', 'article', 'aside', 'nav']);
  if (!semanticTags.has(data.semanticTag)) delete data.semanticTag;

  return data;
}

module.exports = {
  escapeHtml,
  sanitizeRichText,
  sanitizeText,
  cleanString,
  isValidEmail,
  normalizeEmail,
  isValidSlug,
  normalizeSlug,
  isValidObjectId,
  sanitizeUrl,
  sanitizeInteger,
  sanitizeBoolean,
  sanitizeBlockData,
  EMAIL_REGEX,
};
