const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const PORT = process.env.PORT || 3000;
const MIME = {
  '.html':'text/html; charset=utf-8', '.htm':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.js':'application/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.xml':'application/xml; charset=utf-8',
  '.txt':'text/plain; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.gif':'image/gif',
  '.webp':'image/webp', '.svg':'image/svg+xml', '.ico':'image/x-icon', '.mp4':'video/mp4', '.webm':'video/webm'
};
function safeJoin(urlPath) {
  let decoded = decodeURIComponent(urlPath.split('?')[0]).replace(/\\/g, '/');
  decoded = decoded.replace(/\/+/g, '/');
  if (decoded === '/' || decoded === '') decoded = '/index.htm';
  const full = path.normalize(path.join(ROOT, decoded));
  if (!full.startsWith(ROOT)) return null;
  return full;
}
function resolveFile(reqPath) {
  const first = safeJoin(reqPath);
  if (!first) return null;
  const candidates = [first, first + '.html', first + '.htm'];
  if (!path.extname(first)) {
    candidates.push(path.join(first, 'index.html'), path.join(first, 'index.htm'));
  }
  for (const file of candidates) {
    try { if (fs.statSync(file).isFile()) return file; } catch (e) {}
  }
  return null;
}
http.createServer((req, res) => {
  const file = resolveFile(req.url);
  if (!file) {
    const nf = path.join(ROOT, '404.html');
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return fs.createReadStream(fs.existsSync(nf) ? nf : path.join(ROOT, 'index.htm')).pipe(res);
  }
  const ext = path.extname(file).toLowerCase();
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
  if (/\.(png|jpe?g|gif|webp|svg|ico|css|js)$/i.test(file)) res.setHeader('Cache-Control', 'public, max-age=604800');
  else res.setHeader('Cache-Control', 'no-cache');
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`ilovebam10 server running on ${PORT}`));
