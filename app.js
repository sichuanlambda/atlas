// === Atlas Control Center ===
// SPA with hash routing, GitHub API integration

const REPO = 'sichuanlambda/atlas';
const AH_URL = 'https://app.architecturehelper.com';
const CRE_URL = 'https://cresoftware.tech';
const GITHUB_API = 'https://api.github.com';

let DATA = {};
let TASKS = [];
let PINS = {};
let NOTES_CACHE = {};

// === ROUTER ===
const routes = {
  '/': { title: 'Overview', render: renderOverview },
  '/projects': { title: 'Projects', render: renderProjects },
  '/projects/architecture-helper': { title: 'Architecture Helper', render: renderProjectAH },
  '/projects/cre-software': { title: 'CRE Software', render: renderProjectCRE },
  '/projects/plotzy': { title: 'Plotzy', render: renderProjectPlotzy },
  '/tasks': { title: 'Tasks', render: renderTasks },
  '/notes': { title: 'Notes', render: renderNotes },
  '/flows': { title: 'Flows', render: renderFlows },
  '/metrics': { title: 'Metrics', render: renderMetrics },
};

function navigate() {
  const hash = location.hash.slice(1) || '/';
  const route = routes[hash] || routes['/'];
  
  document.getElementById('page-title').textContent = route.title;
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.getAttribute('href') === '#' + hash || 
      (hash !== '/' && el.getAttribute('href').startsWith('#' + hash.split('/').slice(0,2).join('/'))));
  });
  
  route.render(document.getElementById('content'));
}

// === DATA LOADING ===
async function loadData() {
  try {
    const [dataRes, tasksRes, pinsRes] = await Promise.all([
      fetch('data.json?' + Date.now()),
      fetch('tasks.json?' + Date.now()),
      fetch('memory/pinterest-pins.json?' + Date.now()).catch(() => null),
    ]);
    DATA = await dataRes.json();
    TASKS = (await tasksRes.json()).tasks || [];
    if (pinsRes) PINS = await pinsRes.json();
  } catch (e) {
    console.error('Data load error:', e);
  }
  updateStatus();
}

function updateStatus() {
  const dot = document.getElementById('status-dot');
  const text = document.getElementById('status-text');
  const updated = document.getElementById('last-updated');
  
  if (DATA.lastUpdated) {
    const ago = timeAgo(new Date(DATA.lastUpdated));
    const mins = (Date.now() - new Date(DATA.lastUpdated).getTime()) / 60000;
    dot.className = 'status-indicator' + (mins > 60 ? ' stale' : mins > 240 ? ' offline' : '');
    text.textContent = mins < 5 ? 'Active' : mins < 60 ? 'Recent' : 'Stale';
    updated.textContent = 'Updated ' + ago;
  }
}

// === OVERVIEW PAGE ===
function renderOverview(el) {
  const done = TASKS.filter(t => t.status === 'done').length;
  const active = TASKS.filter(t => t.status === 'in-progress').length;
  const blocked = TASKS.filter(t => t.status === 'blocked').length;
  const pending = TASKS.filter(t => t.status === 'pending').length;
  
  el.innerHTML = `
    <div class="grid grid-4" style="margin-bottom:24px">
      <div class="stat-card">
        <div class="stat-label">Tasks Done</div>
        <div class="stat-value">${done}/${TASKS.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Active</div>
        <div class="stat-value" style="color:var(--accent)">${active}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Pinterest Queue</div>
        <div class="stat-value">${PINS.queue ? PINS.queue.length : 0}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Blocked</div>
        <div class="stat-value" style="color:${blocked?'var(--danger)':'var(--text-dim)'}">${blocked}</div>
      </div>
    </div>

    <div class="grid grid-2">
      <div class="card">
        <div class="card-header">
          <span class="card-title">Recent Tasks</span>
          <a href="#/tasks" class="btn btn-ghost" style="font-size:12px">View all →</a>
        </div>
        <div class="task-list">
          ${TASKS.filter(t => t.status !== 'done').slice(0, 6).map(taskItem).join('')}
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <span class="card-title">Projects</span>
        </div>
        ${projectMiniCard('Architecture Helper', AH_URL, 
          `${DATA.cities ? Object.keys(DATA.cities).length : 8} cities, ${DATA.totalBuildings || '~500'} buildings`)}
        ${projectMiniCard('CRE Software', CRE_URL, '174 products, 14 categories')}
        ${projectMiniCard('Plotzy', '#/projects/plotzy', 'Research phase')}
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <div class="card-header">
        <span class="card-title">Pinterest Pipeline</span>
        <span class="card-subtitle">${PINS.pins ? PINS.pins.length : 0} published · ${PINS.queue ? PINS.queue.length : 0} queued</span>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        ${(PINS.queue || []).slice(0, 12).map(p => 
          `<span class="badge badge-info">${p.name}</span>`
        ).join('')}
        ${(PINS.queue || []).length > 12 ? `<span class="badge badge-info">+${PINS.queue.length - 12} more</span>` : ''}
      </div>
    </div>
  `;
}

function projectMiniCard(name, url, desc) {
  return `<div class="task-item" style="cursor:pointer" onclick="location.hash='/projects/${name.toLowerCase().replace(/\s+/g,'-')}'">
    <span style="font-weight:600;flex:1">${name}</span>
    <span class="task-meta">${desc}</span>
  </div>`;
}

// === PROJECTS PAGE ===
function renderProjects(el) {
  el.innerHTML = `
    <div class="grid grid-3">
      <div class="project-card" onclick="location.hash='/projects/architecture-helper'">
        <div class="project-name">🏛️ Architecture Helper</div>
        <div class="project-desc">AI-powered architecture analysis platform with city guides, style pages, and building library</div>
        <div class="project-stats">
          <div class="project-stat"><strong>8</strong> cities</div>
          <div class="project-stat"><strong>~500</strong> buildings</div>
          <div class="project-stat"><strong>30</strong> styles</div>
          <div class="project-stat"><strong>18</strong> PRs</div>
        </div>
      </div>
      
      <div class="project-card" onclick="location.hash='/projects/cre-software'">
        <div class="project-name">🏢 CRE Software</div>
        <div class="project-desc">G2-style commercial real estate software directory with rich product data and SEO</div>
        <div class="project-stats">
          <div class="project-stat"><strong>174</strong> products</div>
          <div class="project-stat"><strong>14</strong> categories</div>
          <div class="project-stat"><strong>100%</strong> enriched</div>
        </div>
      </div>
      
      <div class="project-card" onclick="location.hash='/projects/plotzy'">
        <div class="project-name">📍 Plotzy</div>
        <div class="project-desc">Nathan's startup — property intelligence, zoning data, development tools</div>
        <div class="project-stats">
          <div class="project-stat"><strong>10</strong> cities zoned</div>
          <div class="project-stat"><strong>120K</strong> zones</div>
        </div>
      </div>
    </div>
  `;
}

function renderProjectAH(el) {
  const cities = ['Denver', 'Den Haag', 'San Francisco', 'Chicago', 'New Orleans', 'New York City', 'Washington DC', 'Philadelphia', 'Boston'];
  const pipeline = ['Barcelona', 'Bruges', 'Edinburgh', 'Kraków', 'Tirana', 'Istanbul', 'Rome'];
  
  el.innerHTML = `
    <a href="#/projects" style="font-size:12px;color:var(--text-muted);text-decoration:none;margin-bottom:16px;display:block">← Projects</a>
    
    <div class="grid grid-4" style="margin-bottom:24px">
      <div class="stat-card"><div class="stat-label">Cities Live</div><div class="stat-value">${cities.length}</div></div>
      <div class="stat-card"><div class="stat-label">Buildings</div><div class="stat-value">~500</div></div>
      <div class="stat-card"><div class="stat-label">Style Pages</div><div class="stat-value">30</div></div>
      <div class="stat-card"><div class="stat-label">PRs Merged</div><div class="stat-value">19</div></div>
    </div>
    
    <div class="grid grid-2">
      <div class="card">
        <div class="card-header"><span class="card-title">Live Cities</span></div>
        <div class="task-list">
          ${cities.map(c => `<div class="task-item">
            <span class="task-status done"></span>
            <a href="${AH_URL}/places/${c.toLowerCase().replace(/\s+/g,'-')}" target="_blank" style="color:var(--text);text-decoration:none;flex:1">${c}</a>
            <span class="badge badge-success">Live</span>
          </div>`).join('')}
        </div>
      </div>
      
      <div class="card">
        <div class="card-header"><span class="card-title">Pipeline</span></div>
        <div class="task-list">
          ${pipeline.map(c => `<div class="task-item">
            <span class="task-status pending"></span>
            <span class="task-name">${c}</span>
            <span class="badge badge-warning">Queued</span>
          </div>`).join('')}
        </div>
      </div>
    </div>
    
    <div class="card" style="margin-top:16px">
      <div class="card-header"><span class="card-title">Key Links</span></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <a href="${AH_URL}" target="_blank" class="btn btn-ghost">🌐 Site</a>
        <a href="${AH_URL}/admin/building_analyses" target="_blank" class="btn btn-ghost">⚙️ Admin</a>
        <a href="${AH_URL}/building_library" target="_blank" class="btn btn-ghost">📚 Library</a>
        <a href="${AH_URL}/styles" target="_blank" class="btn btn-ghost">🎨 Styles</a>
        <a href="https://github.com/sichuanlambda/feedback-loop" target="_blank" class="btn btn-ghost">🔗 GitHub</a>
      </div>
    </div>
  `;
}

function renderProjectCRE(el) {
  el.innerHTML = `
    <a href="#/projects" style="font-size:12px;color:var(--text-muted);text-decoration:none;margin-bottom:16px;display:block">← Projects</a>
    <div class="grid grid-4" style="margin-bottom:24px">
      <div class="stat-card"><div class="stat-label">Products</div><div class="stat-value">174</div></div>
      <div class="stat-card"><div class="stat-label">Categories</div><div class="stat-value">14</div></div>
      <div class="stat-card"><div class="stat-label">Enriched</div><div class="stat-value">100%</div></div>
      <div class="stat-card"><div class="stat-label">SSL</div><div class="stat-value" style="color:var(--success)">✓</div></div>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">Key Links</span></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <a href="${CRE_URL}" target="_blank" class="btn btn-ghost">🌐 Site</a>
        <a href="https://github.com/sichuanlambda/cre-directory" target="_blank" class="btn btn-ghost">🔗 GitHub</a>
      </div>
    </div>
  `;
}

function renderProjectPlotzy(el) {
  el.innerHTML = `
    <a href="#/projects" style="font-size:12px;color:var(--text-muted);text-decoration:none;margin-bottom:16px;display:block">← Projects</a>
    <div class="grid grid-4" style="margin-bottom:24px">
      <div class="stat-card"><div class="stat-label">Zoned Cities</div><div class="stat-value">10</div></div>
      <div class="stat-card"><div class="stat-label">Total Zones</div><div class="stat-value">120K</div></div>
      <div class="stat-card"><div class="stat-label">Data Size</div><div class="stat-value">566MB</div></div>
      <div class="stat-card"><div class="stat-label">Stage</div><div class="stat-value" style="font-size:16px">Research</div></div>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">Zoning Data Coverage</span></div>
      <div class="task-list">
        ${['Los Angeles (58K)', 'Austin (22K)', 'Sacramento (11K)', 'Tampa (11K)', 'Norman (4.4K)', 
           'Miami-Dade (4K)', 'Dallas (3.8K)', 'Orlando (2K)', 'San Francisco (1.6K)', 'Fort Lauderdale (739)']
          .map(c => `<div class="task-item"><span class="task-status done"></span><span class="task-name">${c}</span></div>`).join('')}
      </div>
    </div>
  `;
}

// === TASKS PAGE ===
function renderTasks(el) {
  const filter = el._filter || 'all';
  
  const filtered = filter === 'all' ? TASKS : TASKS.filter(t => t.status === filter);
  const counts = { all: TASKS.length, done: 0, 'in-progress': 0, blocked: 0, pending: 0 };
  TASKS.forEach(t => counts[t.status] = (counts[t.status] || 0) + 1);
  
  el.innerHTML = `
    <div class="filter-bar">
      ${['all', 'in-progress', 'pending', 'blocked', 'done'].map(f => 
        `<button class="filter-btn ${filter === f ? 'active' : ''}" onclick="this.closest('.content-area')._filter='${f}';renderTasks(this.closest('.content-area'))">${f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)} (${counts[f] || 0})</button>`
      ).join('')}
    </div>
    <div class="task-list">
      ${filtered.map(taskItem).join('')}
      ${filtered.length === 0 ? '<div style="color:var(--text-dim);padding:24px;text-align:center">No tasks</div>' : ''}
    </div>
  `;
}

function taskItem(t) {
  const priorityColor = t.priority === 'high' ? 'var(--danger)' : t.priority === 'medium' ? 'var(--warning)' : 'var(--text-dim)';
  return `<div class="task-item">
    <span class="task-status ${t.status}"></span>
    <span class="task-name">${t.name || t.title || 'Untitled'}</span>
    ${t.project ? `<span class="badge badge-info">${t.project}</span>` : ''}
    <span class="badge badge-${t.status === 'done' ? 'success' : t.status === 'blocked' ? 'danger' : t.status === 'in-progress' ? 'info' : 'warning'}">${t.status}</span>
  </div>`;
}

// === NOTES PAGE ===
async function renderNotes(el) {
  // List memory files from GitHub
  const noteFiles = [
    { path: 'MEMORY.md', name: 'MEMORY.md', icon: '🧠' },
    { path: 'memory/2026-02-18.md', name: '2026-02-18', icon: '📅' },
    { path: 'memory/vision-architecture-helper.md', name: 'Vision: Architecture Helper', icon: '🔭' },
    { path: 'memory/vision-cresoftware.md', name: 'Vision: CRE Software', icon: '🔭' },
    { path: 'memory/next-cities-ranking.md', name: 'Next Cities Ranking', icon: '🏙️' },
    { path: 'memory/runbooks/building-submission.md', name: 'Runbook: Building Submission', icon: '📋' },
    { path: 'memory/runbooks/pinterest-pin-creation.md', name: 'Runbook: Pinterest Pins', icon: '📋' },
    { path: 'memory/runbooks/city-guide-pipeline.md', name: 'Runbook: City Guide Pipeline', icon: '📋' },
    { path: 'memory/runbooks/dashboard-updates.md', name: 'Runbook: Dashboard Updates', icon: '📋' },
    { path: 'memory/runbooks/browser-automation.md', name: 'Runbook: Browser Automation', icon: '📋' },
    { path: 'memory/runbooks/cre-product-enrichment.md', name: 'Runbook: CRE Enrichment', icon: '📋' },
  ];
  
  const selected = el._selectedNote || noteFiles[0].path;
  
  el.innerHTML = `
    <div class="split-panel">
      <div class="split-left">
        <div class="section-header"><span class="section-title">Files</span></div>
        <div class="note-list">
          ${noteFiles.map(f => `
            <div class="note-item ${selected === f.path ? 'active' : ''}" 
                 onclick="this.closest('.content-area')._selectedNote='${f.path}';renderNotes(this.closest('.content-area'))">
              <span>${f.icon}</span>
              <span>${f.name}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="split-right">
        <div class="note-content" id="note-display">Loading...</div>
      </div>
    </div>
  `;
  
  // Load note content
  loadNote(selected);
}

async function loadNote(path) {
  const display = document.getElementById('note-display');
  if (!display) return;
  
  if (NOTES_CACHE[path]) {
    display.textContent = NOTES_CACHE[path];
    return;
  }
  
  display.textContent = 'Loading...';
  
  try {
    // Try loading from workspace files via relative path
    const wsBase = 'https://raw.githubusercontent.com/sichuanlambda/atlas/main/';
    const notesBase = 'https://raw.githubusercontent.com/sichuanlambda/atlas/main/';
    
    // Memory files are in the openclaw workspace, not the atlas repo
    // We'll fetch from the atlas repo's memory directory if mirrored there
    // Or fall back to a message
    const res = await fetch(notesBase + path + '?' + Date.now());
    if (res.ok) {
      const text = await res.text();
      NOTES_CACHE[path] = text;
      display.textContent = text;
    } else {
      display.textContent = `File not available in the atlas repo.\n\nPath: ${path}\n\nTo make notes viewable, Atlas mirrors workspace files to the atlas repo.`;
    }
  } catch (e) {
    display.textContent = 'Failed to load: ' + e.message;
  }
}

// === FLOWS PAGE ===
function renderFlows(el) {
  const flows = [
    { name: 'Pinterest Posting', schedule: '4x daily (09/13/17/21 UTC)', status: 'active', id: 'bc621e88', lastRun: 'Posts next building from queue' },
    { name: 'Pinterest Performance Review', schedule: 'Every 3 days', status: 'active', id: '9bfc068d', lastRun: 'Reviews pin performance metrics' },
    { name: 'Atlas Heartbeat', schedule: 'Every 30 min', status: 'active', id: '3aad1143', lastRun: 'Reviews tasks, picks up work, updates dashboard' },
    { name: 'Hourly Status Update', schedule: 'Every hour', status: 'active', id: '0f53741f', lastRun: 'Brief update to Nathan via Telegram' },
  ];
  
  el.innerHTML = `
    <div class="section-header">
      <span class="section-title">Cron Jobs</span>
      <span class="card-subtitle">${flows.length} active flows</span>
    </div>
    <div class="grid grid-2">
      ${flows.map(f => `
        <div class="flow-card">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <span class="flow-name">${f.name}</span>
            <span class="badge badge-success">${f.status}</span>
          </div>
          <div class="flow-schedule">⏰ ${f.schedule}</div>
          <div class="flow-meta">
            <span>ID: ${f.id}</span>
            <span>·</span>
            <span>${f.lastRun}</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// === METRICS PAGE ===
function renderMetrics(el) {
  const pinsPublished = PINS.pins ? PINS.pins.length : 0;
  const pinsQueued = PINS.queue ? PINS.queue.length : 0;
  
  el.innerHTML = `
    <div class="section-header"><span class="section-title">Pinterest</span></div>
    <div class="grid grid-4" style="margin-bottom:24px">
      <div class="stat-card"><div class="stat-label">Pins Published</div><div class="stat-value">${pinsPublished}</div></div>
      <div class="stat-card"><div class="stat-label">Queue</div><div class="stat-value">${pinsQueued}</div></div>
      <div class="stat-card"><div class="stat-label">Impressions</div><div class="stat-value">52</div></div>
      <div class="stat-card"><div class="stat-label">Saves</div><div class="stat-value">7</div></div>
    </div>
    
    <div class="grid grid-2">
      <div class="card">
        <div class="card-header"><span class="card-title">Published Pins</span></div>
        <div class="task-list">
          ${(PINS.pins || []).map(p => `<div class="task-item">
            <span class="task-status done"></span>
            <span class="task-name">${p.name || p.building_name || 'Pin #' + p.building_id}</span>
            <span class="task-meta">${p.city || ''}</span>
          </div>`).join('')}
        </div>
      </div>
      
      <div class="card">
        <div class="card-header"><span class="card-title">Queue (Next Up)</span></div>
        <div class="task-list">
          ${(PINS.queue || []).slice(0, 10).map(p => `<div class="task-item">
            <span class="task-status pending"></span>
            <span class="task-name">${p.name}</span>
            <span class="task-meta">${p.city}</span>
          </div>`).join('')}
          ${pinsQueued > 10 ? `<div style="color:var(--text-dim);font-size:12px;padding:8px 16px">+ ${pinsQueued - 10} more</div>` : ''}
        </div>
      </div>
    </div>
    
    <div class="section-header" style="margin-top:24px"><span class="section-title">Boards</span></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      ${(PINS.boards || []).map(b => {
        const name = typeof b === 'string' ? b : b.name;
        const slug = name.toLowerCase().replace(/\s+/g, '-');
        return `<a href="https://pinterest.com/nathaninproduct/${slug}" target="_blank" class="btn btn-ghost">${name}</a>`;
      }).join('')}
    </div>
  `;
}

// === UTILITIES ===
function timeAgo(date) {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return Math.floor(secs / 60) + 'm ago';
  if (secs < 86400) return Math.floor(secs / 3600) + 'h ago';
  return Math.floor(secs / 86400) + 'd ago';
}

// === MOBILE MENU ===
document.getElementById('mobile-menu').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// Close sidebar on nav click (mobile)
document.querySelectorAll('.nav-item').forEach(el => {
  el.addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
  });
});

// === INIT ===
window.addEventListener('hashchange', navigate);
loadData().then(() => navigate());

// Auto-refresh every 5 min
setInterval(async () => { await loadData(); navigate(); }, 300000);
