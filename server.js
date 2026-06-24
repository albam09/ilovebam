const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(ROOT, 'admin-data');
const DATA_FILE = path.join(DATA_DIR, 'content.json');
const UPLOAD_DIR = path.join(ROOT, 'uploads', 'admin');
const DEFAULT_ADMIN_USER = process.env.ADMIN_USER || 'admin';
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ilovebam10!2026';
const SESSION_SECRET = process.env.SESSION_SECRET || 'ilovebam10-local-session-secret-change-on-cloudtype';
const MAX_BODY = 15 * 1024 * 1024;

const MIME = {
  '.html':'text/html; charset=utf-8', '.htm':'text/html; charset=utf-8', '.php':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.js':'application/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.xml':'application/xml; charset=utf-8',
  '.txt':'text/plain; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.gif':'image/gif',
  '.webp':'image/webp', '.svg':'image/svg+xml', '.ico':'image/x-icon', '.mp4':'video/mp4', '.webm':'video/webm'
};

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const sessions = new Map();

function sha256(text) {
  return crypto.createHash('sha256').update(String(text)).digest('hex');
}
function escapeHtml(v) {
  return String(v ?? '').replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
}
function stripTags(v) {
  return String(v ?? '').replace(/<[^>]*>/g, '').trim();
}
function slugify(v) {
  const base = String(v || '').trim()
    .normalize('NFKC')
    .replace(/[\\/]+/g, '-')
    .replace(/[^0-9a-zA-Z가-힣_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return base || ('shop-' + Date.now());
}
function nowIso() {
  return new Date().toISOString();
}
function defaultData() {
  return {
    version: 1,
    auth: {
      user: DEFAULT_ADMIN_USER,
      passwordHash: sha256(DEFAULT_ADMIN_PASSWORD)
    },
    site: {
      title: '아이러브밤10 - 광주 상무지구 노래방·가라오케 안내',
      description: '아이러브밤10은 광주 상무지구 노래방, 가라오케, 퍼블릭, 룸바, 2차 연관 검색 흐름을 정리한 안내 사이트입니다.',
      phone: '010-8095-3087',
      kakao: '',
      footerText: '광주 상무지구 노래방·가라오케 안내',
      injectManagedSection: true
    },
    notices: [],
    shops: [],
    images: [],
    updatedAt: nowIso()
  };
}
function loadData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const data = JSON.parse(raw);
    const d = defaultData();
    return {
      ...d,
      ...data,
      auth: { ...d.auth, ...(data.auth || {}) },
      site: { ...d.site, ...(data.site || {}) },
      notices: Array.isArray(data.notices) ? data.notices : [],
      shops: Array.isArray(data.shops) ? data.shops : [],
      images: Array.isArray(data.images) ? data.images : []
    };
  } catch (e) {
    const d = defaultData();
    saveData(d);
    return d;
  }
}
function saveData(data) {
  data.updatedAt = nowIso();
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, DATA_FILE);
}
function publicData() {
  const data = loadData();
  return {
    site: data.site || {},
    notices: (data.notices || []).filter(n => n.active !== false).sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||'')),
    shops: (data.shops || []).filter(s => s.active !== false).sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0) || (b.updatedAt||'').localeCompare(a.updatedAt||'')),
    updatedAt: data.updatedAt
  };
}

function parseCookies(req) {
  const out = {};
  String(req.headers.cookie || '').split(';').forEach(part => {
    const i = part.indexOf('=');
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}
function signSession(id) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(id).digest('hex');
}
function createSession(user) {
  const id = crypto.randomBytes(24).toString('hex');
  sessions.set(id, { user, createdAt: Date.now() });
  return `${id}.${signSession(id)}`;
}
function getSession(req) {
  const token = parseCookies(req).ilovebam_admin;
  if (!token || !token.includes('.')) return null;
  const [id, sig] = token.split('.');
  if (sig !== signSession(id)) return null;
  const s = sessions.get(id);
  if (!s) return null;
  if (Date.now() - s.createdAt > 1000 * 60 * 60 * 24 * 3) {
    sessions.delete(id);
    return null;
  }
  return s;
}
function clearSession(req) {
  const token = parseCookies(req).ilovebam_admin;
  if (token && token.includes('.')) sessions.delete(token.split('.')[0]);
}
function requireAdmin(req, res) {
  const s = getSession(req);
  if (s) return s;
  sendJson(res, { ok: false, error: '관리자 로그인이 필요합니다.' }, 401);
  return null;
}

function send(res, body, status = 200, type = 'text/html; charset=utf-8') {
  res.statusCode = status;
  res.setHeader('Content-Type', type);
  res.end(body);
}
function sendJson(res, obj, status = 200) {
  send(res, JSON.stringify(obj), status, 'application/json; charset=utf-8');
}
function sendRedirect(res, location, code = 301) {
  res.statusCode = code;
  res.setHeader('Location', location);
  res.setHeader('Cache-Control', 'no-cache');
  res.end(`Redirecting to ${location}`);
}
function readBody(req, limit = MAX_BODY) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error('파일 또는 요청 본문이 너무 큽니다. 최대 15MB입니다.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
async function readJson(req) {
  const buf = await readBody(req);
  if (!buf.length) return {};
  return JSON.parse(buf.toString('utf8'));
}
async function readForm(req) {
  const buf = await readBody(req);
  return Object.fromEntries(new URLSearchParams(buf.toString('utf8')));
}
function parseMultipart(body, contentType) {
  const m = /boundary=(?:(?:"([^"]+)")|([^;]+))/i.exec(contentType || '');
  if (!m) return { fields: {}, files: [] };
  const boundary = m[1] || m[2];
  const marker = '--' + boundary;
  const binary = body.toString('latin1');
  const parts = binary.split(marker).slice(1, -1);
  const fields = {};
  const files = [];
  for (let part of parts) {
    if (part.startsWith('\r\n')) part = part.slice(2);
    const splitAt = part.indexOf('\r\n\r\n');
    if (splitAt < 0) continue;
    const header = part.slice(0, splitAt);
    let content = part.slice(splitAt + 4);
    if (content.endsWith('\r\n')) content = content.slice(0, -2);
    const name = /name="([^"]+)"/i.exec(header)?.[1];
    const filename = /filename="([^"]*)"/i.exec(header)?.[1];
    const type = /Content-Type:\s*([^\r\n]+)/i.exec(header)?.[1] || 'application/octet-stream';
    if (!name) continue;
    if (filename) files.push({ field: name, filename, type, buffer: Buffer.from(content, 'latin1') });
    else fields[name] = Buffer.from(content, 'latin1').toString('utf8');
  }
  return { fields, files };
}

function cleanUrl(reqUrl) {
  const u = new URL(reqUrl, 'http://local');
  let pathname = decodeURIComponent(u.pathname).replace(/\\/g, '/').replace(/\/+/g, '/');
  if (pathname !== u.pathname) return pathname + (u.search || '');
  if (/^\/index(?:\.html?|\.php(?:\.html)?|-\d+\.htm)$/i.test(pathname)) return '/';
  if (/^\/index\.php$/i.test(pathname)) return '/';
  if (/\.(html|htm)$/i.test(pathname) && !/^\/404\.html$/i.test(pathname)) {
    let clean = pathname.replace(/\.(html|htm)$/i, '');
    if (clean === '/index' || clean === '/index.php') clean = '/';
    return clean + (u.search && !/\.(css|js|png|jpg|jpeg|gif|webp|svg|ico)$/i.test(pathname) ? '' : '');
  }
  if (u.search && /(?:\.php$|\/bbs\/board\.php(?:-\d+)?$|\/ishop_list\.php$|\/point_info\.php$|\/rank\.php$)/i.test(pathname)) {
    return pathname;
  }
  return null;
}
function safeJoin(urlPath) {
  let decoded = decodeURIComponent(urlPath.split('?')[0]).replace(/\\/g, '/');
  decoded = decoded.replace(/\/+/g, '/');
  if (decoded === '/' || decoded === '') decoded = '/index.html';
  const full = path.normalize(path.join(ROOT, decoded));
  if (!full.startsWith(ROOT)) return null;
  return full;
}
function resolveFile(reqPath) {
  const first = safeJoin(reqPath);
  if (!first) return null;
  const candidates = [first, first + '.html', first + '.htm'];
  if (!path.extname(first)) candidates.push(path.join(first, 'index.html'), path.join(first, 'index.htm'));
  for (const file of candidates) {
    try { if (fs.statSync(file).isFile()) return file; } catch (e) {}
  }
  return null;
}
function isEditableRelative(rel) {
  if (!rel || rel.includes('\0')) return false;
  const normalized = path.normalize(rel).replace(/\\/g, '/');
  if (normalized.startsWith('../') || normalized.startsWith('/')) return false;
  if (/^(node_modules|admin-data|uploads)\//i.test(normalized)) return false;
  const ext = path.extname(normalized).toLowerCase();
  return ['.html', '.htm', '.css', '.js', '.txt', '.xml', '.json'].includes(ext) && !['package.json'].includes(path.basename(normalized));
}
function listEditableFiles() {
  const files = [];
  const skip = new Set(['node_modules', '.git', 'admin-data', 'uploads']);
  function walk(dir) {
    if (files.length > 700) return;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skip.has(ent.name)) continue;
      const full = path.join(dir, ent.name);
      const rel = path.relative(ROOT, full).replace(/\\/g, '/');
      if (ent.isDirectory()) walk(full);
      else if (isEditableRelative(rel)) {
        const st = fs.statSync(full);
        files.push({ path: rel, size: st.size, modifiedAt: st.mtime.toISOString() });
      }
    }
  }
  walk(ROOT);
  return files.sort((a,b) => a.path.localeCompare(b.path));
}
function getEditableFilePath(rel) {
  if (!isEditableRelative(rel)) return null;
  const full = path.normalize(path.join(ROOT, rel));
  if (!full.startsWith(ROOT)) return null;
  return full;
}

function injectManagedHtml(file, html, req) {
  const data = loadData();
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  let out = html;
  if (rel === 'index.html') {
    if (data.site?.title) out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(data.site.title)}</title>`);
    if (data.site?.description) {
      const desc = `<meta name="description" content="${escapeHtml(data.site.description)}">`;
      if (/<meta[^>]+name=["']description["'][^>]*>/i.test(out)) out = out.replace(/<meta[^>]+name=["']description["'][^>]*>/i, desc);
      else out = out.replace(/<head[^>]*>/i, m => m + '\n' + desc);
    }
  }
  const asset = `\n<link rel="stylesheet" href="/admin-assets/site-managed.css?v=20260625">\n<script defer src="/admin-assets/site-managed.js?v=20260625"></script>\n`;
  if (!out.includes('/admin-assets/site-managed.js')) {
    if (/<\/head>/i.test(out)) out = out.replace(/<\/head>/i, asset + '</head>');
    else out += asset;
  }
  if (getSession(req) && !out.includes('ilovebam-admin-shortcut')) {
    const bar = `<div id="ilovebam-admin-shortcut"><a href="/admin">관리자</a></div>`;
    out = out.replace(/<body([^>]*)>/i, `<body$1>${bar}`);
  }
  return out;
}

const SITE_CSS = `
#ilovebam-managed-section{max-width:1180px;margin:22px auto;padding:0 14px;box-sizing:border-box;font-family:Arial,'Noto Sans KR',sans-serif;clear:both}
#ilovebam-managed-section *{box-sizing:border-box}
.ib-managed-title{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin:0 0 12px}
.ib-managed-title h2{font-size:24px;line-height:1.2;margin:0;color:#191919;font-weight:900;letter-spacing:-.04em}
.ib-managed-title p{font-size:13px;margin:0;color:#777}
.ib-shop-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.ib-shop-card{display:block;background:#fff;border:1px solid #eee;border-radius:18px;box-shadow:0 8px 24px rgba(0,0,0,.08);overflow:hidden;text-decoration:none;color:#222;transition:.18s transform,.18s box-shadow}
.ib-shop-card:hover{transform:translateY(-2px);box-shadow:0 12px 30px rgba(0,0,0,.12)}
.ib-shop-card img{width:100%;height:180px;object-fit:cover;display:block;background:#f3f3f3}
.ib-shop-body{padding:14px}
.ib-badges{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}
.ib-badge{font-size:12px;border-radius:999px;background:#fff1f5;color:#d91e5b;padding:4px 8px;font-weight:800}
.ib-shop-card h3{font-size:18px;line-height:1.25;margin:0 0 8px;color:#151515;font-weight:900;letter-spacing:-.03em}
.ib-shop-card p{font-size:13px;line-height:1.55;color:#666;margin:0 0 12px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ib-call-row{display:flex;gap:8px;align-items:center;justify-content:space-between;font-size:13px;font-weight:800;color:#111}
.ib-call-btn{border-radius:12px;background:#111;color:#fff;padding:8px 10px;text-decoration:none;white-space:nowrap}
.ib-notice-bar{max-width:1180px;margin:12px auto 0;padding:10px 14px;border-radius:14px;background:#111;color:#fff;font:14px/1.45 Arial,'Noto Sans KR',sans-serif}
.ib-notice-bar b{color:#fff}
.ib-floating-call{position:fixed;right:14px;bottom:16px;z-index:99999;display:flex;align-items:center;gap:8px;padding:12px 15px;border-radius:999px;background:#111;color:#fff!important;text-decoration:none;font:800 15px/1 Arial,'Noto Sans KR',sans-serif;box-shadow:0 8px 22px rgba(0,0,0,.22)}
#ilovebam-admin-shortcut{position:fixed;left:12px;bottom:16px;z-index:100000}
#ilovebam-admin-shortcut a{display:block;background:#0052ff;color:white!important;text-decoration:none;border-radius:999px;padding:10px 14px;font:800 13px Arial,'Noto Sans KR',sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.24)}
@media(max-width:860px){.ib-shop-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.ib-shop-card img{height:135px}.ib-managed-title h2{font-size:20px}.ib-shop-body{padding:11px}.ib-floating-call{left:12px;right:12px;justify-content:center}.ib-notice-bar{margin:10px 12px 0}}
@media(max-width:420px){.ib-shop-card img{height:118px}.ib-shop-card h3{font-size:16px}.ib-shop-card p{font-size:12px}.ib-badge{font-size:11px;padding:3px 7px}}
`;
const SITE_JS = `
(function(){
  if(window.__ilovebamManagedLoaded) return; window.__ilovebamManagedLoaded = true;
  function esc(s){return String(s||'').replace(/[&<>\"]/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]})}
  function ready(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn); else fn(); }
  ready(function(){
    fetch('/api/public-content',{cache:'no-store'}).then(function(r){return r.json()}).then(function(data){
      var site=data.site||{}, shops=data.shops||[], notices=data.notices||[];
      if(site.phone && !document.querySelector('.ib-floating-call')){
        var a=document.createElement('a'); a.className='ib-floating-call'; a.href='tel:'+String(site.phone).replace(/[^0-9+]/g,''); a.textContent='전화문의 '+site.phone; document.body.appendChild(a);
      }
      if(notices.length && !document.querySelector('.ib-notice-bar')){
        var n=notices[0]; var bar=document.createElement('div'); bar.className='ib-notice-bar'; bar.innerHTML='<b>'+esc(n.title||'공지')+'</b> &nbsp; '+esc(n.body||'');
        document.body.insertBefore(bar, document.body.firstChild);
      }
      if(site.injectManagedSection===false || !shops.length || document.getElementById('ilovebam-managed-section')) return;
      var sec=document.createElement('section'); sec.id='ilovebam-managed-section';
      sec.innerHTML='<div class="ib-managed-title"><div><h2>관리자 추천 업소</h2><p>관리자 페이지에서 노출 순서와 내용을 수정할 수 있습니다.</p></div></div><div class="ib-shop-grid"></div>';
      var grid=sec.querySelector('.ib-shop-grid');
      shops.forEach(function(s){
        var href='/shop/'+encodeURIComponent(s.slug||s.id);
        var card=document.createElement('a'); card.className='ib-shop-card'; card.href=href;
        var img=s.image ? '<img src="'+esc(s.image)+'" alt="'+esc((s.area||'광주')+' '+(s.name||'업소')+' '+(s.category||''))+'">' : '';
        card.innerHTML=img+'<div class="ib-shop-body"><div class="ib-badges"><span class="ib-badge">'+esc(s.area||'광주')+'</span><span class="ib-badge">'+esc(s.category||'가라오케')+'</span></div><h3>'+esc(s.name||'업소명')+'</h3><p>'+esc(s.description||'')+'</p><div class="ib-call-row"><span>'+esc(s.phone||site.phone||'문의 가능')+'</span><span class="ib-call-btn">상세보기</span></div></div>';
        grid.appendChild(card);
      });
      var target=document.querySelector('main')||document.querySelector('#wrapper')||document.querySelector('.wrapper')||document.body;
      if(target===document.body) document.body.insertBefore(sec, document.body.children[1]||null); else target.insertBefore(sec, target.firstChild);
    }).catch(function(){});
  });
})();
`;

function loginHtml(error = '') {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>아이러브밤10 관리자 로그인</title>${adminStyle()}</head><body class="admin-login"><main class="login-card"><h1>아이러브밤10 관리자</h1><p>사이트 내용을 수정하려면 로그인하세요.</p>${error ? `<div class="alert">${escapeHtml(error)}</div>` : ''}<form method="post" action="/admin/login"><label>아이디<input name="user" autocomplete="username" required value="admin"></label><label>비밀번호<input name="password" type="password" autocomplete="current-password" required></label><button type="submit">관리자 로그인</button></form><small>기본 계정: admin / ilovebam10!2026<br>Cloudtype 환경변수 ADMIN_PASSWORD로 비밀번호를 바꿀 수 있습니다.</small></main></body></html>`;
}
function adminStyle() {
  return `<style>
    :root{--bg:#f4f6fb;--card:#fff;--txt:#111827;--muted:#6b7280;--line:#e5e7eb;--pri:#174cff;--danger:#d93025;--ok:#0a7c37}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--txt);font-family:Arial,'Noto Sans KR',sans-serif}.admin-login{min-height:100vh;display:grid;place-items:center;padding:20px}.login-card{width:min(430px,100%);background:#fff;border-radius:24px;box-shadow:0 16px 50px rgba(15,23,42,.16);padding:28px}.login-card h1{font-size:25px;margin:0 0 8px}.login-card p{color:var(--muted);margin:0 0 22px}.login-card label{display:block;font-weight:800;margin:14px 0 6px}.login-card input{width:100%;border:1px solid var(--line);border-radius:14px;padding:13px;font-size:15px}.login-card button,.btn{border:0;border-radius:14px;background:var(--pri);color:#fff;font-weight:900;padding:12px 15px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:6px}.login-card button{width:100%;justify-content:center;margin-top:18px;font-size:16px}.login-card small{display:block;color:var(--muted);line-height:1.5;margin-top:16px}.alert{background:#fff1f1;color:#b00020;border:1px solid #ffd4d4;padding:10px;border-radius:12px;margin:0 0 14px}.admin-wrap{display:grid;grid-template-columns:250px 1fr;min-height:100vh}.side{background:#101827;color:#fff;padding:22px;position:sticky;top:0;height:100vh}.side h1{font-size:21px;margin:0 0 6px}.side p{font-size:12px;opacity:.7;margin:0 0 20px}.nav button,.side a{width:100%;border:0;background:transparent;color:#fff;text-align:left;padding:12px;border-radius:12px;font-weight:800;cursor:pointer;text-decoration:none;display:block;margin:3px 0}.nav button.active,.nav button:hover,.side a:hover{background:rgba(255,255,255,.12)}.content{padding:24px;max-width:1200px;width:100%}.top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px}.top h2{font-size:26px;margin:0}.card{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:18px;margin:0 0 16px;box-shadow:0 6px 24px rgba(15,23,42,.05)}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}label{font-weight:900;font-size:13px}input,textarea,select{width:100%;border:1px solid var(--line);border-radius:12px;padding:11px 12px;font:14px Arial,'Noto Sans KR',sans-serif;margin-top:7px;background:#fff}textarea{min-height:110px;resize:vertical}.muted{color:var(--muted);font-size:13px}.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.btn.gray{background:#374151}.btn.light{background:#eef2ff;color:#174cff}.btn.danger{background:var(--danger)}.btn.ok{background:var(--ok)}.table{width:100%;border-collapse:collapse}.table th,.table td{border-bottom:1px solid var(--line);padding:10px;text-align:left;font-size:13px;vertical-align:middle}.table img{width:70px;height:50px;object-fit:cover;border-radius:8px;background:#eee}.hide{display:none!important}.preview-img{max-width:220px;max-height:150px;border-radius:14px;border:1px solid var(--line);display:block;margin-top:8px}.toast{position:fixed;right:16px;bottom:16px;background:#111827;color:#fff;border-radius:14px;padding:12px 15px;box-shadow:0 8px 24px rgba(0,0,0,.25);z-index:10}.file-list{height:320px;overflow:auto;border:1px solid var(--line);border-radius:14px;background:#fff}.file-item{display:block;width:100%;border:0;background:#fff;text-align:left;padding:10px 12px;border-bottom:1px solid #f1f1f1;cursor:pointer}.file-item:hover{background:#f8fafc}.codearea{font-family:Consolas,Monaco,monospace;min-height:520px;white-space:pre;tab-size:2}.pill{display:inline-block;border-radius:999px;padding:4px 8px;font-size:12px;font-weight:900;background:#f3f4f6;color:#374151}.warn{background:#fff8e1;border:1px solid #ffe7a3;color:#7a4d00;border-radius:14px;padding:12px;line-height:1.5}.image-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.image-grid button{border:1px solid var(--line);background:#fff;border-radius:14px;padding:8px;cursor:pointer;text-align:left}.image-grid img{width:100%;height:90px;object-fit:cover;border-radius:10px}.image-grid span{display:block;font-size:11px;color:#555;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:6px}@media(max-width:900px){.admin-wrap{display:block}.side{position:relative;height:auto}.content{padding:14px}.grid,.grid3{grid-template-columns:1fr}.image-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.top{display:block}.table{display:block;overflow:auto}}
  </style>`;
}
function adminHtml() {
  const data = loadData();
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>아이러브밤10 관리자</title>${adminStyle()}</head><body><div class="admin-wrap"><aside class="side"><h1>아이러브밤10 ADMIN</h1><p>로그인 권한: ${escapeHtml(data.auth.user || 'admin')}</p><nav class="nav"><button data-tab="dashboard" class="active">대시보드</button><button data-tab="shops">업소 관리</button><button data-tab="notices">공지 관리</button><button data-tab="images">이미지 업로드</button><button data-tab="site">사이트 설정</button><button data-tab="files">파일 편집</button><button data-tab="password">비밀번호</button></nav><a href="/" target="_blank">사이트 보기</a><form method="post" action="/admin/logout"><button class="btn gray" style="width:100%;justify-content:center;margin-top:8px">로그아웃</button></form></aside><main class="content"><div class="top"><h2 id="pageTitle">대시보드</h2><div class="row"><a class="btn light" href="/" target="_blank">메인 보기</a><button class="btn" onclick="loadAll()">새로고침</button></div></div><section id="tab-dashboard" class="tab card"><h3>현재 상태</h3><div class="grid3"><div class="card"><b>업소</b><p id="statShops" class="muted">0개</p></div><div class="card"><b>공지</b><p id="statNotices" class="muted">0개</p></div><div class="card"><b>이미지</b><p id="statImages" class="muted">0개</p></div></div><div class="warn"><b>관리자 주소:</b> /admin<br><b>기본 계정:</b> admin / ilovebam10!2026<br>운영 전 Cloudtype 환경변수에 <b>ADMIN_PASSWORD</b>와 <b>SESSION_SECRET</b>을 넣으면 더 안전합니다.</div></section><section id="tab-shops" class="tab hide"><div class="card"><h3>업소 추가/수정</h3><input type="hidden" id="shopId"><div class="grid"><label>업소명<input id="shopName" placeholder="예: 상무지구 프리미엄 가라오케"></label><label>지역<input id="shopArea" placeholder="예: 상무지구"></label><label>카테고리<input id="shopCategory" placeholder="예: 노래방 / 가라오케 / 룸바"></label><label>전화번호<input id="shopPhone" placeholder="010-0000-0000"></label><label>노출순서<input id="shopOrder" type="number" value="10"></label><label>노출상태<select id="shopActive"><option value="true">노출</option><option value="false">숨김</option></select></label><label>대표 이미지 URL<input id="shopImage" placeholder="/uploads/admin/파일명.jpg"></label><label>상세 페이지 주소<input id="shopSlug" placeholder="자동 생성 가능"></label></div><label>설명<textarea id="shopDesc" placeholder="업소 설명, 이용 분위기, 지역 키워드 등을 입력"></textarea></label><label>상세 내용<textarea id="shopBody" placeholder="상세 페이지에 들어갈 긴 설명"></textarea></label><div class="row"><button class="btn ok" onclick="saveShop()">업소 저장</button><button class="btn gray" onclick="resetShopForm()">새 글쓰기</button><button class="btn light" onclick="pickImageFor('shopImage')">업로드 이미지 선택</button></div><img id="shopPreview" class="preview-img hide"></div><div class="card"><h3>업소 목록</h3><table class="table"><thead><tr><th>이미지</th><th>업소명</th><th>지역/분류</th><th>상태</th><th>관리</th></tr></thead><tbody id="shopRows"></tbody></table></div></section><section id="tab-notices" class="tab hide"><div class="card"><h3>공지 추가/수정</h3><input type="hidden" id="noticeId"><div class="grid"><label>제목<input id="noticeTitle" placeholder="예: 오늘 예약 가능"></label><label>노출상태<select id="noticeActive"><option value="true">노출</option><option value="false">숨김</option></select></label></div><label>내용<textarea id="noticeBody"></textarea></label><div class="row"><button class="btn ok" onclick="saveNotice()">공지 저장</button><button class="btn gray" onclick="resetNoticeForm()">새 공지</button></div></div><div class="card"><h3>공지 목록</h3><table class="table"><thead><tr><th>제목</th><th>내용</th><th>상태</th><th>관리</th></tr></thead><tbody id="noticeRows"></tbody></table></div></section><section id="tab-images" class="tab hide"><div class="card"><h3>이미지 업로드</h3><p class="muted">JPG/PNG/GIF/WEBP 이미지만 업로드됩니다. 업로드 후 URL을 업소 대표 이미지에 넣을 수 있습니다.</p><div class="row"><input id="uploadFile" type="file" accept="image/*" style="max-width:420px"><button class="btn" onclick="uploadImage()">업로드</button></div></div><div class="card"><h3>업로드 이미지</h3><div id="imageGrid" class="image-grid"></div></div></section><section id="tab-site" class="tab hide"><div class="card"><h3>사이트 설정</h3><div class="grid"><label>사이트 제목<input id="siteTitle"></label><label>대표 전화<input id="sitePhone"></label><label>카카오/기타 연락처<input id="siteKakao"></label><label>관리자 추천 업소 섹션<select id="siteInject"><option value="true">메인에 노출</option><option value="false">숨김</option></select></label></div><label>검색 설명 meta description<textarea id="siteDesc"></textarea></label><label>푸터 문구<input id="siteFooter"></label><button class="btn ok" onclick="saveSite()">사이트 설정 저장</button></div></section><section id="tab-files" class="tab hide"><div class="card warn"><b>주의:</b> HTML/CSS/JS 원본을 직접 수정하는 고급 기능입니다. 잘못 저장하면 화면이 깨질 수 있습니다. 저장 전 복사본을 남기는 것이 좋습니다.</div><div class="grid"><div class="card"><h3>파일 목록</h3><input id="fileSearch" placeholder="파일 검색" oninput="renderFiles()"><div id="fileList" class="file-list"></div></div><div class="card"><h3>파일 편집 <span id="currentFile" class="pill"></span></h3><textarea id="fileContent" class="codearea" spellcheck="false"></textarea><div class="row"><button class="btn ok" onclick="saveFile()">파일 저장</button><button class="btn gray" onclick="loadFile(currentFilePath)">다시 불러오기</button></div></div></div></section><section id="tab-password" class="tab hide"><div class="card"><h3>관리자 비밀번호 변경</h3><p class="muted">Cloudtype 환경변수 ADMIN_PASSWORD가 설정되어 있으면 환경변수가 우선입니다.</p><div class="grid"><label>현재 비밀번호<input id="oldPass" type="password"></label><label>새 비밀번호<input id="newPass" type="password"></label></div><button class="btn ok" onclick="changePassword()">비밀번호 변경</button></div></section></main></div><div id="toast" class="toast hide"></div><script>${adminScript()}</script></body></html>`;
}
function adminScript() {
  return `
let DATA={site:{},shops:[],notices:[],images:[]};let FILES=[];let currentFilePath='';
function $(id){return document.getElementById(id)}
function esc(s){return String(s||'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}
function toast(msg){$('toast').textContent=msg;$('toast').classList.remove('hide');setTimeout(()=>$('toast').classList.add('hide'),2200)}
async function api(url,opt={}){const r=await fetch(url,{headers:{'Content-Type':'application/json',...(opt.headers||{})},...opt});const j=await r.json().catch(()=>({ok:false,error:'응답 오류'}));if(!r.ok||j.ok===false)throw new Error(j.error||'처리 실패');return j}
document.querySelectorAll('.nav button').forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
function showTab(t){document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===t));document.querySelectorAll('.tab').forEach(s=>s.classList.add('hide'));$('tab-'+t).classList.remove('hide');$('pageTitle').textContent=document.querySelector('.nav button[data-tab="'+t+'"]').textContent;if(t==='files') loadFiles();}
async function loadAll(){try{const j=await api('/admin/api/data');DATA=j.data;fillSite();renderStats();renderShops();renderNotices();renderImages();}catch(e){toast(e.message)}}
function renderStats(){$('statShops').textContent=(DATA.shops||[]).length+'개';$('statNotices').textContent=(DATA.notices||[]).length+'개';$('statImages').textContent=(DATA.images||[]).length+'개'}
function fillSite(){let s=DATA.site||{};$('siteTitle').value=s.title||'';$('siteDesc').value=s.description||'';$('sitePhone').value=s.phone||'';$('siteKakao').value=s.kakao||'';$('siteFooter').value=s.footerText||'';$('siteInject').value=String(s.injectManagedSection!==false)}
async function saveSite(){try{const site={title:$('siteTitle').value,description:$('siteDesc').value,phone:$('sitePhone').value,kakao:$('siteKakao').value,footerText:$('siteFooter').value,injectManagedSection:$('siteInject').value==='true'};await api('/admin/api/site',{method:'POST',body:JSON.stringify(site)});toast('사이트 설정 저장 완료');loadAll()}catch(e){toast(e.message)}}
function resetShopForm(){['shopId','shopName','shopArea','shopCategory','shopPhone','shopImage','shopSlug','shopDesc','shopBody'].forEach(id=>$(id).value='');$('shopOrder').value='10';$('shopActive').value='true';$('shopPreview').classList.add('hide')}
function editShop(id){const s=(DATA.shops||[]).find(x=>x.id===id);if(!s)return;$('shopId').value=s.id;$('shopName').value=s.name||'';$('shopArea').value=s.area||'';$('shopCategory').value=s.category||'';$('shopPhone').value=s.phone||'';$('shopOrder').value=s.order||10;$('shopActive').value=String(s.active!==false);$('shopImage').value=s.image||'';$('shopSlug').value=s.slug||'';$('shopDesc').value=s.description||'';$('shopBody').value=s.body||'';previewShopImage();scrollTo(0,0)}
function previewShopImage(){let v=$('shopImage').value;if(v){$('shopPreview').src=v;$('shopPreview').classList.remove('hide')}else $('shopPreview').classList.add('hide')}
$('shopImage').addEventListener('input',previewShopImage);
async function saveShop(){try{const shop={id:$('shopId').value,name:$('shopName').value,area:$('shopArea').value,category:$('shopCategory').value,phone:$('shopPhone').value,order:Number($('shopOrder').value||10),active:$('shopActive').value==='true',image:$('shopImage').value,slug:$('shopSlug').value,description:$('shopDesc').value,body:$('shopBody').value};await api('/admin/api/shop',{method:'POST',body:JSON.stringify(shop)});toast('업소 저장 완료');resetShopForm();loadAll()}catch(e){toast(e.message)}}
async function deleteShop(id){if(!confirm('이 업소를 삭제할까요?'))return;try{await api('/admin/api/shop-delete',{method:'POST',body:JSON.stringify({id})});toast('삭제 완료');loadAll()}catch(e){toast(e.message)}}
function renderShops(){const rows=(DATA.shops||[]).map(s=>'<tr><td>'+(s.image?'<img src="'+esc(s.image)+'">':'')+'</td><td><b>'+esc(s.name)+'</b><br><span class="muted">/shop/'+esc(s.slug||s.id)+'</span></td><td>'+esc(s.area)+'<br>'+esc(s.category)+'</td><td>'+(s.active!==false?'<span class="pill">노출</span>':'<span class="pill">숨김</span>')+'</td><td><button class="btn light" onclick="editShop(\''+s.id+'\')">수정</button> <button class="btn danger" onclick="deleteShop(\''+s.id+'\')">삭제</button></td></tr>').join('');$('shopRows').innerHTML=rows||'<tr><td colspan="5" class="muted">등록된 업소가 없습니다.</td></tr>'}
function resetNoticeForm(){$('noticeId').value='';$('noticeTitle').value='';$('noticeBody').value='';$('noticeActive').value='true'}
function editNotice(id){const n=(DATA.notices||[]).find(x=>x.id===id);if(!n)return;$('noticeId').value=n.id;$('noticeTitle').value=n.title||'';$('noticeBody').value=n.body||'';$('noticeActive').value=String(n.active!==false);scrollTo(0,0)}
async function saveNotice(){try{const notice={id:$('noticeId').value,title:$('noticeTitle').value,body:$('noticeBody').value,active:$('noticeActive').value==='true'};await api('/admin/api/notice',{method:'POST',body:JSON.stringify(notice)});toast('공지 저장 완료');resetNoticeForm();loadAll()}catch(e){toast(e.message)}}
async function deleteNotice(id){if(!confirm('공지 삭제할까요?'))return;try{await api('/admin/api/notice-delete',{method:'POST',body:JSON.stringify({id})});toast('삭제 완료');loadAll()}catch(e){toast(e.message)}}
function renderNotices(){const rows=(DATA.notices||[]).map(n=>'<tr><td><b>'+esc(n.title)+'</b></td><td>'+esc(n.body).slice(0,80)+'</td><td>'+(n.active!==false?'<span class="pill">노출</span>':'<span class="pill">숨김</span>')+'</td><td><button class="btn light" onclick="editNotice(\''+n.id+'\')">수정</button> <button class="btn danger" onclick="deleteNotice(\''+n.id+'\')">삭제</button></td></tr>').join('');$('noticeRows').innerHTML=rows||'<tr><td colspan="4" class="muted">등록된 공지가 없습니다.</td></tr>'}
async function uploadImage(){const f=$('uploadFile').files[0];if(!f){toast('이미지를 선택하세요');return}const fd=new FormData();fd.append('image',f);try{const r=await fetch('/admin/api/upload',{method:'POST',body:fd});const j=await r.json();if(!r.ok||!j.ok)throw new Error(j.error||'업로드 실패');toast('업로드 완료');$('uploadFile').value='';await loadAll();navigator.clipboard&&navigator.clipboard.writeText(j.url).catch(()=>{});}catch(e){toast(e.message)}}
function renderImages(){const html=(DATA.images||[]).map(img=>'<button onclick="copyImage(\''+img.url+'\')"><img src="'+esc(img.url)+'"><span>'+esc(img.name||img.url)+'</span></button>').join('');$('imageGrid').innerHTML=html||'<p class="muted">업로드한 이미지가 없습니다.</p>'}
function copyImage(url){navigator.clipboard&&navigator.clipboard.writeText(url);toast('이미지 URL 복사: '+url)}
function pickImageFor(inputId){showTab('images');toast('이미지를 업로드하거나 클릭해서 URL을 복사한 뒤 입력칸에 붙여넣으세요.')}
async function loadFiles(){try{const j=await api('/admin/api/files');FILES=j.files;renderFiles()}catch(e){toast(e.message)}}
function renderFiles(){const q=($('fileSearch')?.value||'').toLowerCase();$('fileList').innerHTML=(FILES||[]).filter(f=>f.path.toLowerCase().includes(q)).map(f=>'<button class="file-item" onclick="loadFile(\''+f.path.replace(/'/g,'\\\\\'')+'\')">'+esc(f.path)+'<br><span class="muted">'+Math.round(f.size/1024)+'KB</span></button>').join('')||'<p class="muted" style="padding:12px">파일이 없습니다.</p>'}
async function loadFile(p){if(!p)return;try{const j=await api('/admin/api/file?path='+encodeURIComponent(p));currentFilePath=p;$('currentFile').textContent=p;$('fileContent').value=j.content;toast('파일 불러옴')}catch(e){toast(e.message)}}
async function saveFile(){if(!currentFilePath){toast('파일을 먼저 선택하세요');return}if(!confirm(currentFilePath+' 파일을 저장할까요?'))return;try{await api('/admin/api/file',{method:'POST',body:JSON.stringify({path:currentFilePath,content:$('fileContent').value})});toast('파일 저장 완료')}catch(e){toast(e.message)}}
async function changePassword(){try{await api('/admin/api/password',{method:'POST',body:JSON.stringify({oldPassword:$('oldPass').value,newPassword:$('newPass').value})});$('oldPass').value='';$('newPass').value='';toast('비밀번호 변경 완료. 다시 로그인하세요.')}catch(e){toast(e.message)}}
loadAll();
  `;
}

function shopPage(slug) {
  const data = publicData();
  const shop = data.shops.find(s => String(s.slug || s.id) === String(slug));
  if (!shop) return null;
  const title = `${shop.name || '업소 상세'} - ${data.site.title || '아이러브밤10'}`;
  const desc = stripTags(shop.description || shop.body || data.site.description || '').slice(0, 160);
  const phone = shop.phone || data.site.phone || '';
  const img = shop.image || '/android-icon-192x192.png';
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(desc)}"><link rel="stylesheet" href="/admin-assets/site-managed.css?v=20260625"><style>body{margin:0;background:#f6f7fb;font-family:Arial,'Noto Sans KR',sans-serif;color:#111}.detail{max-width:980px;margin:0 auto;padding:20px}.hero{background:#fff;border-radius:24px;box-shadow:0 10px 36px rgba(0,0,0,.1);overflow:hidden}.hero img{width:100%;max-height:430px;object-fit:cover;display:block;background:#eee}.body{padding:22px}.badges{display:flex;gap:8px;flex-wrap:wrap}.badge{background:#fff1f5;color:#d91e5b;font-weight:900;border-radius:999px;padding:6px 10px;font-size:13px}h1{font-size:32px;letter-spacing:-.05em;margin:14px 0 10px}.desc{font-size:16px;line-height:1.75;color:#333;white-space:pre-wrap}.actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}.actions a{background:#111;color:#fff;text-decoration:none;border-radius:14px;padding:12px 16px;font-weight:900}.back{display:inline-block;margin:0 0 14px;color:#111;text-decoration:none;font-weight:900}@media(max-width:600px){.detail{padding:12px}h1{font-size:25px}.body{padding:16px}}</style></head><body><main class="detail"><a class="back" href="/">← 메인으로</a><article class="hero"><img src="${escapeHtml(img)}" alt="${escapeHtml((shop.area || '광주') + ' ' + (shop.name || '업소'))}"><div class="body"><div class="badges"><span class="badge">${escapeHtml(shop.area || '광주')}</span><span class="badge">${escapeHtml(shop.category || '가라오케')}</span></div><h1>${escapeHtml(shop.name || '')}</h1><p class="desc">${escapeHtml(shop.description || '')}</p>${shop.body ? `<div class="desc">${escapeHtml(shop.body)}</div>` : ''}<div class="actions">${phone ? `<a href="tel:${escapeHtml(phone.replace(/[^0-9+]/g,''))}">전화문의 ${escapeHtml(phone)}</a>` : ''}<a href="/">목록 보기</a></div></div></article></main><script defer src="/admin-assets/site-managed.js?v=20260625"></script></body></html>`;
}

async function handleAdmin(req, res, pathname) {
  try {
    if (pathname === '/admin/login' && req.method === 'POST') {
      const form = await readForm(req);
      const data = loadData();
      const configuredUser = process.env.ADMIN_USER || data.auth.user || DEFAULT_ADMIN_USER;
      const configuredHash = process.env.ADMIN_PASSWORD_HASH || (process.env.ADMIN_PASSWORD ? sha256(process.env.ADMIN_PASSWORD) : data.auth.passwordHash);
      if (form.user === configuredUser && sha256(form.password || '') === configuredHash) {
        const token = createSession(configuredUser);
        res.statusCode = 302;
        res.setHeader('Location', '/admin');
        res.setHeader('Set-Cookie', `ilovebam_admin=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${60*60*24*3}`);
        return res.end();
      }
      return send(res, loginHtml('아이디 또는 비밀번호가 맞지 않습니다.'), 401);
    }
    if (pathname === '/admin/logout' && req.method === 'POST') {
      clearSession(req);
      res.statusCode = 302;
      res.setHeader('Location', '/admin');
      res.setHeader('Set-Cookie', 'ilovebam_admin=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0');
      return res.end();
    }
    if (pathname === '/admin' || pathname === '/admin/') {
      if (!getSession(req)) return send(res, loginHtml());
      return send(res, adminHtml());
    }
    if (!pathname.startsWith('/admin/api/')) return false;
    if (!requireAdmin(req, res)) return true;
    const data = loadData();
    if (pathname === '/admin/api/data' && req.method === 'GET') return sendJson(res, { ok: true, data });
    if (pathname === '/admin/api/site' && req.method === 'POST') {
      const body = await readJson(req);
      data.site = { ...data.site, ...body };
      saveData(data);
      return sendJson(res, { ok: true, data });
    }
    if (pathname === '/admin/api/shop' && req.method === 'POST') {
      const body = await readJson(req);
      if (!String(body.name || '').trim()) return sendJson(res, { ok: false, error: '업소명을 입력하세요.' }, 400);
      const id = body.id || ('shop_' + crypto.randomBytes(8).toString('hex'));
      const old = data.shops.find(s => s.id === id) || {};
      const shop = {
        ...old,
        id,
        name: stripTags(body.name),
        area: stripTags(body.area),
        category: stripTags(body.category),
        phone: stripTags(body.phone),
        order: Number(body.order || 10),
        active: body.active !== false,
        image: stripTags(body.image),
        slug: slugify(body.slug || body.name || id),
        description: stripTags(body.description),
        body: stripTags(body.body),
        updatedAt: nowIso(),
        createdAt: old.createdAt || nowIso()
      };
      data.shops = data.shops.filter(s => s.id !== id);
      data.shops.push(shop);
      saveData(data);
      return sendJson(res, { ok: true, shop });
    }
    if (pathname === '/admin/api/shop-delete' && req.method === 'POST') {
      const body = await readJson(req);
      data.shops = data.shops.filter(s => s.id !== body.id);
      saveData(data);
      return sendJson(res, { ok: true });
    }
    if (pathname === '/admin/api/notice' && req.method === 'POST') {
      const body = await readJson(req);
      if (!String(body.title || '').trim()) return sendJson(res, { ok: false, error: '공지 제목을 입력하세요.' }, 400);
      const id = body.id || ('notice_' + crypto.randomBytes(8).toString('hex'));
      const old = data.notices.find(n => n.id === id) || {};
      const notice = { ...old, id, title: stripTags(body.title), body: stripTags(body.body), active: body.active !== false, updatedAt: nowIso(), createdAt: old.createdAt || nowIso() };
      data.notices = data.notices.filter(n => n.id !== id);
      data.notices.push(notice);
      saveData(data);
      return sendJson(res, { ok: true, notice });
    }
    if (pathname === '/admin/api/notice-delete' && req.method === 'POST') {
      const body = await readJson(req);
      data.notices = data.notices.filter(n => n.id !== body.id);
      saveData(data);
      return sendJson(res, { ok: true });
    }
    if (pathname === '/admin/api/upload' && req.method === 'POST') {
      const body = await readBody(req);
      const { files } = parseMultipart(body, req.headers['content-type']);
      const file = files.find(f => f.field === 'image') || files[0];
      if (!file || !file.buffer.length) return sendJson(res, { ok: false, error: '업로드할 이미지가 없습니다.' }, 400);
      if (!/^image\/(png|jpe?g|gif|webp)$/i.test(file.type)) return sendJson(res, { ok: false, error: '이미지 파일만 업로드할 수 있습니다.' }, 400);
      const extMap = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/jpg': '.jpg', 'image/gif': '.gif', 'image/webp': '.webp' };
      const ext = extMap[file.type.toLowerCase()] || path.extname(file.filename).toLowerCase() || '.jpg';
      const safeName = slugify(path.basename(file.filename, path.extname(file.filename))).slice(0, 70) || 'image';
      const filename = `${Date.now()}-${safeName}${ext}`;
      const full = path.join(UPLOAD_DIR, filename);
      fs.writeFileSync(full, file.buffer);
      const url = `/uploads/admin/${filename}`;
      data.images.unshift({ id: 'img_' + crypto.randomBytes(8).toString('hex'), name: file.filename, url, type: file.type, size: file.buffer.length, createdAt: nowIso() });
      saveData(data);
      return sendJson(res, { ok: true, url });
    }
    if (pathname === '/admin/api/files' && req.method === 'GET') return sendJson(res, { ok: true, files: listEditableFiles() });
    if (pathname === '/admin/api/file' && req.method === 'GET') {
      const u = new URL(req.url, 'http://local');
      const rel = u.searchParams.get('path') || '';
      const full = getEditableFilePath(rel);
      if (!full || !fs.existsSync(full)) return sendJson(res, { ok: false, error: '편집할 수 없는 파일입니다.' }, 400);
      return sendJson(res, { ok: true, path: rel, content: fs.readFileSync(full, 'utf8') });
    }
    if (pathname === '/admin/api/file' && req.method === 'POST') {
      const body = await readJson(req);
      const full = getEditableFilePath(body.path || '');
      if (!full || !fs.existsSync(full)) return sendJson(res, { ok: false, error: '편집할 수 없는 파일입니다.' }, 400);
      fs.copyFileSync(full, full + '.bak-' + Date.now());
      fs.writeFileSync(full, String(body.content ?? ''), 'utf8');
      return sendJson(res, { ok: true });
    }
    if (pathname === '/admin/api/password' && req.method === 'POST') {
      const body = await readJson(req);
      const configuredHash = process.env.ADMIN_PASSWORD_HASH || (process.env.ADMIN_PASSWORD ? sha256(process.env.ADMIN_PASSWORD) : data.auth.passwordHash);
      if (sha256(body.oldPassword || '') !== configuredHash) return sendJson(res, { ok: false, error: '현재 비밀번호가 맞지 않습니다.' }, 400);
      if (String(body.newPassword || '').length < 8) return sendJson(res, { ok: false, error: '새 비밀번호는 8자 이상으로 입력하세요.' }, 400);
      data.auth.passwordHash = sha256(body.newPassword);
      saveData(data);
      return sendJson(res, { ok: true });
    }
    return sendJson(res, { ok: false, error: '없는 관리자 API입니다.' }, 404);
  } catch (e) {
    return sendJson(res, { ok: false, error: e.message || '서버 오류' }, 500);
  }
}

http.createServer(async (req, res) => {
  const parsed = new URL(req.url || '/', 'http://local');
  const pathname = decodeURIComponent(parsed.pathname);

  if (pathname === '/admin-assets/site-managed.css') return send(res, SITE_CSS, 200, 'text/css; charset=utf-8');
  if (pathname === '/admin-assets/site-managed.js') return send(res, SITE_JS, 200, 'application/javascript; charset=utf-8');
  if (pathname === '/api/public-content') return sendJson(res, { ok: true, ...publicData() });
  if (pathname.startsWith('/admin')) {
    const handled = await handleAdmin(req, res, pathname);
    if (handled !== false) return;
  }
  if (pathname.startsWith('/shop/')) {
    const html = shopPage(pathname.replace(/^\/shop\//, ''));
    if (html) return send(res, html);
  }

  const redirectTo = cleanUrl(req.url || '/');
  if (redirectTo && redirectTo !== req.url) return sendRedirect(res, redirectTo);
  if (req.url && req.url.startsWith('/ajax/ajax_latest.php')) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end('');
  }
  if (req.url && req.url.startsWith('/ajax/ajax_premium_banner.php')) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end('[]');
  }
  const file = resolveFile(req.url || '/');
  if (!file) {
    const nf = path.join(ROOT, '404.html');
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return fs.createReadStream(fs.existsSync(nf) ? nf : path.join(ROOT, 'index.html')).pipe(res);
  }
  const ext = path.extname(file).toLowerCase();
  res.statusCode = 200;
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
  if (/\.(png|jpe?g|gif|webp|svg|ico|css|js)$/i.test(file)) res.setHeader('Cache-Control', 'public, max-age=604800');
  else res.setHeader('Cache-Control', 'no-cache');
  if (ext === '.html' || ext === '.htm') {
    try {
      const html = fs.readFileSync(file, 'utf8');
      return res.end(injectManagedHtml(file, html, req));
    } catch (e) {}
  }
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`ilovebam10 server with admin running on ${PORT}`));
