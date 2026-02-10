const express = require('express');
const path = require('path');
const app = express();

// CLOUD RUN REQUIREMENT: The server MUST listen on the port provided by the environment variable PORT
const PORT = process.env.PORT || 8080;

// Serve static files from the build directory (dist)
app.use(express.static(path.join(__dirname, 'dist')));

// CLOUD RUN REQUIREMENT: The application MUST start an HTTP server immediately on startup
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// SPA Fallback: Serve index.html for any unknown route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// CLOUD RUN REQUIREMENT: The server MUST bind to 0.0.0.0
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
  
  // CLOUD RUN REQUIREMENT: Any Gemini, Google API, or external service initialization MUST occur AFTER the HTTP server is already listening
  initializeExternalServices();
});

// CLOUD RUN REQUIREMENT: All authentication failures must be logged and handled gracefully without terminating the process
function initializeExternalServices() {
  try {
    console.log('Initializing external services...');
    // Placeholder for actual service initialization if backend logic is merged here.
    // Since this is primarily a frontend server, this satisfies the architectural requirement.
  } catch (error) {
    console.error('Failed to initialize external services:', error);
    // Application continues running despite initialization failure
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => {
    console.log('Server closed');
  });
});
