# Interactive Web Development Learning Platform

A full-stack, server-rendered learning management and content management platform built with:

- **Frontend**: Semantic HTML5, modern responsive CSS, vanilla JavaScript, EJS templates
- **Backend**: Node.js, Express.js (Routes → Controllers → Database → EJS Views)
- **Database**: MongoDB (official Node.js driver)
- **Auth**: Express sessions + bcryptjs (pure JavaScript), role-based (admin / user)

No React, Vue, Angular or other frontend frameworks.

## Current Status (Milestone 1)

- Project structure created according to preferred layout
- Environment variable configuration (`.env.example`)
- MongoDB connection module with required indexes
- Express app skeleton with security middleware, sessions, static files
- EJS layout partials (head, nav, footer)
- Public pages: Home, About, Contact, 404, 500
- Responsive mobile-first CSS and basic accessibility
- Client-side navigation toggle (progressive enhancement)

## Next Steps (following development_order)

1. Finish dependency installation (`npm install`)
2. Build dynamic lesson/page rendering from MongoDB
3. User registration, login, logout
4. Role-based authorization middleware
5. Admin dashboard
6. Page & content-block CRUD
7. Publishing workflow
8. Comments, media, advanced blocks, etc.

## Running Locally (Windows / macOS / Linux)

```bash
# 1. Make sure you are inside the coding folder
cd coding

# 2. Clean any previous failed install (important after the bcrypt change)
rmdir /s /q node_modules   # Windows
# or:  rm -rf node_modules package-lock.json   # macOS / Linux

# 3. Install dependencies
npm install

# 4. Configure environment
copy .env.example .env     # Windows
# or:  cp .env.example .env   # macOS / Linux
# Edit .env with your MongoDB URI and a strong SESSION_SECRET

# 5. Start the server
npm start
# or for development with auto-restart:
npm run dev
```

Visit http://localhost:3000

### Why bcryptjs instead of bcrypt?

`bcrypt` is a native C++ module that requires compilation tools on Windows and frequently fails with node-pre-gyp / missing module errors.  
`bcryptjs` is a pure-JavaScript implementation with the same API (`hash`, `compare`). It installs cleanly everywhere and is perfectly suitable for this learning platform.

## Architecture Notes

- **Separation of concerns**: Routes only route; controllers handle request/response logic; database access is isolated; views contain presentation only.
- **Dynamic content**: Lessons and pages are stored as documents in MongoDB. Administrators create and edit them through the admin UI — no new EJS files are required for new lessons.
- **Security**: Passwords hashed with bcryptjs, secrets in environment variables, role checks on protected routes, input validation on the server.
- **Responsive & accessible**: Mobile-first CSS, semantic HTML, keyboard navigation, focus states, prefers-reduced-motion support.
