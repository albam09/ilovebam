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
.ib-badge{font-size:12px;border-radius:999px;background:#0d0d10;color:#d91e5b;padding:4px 8px;font-weight:800}
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


/* === ilovebam10 repair: visible login/admin, clean top/popup, broken image safety === */
#hd_pop,.hd_pops,.hd_pops_con,.hd_pops_footer{display:none!important;visibility:hidden!important;pointer-events:none!important}
#ilovebam10-top-call{display:block!important;width:100%!important;min-height:72px!important;background:linear-gradient(100deg,#b00016,#ffb35b)!important;text-align:center!important;line-height:0!important;overflow:hidden!important;position:relative!important;z-index:9999!important}
#ilovebam10-top-call img{display:block!important;width:100%!important;max-width:1900px!important;height:92px!important;object-fit:cover!important;object-position:center!important;margin:0 auto!important;border:0!important;background:linear-gradient(100deg,#b00016,#ffb35b)!important}
.at-lnb{background:linear-gradient(180deg,#2a1023,#120811)!important;border:0!important;min-height:48px!important;line-height:48px!important;box-shadow:0 5px 18px rgba(0,0,0,.18)!important}
.at-lnb .at-container{display:flex!important;align-items:center!important;justify-content:flex-end!important;min-height:48px!important}
.at-lnb .pull-left{display:none!important}.at-lnb .pull-right{float:none!important;margin-left:auto!important}
.at-lnb .pull-right ul,.header-tnb{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:9px!important;margin:0!important;padding:0!important;list-style:none!important}
.at-lnb .pull-right li,.header-tnb li{display:block!important;margin:0!important;padding:0!important;list-style:none!important}
.at-lnb .pull-right a,.header-tnb a,.ilovebam-admin-login-link{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:34px!important;padding:0 15px!important;border-radius:999px!important;background:#b00016!important;color:#fff!important;font-size:14px!important;font-weight:900!important;letter-spacing:-.02em!important;text-decoration:none!important;border:1px solid rgba(255,255,255,.55)!important;box-shadow:0 4px 14px rgba(255,27,49,.34)!important;opacity:1!important;text-shadow:none!important;line-height:34px!important}
.at-lnb .pull-right a:hover,.header-tnb a:hover,.ilovebam-admin-login-link:hover{background:#111!important;color:#fff!important}
.header-tnb{position:relative!important;z-index:20!important}
.pc-header .header-logo img,.m-header .header-logo img{max-height:100px!important;object-fit:contain!important}
.top_slide_wrap,.top_slide,.top_slide_item{min-height:170px!important}
.premium_random_banner_wait{display:flex!important;align-items:center!important;justify-content:center!important;color:#5c2340!important;font-weight:900!important;background:linear-gradient(135deg,#0d0d10,#fff)!important;border-radius:18px!important;min-height:145px!important}
.premium_banner_nodata,.premium_random_banner_error{display:flex!important;align-items:center!important;justify-content:center!important;color:#5c2340!important;font-weight:900!important;background:linear-gradient(135deg,#0d0d10,#fff)!important;border-radius:18px!important;min-height:145px!important}
.top_slide_thumbnail_img{background:#0d0d10!important;object-fit:cover!important}
img.ilovebam-img-fallback{object-fit:cover!important;background:#0d0d10!important;border:1px solid #280006!important;border-radius:14px!important}
.ib-floating-call{right:18px!important;bottom:18px!important;background:linear-gradient(135deg,#b00016,#111)!important;color:#fff!important;z-index:999999!important}
#ilovebam-admin-shortcut{left:18px!important;bottom:18px!important}
#ilovebam-admin-shortcut a{background:#0f52ff!important;color:#fff!important}
@media(max-width:767px){#ilovebam10-top-call img{height:78px!important}.at-lnb{display:block!important}.at-lnb .at-container{justify-content:center!important}.at-lnb .pull-right ul,.header-tnb{justify-content:center!important;gap:6px!important}.at-lnb .pull-right a,.header-tnb a,.ilovebam-admin-login-link{font-size:12px!important;min-height:32px!important;line-height:32px!important;padding:0 11px!important}.m-header .header-logo{max-width:62%!important}.ib-floating-call{left:12px!important;right:12px!important;bottom:12px!important;justify-content:center!important}}



/* === BUNNY THEME OVERRIDES === */
:root{--ib-red:#ff1b2e;--ib-red2:#d90019;--ib-black:#060606;--ib-panel:#0c0c0f;--ib-panel2:#131316;--ib-line:rgba(255,30,60,.28);--ib-text:#f6f6f6;--ib-muted:#c6c6cc}
html,body{background:#050505!important;color:var(--ib-text)!important}
body{background-image:radial-gradient(circle at 50% 0%, rgba(255,20,40,.14), transparent 44%),linear-gradient(180deg,#0b0b0d 0%,#050505 100%)!important}
a{color:#ff6875!important}
a:hover{color:#fff!important}
input,select,textarea,button{font-family:Arial,'Noto Sans KR',sans-serif}
input,select,textarea{background:#0f1013!important;color:#fff!important;border:1px solid var(--ib-line)!important}
#thema_wrapper,#wrapper,#container,.wrapper,.at-body,.at-main,.main_wrap,.sub_wrap,.content-wrap,.container,.at-container{background:transparent!important}
.pc-header,.m-header,.pc-menu,.m-menu,.header-wrap,.header_box,.main_content,.content_area,.sub_content,.board-list,.list-board,.basic-post-list,.basic-post-gallery,.list-group,.list-group-item,.widget-box,.item-list,.rank_box,.rank-list,.searchbox,.s_box,.ibox,.bbs-list,.lt,.notice-wrap,.latest-wrap,.sidebox,.left_sidemenu,.right_sidemenu,.main_box,.con_box,.box,.panel,.panel-default,.thumbnail,.post-row,.basic-list,.board-view,.view-wrap,.view-content,.at-side,.shop-list,.ranking_box,.main_left,.main_right{background:rgba(7,7,9,.88)!important;color:var(--ib-text)!important;border-color:var(--ib-line)!important;box-shadow:0 12px 30px rgba(0,0,0,.35)!important}
.pc-header,.m-header{border-bottom:1px solid rgba(255,0,30,.22)!important;background:linear-gradient(180deg,rgba(18,18,20,.98),rgba(7,7,9,.98))!important}
.pc-header .header-logo,.m-header .header-logo{padding:10px 0!important}
.pc-menu a,.m-menu a,.header-gnb a,.board_tab a,.main-tab a,.tab a,.at-menu a{color:#f2f2f2!important}
.main-menu,.sub-menu,.menu-all,.gnb,.lnb,.header-menu,.nav,.cate-box,.cate-item,.dropdown-menu,.popover,.modal-content{background:#0b0b0d!important;border-color:var(--ib-line)!important;color:#f6f6f6!important}
.board_tab a.active,.tab .active a,.main-tab .active a,.pc-menu .active>a,.m-menu .active>a,.menu a:hover,.main_tab li.on a{background:linear-gradient(135deg,var(--ib-red),#540008)!important;color:#fff!important;border-color:transparent!important}
#ilovebam10-top-call{background:#000!important;border-bottom:1px solid rgba(255,255,255,.05)!important}
#ilovebam10-top-call img{height:104px!important;filter:contrast(1.02) saturate(1.05)!important}
.at-lnb{background:linear-gradient(180deg,#170609,#080203)!important;border-bottom:1px solid rgba(255,30,60,.18)!important;box-shadow:0 8px 22px rgba(0,0,0,.35)!important}
.at-lnb .pull-right a,.header-tnb a,.ilovebam-admin-login-link{background:linear-gradient(135deg,var(--ib-red),#65000b)!important;border:1px solid rgba(255,255,255,.08)!important;box-shadow:0 8px 18px rgba(255,15,45,.24)!important}
.at-lnb .pull-right a:hover,.header-tnb a:hover,.ilovebam-admin-login-link:hover,.ib-call-btn:hover,.ib-floating-call:hover{background:#fff!important;color:#111!important}
.premium_random_banner_wait,.premium_banner_nodata,.premium_random_banner_error{background:#0e0e11!important;color:#fff!important;border:1px solid var(--ib-line)!important}
.top_slide_wrap,.top_slide,.top_slide_item,.top_slide_thumbnail_img{background:#0e0e11!important;border-radius:22px!important}
.top_slide_wrap{border:1px solid var(--ib-line)!important;box-shadow:0 15px 36px rgba(0,0,0,.34)!important;overflow:hidden!important}
.top_slide_prev_btn,.top_slide_next_btn{background:rgba(255,255,255,.1)!important;border-color:rgba(255,255,255,.08)!important}
#ilovebam-managed-section{max-width:1220px!important;margin:26px auto!important;padding:0 16px!important}
.ib-managed-title h2{color:#fff!important;font-size:28px!important;letter-spacing:-.04em}
.ib-managed-title p{color:#d4d4d8!important}
.ib-shop-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:16px!important}
.ib-shop-card{background:linear-gradient(180deg,#121216,#0a0a0d)!important;border:1px solid var(--ib-line)!important;box-shadow:0 12px 30px rgba(0,0,0,.34)!important}
.ib-shop-card:hover{transform:translateY(-4px)!important;box-shadow:0 20px 46px rgba(0,0,0,.45)!important;border-color:rgba(255,40,65,.42)!important}
.ib-shop-card img{height:200px!important}
.ib-shop-card h3,.ib-call-row,.ib-call-row span{color:#fff!important}
.ib-shop-card p{color:#cfcfd4!important}
.ib-badge{background:rgba(255,23,48,.14)!important;border:1px solid rgba(255,48,73,.28)!important;color:#ff7b8c!important}
.ib-call-btn,.ib-floating-call{background:linear-gradient(135deg,var(--ib-red),#65000b)!important;color:#fff!important;border:1px solid rgba(255,255,255,.08)!important;box-shadow:0 10px 24px rgba(255,18,44,.26)!important}
.ib-notice-bar{display:none!important}
#ilovebam-theme-hero{max-width:1220px;margin:18px auto 18px;padding:0 16px;box-sizing:border-box}
#ilovebam-theme-hero .hero-card{position:relative;min-height:340px;border-radius:28px;overflow:hidden;border:1px solid var(--ib-line);box-shadow:0 24px 55px rgba(0,0,0,.42);background:#09090b url('/images/theme-brand-hero.png') center/cover no-repeat}
#ilovebam-theme-hero .hero-card:before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.72),rgba(0,0,0,.32) 55%,rgba(0,0,0,.7))}
#ilovebam-theme-hero .hero-inner{position:relative;z-index:2;display:flex;flex-direction:column;justify-content:center;min-height:340px;padding:36px 38px;max-width:640px}
#ilovebam-theme-hero .hero-kicker{display:inline-block;align-self:flex-start;padding:8px 12px;border:1px solid rgba(255,255,255,.12);border-radius:999px;background:rgba(255,0,30,.14);color:#ff8a98;font-size:13px;font-weight:900;letter-spacing:.06em}
#ilovebam-theme-hero h1{margin:16px 0 12px;font-size:44px;line-height:1.04;color:#fff;letter-spacing:-.05em;text-shadow:0 10px 30px rgba(0,0,0,.28)}
#ilovebam-theme-hero p{margin:0;color:#ececf1;font-size:17px;line-height:1.75}
#ilovebam-theme-hero .hero-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:22px}
#ilovebam-theme-hero .hero-btn{display:inline-flex;align-items:center;justify-content:center;height:48px;padding:0 18px;border-radius:14px;text-decoration:none!important;font-weight:900}
#ilovebam-theme-hero .hero-btn.primary{background:linear-gradient(135deg,var(--ib-red),#65000b);color:#fff!important}
#ilovebam-theme-hero .hero-btn.secondary{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);color:#fff!important}
#ilovebam-theme-notice{max-width:1220px;margin:0 auto 16px;padding:0 16px;box-sizing:border-box}
#ilovebam-theme-notice .notice-card{display:block;background:#0a0a0d;border-radius:24px;overflow:hidden;border:1px solid var(--ib-line);box-shadow:0 16px 36px rgba(0,0,0,.4)}
#ilovebam-theme-notice .notice-card img{display:block;width:100%;height:auto}
#ilovebam-theme-hero .hero-logo-mark{position:absolute;right:28px;bottom:22px;width:120px;opacity:.14;filter:drop-shadow(0 10px 18px rgba(255,0,40,.2))}
#ilovebam-admin-shortcut a{background:linear-gradient(135deg,#1e1e27,#0062ff)!important}
footer,.footer,.at-footer{background:#09090b!important;color:#d4d4d8!important;border-top:1px solid var(--ib-line)!important}
.footer a,.at-footer a{color:#ff8c98!important}
.table,table,.table td,.table th,.list-group-item,.post-title,.media-heading,.ellipsis,.txt{color:var(--ib-text)!important}
@media(max-width:1024px){.ib-shop-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}#ilovebam-theme-hero .hero-card{min-height:290px}#ilovebam-theme-hero .hero-inner{min-height:290px;padding:28px}#ilovebam-theme-hero h1{font-size:36px}}
@media(max-width:767px){#ilovebam10-top-call img{height:82px!important}#ilovebam-theme-hero,#ilovebam-theme-notice,#ilovebam-managed-section{padding:0 12px!important}#ilovebam-theme-hero .hero-card{min-height:250px;border-radius:22px}#ilovebam-theme-hero .hero-inner{min-height:250px;padding:22px}#ilovebam-theme-hero h1{font-size:28px}#ilovebam-theme-hero p{font-size:14px;line-height:1.6}.ib-shop-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}.ib-shop-card img{height:132px!important}.ib-managed-title h2{font-size:22px!important}}


/* =========================================================
   ILOVEBAM BUNNY STATIC THEME - works even with file:// index.html
   ========================================================= */
:root{
  --ib-red:#ff1428;
  --ib-red-dark:#610008;
  --ib-black:#050506;
  --ib-panel:#0b0b0e;
  --ib-panel2:#121217;
  --ib-line:rgba(255,30,55,.32);
  --ib-text:#f7f7f9;
  --ib-muted:#c9c9cf;
}
html,body{
  background:#050506!important;
  color:var(--ib-text)!important;
  background-image:
    radial-gradient(circle at 50% 0%, rgba(255,20,40,.20), transparent 40%),
    radial-gradient(circle at 8% 22%, rgba(255,20,40,.12), transparent 30%),
    linear-gradient(180deg,#09090b 0%,#050506 100%)!important;
}
body:before{
  content:"";
  position:fixed;
  inset:0;
  z-index:-1;
  pointer-events:none;
  background:
    linear-gradient(115deg, rgba(255,0,25,.10), transparent 18%, transparent 80%, rgba(255,0,25,.10)),
    radial-gradient(circle at 100% 0%, rgba(255,0,25,.12), transparent 35%);
}
*{
  scrollbar-color:#ff1428 #0b0b0e;
}
a{color:#ff6b78!important}
a:hover{color:#fff!important}
img{max-width:100%}

/* kill old white/pink popup and blank box */
#hd_pop,.hd_pops,.hd_pops_con,.hd_pops_footer,
div[id*="hd_pops"],div[class*="hd_pops"],
.popup_layer,.popup-wrap,.pop_layer,.layer-popup,
#layer_popup,#divpop,.main_popup,.notice_popup{
  display:none!important;
  visibility:hidden!important;
  opacity:0!important;
  pointer-events:none!important;
}

/* remove pink base from old theme containers */
#wrapper,#container,#content,#thema_wrapper,#at_wrap,.at-body,.at-main,.at-container,
.container,.wrapper,.main_wrap,.sub_wrap,.content-wrap,.content_area,.main_content,
.main_box,.con_box,.box,.panel,.panel-default,.widget-box,.sidebox,.left_sidemenu,.right_sidemenu,
.rank_box,.ranking_box,.list-group,.list-group-item,.board-list,.list-board,.basic-post-list,
.basic-post-gallery,.thumbnail,.bbs-list,.latest-wrap,.notice-wrap,.view-wrap,.board-view,
.shop-list,.searchbox,.s_box,.ibox,.post-row,.basic-list,.at-side{
  background:rgba(7,7,9,.90)!important;
  color:var(--ib-text)!important;
  border-color:var(--ib-line)!important;
  box-shadow:0 14px 32px rgba(0,0,0,.36)!important;
}

/* broad old pink/white surfaces */
div,section,article,aside,nav,header,footer,main,ul,li,table,tr,td,th{
  border-color:rgba(255,30,55,.23)!important;
}
table,.table,.table td,.table th,.list-group-item,.post-title,.media-heading,.ellipsis,.txt,
.latest_title,.latest_author,.wr_subject,.bo_tit,.td_subject,.td_name,.td_datetime,
span,p,b,strong,em,label,h1,h2,h3,h4,h5,h6{
  color:inherit;
}
input,select,textarea{
  background:#0f1013!important;
  color:#fff!important;
  border:1px solid rgba(255,30,55,.38)!important;
  box-shadow:none!important;
}
input::placeholder,textarea::placeholder{color:#a8a8ae!important}

/* top banner */
#ilovebam10-top-call{
  display:block!important;
  width:100%!important;
  background:#000!important;
  border-bottom:1px solid rgba(255,30,55,.22)!important;
  min-height:96px!important;
  overflow:hidden!important;
}
#ilovebam10-top-call img{
  display:block!important;
  width:100%!important;
  height:106px!important;
  object-fit:cover!important;
  object-position:center!important;
  border:0!important;
  background:#000!important;
}

/* old navigation/header */
.at-lnb,.header-tnb,.pc-header,.m-header,.header-wrap,.header_box,.gnb,.lnb,
.pc-menu,.m-menu,.main-menu,.sub-menu,.menu-all,.header-menu,.nav,.dropdown-menu{
  background:linear-gradient(180deg,#150507,#070202)!important;
  color:#fff!important;
  border-color:rgba(255,30,55,.30)!important;
  box-shadow:0 8px 22px rgba(0,0,0,.42)!important;
}
.at-lnb .at-container{
  display:flex!important;
  align-items:center!important;
  justify-content:flex-end!important;
  min-height:48px!important;
}
.at-lnb .pull-left{display:none!important}
.at-lnb .pull-right{float:none!important;margin-left:auto!important}
.at-lnb .pull-right ul,.header-tnb{
  display:flex!important;
  align-items:center!important;
  justify-content:flex-end!important;
  gap:8px!important;
  margin:0!important;
  padding:0!important;
  list-style:none!important;
}
.at-lnb .pull-right li,.header-tnb li{display:block!important;margin:0!important;padding:0!important}
.at-lnb .pull-right a,.header-tnb a,.ilovebam-admin-login-link,
button,.btn,.button,.search_btn,.submit,.write_btn{
  background:linear-gradient(135deg,var(--ib-red),var(--ib-red-dark))!important;
  color:#fff!important;
  border:1px solid rgba(255,255,255,.10)!important;
  border-radius:999px!important;
  box-shadow:0 8px 18px rgba(255,15,45,.22)!important;
  text-shadow:none!important;
}
.at-lnb .pull-right a,.header-tnb a,.ilovebam-admin-login-link{
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  min-height:34px!important;
  line-height:34px!important;
  padding:0 14px!important;
  font-size:13px!important;
  font-weight:900!important;
  text-decoration:none!important;
  opacity:1!important;
}
.at-lnb .pull-right a:hover,.header-tnb a:hover,.ilovebam-admin-login-link:hover,
button:hover,.btn:hover,.button:hover{
  background:#fff!important;
  color:#111!important;
}

/* direct inserted hero/notice */
#ib-static-hero{
  max-width:1220px;
  margin:18px auto 18px;
  padding:0 16px;
  box-sizing:border-box;
  clear:both;
}
#ib-static-hero .ib-hero-card{
  position:relative;
  min-height:360px;
  border-radius:28px;
  overflow:hidden;
  border:1px solid rgba(255,30,55,.38);
  box-shadow:0 26px 60px rgba(0,0,0,.48);
  background:#050506 url("/images/theme-brand-hero.png") center/cover no-repeat;
}
#ib-static-hero .ib-hero-card:before{
  content:"";
  position:absolute;
  inset:0;
  background:linear-gradient(90deg,rgba(0,0,0,.78),rgba(0,0,0,.38) 55%,rgba(0,0,0,.78));
}
#ib-static-hero .ib-hero-inner{
  position:relative;
  z-index:2;
  min-height:360px;
  max-width:650px;
  padding:38px;
  display:flex;
  flex-direction:column;
  justify-content:center;
}
#ib-static-hero .ib-kicker{
  align-self:flex-start;
  padding:8px 12px;
  border-radius:999px;
  border:1px solid rgba(255,255,255,.12);
  background:rgba(255,20,40,.16);
  color:#ff8794;
  font-size:13px;
  font-weight:900;
  letter-spacing:.08em;
}
#ib-static-hero h1{
  margin:16px 0 10px!important;
  font-size:52px!important;
  line-height:1!important;
  color:#fff!important;
  letter-spacing:-.05em!important;
  text-shadow:0 12px 32px rgba(0,0,0,.45);
}
#ib-static-hero p{
  margin:0!important;
  color:#f1f1f4!important;
  font-size:17px!important;
  line-height:1.72!important;
}
#ib-static-hero .ib-hero-actions{
  display:flex;
  gap:12px;
  flex-wrap:wrap;
  margin-top:22px;
}
#ib-static-hero .ib-hero-btn{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  height:48px;
  padding:0 18px;
  border-radius:14px!important;
  text-decoration:none!important;
  font-weight:900!important;
}
#ib-static-hero .primary{
  background:linear-gradient(135deg,var(--ib-red),var(--ib-red-dark))!important;
  color:#fff!important;
}
#ib-static-hero .secondary{
  background:rgba(255,255,255,.08)!important;
  border:1px solid rgba(255,255,255,.12)!important;
  color:#fff!important;
}
#ib-static-hero .ib-faint-logo{
  position:absolute;
  right:26px;
  bottom:22px;
  width:120px;
  opacity:.15;
  z-index:2;
}

#ib-static-notice{
  max-width:1220px;
  margin:0 auto 18px;
  padding:0 16px;
  box-sizing:border-box;
  clear:both;
}
#ib-static-notice .ib-notice-card{
  display:grid;
  grid-template-columns:330px 1fr;
  gap:18px;
  align-items:stretch;
  background:linear-gradient(180deg,#111115,#08080a)!important;
  border:1px solid rgba(255,30,55,.36)!important;
  border-radius:26px;
  overflow:hidden;
  box-shadow:0 20px 46px rgba(0,0,0,.42)!important;
}
#ib-static-notice .ib-notice-card img{
  width:100%;
  height:100%;
  min-height:260px;
  object-fit:cover;
  display:block;
  background:#050506;
}
#ib-static-notice .ib-notice-text{
  padding:26px 26px 24px 0;
  display:flex;
  flex-direction:column;
  justify-content:center;
}
#ib-static-notice .ib-label{
  align-self:flex-start;
  color:#ff8490!important;
  border:1px solid rgba(255,30,55,.35);
  background:rgba(255,30,55,.10);
  padding:7px 11px;
  border-radius:999px;
  font-size:12px;
  font-weight:900;
  letter-spacing:.08em;
}
#ib-static-notice h2{
  margin:14px 0 12px!important;
  font-size:34px!important;
  color:#fff!important;
  letter-spacing:-.05em!important;
}
#ib-static-notice ul{
  list-style:none!important;
  padding:0!important;
  margin:0!important;
  display:grid;
  gap:10px;
}
#ib-static-notice li{
  background:rgba(255,255,255,.04)!important;
  border:1px solid rgba(255,30,55,.18)!important;
  color:#ededf0!important;
  border-radius:14px;
  padding:12px 14px;
  font-weight:800;
}

/* old premium/slide waiting area: no blank */
.premium_random_banner_wait,.premium_banner_nodata,.premium_random_banner_error,
.top_slide_wrap,.top_slide,.top_slide_item{
  background:#0a0a0d!important;
  color:#fff!important;
  border-color:rgba(255,30,55,.32)!important;
}
.premium_random_banner_wait,.premium_banner_nodata,.premium_random_banner_error{
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  min-height:210px!important;
  border-radius:20px!important;
  overflow:hidden!important;
}
.premium_random_banner_wait:before,.premium_banner_nodata:before,.premium_random_banner_error:before{
  content:"";
  display:block;
  width:100%;
  min-height:210px;
  background:#050506 url("/images/theme-loading-screen.png") center/cover no-repeat;
}
.premium_random_banner_wait > *,.premium_banner_nodata > *,.premium_random_banner_error > *{
  display:none!important;
}

/* old board/tabs/buttons */
.board_tab a,.main-tab a,.tab a,.category a,.bo_cate a,.list-category a,
[class*="tab"] a,[class*="cate"] a{
  background:#111116!important;
  color:#f1f1f3!important;
  border:1px solid rgba(255,30,55,.25)!important;
  border-radius:999px!important;
}
.board_tab a.active,.main-tab .active a,.tab .active a,.bo_cate .active,
[class*="tab"] .active a,[class*="cate"] .active a{
  background:linear-gradient(135deg,var(--ib-red),var(--ib-red-dark))!important;
  color:#fff!important;
}
.notice,.notice-row,[class*="notice"],[id*="notice"]{
  border-color:rgba(255,30,55,.24)!important;
}
tr,td,th{
  background:rgba(10,10,13,.72)!important;
  color:#f4f4f6!important;
}
tr:nth-child(even),li:nth-child(even){
  background-color:rgba(255,255,255,.015)!important;
}
.board-list a,.list-board a,.latest a,.lt a,.sidebox a,.right_sidemenu a,.left_sidemenu a{
  color:#f3f3f6!important;
}

/* side lists */
.left_sidemenu,.right_sidemenu,.rank_box{
  border-radius:22px!important;
}
.left_sidemenu li,.right_sidemenu li,.rank_box li{
  background:rgba(10,10,13,.72)!important;
  border-color:rgba(255,30,55,.16)!important;
}
[class*="new"],.new{
  color:#ff4b5d!important;
}

/* fallback images */
img[src=""],img:not([src]){
  background:#0a0a0d!important;
}
img.ilovebam-img-fallback{
  object-fit:cover!important;
  background:#0a0a0d!important;
  border:1px solid rgba(255,30,55,.28)!important;
  border-radius:14px!important;
}

/* Floating phone */
.ib-static-floating-call{
  position:fixed;
  right:16px;
  bottom:16px;
  z-index:999999;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  min-height:48px;
  padding:0 18px;
  border-radius:999px;
  background:linear-gradient(135deg,var(--ib-red),var(--ib-red-dark))!important;
  color:#fff!important;
  text-decoration:none!important;
  font-weight:900!important;
  box-shadow:0 14px 30px rgba(255,20,40,.25);
}

/* mobile */
@media(max-width:1024px){
  #ib-static-notice .ib-notice-card{grid-template-columns:260px 1fr}
  #ib-static-hero .ib-hero-card{min-height:310px}
  #ib-static-hero .ib-hero-inner{min-height:310px;padding:28px}
  #ib-static-hero h1{font-size:40px!important}
}
@media(max-width:767px){
  #ilovebam10-top-call img{height:78px!important}
  .at-lnb .at-container{justify-content:center!important}
  .at-lnb .pull-right ul,.header-tnb{justify-content:center!important;gap:5px!important}
  .at-lnb .pull-right a,.header-tnb a,.ilovebam-admin-login-link{font-size:12px!important;min-height:31px!important;line-height:31px!important;padding:0 10px!important}
  #ib-static-hero,#ib-static-notice{padding:0 10px!important}
  #ib-static-hero .ib-hero-card{min-height:260px;border-radius:20px}
  #ib-static-hero .ib-hero-inner{min-height:260px;padding:20px}
  #ib-static-hero h1{font-size:30px!important}
  #ib-static-hero p{font-size:14px!important;line-height:1.58!important}
  #ib-static-hero .ib-faint-logo{width:86px;right:14px;bottom:14px}
  #ib-static-notice .ib-notice-card{grid-template-columns:1fr}
  #ib-static-notice .ib-notice-card img{min-height:auto;max-height:360px}
  #ib-static-notice .ib-notice-text{padding:0 18px 18px}
  #ib-static-notice h2{font-size:25px!important}
  .ib-static-floating-call{left:12px;right:12px;bottom:12px}
}


/* === ILOVEBAM HARD PATCH === */
:root{
  --group_color_1:#030304!important;
  --group_color_2:#050506!important;
  --group_color_3:#070708!important;
  --group_color_4:#09090b!important;
  --group_color_5:#0b0b0e!important;
  --group_color_6:#0e0e12!important;
  --group_color_7:#111116!important;
  --group_color_8:#141419!important;
  --group_color_9:#17171d!important;
  --group_color_10:#1b1b22!important;
  --group_color_11:#030304!important;
  --group_color_12:#050506!important;
  --group_color_13:#0b0b0e!important;
  --group_color_14:#070708!important;
  --group_color_15:#0b0b0e!important;
  --group_color_16:#0e0e12!important;
  --group_color_17:#111116!important;
  --group_color_18:#141419!important;
  --group_color_19:#17171d!important;
  --group_color_20:#1b0005!important;
  --group_color_21:#2f0008!important;
  --group_color_22:#3d0007!important;
  --group_color_23:#520009!important;
  --group_color_24:#68000d!important;
  --group_color_25:#820012!important;
  --group_color_26:#9d0017!important;
  --group_color_27:#b6001d!important;
  --group_color_28:#42000a!important;
  --group_color_29:#e01932!important;
  --group_color_30:#ff263d!important;
  --group_color_31:#030304!important;
  --group_color_32:#121217!important;
  --group_color_33:#070708!important;
  --group_color_34:#09090b!important;
  --group_color_35:#0b0b0e!important;
  --group_color_36:#0e0e12!important;
  --group_color_37:#111116!important;
  --group_color_38:#141419!important;
  --group_color_39:#17171d!important;
  --group_color_40:#1b1b22!important;
  --group_color_41:#a50018!important;
  --group_color_42:#3d0007!important;
  --group_color_43:#520009!important;
  --group_color_44:#68000d!important;
  --group_color_45:#820012!important;
  --group_color_46:#9d0017!important;
  --group_color_47:#6d000e!important;
  --group_color_48:#cc1028!important;
  --group_color_49:#e01932!important;
  --group_color_50:#ff263d!important;
  --group_color_51:#030304!important;
  --group_color_52:#050506!important;
  --group_color_53:#070708!important;
  --group_color_54:#09090b!important;
  --group_color_55:#0b0b0e!important;
  --group_color_56:#0e0e12!important;
  --group_color_57:#111116!important;
  --group_color_58:#141419!important;
  --group_color_59:#17171d!important;
  --group_color_60:#1b1b22!important;
  --group_color_61:#ff263d!important;
  --group_color_62:#3d0007!important;
  --group_color_63:#520009!important;
  --group_color_64:#68000d!important;
  --group_color_65:#820012!important;
  --group_color_66:#9d0017!important;
  --group_color_67:#b6001d!important;
  --group_color_68:#cc1028!important;
  --group_color_69:#e01932!important;
  --group_color_70:#ff263d!important;
}
html,body{background:#040405!important}
body *{outline-color:rgba(255,45,66,.35)!important}
/* stronger recolor for pink remnants */
[class*="pink"],[style*="#ff"],[style*="#FE"], [style*="#ff263d"], [style*="#ff263d"]{}
.header-mn ul li a,.header-mn ul li span,.header-mn ul li i{color:#f2f2f4!important}
.header-mn ul li.on a,.header-mn ul li:hover a{background:linear-gradient(135deg,#ff1b31,#63000b)!important;color:#fff!important;border-color:rgba(255,40,65,.35)!important}
.header-mn ul li a{background:#17171d!important;border:1px solid rgba(255,30,55,.22)!important;border-radius:12px!important}
.areacategory,.nav-top,.nav-float,.nav-slide{background:transparent!important}
.open_area,#nav_shoptype,#nav_shoparea{display:inline-flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;min-width:260px!important;min-height:56px!important;padding:0 22px!important;border-radius:999px!important;background:linear-gradient(180deg,#131318,#09090c)!important;border:1px solid rgba(255,30,55,.36)!important;box-shadow:0 10px 22px rgba(0,0,0,.35)!important;color:#fff!important;text-decoration:none!important}
.open_area i,#nav_shoptype i,#nav_shoparea i{color:#ff2940!important}
.open_area span,#nav_shoptype span,#nav_shoparea span,.selectedmenu{color:#fff!important;font-weight:800!important}
.selectedmenu{display:inline-flex!important;align-items:center!important;justify-content:center!important;margin-left:10px!important;padding:4px 10px!important;background:rgba(255,27,49,.18)!important;border:1px solid rgba(255,27,49,.4)!important;border-radius:999px!important;color:#ff8b97!important}
#modal_overlay,.modal_overlay,#gnb_area,.area_wrap#region_modal,.area_wrap#gnb_area,.area_wrap#gnb_cate{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}
.area_wrap,.gnb_sub_menu{background:#0c0c0f!important;border:1px solid rgba(255,30,55,.35)!important;border-radius:20px!important}
.area_wrap .area_tit{background:linear-gradient(135deg,#ff1b31,#63000b)!important}
.area_wrap .tit_text{color:#fff!important}
.category_grid .category_item a{background:#141419!important;color:#f0f0f3!important;border:1px solid rgba(255,30,55,.18)!important;border-radius:16px!important}
.category_grid .category_item.active a,.category_grid .category_item a:hover{background:linear-gradient(135deg,#ff1b31,#63000b)!important;color:#fff!important}
.nav-search .input-group .form-control,.nav-search .input-group-btn button{background:#0b0b0e!important;border-color:rgba(255,30,55,.35)!important;color:#fff!important}
.nav-search .input-group-btn button{border-radius:18px!important}
/* premium area hard replace */
.top_slide_wrap{padding:0!important;background:#08080b!important;border:1px solid rgba(255,30,55,.35)!important;border-radius:28px!important;overflow:hidden!important;min-height:280px!important}
.top_slide{display:block!important;position:relative!important;min-height:280px!important;background:#08080b!important}
.top_slide_item{display:none!important}
.top_slide_prev_button,.top_slide_next_button,.top_slide_pagination{display:none!important}
.top_slide::before{content:"";display:block;width:100%;height:280px;background:#050506 url('/images/theme-loading-screen.png') center/cover no-repeat}
/* tabs and board */
.upso_latest_tabs{background:#0b0b0e!important;border:1px solid rgba(255,30,55,.32)!important;border-radius:24px!important;box-shadow:0 18px 38px rgba(0,0,0,.38)!important}
.upso_latest_tabs .tab_head,.upso_latest_tabs .tab_select_wrap{background:#0f0f13!important;border-bottom:1px solid rgba(255,30,55,.22)!important}
.upso_latest_tabs .tab_btn,.upso_latest_tabs .tab_select{background:#17171d!important;color:#f4f4f6!important;border:1px solid rgba(255,30,55,.22)!important;border-radius:999px!important}
.upso_latest_tabs .tab_btn.is_active{background:linear-gradient(135deg,#ff1b31,#63000b)!important;color:#fff!important;border-color:transparent!important}
.upso_latest_tabs .tab_select_icon{color:#ff3348!important}
.upso_latest_tabs .latest_item,.upso_latest_tabs .latest_item:nth-child(odd),.upso_latest_tabs .latest_item:hover{background:transparent!important}
.upso_latest_tabs .latest_item{border-bottom:1px solid rgba(255,30,55,.14)!important}
.upso_latest_tabs .latest_subject,.upso_latest_tabs .latest_link,.upso_latest_tabs .latest_title,.upso_latest_tabs .latest_meta,.upso_latest_tabs .writer_rank_user{color:#f4f4f6!important}
.upso_latest_tabs .latest_title_wrap,.upso_latest_tabs .latest_left{background:#0d0d11!important;border-radius:999px!important;padding:4px 10px!important}
/* right aside */
#right_aside,#left_aside{top:120px!important}
.right_upsobox{background:#0a0a0d!important;border:1px solid rgba(255,30,55,.32)!important;border-radius:24px!important;overflow:hidden!important;box-shadow:0 16px 34px rgba(0,0,0,.34)!important}
.right_upsobox .tab_title{display:flex!important;background:#0c0c10!important}
.right_upsobox .tab_title li{flex:1 1 0!important;text-align:center!important;background:#15151a!important;color:#e9e9ee!important;border-bottom:1px solid rgba(255,30,55,.18)!important;padding:14px 10px!important;font-weight:900!important}
.right_upsobox .tab_title li.on{background:linear-gradient(135deg,#ff1b31,#63000b)!important;color:#fff!important}
.right_upsobox .list_upso{background:#0d0d11!important}
.right_upsobox .list_upso li{border-bottom:1px solid rgba(255,30,55,.12)!important;background:#0d0d11!important}
.right_upsobox .list_upso li a{display:block!important;color:#f2f2f5!important;background:#0d0d11!important;padding:9px 12px!important}
/* telegram side banner */
.right_banner li a{display:block!important}
.msn2_wrapper{background:linear-gradient(180deg,#111116,#08080b)!important;border:1px solid rgba(255,30,55,.32)!important;border-radius:24px!important;padding:22px 16px!important;min-height:160px!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:10px!important}
.msn2_img img{width:54px!important;height:54px!important;object-fit:contain!important;filter:drop-shadow(0 8px 14px rgba(255,20,40,.16))}
.msn2_text{font-size:18px!important;font-weight:900!important;color:#fff!important}
.msn2_text1{font-size:26px!important;font-weight:900!important;color:#ffd21f!important}
/* login/signup buttons */
.login ul li a,.tnb a,.util a{background:linear-gradient(135deg,#ff1b31,#63000b)!important;color:#fff!important;border:1px solid rgba(255,255,255,.1)!important;border-radius:999px!important;padding:8px 16px!important}
/* scroll top / float buttons */
.quickmenu a,.fixed_btn a,[class*="float"] a{background:#131318!important;color:#fff!important;border-color:rgba(255,30,55,.22)!important}
/* if any blank popup/error message appears */
.ib-force-hide, .ajax-error-popup, .region_error_popup{display:none!important}


/* === ILOVEBAM MENU + REGION REAL FIX === */

/* top menu: remove broken icon squares, make clean red/black cards */
.header-mn{
  display:flex!important;
  justify-content:flex-end!important;
  align-items:center!important;
}
.header-mn ul{
  display:flex!important;
  align-items:center!important;
  justify-content:flex-end!important;
  gap:10px!important;
  margin:0!important;
  padding:0!important;
  list-style:none!important;
  flex-wrap:nowrap!important;
}
.header-mn ul li{
  width:auto!important;
  height:auto!important;
  margin:0!important;
  padding:0!important;
  float:none!important;
  list-style:none!important;
}
.header-mn ul li a{
  width:96px!important;
  height:92px!important;
  display:flex!important;
  flex-direction:column!important;
  align-items:center!important;
  justify-content:center!important;
  gap:8px!important;
  padding:10px 8px!important;
  background:linear-gradient(180deg,#1b1b21,#0b0b0e)!important;
  border:1px solid rgba(255,35,60,.32)!important;
  border-radius:14px!important;
  box-shadow:0 12px 26px rgba(0,0,0,.38)!important;
  color:#f6f6f8!important;
  text-decoration:none!important;
  overflow:hidden!important;
}
.header-mn ul li.on a,
.header-mn ul li a:hover{
  background:linear-gradient(135deg,#ff1b31,#72000d)!important;
  border-color:rgba(255,255,255,.14)!important;
  color:#fff!important;
}
.header-mn ul li a i{
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  width:30px!important;
  height:30px!important;
  margin:0!important;
  border-radius:10px!important;
  background:rgba(255,255,255,.06)!important;
  border:1px solid rgba(255,45,70,.25)!important;
  color:#ff4055!important;
  font-size:0!important;
  line-height:1!important;
}
.header-mn ul li a i:before{
  content:"IB"!important;
  font-family:Arial,'Noto Sans KR',sans-serif!important;
  font-size:11px!important;
  font-weight:900!important;
  color:#ff4055!important;
}
.header-mn ul li.on a i,
.header-mn ul li a:hover i{
  background:rgba(0,0,0,.25)!important;
  border-color:rgba(255,255,255,.18)!important;
}
.header-mn ul li.on a i:before,
.header-mn ul li a:hover i:before{
  color:#fff!important;
}
.header-mn ul li a span{
  color:inherit!important;
  font-size:13px!important;
  font-weight:900!important;
  line-height:1.25!important;
  text-align:center!important;
  letter-spacing:-.04em!important;
}

/* search + selection row */
.nav-visible{
  background:#050506!important;
  border-top:1px solid rgba(255,35,60,.16)!important;
  border-bottom:1px solid rgba(255,35,60,.26)!important;
}
.nav-visible .at-container{
  display:flex!important;
  align-items:center!important;
  justify-content:space-between!important;
  gap:14px!important;
  background:#050506!important;
}
.nav-top.nav-float.nav-slide{
  background:transparent!important;
  box-shadow:none!important;
  border:0!important;
}
.areacategory{
  display:flex!important;
  align-items:center!important;
  gap:12px!important;
  flex-wrap:nowrap!important;
  background:transparent!important;
}
.open_area,
#nav_shoptype,
#nav_shoparea{
  position:relative!important;
  width:270px!important;
  min-width:220px!important;
  height:58px!important;
  display:flex!important;
  align-items:center!important;
  justify-content:space-between!important;
  gap:12px!important;
  padding:0 20px!important;
  border-radius:999px!important;
  background:linear-gradient(180deg,#15151a,#09090c)!important;
  border:1px solid rgba(255,35,60,.36)!important;
  color:#fff!important;
  box-shadow:0 12px 24px rgba(0,0,0,.38)!important;
  text-decoration:none!important;
}
.open_area:hover{
  background:linear-gradient(135deg,#ff1b31,#65000b)!important;
}
.open_area i{
  display:none!important;
}
.open_area > span{
  display:flex!important;
  align-items:center!important;
  gap:8px!important;
  color:#fff!important;
  font-size:16px!important;
  font-weight:900!important;
  letter-spacing:-.04em!important;
}
.open_area > span:before{
  content:"◆";
  color:#ff2940!important;
  font-size:14px!important;
}
.open_area:after{
  content:"▼";
  font-size:13px!important;
  color:#fff!important;
  opacity:.9!important;
}
.selectedmenu{
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  min-width:64px!important;
  height:28px!important;
  margin-left:8px!important;
  padding:0 10px!important;
  border-radius:999px!important;
  background:rgba(255,27,49,.18)!important;
  border:1px solid rgba(255,27,49,.38)!important;
  color:#ff8b97!important;
  font-size:13px!important;
  font-weight:900!important;
}

/* search bar */
.nav-search{
  display:flex!important;
  align-items:center!important;
  justify-content:flex-end!important;
  background:transparent!important;
}
.nav-search .input-group{
  display:flex!important;
  align-items:center!important;
  border-radius:18px!important;
  overflow:hidden!important;
  border:1px solid rgba(255,35,60,.36)!important;
  background:#07070a!important;
  box-shadow:0 12px 24px rgba(0,0,0,.38)!important;
}
.nav-search .input-group .form-control{
  width:260px!important;
  height:58px!important;
  background:#07070a!important;
  color:#fff!important;
  border:0!important;
  padding:0 18px!important;
}
.nav-search .input-group .form-control::placeholder{
  color:#c6c6ca!important;
}
.nav-search .input-group-btn button,
.nav-search button,
.search-m{
  width:58px!important;
  height:58px!important;
  border-radius:0!important;
  background:linear-gradient(135deg,#ff1b31,#65000b)!important;
  color:#fff!important;
  border:0!important;
}

/* custom selector modal */
.ib-selector-backdrop{
  position:fixed;
  inset:0;
  z-index:2147483000;
  background:rgba(0,0,0,.72);
  backdrop-filter:blur(5px);
  display:flex;
  align-items:center;
  justify-content:center;
  padding:20px;
}
.ib-selector-modal{
  width:min(760px,96vw);
  max-height:86vh;
  overflow:auto;
  background:
    linear-gradient(180deg,rgba(18,18,22,.98),rgba(7,7,9,.98)),
    #09090b;
  border:1px solid rgba(255,35,60,.42);
  border-radius:26px;
  box-shadow:0 30px 80px rgba(0,0,0,.65);
  color:#fff;
}
.ib-selector-head{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  padding:18px 20px;
  border-bottom:1px solid rgba(255,35,60,.24);
  background:linear-gradient(135deg,rgba(255,27,49,.22),rgba(0,0,0,0));
}
.ib-selector-head h3{
  margin:0!important;
  color:#fff!important;
  font-size:22px!important;
  font-weight:900!important;
  letter-spacing:-.05em!important;
}
.ib-selector-close{
  width:42px;
  height:42px;
  border-radius:14px!important;
  border:1px solid rgba(255,255,255,.12)!important;
  background:rgba(255,255,255,.06)!important;
  color:#fff!important;
  font-size:24px!important;
  font-weight:900!important;
  line-height:1!important;
}
.ib-selector-body{
  padding:18px 20px 22px;
}
.ib-selector-grid{
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:10px;
}
.ib-selector-item{
  min-height:48px;
  border-radius:14px!important;
  border:1px solid rgba(255,35,60,.22)!important;
  background:#121217!important;
  color:#f5f5f7!important;
  font-weight:900!important;
  letter-spacing:-.04em!important;
  cursor:pointer;
}
.ib-selector-item:hover,
.ib-selector-item.active{
  background:linear-gradient(135deg,#ff1b31,#65000b)!important;
  color:#fff!important;
  border-color:rgba(255,255,255,.12)!important;
}

/* old broken region modal must not appear above real selector */
#modal_overlay,.modal_overlay,#gnb_area,#gnb_cate,.area_wrap.gnb_sub_menu{
  display:none!important;
  visibility:hidden!important;
  opacity:0!important;
  pointer-events:none!important;
}

/* mobile */
@media(max-width:991px){
  .header-mn ul{gap:6px!important;overflow-x:auto!important;justify-content:flex-start!important}
  .header-mn ul li a{width:82px!important;height:76px!important}
  .header-mn ul li a span{font-size:12px!important}
  .nav-visible .at-container{
    flex-direction:column!important;
    align-items:stretch!important;
    padding:10px!important;
  }
  .areacategory{
    width:100%!important;
    display:grid!important;
    grid-template-columns:1fr 1fr!important;
    gap:8px!important;
  }
  .open_area,#nav_shoptype,#nav_shoparea{
    width:100%!important;
    min-width:0!important;
    height:50px!important;
    padding:0 13px!important;
  }
  .open_area > span{font-size:14px!important}
  .nav-search,.nav-search .input-group{width:100%!important}
  .nav-search .input-group .form-control{width:100%!important;height:52px!important}
  .nav-search .input-group-btn button,.nav-search button,.search-m{height:52px!important;width:52px!important}
  .ib-selector-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
}

:root{--group_color_1:#030304!important;--group_color_2:#050506!important;--group_color_3:#070708!important;--group_color_4:#09090b!important;--group_color_5:#0b0b0e!important;--group_color_6:#0e0e12!important;--group_color_7:#111116!important;--group_color_8:#141419!important;--group_color_9:#17171d!important;--group_color_10:#1b1b22!important;--group_color_11:#030304!important;--group_color_12:#050506!important;--group_color_13:#0b0b0e!important;--group_color_14:#070708!important;--group_color_15:#0b0b0e!important;--group_color_16:#0e0e12!important;--group_color_17:#111116!important;--group_color_18:#141419!important;--group_color_19:#17171d!important;--group_color_20:#1b0005!important;--group_color_21:#2f0008!important;--group_color_22:#3d0007!important;--group_color_23:#520009!important;--group_color_24:#68000d!important;--group_color_25:#820012!important;--group_color_26:#9d0017!important;--group_color_27:#b6001d!important;--group_color_28:#42000a!important;--group_color_29:#e01932!important;--group_color_30:#ff263d!important;--group_color_31:#030304!important;--group_color_32:#121217!important;--group_color_33:#070708!important;--group_color_34:#09090b!important;--group_color_35:#0b0b0e!important;--group_color_36:#0e0e12!important;--group_color_37:#111116!important;--group_color_38:#141419!important;--group_color_39:#17171d!important;--group_color_40:#1b1b22!important;--group_color_41:#a50018!important;--group_color_42:#3d0007!important;--group_color_43:#520009!important;--group_color_44:#68000d!important;--group_color_45:#820012!important;--group_color_46:#9d0017!important;--group_color_47:#6d000e!important;--group_color_48:#cc1028!important;--group_color_49:#e01932!important;--group_color_50:#ff263d!important;--group_color_51:#030304!important;--group_color_52:#050506!important;--group_color_53:#070708!important;--group_color_54:#09090b!important;--group_color_55:#0b0b0e!important;--group_color_56:#0e0e12!important;--group_color_57:#111116!important;--group_color_58:#141419!important;--group_color_59:#17171d!important;--group_color_60:#1b1b22!important;--group_color_61:#ff263d!important;--group_color_62:#3d0007!important;--group_color_63:#520009!important;--group_color_64:#68000d!important;--group_color_65:#820012!important;--group_color_66:#9d0017!important;--group_color_67:#b6001d!important;--group_color_68:#cc1028!important;--group_color_69:#e01932!important;--group_color_70:#ff263d!important;--ib-red:#f01529!important;--ib-red2:#a30012!important;--ib-red3:#62000a!important;--ib-black:#030304!important;--ib-dark:#08080b!important;--ib-panel:#111118!important;--ib-line:rgba(255,35,58,.34)!important;--ib-text:#f7f7f9!important}
html,body{background:#030304!important;color:#f7f7f9!important;}body{background-image:radial-gradient(circle at 50% -10%,rgba(240,21,41,.18),transparent 36%),linear-gradient(180deg,#09090b,#030304)!important;}
/* surfaces */
#wrapper,#container,#content,#thema_wrapper,#at_wrap,.wrapper,.at-container,.at-body,.at-main,.container,.content-wrap,.main_wrap,.sub_wrap,.main_content,.content_area,.main_box,.con_box,.box,.panel,.panel-default,.widget-box,.sidebox,.left_sidemenu,.right_sidemenu,.rank_box,.ranking_box,.list-group,.list-group-item,.board-list,.list-board,.basic-post-list,.basic-post-gallery,.thumbnail,.bbs-list,.latest-wrap,.notice-wrap,.view-wrap,.board-view,.shop-list,.searchbox,.s_box,.ibox,.post-row,.basic-list,.at-side,.tab_cont,.tab_pane,.latest_list,.latest_item,.latest_left,.latest_right,.right_upsobox,.list_upso,.list_upso li,.msn2_wrapper,.sidebar-content,#sidebar-box,.sidebar-login{background:#08080b!important;color:#f7f7f9!important;border-color:rgba(255,35,58,.24)!important;box-shadow:none!important}.at-container{background:transparent!important}
a,span,p,b,strong,em,label,li,td,th,h1,h2,h3,h4,h5,h6{color:inherit}
button,.btn,.button,input[type=submit],input[type=button],.tab_btn,.tab_title li,.header-tnb a,.at-lnb a,.login a,.open_area,.ib-hero-btn,.search-m,.nav-search button{background:linear-gradient(135deg,#f01529,#62000a)!important;color:#fff!important;border-color:rgba(255,255,255,.12)!important;text-shadow:none!important;box-shadow:0 10px 22px rgba(0,0,0,.28)!important}button:hover,.btn:hover,.button:hover,.tab_btn:hover,.tab_btn.is_active,.tab_title li.on,.header-tnb a:hover,.at-lnb a:hover,.open_area:hover{background:#fff!important;color:#111!important}
.header-mn ul li a{background:#15151b!important;border:1px solid rgba(255,35,58,.24)!important;color:#f7f7f9!important;box-shadow:none!important}.header-mn ul li.on a,.header-mn ul li a:hover{background:linear-gradient(135deg,#f01529,#62000a)!important;color:#fff!important}.header-mn ul li a span{color:inherit!important}.header-mn ul li a i{background:rgba(255,255,255,.05)!important;border-color:rgba(255,35,58,.22)!important;color:#f01529!important;font-size:0!important}.header-mn ul li a i:before{content:"IB"!important;font-size:11px!important;font-family:Arial!important;font-weight:900!important;color:currentColor!important}
.nav-visible{background:#030304!important;border-color:rgba(255,35,58,.28)!important}.nav-visible .at-container{background:#030304!important}.areacategory,.nav-top,.nav-float,.nav-slide{background:transparent!important}.open_area,#nav_shoptype,#nav_shoparea{background:#0d0d11!important;color:#fff!important;border:1px solid rgba(255,35,58,.34)!important;box-shadow:none!important}.open_area>span,.selectedmenu{color:#fff!important}.selectedmenu{background:rgba(240,21,41,.18)!important;border:1px solid rgba(240,21,41,.42)!important;color:#ff7c89!important}.nav-search .input-group{background:#08080b!important;border:1px solid rgba(255,35,58,.34)!important;border-radius:16px!important;overflow:hidden!important;box-shadow:none!important}.nav-search .form-control,.nav-search input,input,select,textarea{background:#09090d!important;color:#fff!important;border:1px solid rgba(255,35,58,.30)!important;box-shadow:none!important}.nav-search .form-control{border:0!important}.nav-search .form-control::placeholder,input::placeholder,textarea::placeholder{color:#a8a8af!important}
.top_slide_wrap,.top_slide,.top_slide_item{background:#050506!important;border:1px solid rgba(255,35,58,.28)!important}.top_slide_wrap{border-radius:24px!important;overflow:hidden!important;min-height:280px!important}.top_slide{min-height:280px!important}.top_slide_item{display:none!important}.top_slide::before{content:"";display:block;width:100%;height:280px;background:#050506 url('/images/theme-loading-screen.png') center/cover no-repeat!important}.top_slide_button,.top_slide_prev_button,.top_slide_next_button,.top_slide_pagination{display:none!important}
.upso_latest_tabs{background:#08080b!important;border:1px solid rgba(255,35,58,.28)!important;border-radius:20px!important;box-shadow:none!important}.upso_latest_tabs .tab_head{background:#0d0d11!important;border-bottom:1px solid rgba(255,35,58,.22)!important}.upso_latest_tabs .tab_btn{background:#16161c!important;color:#f7f7f9!important;border:1px solid rgba(255,35,58,.22)!important}.upso_latest_tabs .tab_btn.is_active{background:linear-gradient(135deg,#f01529,#62000a)!important;color:#fff!important}.upso_latest_tabs .latest_item{background:transparent!important;border-bottom:1px solid rgba(255,35,58,.13)!important}.upso_latest_tabs .latest_title_wrap,.upso_latest_tabs .latest_left{background:#0c0c10!important;color:#fff!important;border-radius:999px!important}.upso_latest_tabs .latest_subject,.upso_latest_tabs a{color:#f4f4f6!important}
#left_aside .rank_box,#right_aside .right_upsobox,#right_aside .right_banner .msn2_wrapper{background:#08080b!important;border:1px solid rgba(255,35,58,.28)!important;border-radius:20px!important;overflow:hidden!important}.right_upsobox .tab_title li{background:#15151b!important;color:#f4f4f6!important}.right_upsobox .tab_title li.on{background:linear-gradient(135deg,#f01529,#62000a)!important;color:#fff!important}.right_upsobox .list_upso li a{background:#0a0a0e!important;color:#fff!important}.msn2_text{color:#fff!important}.msn2_text1{color:#ffd21f!important}
.modal-backdrop,.ib-login-backdrop{position:fixed!important;inset:0!important;background:rgba(0,0,0,.76)!important;backdrop-filter:blur(5px)!important;z-index:2147483500!important}.modal,.ib-login-modal{z-index:2147483600!important}.modal-content,.ib-login-box{background:#111118!important;color:#fff!important;border:1px solid rgba(255,35,58,.34)!important;border-radius:22px!important;box-shadow:0 28px 75px rgba(0,0,0,.62)!important}.modal-header,.ib-login-head,.sidebar-head{background:#1a1a22!important;border-color:rgba(255,35,58,.22)!important;color:#fff!important}.modal-title,.ib-login-head h3{color:#fff!important;font-weight:900!important}.modal-body,.modal-footer,.ib-login-body{background:#111118!important;color:#fff!important;border-color:rgba(255,35,58,.18)!important}.modal input,.sidebar-login input,.ib-login-body input{background:#07070a!important;color:#fff!important;border:1px solid rgba(255,35,58,.38)!important;border-radius:14px!important}.modal label,.sidebar-login label,.ib-login-body label{color:#fff!important}.ib-login-backdrop{display:flex!important;align-items:center!important;justify-content:center!important;padding:18px!important}.ib-login-box{width:min(520px,96vw)!important;overflow:hidden!important}.ib-login-head{display:flex!important;align-items:center!important;justify-content:space-between!important;padding:18px 20px!important}.ib-login-head h3{margin:0!important;font-size:22px!important}.ib-login-close{width:42px!important;height:42px!important;border-radius:14px!important;background:linear-gradient(135deg,#f01529,#62000a)!important;color:#fff!important;border:0!important;font-size:25px!important;font-weight:900!important}.ib-login-body{padding:22px!important}.ib-login-tabs{display:grid!important;grid-template-columns:1fr 1fr!important;gap:0!important;margin:0 0 20px!important;border-radius:18px!important;overflow:hidden!important}.ib-login-tabs button{height:58px!important;border-radius:0!important}.ib-login-body label{display:block!important;font-size:14px!important;font-weight:900!important;margin:12px 0 7px!important}.ib-login-body input{width:100%!important;height:54px!important;padding:0 14px!important;box-sizing:border-box!important}.ib-login-submit{width:100%!important;height:56px!important;margin-top:18px!important;border-radius:18px!important;background:linear-gradient(135deg,#f01529,#62000a)!important;color:#fff!important;border:0!important;font-size:18px!important;font-weight:900!important}.ib-login-help{margin-top:14px!important;color:#bfc0c7!important;font-size:13px!important;line-height:1.55!important}.ib-login-error{display:none;margin-top:12px!important;color:#ff8792!important;font-weight:900!important}.ib-login-contact{margin-top:18px!important;padding:18px!important;border-radius:18px!important;background:#08080b!important;border:1px solid rgba(255,35,58,.22)!important;text-align:center!important}.ib-login-contact b{display:block!important;color:#fff!important;font-size:17px!important;margin-bottom:8px!important}.ib-login-contact a{color:#ffd21f!important;font-size:24px!important;font-weight:900!important;text-decoration:none!important}.ib-force-dark{background:#08080b!important;color:#f7f7f9!important;border-color:rgba(255,35,58,.22)!important;box-shadow:none!important}.ib-force-red{background:linear-gradient(135deg,#f01529,#62000a)!important;color:#fff!important;border-color:rgba(255,255,255,.12)!important}.ib-force-redtext{color:#ff5364!important}


/* === BLACK RED FINAL SOURCE FIX: no pink buttons === */
.info_btn a,
.info_btn01,
.info_btn02,
.info_btn .disable_btn,
a.info_btn01,
a.info_btn02,
[class*="info_btn"] a,
[class*="btn"]{
  background:linear-gradient(135deg,#d0001b,#65000b)!important;
  color:#fff!important;
  border:1px solid rgba(255,255,255,.10)!important;
}
.info_btn .disable_btn,
a.disable_btn{
  background:linear-gradient(180deg,#17171d,#09090c)!important;
  color:#f1f1f4!important;
  cursor:pointer!important;
}
.listbox .info_btn a:hover,
[class*="btn"]:hover{
  background:#fff!important;
  color:#111!important;
}

/* remove any remaining pink-coded inline style appearance */
[style*="#b00016"],
[style*="#ff2"],
[style*="#ff3"],
[style*="255,27,49"]{
  border-color:rgba(255,38,61,.34)!important;
}

/* login modal black-red */
#loginModal,
.login-modal,
.ib-login-modal,
.modal-dialog,
.modal-content{
  background:#111116!important;
  color:#fff!important;
  border-color:rgba(255,38,61,.34)!important;
}
#loginModal button,
.login-modal button,
.ib-login-modal button,
.modal-content button,
.login_tab a,
.login-tabs a{
  background:linear-gradient(135deg,#d0001b,#65000b)!important;
  color:#fff!important;
  border-color:rgba(255,255,255,.10)!important;
}
#loginModal input,
.login-modal input,
.ib-login-modal input,
.modal-content input{
  background:#08080a!important;
  color:#fff!important;
  border:1px solid rgba(255,38,61,.36)!important;
}

/* source cards */
.listbox{
  background:#08080a!important;
  border:1px solid rgba(255,38,61,.30)!important;
}
.info_area{
  background:#0b0b0e!important;
  color:#ff5365!important;
  border:1px solid rgba(255,38,61,.38)!important;
}
`;
const SITE_JS = `
(function(){
  if(window.__ilovebamManagedLoaded) return; window.__ilovebamManagedLoaded = true;

function injectThemeBlocks(site){
  if(document.getElementById('ilovebam-theme-hero')) return;
  var phone=(site&&site.phone)||'010-8095-3087';
  var hero=document.createElement('section');
  hero.id='ilovebam-theme-hero';
  hero.innerHTML='\
    <div class="hero-card">\
      <div class="hero-inner">\
        <span class="hero-kicker">BUNNY RED EDITION</span>\
        <h1>ILOVEBAM</h1>\
        <p>강렬한 레드·블랙 무드로 다시 정리한 광주 · 전라 유흥 커뮤니티입니다. 공지사항, 추천 업소, 예약 문의를 더 빠르게 확인할 수 있습니다.</p>\
        <div class="hero-actions">\
          <a class="hero-btn primary" href="tel:'+String(phone).replace(/[^0-9+]/g,'')+'">전화문의 바로가기</a>\
          <a class="hero-btn secondary" href="/admin">관리자</a>\
        </div>\
      </div>\
      <img class="hero-logo-mark" src="/images/theme-bunny-logo-square.png" alt="ILOVEBAM Bunny Logo">\
    </div>';
  var notice=document.createElement('section');
  notice.id='ilovebam-theme-notice';
  notice.innerHTML='<a class="notice-card" href="#notice"><img src="/images/theme-notice-card.png" alt="ILOVEBAM 공지사항 업데이트 안내"></a>';
  var target=document.querySelector('main')||document.querySelector('#wrapper')||document.querySelector('.wrapper')||document.body;
  if(target===document.body){document.body.insertBefore(notice, document.body.children[1]||null);document.body.insertBefore(hero, notice);} else {target.insertBefore(notice,target.firstChild);target.insertBefore(hero,notice);}
}
function replaceBrandLogos(){
  ['img[src*="images/logo.png"]','img[src*="images/m_logo.png"]','img[src*="images/logo-1.png"]'].forEach(function(sel){
    document.querySelectorAll(sel).forEach(function(img){
      img.src='/images/logo.png?v=bunny';
      img.removeAttribute('srcset');
      img.alt='ILOVEBAM';
    });
  });
}
function useThemeForWaiters(){
  document.querySelectorAll('.premium_random_banner_wait,.premium_banner_nodata,.premium_random_banner_error').forEach(function(el){
    if(el.dataset.themeDone) return;
    el.dataset.themeDone='1';
    el.innerHTML='<img src="/images/theme-loading-screen.png" alt="잠시만 기다려주세요" style="display:block;width:100%;height:auto;border-radius:18px">';
  });
}
  function esc(s){return String(s||'').replace(/[&<>\"]/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]})}
  function ready(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn); else fn(); }

  function addVisibleAdminLogin(){
    function makeLink(text){
      var a=document.createElement('a');
      a.href='/admin';
      a.className='ilovebam-admin-login-link';
      a.textContent=text||'관리자 로그인';
      return a;
    }
    var topUl=document.querySelector('.at-lnb .pull-right ul');
    if(topUl && !topUl.querySelector('.ilovebam-admin-login-link')){
      var li=document.createElement('li'); li.appendChild(makeLink('관리자 로그인')); topUl.insertBefore(li, topUl.firstChild);
    }
    var mobile=document.querySelector('.header-tnb');
    if(mobile && !mobile.querySelector('.ilovebam-admin-login-link')){
      var li2=document.createElement('li'); li2.appendChild(makeLink('관리자')); mobile.insertBefore(li2, mobile.firstChild);
    }
    var links=document.querySelectorAll('a[onclick*="openLoginModal"]');
    for(var i=0;i<links.length;i++){
      links[i].style.color='#fff';
      links[i].style.opacity='1';
    }
  }
  function setImageFallback(img){
    if(!img || img.dataset.ilovebamFallbackAttached) return;
    img.dataset.ilovebamFallbackAttached='1';
    img.addEventListener('error',function(){
      if(this.dataset.ilovebamFallbackDone) return;
      this.dataset.ilovebamFallbackDone='1';
      this.className=(this.className?this.className+' ':'')+'ilovebam-img-fallback';
      var w=this.getAttribute('width') || this.naturalWidth || this.clientWidth || 0;
      var h=this.getAttribute('height') || this.naturalHeight || this.clientHeight || 0;
      var src=(Number(w)>260 || Number(h)<160) ? '/images/site-placeholder-wide.svg' : '/images/site-placeholder-square.svg';
      this.removeAttribute('srcset');
      this.src=src;
    },true);
    var src=img.getAttribute('src');
    if(!src || src==='#'){
      img.dispatchEvent(new Event('error'));
    }
  }
  function repairBrokenImages(){
    var imgs=document.querySelectorAll('img');
    for(var i=0;i<imgs.length;i++) setImageFallback(imgs[i]);
  }
  ready(function(){ addVisibleAdminLogin(); replaceBrandLogos(); repairBrokenImages(); useThemeForWaiters(); setTimeout(repairBrokenImages,1000); setTimeout(repairBrokenImages,2500); setTimeout(useThemeForWaiters,800); });

  ready(function(){
    fetch('/api/public-content',{cache:'no-store'}).then(function(r){return r.json()}).then(function(data){
      var site=data.site||{}, shops=data.shops||[], notices=data.notices||[];
      injectThemeBlocks(site);
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


(function(){
  if(window.__IB_STATIC_FIXED__) return;
  window.__IB_STATIC_FIXED__ = true;

  function ready(fn){
    if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }
  function makeAdminLink(){
    var a = document.createElement("a");
    a.href = "/admin";
    a.className = "ilovebam-admin-login-link";
    a.textContent = "관리자";
    return a;
  }
  function addAdminButtons(){
    var topUl = document.querySelector(".at-lnb .pull-right ul");
    if(topUl && !topUl.querySelector(".ilovebam-admin-login-link")){
      var li = document.createElement("li");
      li.appendChild(makeAdminLink());
      topUl.insertBefore(li, topUl.firstChild);
    }
    var body = document.body;
    if(body && !document.querySelector(".ib-static-floating-call")){
      var call = document.createElement("a");
      call.className = "ib-static-floating-call";
      call.href = "tel:01080953087";
      call.textContent = "전화문의 바로가기";
      body.appendChild(call);
    }
  }
  function removeOldPopups(){
    var selectors = [
      "#hd_pop",".hd_pops",".hd_pops_con",".hd_pops_footer",
      "[id*='hd_pops']","[class*='hd_pops']",
      ".popup_layer",".popup-wrap",".pop_layer",".layer-popup",
      "#layer_popup","#divpop",".main_popup",".notice_popup"
    ];
    document.querySelectorAll(selectors.join(",")).forEach(function(el){
      el.remove();
    });
  }
  function replaceBrokenImages(){
    document.querySelectorAll("img").forEach(function(img){
      if(img.dataset.ibFixed) return;
      img.dataset.ibFixed = "1";
      img.addEventListener("error", function(){
        if(this.dataset.ibFallbackDone) return;
        this.dataset.ibFallbackDone = "1";
        this.removeAttribute("srcset");
        this.className += " ilovebam-img-fallback";
        var box = this.getBoundingClientRect();
        this.src = (box.width > 260 || box.height < 160) ? "/images/theme-loading-screen.png" : "/images/theme-bunny-logo-square.png";
      }, true);
      var src = img.getAttribute("src");
      if(!src || src === "#") img.dispatchEvent(new Event("error"));
    });
  }
  function replaceLogoImages(){
    document.querySelectorAll("img").forEach(function(img){
      var src = img.getAttribute("src") || "";
      if(src.indexOf("logo.png") >= 0 || src.indexOf("m_logo.png") >= 0 || src.indexOf("logo-1.png") >= 0){
        img.removeAttribute("srcset");
        img.src = "/images/logo.png?v=static-bunny";
        img.alt = "ILOVEBAM";
      }
    });
  }
  function injectThemeBlocks(){
    if(document.getElementById("ib-static-hero")) return;

    var hero = document.createElement("section");
    hero.id = "ib-static-hero";
    hero.innerHTML =
      '<div class="ib-hero-card">' +
        '<div class="ib-hero-inner">' +
          '<span class="ib-kicker">BUNNY RED EDITION</span>' +
          '<h1>ILOVEBAM</h1>' +
          '<p>강렬한 레드·블랙 무드로 다시 정리한 광주 · 전라 유흥 커뮤니티입니다. 상무지구 노래방, 가라오케, 룸바, 퍼블릭 정보를 빠르게 확인할 수 있습니다.</p>' +
          '<div class="ib-hero-actions">' +
            '<a class="ib-hero-btn primary" href="tel:01080953087">전화문의 바로가기</a>' +
            '<a class="ib-hero-btn secondary" href="/admin">관리자</a>' +
          '</div>' +
        '</div>' +
        '<img class="ib-faint-logo" src="/images/theme-bunny-logo-square.png" alt="ILOVEBAM">' +
      '</div>';

    var notice = document.createElement("section");
    notice.id = "ib-static-notice";
    notice.innerHTML =
      '<div class="ib-notice-card">' +
        '<img src="/images/theme-notice-card.png" alt="ILOVEBAM 공지사항">' +
        '<div class="ib-notice-text">' +
          '<span class="ib-label">NOTICE</span>' +
          '<h2>공지사항 업데이트 안내</h2>' +
          '<ul>' +
            '<li>사이트 점검 시간 안내</li>' +
            '<li>예약 및 문의는 상단 전화 버튼 이용</li>' +
            '<li>신규 업소 업데이트 진행중</li>' +
          '</ul>' +
        '</div>' +
      '</div>';

    var insertAfter = document.getElementById("ilovebam10-top-call");
    if(insertAfter && insertAfter.parentNode){
      insertAfter.parentNode.insertBefore(notice, insertAfter.nextSibling);
      insertAfter.parentNode.insertBefore(hero, notice);
      return;
    }
    var target = document.querySelector("main") || document.querySelector("#wrapper") || document.querySelector(".wrapper") || document.body;
    target.insertBefore(notice, target.firstChild);
    target.insertBefore(hero, notice);
  }
  function replaceWaitBlocks(){
    document.querySelectorAll(".premium_random_banner_wait,.premium_banner_nodata,.premium_random_banner_error").forEach(function(el){
      if(el.dataset.ibWaitFixed) return;
      el.dataset.ibWaitFixed = "1";
      el.innerHTML = '<img src="/images/theme-loading-screen.png" alt="잠시만 기다려주세요" style="display:block;width:100%;height:auto;border-radius:18px">';
    });
  }
  ready(function(){
    removeOldPopups();
    addAdminButtons();
    replaceLogoImages();
    injectThemeBlocks();
    replaceBrokenImages();
    replaceWaitBlocks();
    setTimeout(removeOldPopups, 300);
    setTimeout(replaceBrokenImages, 800);
    setTimeout(replaceWaitBlocks, 900);
    setTimeout(removeOldPopups, 1500);
  });
})();


(function(){
  if(window.__IB_HARD_PATCH__) return;
  window.__IB_HARD_PATCH__=true;
  function ready(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn); else fn(); }
  function hideRegionStuff(){
    ['#modal_overlay','#gnb_area','#gnb_cate','.modal_overlay','.area_wrap.gnb_sub_menu'].forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(el){ el.style.display='none'; el.remove(); });
    });
    var shoparea=document.getElementById('nav_shoparea');
    if(shoparea){
      shoparea.onclick=function(e){ e.preventDefault(); return false; };
      shoparea.setAttribute('href','#');
    }
  }
  function replaceTopSlide(){
    var top=document.querySelector('.top_slide');
    if(!top) return;
    top.innerHTML='<div class="ib-top-single" style="width:100%;height:280px;background:#050506 url(\'/images/theme-loading-screen.png\') center/cover no-repeat"></div>';
  }
  function cleanupPinkText(){
    document.querySelectorAll('*').forEach(function(el){
      var txt=(el.textContent||'').trim();
      if(txt==='오류가 발생하여 자료를 가져오지 못했습니다' || txt==='오류가 발생하여 자료를 가져오지 못했습니다.'){ el.remove(); }
      if(txt==='지역선택' && el.closest('.modal_overlay, .area_wrap, .gnb_sub_menu')){ el.closest('.area_wrap, .gnb_sub_menu')?.remove(); }
    });
  }
  function replaceSideBanner(){
    var box=document.querySelector('.msn2_wrapper');
    if(box){
      box.innerHTML='<div class="msn2_img"><img src="images/theme-bunny-logo-square.png" alt="ILOVEBAM"></div><div class="msn2_text">고객센터 바로연결</div><div class="msn2_text1">클릭시 오픈</div>';
    }
  }
  ready(function(){ hideRegionStuff(); replaceTopSlide(); cleanupPinkText(); replaceSideBanner(); setTimeout(hideRegionStuff,300); setTimeout(replaceTopSlide,500); setTimeout(cleanupPinkText,800); });
})();


(function(){
  if(window.__IB_MENU_REGION_REAL_FIX__) return;
  window.__IB_MENU_REGION_REAL_FIX__ = true;

  var state = {
    category: '유흥주점',
    region: '지역전체'
  };

  var categories = ['전체','유흥주점','노래방','가라오케','룸바','퍼블릭','단란주점','노래주점','아로마','마사지','휴게텔','기타업종'];
  var regions = ['지역전체','상무지구','치평동','쌍촌동','금호동','광산구','첨단','수완지구','봉선동','충장로','전대후문','광주전체','목포','여수','순천','나주','화순','전남전체'];

  function ready(fn){
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function esc(s){
    return String(s || '').replace(/[&<>"']/g, function(m){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];
    });
  }

  function labelFor(type){
    return type === 'category' ? '업종선택' : '지역선택';
  }

  function openSelector(type){
    closeSelector();

    var list = type === 'category' ? categories : regions;
    var current = type === 'category' ? state.category : state.region;

    var backdrop = document.createElement('div');
    backdrop.className = 'ib-selector-backdrop';
    backdrop.innerHTML =
      '<div class="ib-selector-modal" role="dialog" aria-modal="true">' +
        '<div class="ib-selector-head">' +
          '<h3>' + labelFor(type) + '</h3>' +
          '<button type="button" class="ib-selector-close" aria-label="닫기">×</button>' +
        '</div>' +
        '<div class="ib-selector-body">' +
          '<div class="ib-selector-grid">' +
            list.map(function(item){
              return '<button type="button" class="ib-selector-item ' + (item === current ? 'active' : '') + '" data-value="' + esc(item) + '">' + esc(item) + '</button>';
            }).join('') +
          '</div>' +
        '</div>' +
      '</div>';

    backdrop.addEventListener('click', function(e){
      if(e.target === backdrop || e.target.classList.contains('ib-selector-close')) closeSelector();
      if(e.target.classList.contains('ib-selector-item')){
        var value = e.target.getAttribute('data-value') || '';
        if(type === 'category') {
          state.category = value;
          setCategoryLabel(value);
        } else {
          state.region = value;
          setRegionLabel(value);
        }
        filterVisibleText(value, type);
        closeSelector();
      }
    });

    document.body.appendChild(backdrop);
  }

  function closeSelector(){
    document.querySelectorAll('.ib-selector-backdrop').forEach(function(el){ el.remove(); });
  }

  function setCategoryLabel(value){
    var el = document.getElementById('nav_shoptype');
    if(!el) return;
    el.innerHTML = '<span>업종선택<span class="selectedmenu">' + esc(value) + '</span></span>';
  }

  function setRegionLabel(value){
    var el = document.getElementById('nav_shoparea');
    if(!el) return;
    el.innerHTML = '<span>지역선택<span class="selectedmenu">' + esc(value) + '</span></span>';
  }

  function filterVisibleText(value, type){
    // 정적 저장본이라 서버 필터는 없으므로, 선택값을 검색창 placeholder/화면 라벨에 반영한다.
    var input = document.querySelector('.nav-search input, input[name="stx"], input[type="search"]');
    if(input){
      input.placeholder = type === 'category' ? value + ' 검색어를 입력하세요' : value + ' 검색어를 입력하세요';
    }
  }

  function killOldBrokenModals(){
    ['#modal_overlay','.modal_overlay','#gnb_cate','#gnb_area','.area_wrap.gnb_sub_menu'].forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(el){
        el.style.display = 'none';
        el.style.visibility = 'hidden';
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
      });
    });
  }

  function bindSelectors(){
    var cate = document.getElementById('nav_shoptype');
    var area = document.getElementById('nav_shoparea');

    if(cate){
      cate.onclick = function(e){
        e.preventDefault();
        e.stopPropagation();
        killOldBrokenModals();
        openSelector('category');
        return false;
      };
      cate.removeAttribute('val');
      setCategoryLabel(state.category);
    }

    if(area){
      area.onclick = function(e){
        e.preventDefault();
        e.stopPropagation();
        killOldBrokenModals();
        openSelector('region');
        return false;
      };
      area.removeAttribute('val');
      setRegionLabel(state.region);
    }
  }

  function cleanHeaderMenu(){
    document.querySelectorAll('.header-mn ul li a i').forEach(function(i){
      i.removeAttribute('class');
      i.setAttribute('aria-hidden', 'true');
    });
  }

  function fixSearchButton(){
    document.querySelectorAll('.nav-search button, .search-m').forEach(function(btn){
      if(!btn.textContent.trim()) btn.textContent = '검색';
      btn.onclick = btn.onclick || function(){ return true; };
    });
  }

  ready(function(){
    bindSelectors();
    cleanHeaderMenu();
    fixSearchButton();
    killOldBrokenModals();
    setTimeout(function(){ bindSelectors(); cleanHeaderMenu(); killOldBrokenModals(); }, 500);
    setTimeout(function(){ bindSelectors(); cleanHeaderMenu(); killOldBrokenModals(); }, 1500);
  });
})();


(function(){
  if(window.__IB_FINAL_NO_PINK_LOGIN__) return; window.__IB_FINAL_NO_PINK_LOGIN__=true;
  var ADMIN_USER='admin', ADMIN_PASS='ilovebam10!2026';
  function ready(fn){ if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn); else fn(); }
  function closeOldModals(){document.querySelectorAll('.modal-backdrop,.modal.in,.modal.show').forEach(function(el){if(!el.classList.contains('ib-login-backdrop')&&!el.classList.contains('ib-selector-backdrop'))el.remove();});document.body.classList.remove('modal-open');document.body.style.paddingRight='';}
  function showLogin(){closeOldModals();document.querySelectorAll('.ib-login-backdrop').forEach(function(el){el.remove();});var back=document.createElement('div');back.className='ib-login-backdrop';back.innerHTML='<div class="ib-login-box" role="dialog" aria-modal="true"><div class="ib-login-head"><h3>ILOVEBAM 로그인</h3><button class="ib-login-close" type="button">×</button></div><div class="ib-login-body"><div class="ib-login-tabs"><button type="button" class="ib-force-red">로그인</button><button type="button">회원가입</button></div><form id="ibLoginForm"><label>아이디</label><input id="ibLoginId" autocomplete="username" value="admin"><label>비밀번호</label><input id="ibLoginPw" type="password" autocomplete="current-password"><button class="ib-login-submit" type="submit">로그인</button><div class="ib-login-error" id="ibLoginErr">아이디 또는 비밀번호가 맞지 않습니다.</div></form><div class="ib-login-help">관리자 계정은 <b>admin</b> / <b>ilovebam10!2026</b> 입니다. 로컬 파일에서는 미리보기 로그인으로 처리되고, 실제 관리는 서버 실행 후 <b>/admin</b>에서 접속됩니다.</div><div class="ib-login-contact"><b>고객센터 바로연결</b><a href="tel:01080953087">클릭시 오픈</a></div></div></div>';back.addEventListener('click',function(e){if(e.target===back||e.target.classList.contains('ib-login-close'))back.remove();});document.body.appendChild(back);var pw=back.querySelector('#ibLoginPw');if(pw)pw.focus();back.querySelector('#ibLoginForm').addEventListener('submit',function(e){e.preventDefault();var id=(back.querySelector('#ibLoginId').value||'').trim(), pass=back.querySelector('#ibLoginPw').value||'', err=back.querySelector('#ibLoginErr');if(id!==ADMIN_USER||pass!==ADMIN_PASS){err.style.display='block';return false;}try{localStorage.setItem('ilovebam_admin_preview','1');}catch(_e){}updateLoginState();if(location.protocol==='file:'){err.style.display='block';err.style.color='#8cffac';err.textContent='로컬 미리보기 로그인 완료. 실제 관리는 node server.js 실행 후 http://localhost:3000/admin 접속';setTimeout(function(){back.remove();},1400);}else{fetch('/admin/login',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'user='+encodeURIComponent(id)+'&password='+encodeURIComponent(pass),credentials:'same-origin'}).then(function(){location.href='/admin';}).catch(function(){location.href='/admin';});}return false;});}
  function updateLoginState(){var logged=false;try{logged=localStorage.getItem('ilovebam_admin_preview')==='1';}catch(_e){}if(!logged)return;document.querySelectorAll('a').forEach(function(a){var t=(a.textContent||'').trim(), oc=a.getAttribute('onclick')||'';if(t==='로그인'||oc.indexOf('openLoginModal')>=0){a.textContent='관리자';a.removeAttribute('onclick');a.href='/admin';}});}
  window.openLoginModal=function(){showLogin();return false;};window.loginfirst=function(){showLogin();return false;};window.sidebar_login=function(){showLogin();return false;};
  function interceptClicks(){document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a,button');if(!a)return;var text=(a.textContent||'').trim(),oc=a.getAttribute('onclick')||'',href=a.getAttribute('href')||'';if(oc.indexOf('openLoginModal')>=0||oc.indexOf('loginfirst')>=0||href.indexOf('login_check.php')>=0||(text==='로그인'&&!a.closest('.ib-login-box'))){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();showLogin();return false;}},true);}
  function patchForms(){document.querySelectorAll('form[action*="login_check.php"],#sidebar_login_form').forEach(function(f){f.setAttribute('action','#');f.onsubmit=function(e){if(e&&e.preventDefault)e.preventDefault();showLogin();return false;};});}
  function isPinkish(rgb){var m=String(rgb||'').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);if(!m)return false;var r=+m[1],g=+m[2],b=+m[3];return(r>170&&b>110&&g<175)||(r>220&&g>180&&b>200)||(r>180&&g<100&&b<130);}function isWhiteish(rgb){var m=String(rgb||'').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);if(!m)return false;var r=+m[1],g=+m[2],b=+m[3];return r>235&&g>235&&b>235;}
  function dePink(){var skip=['SCRIPT','STYLE','LINK','META','IMG','SVG','PATH'];document.querySelectorAll('body *').forEach(function(el){if(skip.indexOf(el.tagName)>=0)return;var cs=getComputedStyle(el),bg=cs.backgroundColor,color=cs.color,border=cs.borderTopColor,rect=el.getBoundingClientRect(),clickable=el.matches('a,button,input[type="submit"],input[type="button"],.btn,.tab_btn')||el.closest('.tab_title');if(isPinkish(bg))el.classList.add(clickable?'ib-force-red':'ib-force-dark');if(isWhiteish(bg)&&rect.width>50&&rect.height>20&&!el.closest('.ib-login-box'))el.classList.add('ib-force-dark');if(isPinkish(color))el.classList.add('ib-force-redtext');if(isPinkish(border))el.style.borderColor='rgba(255,35,58,.24)';});}
  function fixContact(){document.querySelectorAll('.msn2_wrapper').forEach(function(box){if(box.dataset.ibContactFixed)return;box.dataset.ibContactFixed='1';box.innerHTML='<div class="msn2_img"><img src="/images/theme-bunny-logo-square.png" alt="ILOVEBAM" style="width:54px;height:54px;object-fit:contain"></div><div class="msn2_text">고객센터 바로연결</div><div class="msn2_text1">클릭시 오픈</div>';});}
  ready(function(){interceptClicks();patchForms();updateLoginState();fixContact();dePink();setTimeout(function(){patchForms();fixContact();dePink();},600);setTimeout(dePink,1600);setTimeout(dePink,3000);});
})();


(function(){
  if(window.__IB_SOURCE_NO_PINK__) return;
  window.__IB_SOURCE_NO_PINK__ = true;

  function ready(fn){
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function forceNoPinkButtons(){
    document.querySelectorAll('.info_btn a,.info_btn01,.info_btn02,.disable_btn').forEach(function(el){
      el.style.background = el.classList.contains('disable_btn')
        ? 'linear-gradient(180deg,#17171d,#09090c)'
        : 'linear-gradient(135deg,#d0001b,#65000b)';
      el.style.color = '#fff';
      el.style.border = '1px solid rgba(255,255,255,.10)';
    });
  }

  function fixLoginModal(){
    document.querySelectorAll('.modal-content,.login-modal,.ib-login-modal,#loginModal').forEach(function(el){
      el.style.background = '#111116';
      el.style.color = '#fff';
      el.style.borderColor = 'rgba(255,38,61,.34)';
    });
  }

  ready(function(){
    forceNoPinkButtons();
    fixLoginModal();
    setTimeout(forceNoPinkButtons,300);
    setTimeout(forceNoPinkButtons,1000);
    setTimeout(fixLoginModal,1000);
  });
})();
})();
`;

function loginHtml(error = '') {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ILOVEBAM 관리자 로그인</title>${adminStyle()}</head><body class="admin-login"><main class="login-card"><h1>ILOVEBAM 관리자</h1><p>사이트 내용을 수정하려면 로그인하세요.</p>${error ? `<div class="alert">${escapeHtml(error)}</div>` : ''}<form method="post" action="/admin/login"><label>아이디<input name="user" autocomplete="username" required value="admin"></label><label>비밀번호<input name="password" type="password" autocomplete="current-password" required></label><button type="submit">관리자 로그인</button></form><small>기본 계정: admin / ilovebam10!2026<br>Cloudtype 환경변수 ADMIN_PASSWORD로 비밀번호를 바꿀 수 있습니다.</small></main></body></html>`;
}
function adminStyle() {
  return `<style>
    :root{--bg:#08080b;--card:#121216;--txt:#f4f4f6;--muted:#b1b1b8;--line:rgba(255,30,60,.22);--pri:#ff1b2e;--danger:#ff4757;--ok:#0f9d58}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--txt);font-family:Arial,'Noto Sans KR',sans-serif}.admin-login{min-height:100vh;display:grid;place-items:center;padding:20px}.login-card{width:min(430px,100%);background:#fff;border-radius:24px;box-shadow:0 16px 50px rgba(15,23,42,.16);padding:28px}.login-card h1{font-size:25px;margin:0 0 8px}.login-card p{color:var(--muted);margin:0 0 22px}.login-card label{display:block;font-weight:800;margin:14px 0 6px}.login-card input{width:100%;border:1px solid var(--line);border-radius:14px;padding:13px;font-size:15px}.login-card button,.btn{border:0;border-radius:14px;background:var(--pri);color:#fff;font-weight:900;padding:12px 15px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:6px}.login-card button{width:100%;justify-content:center;margin-top:18px;font-size:16px}.login-card small{display:block;color:var(--muted);line-height:1.5;margin-top:16px}.alert{background:#fff1f1;color:#b00020;border:1px solid #ffd4d4;padding:10px;border-radius:12px;margin:0 0 14px}.admin-wrap{display:grid;grid-template-columns:250px 1fr;min-height:100vh}.side{background:#101827;color:#fff;padding:22px;position:sticky;top:0;height:100vh}.side h1{font-size:21px;margin:0 0 6px}.side p{font-size:12px;opacity:.7;margin:0 0 20px}.nav button,.side a{width:100%;border:0;background:transparent;color:#fff;text-align:left;padding:12px;border-radius:12px;font-weight:800;cursor:pointer;text-decoration:none;display:block;margin:3px 0}.nav button.active,.nav button:hover,.side a:hover{background:rgba(255,255,255,.12)}.content{padding:24px;max-width:1200px;width:100%}.top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px}.top h2{font-size:26px;margin:0}.card{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:18px;margin:0 0 16px;box-shadow:0 6px 24px rgba(15,23,42,.05)}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}label{font-weight:900;font-size:13px}input,textarea,select{width:100%;border:1px solid var(--line);border-radius:12px;padding:11px 12px;font:14px Arial,'Noto Sans KR',sans-serif;margin-top:7px;background:#fff}textarea{min-height:110px;resize:vertical}.muted{color:var(--muted);font-size:13px}.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.btn.gray{background:#374151}.btn.light{background:#eef2ff;color:#174cff}.btn.danger{background:var(--danger)}.btn.ok{background:var(--ok)}.table{width:100%;border-collapse:collapse}.table th,.table td{border-bottom:1px solid var(--line);padding:10px;text-align:left;font-size:13px;vertical-align:middle}.table img{width:70px;height:50px;object-fit:cover;border-radius:8px;background:#eee}.hide{display:none!important}.preview-img{max-width:220px;max-height:150px;border-radius:14px;border:1px solid var(--line);display:block;margin-top:8px}.toast{position:fixed;right:16px;bottom:16px;background:#111827;color:#fff;border-radius:14px;padding:12px 15px;box-shadow:0 8px 24px rgba(0,0,0,.25);z-index:10}.file-list{height:320px;overflow:auto;border:1px solid var(--line);border-radius:14px;background:#fff}.file-item{display:block;width:100%;border:0;background:#fff;text-align:left;padding:10px 12px;border-bottom:1px solid #f1f1f1;cursor:pointer}.file-item:hover{background:#f8fafc}.codearea{font-family:Consolas,Monaco,monospace;min-height:520px;white-space:pre;tab-size:2}.pill{display:inline-block;border-radius:999px;padding:4px 8px;font-size:12px;font-weight:900;background:#f3f4f6;color:#374151}.warn{background:#fff8e1;border:1px solid #ffe7a3;color:#7a4d00;border-radius:14px;padding:12px;line-height:1.5}.image-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.image-grid button{border:1px solid var(--line);background:#fff;border-radius:14px;padding:8px;cursor:pointer;text-align:left}.image-grid img{width:100%;height:90px;object-fit:cover;border-radius:10px}.image-grid span{display:block;font-size:11px;color:#555;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:6px}@media(max-width:900px){.admin-wrap{display:block}.side{position:relative;height:auto}.content{padding:14px}.grid,.grid3{grid-template-columns:1fr}.image-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.top{display:block}.table{display:block;overflow:auto}}
  </style>`;
}
function adminHtml() {
  const data = loadData();
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ILOVEBAM 관리자</title>${adminStyle()}</head><body><div class="admin-wrap"><aside class="side"><h1>ILOVEBAM ADMIN</h1><p>로그인 권한: ${escapeHtml(data.auth.user || 'admin')}</p><nav class="nav"><button data-tab="dashboard" class="active">대시보드</button><button data-tab="shops">업소 관리</button><button data-tab="notices">공지 관리</button><button data-tab="images">이미지 업로드</button><button data-tab="site">사이트 설정</button><button data-tab="files">파일 편집</button><button data-tab="password">비밀번호</button></nav><a href="/" target="_blank">사이트 보기</a><form method="post" action="/admin/logout"><button class="btn gray" style="width:100%;justify-content:center;margin-top:8px">로그아웃</button></form></aside><main class="content"><div class="top"><h2 id="pageTitle">대시보드</h2><div class="row"><a class="btn light" href="/" target="_blank">메인 보기</a><button class="btn" onclick="loadAll()">새로고침</button></div></div><section id="tab-dashboard" class="tab card"><h3>현재 상태</h3><div class="grid3"><div class="card"><b>업소</b><p id="statShops" class="muted">0개</p></div><div class="card"><b>공지</b><p id="statNotices" class="muted">0개</p></div><div class="card"><b>이미지</b><p id="statImages" class="muted">0개</p></div></div><div class="warn"><b>관리자 주소:</b> /admin<br><b>기본 계정:</b> admin / ilovebam10!2026<br>운영 전 Cloudtype 환경변수에 <b>ADMIN_PASSWORD</b>와 <b>SESSION_SECRET</b>을 넣으면 더 안전합니다.</div></section><section id="tab-shops" class="tab hide"><div class="card"><h3>업소 추가/수정</h3><input type="hidden" id="shopId"><div class="grid"><label>업소명<input id="shopName" placeholder="예: 상무지구 프리미엄 가라오케"></label><label>지역<input id="shopArea" placeholder="예: 상무지구"></label><label>카테고리<input id="shopCategory" placeholder="예: 노래방 / 가라오케 / 룸바"></label><label>전화번호<input id="shopPhone" placeholder="010-0000-0000"></label><label>노출순서<input id="shopOrder" type="number" value="10"></label><label>노출상태<select id="shopActive"><option value="true">노출</option><option value="false">숨김</option></select></label><label>대표 이미지 URL<input id="shopImage" placeholder="/uploads/admin/파일명.jpg"></label><label>상세 페이지 주소<input id="shopSlug" placeholder="자동 생성 가능"></label></div><label>설명<textarea id="shopDesc" placeholder="업소 설명, 이용 분위기, 지역 키워드 등을 입력"></textarea></label><label>상세 내용<textarea id="shopBody" placeholder="상세 페이지에 들어갈 긴 설명"></textarea></label><div class="row"><button class="btn ok" onclick="saveShop()">업소 저장</button><button class="btn gray" onclick="resetShopForm()">새 글쓰기</button><button class="btn light" onclick="pickImageFor('shopImage')">업로드 이미지 선택</button></div><img id="shopPreview" class="preview-img hide"></div><div class="card"><h3>업소 목록</h3><table class="table"><thead><tr><th>이미지</th><th>업소명</th><th>지역/분류</th><th>상태</th><th>관리</th></tr></thead><tbody id="shopRows"></tbody></table></div></section><section id="tab-notices" class="tab hide"><div class="card"><h3>공지 추가/수정</h3><input type="hidden" id="noticeId"><div class="grid"><label>제목<input id="noticeTitle" placeholder="예: 오늘 예약 가능"></label><label>노출상태<select id="noticeActive"><option value="true">노출</option><option value="false">숨김</option></select></label></div><label>내용<textarea id="noticeBody"></textarea></label><div class="row"><button class="btn ok" onclick="saveNotice()">공지 저장</button><button class="btn gray" onclick="resetNoticeForm()">새 공지</button></div></div><div class="card"><h3>공지 목록</h3><table class="table"><thead><tr><th>제목</th><th>내용</th><th>상태</th><th>관리</th></tr></thead><tbody id="noticeRows"></tbody></table></div></section><section id="tab-images" class="tab hide"><div class="card"><h3>이미지 업로드</h3><p class="muted">JPG/PNG/GIF/WEBP 이미지만 업로드됩니다. 업로드 후 URL을 업소 대표 이미지에 넣을 수 있습니다.</p><div class="row"><input id="uploadFile" type="file" accept="image/*" style="max-width:420px"><button class="btn" onclick="uploadImage()">업로드</button></div></div><div class="card"><h3>업로드 이미지</h3><div id="imageGrid" class="image-grid"></div></div></section><section id="tab-site" class="tab hide"><div class="card"><h3>사이트 설정</h3><div class="grid"><label>사이트 제목<input id="siteTitle"></label><label>대표 전화<input id="sitePhone"></label><label>카카오/기타 연락처<input id="siteKakao"></label><label>관리자 추천 업소 섹션<select id="siteInject"><option value="true">메인에 노출</option><option value="false">숨김</option></select></label></div><label>검색 설명 meta description<textarea id="siteDesc"></textarea></label><label>푸터 문구<input id="siteFooter"></label><button class="btn ok" onclick="saveSite()">사이트 설정 저장</button></div></section><section id="tab-files" class="tab hide"><div class="card warn"><b>주의:</b> HTML/CSS/JS 원본을 직접 수정하는 고급 기능입니다. 잘못 저장하면 화면이 깨질 수 있습니다. 저장 전 복사본을 남기는 것이 좋습니다.</div><div class="grid"><div class="card"><h3>파일 목록</h3><input id="fileSearch" placeholder="파일 검색" oninput="renderFiles()"><div id="fileList" class="file-list"></div></div><div class="card"><h3>파일 편집 <span id="currentFile" class="pill"></span></h3><textarea id="fileContent" class="codearea" spellcheck="false"></textarea><div class="row"><button class="btn ok" onclick="saveFile()">파일 저장</button><button class="btn gray" onclick="loadFile(currentFilePath)">다시 불러오기</button></div></div></div></section><section id="tab-password" class="tab hide"><div class="card"><h3>관리자 비밀번호 변경</h3><p class="muted">Cloudtype 환경변수 ADMIN_PASSWORD가 설정되어 있으면 환경변수가 우선입니다.</p><div class="grid"><label>현재 비밀번호<input id="oldPass" type="password"></label><label>새 비밀번호<input id="newPass" type="password"></label></div><button class="btn ok" onclick="changePassword()">비밀번호 변경</button></div></section></main></div><div id="toast" class="toast hide"></div><script>${adminScript()}</script></body></html>`;
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
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(desc)}"><link rel="stylesheet" href="/admin-assets/site-managed.css?v=20260625"><style>body{margin:0;background:#f6f7fb;font-family:Arial,'Noto Sans KR',sans-serif;color:#111}.detail{max-width:980px;margin:0 auto;padding:20px}.hero{background:#fff;border-radius:24px;box-shadow:0 10px 36px rgba(0,0,0,.1);overflow:hidden}.hero img{width:100%;max-height:430px;object-fit:cover;display:block;background:#eee}.body{padding:22px}.badges{display:flex;gap:8px;flex-wrap:wrap}.badge{background:#0d0d10;color:#d91e5b;font-weight:900;border-radius:999px;padding:6px 10px;font-size:13px}h1{font-size:32px;letter-spacing:-.05em;margin:14px 0 10px}.desc{font-size:16px;line-height:1.75;color:#333;white-space:pre-wrap}.actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}.actions a{background:#111;color:#fff;text-decoration:none;border-radius:14px;padding:12px 16px;font-weight:900}.back{display:inline-block;margin:0 0 14px;color:#111;text-decoration:none;font-weight:900}@media(max-width:600px){.detail{padding:12px}h1{font-size:25px}.body{padding:16px}}</style></head><body><main class="detail"><a class="back" href="/">← 메인으로</a><article class="hero"><img src="${escapeHtml(img)}" alt="${escapeHtml((shop.area || '광주') + ' ' + (shop.name || '업소'))}"><div class="body"><div class="badges"><span class="badge">${escapeHtml(shop.area || '광주')}</span><span class="badge">${escapeHtml(shop.category || '가라오케')}</span></div><h1>${escapeHtml(shop.name || '')}</h1><p class="desc">${escapeHtml(shop.description || '')}</p>${shop.body ? `<div class="desc">${escapeHtml(shop.body)}</div>` : ''}<div class="actions">${phone ? `<a href="tel:${escapeHtml(phone.replace(/[^0-9+]/g,''))}">전화문의 ${escapeHtml(phone)}</a>` : ''}<a href="/">목록 보기</a></div></div></article></main><script defer src="/admin-assets/site-managed.js?v=20260625"></script></body></html>`;
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

  if (req.url && req.url.startsWith('/ajax/ajax_latest.php')) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end('');
  }
  if (req.url && req.url.startsWith('/ajax/ajax_premium_banner.php')) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const pub = publicData();
    const defaultPremium = [
      { wr_id:'p1', mb_id:'admin', shoplink:'/', thumbnail:'/images/premium_local_01.jpg', shopname:'상무지구 프리미엄 가라오케', shoptime:'24시간 문의', shoparea:'상무지구', shoptype:'유흥주점', comment:3, hit:361 },
      { wr_id:'p2', mb_id:'admin', shoplink:'/', thumbnail:'/images/premium_local_02.jpg', shopname:'광주 노래방 추천 안내', shoptime:'예약 문의 가능', shoparea:'광주 서구', shoptype:'노래방', comment:2, hit:245 },
      { wr_id:'p3', mb_id:'admin', shoplink:'/', thumbnail:'/images/premium_local_03.jpg', shopname:'상무지구 룸바·노래주점', shoptime:'상담 가능', shoparea:'치평동', shoptype:'룸바', comment:1, hit:198 },
      { wr_id:'p4', mb_id:'admin', shoplink:'/', thumbnail:'/images/premium_local_04.jpg', shopname:'아이러브밤10 추천 업소', shoptime:'관리자 수정 가능', shoparea:'광주/전남', shoptype:'가라오케', comment:0, hit:156 }
    ];
    const rows = (pub.shops && pub.shops.length ? pub.shops.slice(0, 6).map((s, i) => ({
      wr_id: s.id || ('shop' + i),
      mb_id: 'admin',
      shoplink: '/shop/' + encodeURIComponent(s.slug || s.id || ''),
      thumbnail: s.image || ('/images/premium_local_0' + ((i % 4) + 1) + '.jpg'),
      shopname: s.name || '관리자 등록 업소',
      shoptime: '문의 가능',
      shoparea: s.area || '광주',
      shoptype: s.category || '가라오케',
      comment: 0,
      hit: 100 + i
    })) : defaultPremium);
    return res.end(JSON.stringify(rows));
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
    const pub = publicData();
    const defaultPremium = [
      { wr_id:'p1', mb_id:'admin', shoplink:'/', thumbnail:'/images/premium_local_01.jpg', shopname:'상무지구 프리미엄 가라오케', shoptime:'24시간 문의', shoparea:'상무지구', shoptype:'유흥주점', comment:3, hit:361 },
      { wr_id:'p2', mb_id:'admin', shoplink:'/', thumbnail:'/images/premium_local_02.jpg', shopname:'광주 노래방 추천 안내', shoptime:'예약 문의 가능', shoparea:'광주 서구', shoptype:'노래방', comment:2, hit:245 },
      { wr_id:'p3', mb_id:'admin', shoplink:'/', thumbnail:'/images/premium_local_03.jpg', shopname:'상무지구 룸바·노래주점', shoptime:'상담 가능', shoparea:'치평동', shoptype:'룸바', comment:1, hit:198 },
      { wr_id:'p4', mb_id:'admin', shoplink:'/', thumbnail:'/images/premium_local_04.jpg', shopname:'아이러브밤10 추천 업소', shoptime:'관리자 수정 가능', shoparea:'광주/전남', shoptype:'가라오케', comment:0, hit:156 }
    ];
    const rows = (pub.shops && pub.shops.length ? pub.shops.slice(0, 6).map((s, i) => ({
      wr_id: s.id || ('shop' + i),
      mb_id: 'admin',
      shoplink: '/shop/' + encodeURIComponent(s.slug || s.id || ''),
      thumbnail: s.image || ('/images/premium_local_0' + ((i % 4) + 1) + '.jpg'),
      shopname: s.name || '관리자 등록 업소',
      shoptime: '문의 가능',
      shoparea: s.area || '광주',
      shoptype: s.category || '가라오케',
      comment: 0,
      hit: 100 + i
    })) : defaultPremium);
    return res.end(JSON.stringify(rows));
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
