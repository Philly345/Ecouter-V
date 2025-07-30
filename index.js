const { onRequest } = require('firebase-functions/v2/https');
const next = require('next');

// Configure Next.js app
const nextjsDistDir = require('./next.config.js')?.distDir || '.next';
const nextjsServer = next({
  dev: false,
  conf: {
    distDir: nextjsDistDir,
  },
});
const nextjsHandle = nextjsServer.getRequestHandler();

// Export the Firebase function
exports.nextjsFunc = onRequest(
  {
    memory: '2GiB',
    timeoutSeconds: 3600, // 60 minutes
    maxInstances: 10,
  },
  async (req, res) => {
    return nextjsServer.prepare().then(() => nextjsHandle(req, res));
  }
);
