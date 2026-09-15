/**
 * Seed script – populates a few sample published lessons
 * so the public site has content to display.
 *
 * Run with:  npm run seed
 *
 * Safe to run multiple times – it clears previous seed data first.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { connect, getDb, close } = require('../db/connect');
const { ObjectId } = require('mongodb');

async function seed() {
  try {
    // Helpful debug (password is masked)
    const uri = process.env.MONGODB_URI || '(not set)';
    const masked = uri.replace(/:([^@]+)@/, ':********@');
    console.log('Using MongoDB URI:', masked);
    console.log('Database name:', process.env.MONGODB_DB_NAME || '(not set)');

    await connect();
    const db = getDb();

    console.log('Clearing previous seed data…');
    // Remove only pages that look like seed data (week 1–3)
    await db.collection('pages').deleteMany({
      slug: { $in: ['intro-to-web-dev', 'vs-code-setup', 'html-document-structure'] },
    });
    // Also remove orphaned content blocks that belonged to those pages
    // (we will re-insert fresh ones)

    console.log('Inserting sample pages…');

    const pages = [
      {
        title: 'Workspace Setup and Introduction to Web Development',
        slug: 'intro-to-web-dev',
        description: 'Get your development environment ready and understand what web development is all about.',
        category: 'HTML',
        weekNumber: 1,
        status: 'published',
        seoTitle: 'Week 1 – Introduction to Web Development',
        seoDescription: 'Set up your workspace and learn the basics of how the web works.',
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: new Date(),
      },
      {
        title: 'VS Code, Files, Folders and Developer Tools',
        slug: 'vs-code-setup',
        description: 'Master Visual Studio Code, organize projects, and use the browser developer tools.',
        category: 'HTML',
        weekNumber: 2,
        status: 'published',
        seoTitle: 'Week 2 – VS Code and Developer Tools',
        seoDescription: 'Learn VS Code, file structure, and browser developer tools.',
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: new Date(),
      },
      {
        title: 'HTML Document Structure',
        slug: 'html-document-structure',
        description: 'Understand the basic structure of every HTML page: doctype, html, head and body.',
        category: 'HTML',
        weekNumber: 3,
        status: 'published',
        seoTitle: 'Week 3 – HTML Document Structure',
        seoDescription: 'Learn the essential structure of an HTML document.',
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: new Date(),
      },
    ];

    const result = await db.collection('pages').insertMany(pages);
    const pageIds = Object.values(result.insertedIds);

    console.log('Inserting content blocks…');

    const contentBlocks = [
      // Week 1
      {
        pageId: pageIds[0],
        type: 'learningObjectives',
        order: 1,
        visible: true,
        data: {
          objectives: [
            'Explain what web development is',
            'Set up a basic development workspace',
            'Create your first HTML file',
          ],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        pageId: pageIds[0],
        type: 'heading',
        order: 2,
        visible: true,
        data: { text: 'Welcome to Web Development', level: 'h2' },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        pageId: pageIds[0],
        type: 'text',
        order: 3,
        visible: true,
        data: {
          content:
            '<p>Web development is the process of building websites and web applications. In this 36-week course you will learn HTML, CSS, JavaScript and how to put them together into real projects.</p><p>Everything you see on this learning platform is itself built with the technologies you will study.</p>',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        pageId: pageIds[0],
        type: 'informationBox',
        order: 4,
        visible: true,
        data: {
          title: 'Tip',
          style: 'tip',
          content: '<p>Keep a notebook (digital or paper) and write down every new concept. Active note-taking dramatically improves retention.</p>',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        pageId: pageIds[0],
        type: 'code',
        order: 5,
        visible: true,
        data: {
          language: 'html',
          description: 'Your first HTML file',
          code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Hello World</title>
</head>
<body>
  <h1>Hello, Web Development!</h1>
</body>
</html>`,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Week 2
      {
        pageId: pageIds[1],
        type: 'heading',
        order: 1,
        visible: true,
        data: { text: 'Visual Studio Code', level: 'h2' },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        pageId: pageIds[1],
        type: 'text',
        order: 2,
        visible: true,
        data: {
          content:
            '<p>VS Code is a free, powerful code editor. Install it from <a href="https://code.visualstudio.com/" target="_blank" rel="noopener">code.visualstudio.com</a>.</p><p>Useful extensions for this course: Live Server, Prettier, ESLint.</p>',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        pageId: pageIds[1],
        type: 'activity',
        order: 3,
        visible: true,
        data: {
          title: 'Create a Project Folder',
          difficulty: 'Easy',
          instructions:
            '<ol><li>Create a folder called <code>my-first-website</code>.</li><li>Inside it create an <code>index.html</code> file.</li><li>Open the folder in VS Code.</li></ol>',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Week 3
      {
        pageId: pageIds[2],
        type: 'heading',
        order: 1,
        visible: true,
        data: { text: 'The Basic HTML Skeleton', level: 'h2' },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        pageId: pageIds[2],
        type: 'text',
        order: 2,
        visible: true,
        data: {
          content:
            '<p>Every HTML page starts with a doctype declaration and contains an <code>&lt;html&gt;</code> element that holds a <code>&lt;head&gt;</code> and a <code>&lt;body&gt;</code>.</p>',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        pageId: pageIds[2],
        type: 'code',
        order: 3,
        visible: true,
        data: {
          language: 'html',
          description: 'Minimal valid HTML5 document',
          code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document Title</title>
</head>
<body>
  <!-- Visible content goes here -->
</body>
</html>`,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        pageId: pageIds[2],
        type: 'informationBox',
        order: 4,
        visible: true,
        data: {
          title: 'Important',
          style: 'important',
          content: '<p>Always include the <code>lang</code> attribute on the <code>&lt;html&gt;</code> element. It helps screen readers and search engines.</p>',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.collection('content').insertMany(contentBlocks);

    console.log('Seed completed successfully!');
    console.log(`  • ${pages.length} published lessons created`);
    console.log(`  • ${contentBlocks.length} content blocks created`);
    console.log('\nVisit http://localhost:3000/lessons to see them.');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    await close();
  }
}

seed();
