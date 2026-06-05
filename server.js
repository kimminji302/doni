const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
};

// index.html, sw.js 는 캐시 금지 — 나머지 정적 에셋은 1년 캐시
function getCacheHeader(filePath) {
  const base = path.basename(filePath);
  if (base === 'index.html' || base === 'sw.js') {
    return 'no-cache, no-store, must-revalidate';
  }
  return 'public, max-age=31536000, immutable';
}

http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.join(ROOT, urlPath);

  // 경로 탈출 방지
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end(); return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // 404 → index.html (SPA fallback)
      fs.readFile(path.join(ROOT, 'index.html'), (e2, d2) => {
        if (e2) { res.writeHead(500); res.end(); return; }
        res.writeHead(200, {
          'Content-Type': MIME['.html'],
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        });
        res.end(d2);
      });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': getCacheHeader(filePath),
    });
    res.end(data);
  });
}).listen(PORT, () => console.log(`doni server running on port ${PORT}`));
