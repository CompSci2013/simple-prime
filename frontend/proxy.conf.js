const fs = require('fs');
const path = require('path');

/**
 * Angular Dev Server Proxy Configuration
 *
 * Configures proxy routes for the Angular development server.
 * Updated for http-proxy-middleware v3+ (Angular 21+).
 *
 * Routes:
 * - /api/preferences/v1: Proxied to backend API
 * - /report: Serves Playwright test reports with no-cache headers
 */
module.exports = [
  // API proxy for preferences endpoint
  {
    context: ['/api/preferences/v1'],
    target: 'http://generic-prime.minilab',
    changeOrigin: true
  },
  // Playwright report static file server
  {
    context: ['/report'],
    target: 'http://localhost:4205',
    changeOrigin: false,
    // Use selfHandleResponse to bypass proxy and serve files directly
    selfHandleResponse: true,
    on: {
      proxyReq: (proxyReq, req, res) => {
        // Serve static report files with aggressive no-cache headers
        const reportPath = path.join(__dirname, 'playwright-report', req.url.substring(8));

        if (fs.existsSync(reportPath)) {
          try {
            const content = fs.readFileSync(reportPath);

            // Set aggressive no-cache headers for all report files
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0, private');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            res.setHeader('ETag', 'W/"' + Date.now() + '"');

            // Determine content type based on file extension
            const ext = path.extname(reportPath).toLowerCase();
            const contentTypes = {
              '.html': 'text/html; charset=utf-8',
              '.js': 'application/javascript; charset=utf-8',
              '.json': 'application/json',
              '.css': 'text/css; charset=utf-8',
              '.png': 'image/png',
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.gif': 'image/gif',
              '.svg': 'image/svg+xml',
              '.woff': 'font/woff',
              '.woff2': 'font/woff2',
              '.ttf': 'font/ttf',
              '.eot': 'application/vnd.ms-fontobject'
            };

            res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
            res.writeHead(200);
            res.end(content);
          } catch (error) {
            console.error('Error serving report file:', error);
            res.writeHead(500);
            res.end('Error serving file');
          }
        } else {
          // File not found
          res.writeHead(404);
          res.end('Report file not found');
        }
      }
    }
  }
];
