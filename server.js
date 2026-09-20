/**
 * Application entry point.
 * Connects to MongoDB, then starts the HTTP server.
 */

const fs = require('fs');
const path = require('path');
const app = require('./app');
const { connect } = require('./src/db/connect');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    // Ensure upload directory exists (Render's filesystem is ephemeral)
    const uploadDir = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    await connect();

    // Bind to 0.0.0.0 so Render (and other hosts) can reach the service
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
