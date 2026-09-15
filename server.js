/**
 * Application entry point.
 * Connects to MongoDB, then starts the HTTP server.
 * Separating this from app.js allows the Express app to be
 * imported for testing without binding to a port.
 */

const app = require('./app');
const { connect } = require('./src/db/connect');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    // Establish database connection before accepting requests
    await connect();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
