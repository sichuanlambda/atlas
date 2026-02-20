// === Atlas Control Center ===
const REPO = 'sichuanlambda/atlas';
const AH_URL = 'https://app.architecturehelper.com';
const CRE_URL = 'https://cresoftware.tech';

let DATA = {};
let TASKS = [];
let PINS = {};
let CONTENT_Q = {};
let NOTES_CACHE = {};
let CHATS = JSON.parse(localStorage.getItem('atlas_chats') || '{}');
let ACTIVE_CHAT = localStorage.getItem('atlas_active_chat') || null;

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
  '/chat': { title: 'Chat', render: renderChat },
  '/agents': { title: 'Agents', render: renderAgents },
  '/content': { title: 'Content Queue', render: renderContent },
};

function navigate() {
  const hash = location.hash.slice(1) || '/';
  const route = routes[hash] || routes['/'];
  document.getElementById('page-title').textContent = route.title;
  document.querySelectorAll('.nav-item').forEach(el => {
    const href = el.getAttribute('href').slice(1);
    el.classList.toggle('active', href === hash || (hash !== '/' && hash.startsWith(href) && href !== '/'));
  });
  route.render(document.getElementById('content'));
}

// === DATA LOADING ===
async function loadData() {
  try {
    const [dataRes, tasksRes, pinsRes, contentRes] = await Promise.all([
      fetch('data.json?' + Date.now()),
      fetch('tasks.json?' + Date.now()),
      fetch('memory/pinterest-pins.json?' + Date.now()).catch(() => null),
      fetch('content-queue.json?' + Date.now()).catch(() => null),
    ]);
    DATA = await dataRes.json();
    TASKS = (await tasksRes.json()).tasks || [];
    if (pinsRes && pinsRes.ok) PINS = await pinsRes.json();
    if (contentRes && contentRes.ok) CONTENT_Q = await contentRes.json();
  } catch (e) { console.error('Data load error:', e); }
  updateStatus();
}

function updateStatus() {
  const dot = document.getElementById('status-dot');
  const text = document.getElementById('status-text');
  const updated = document.getElementById('last-updated');
  if (!DATA.lastUpdated) return;
  const mins = (Date.now() - new Date(DATA.lastUpdated).getTime()) / 60000;
  dot.className = 'status-indicator' + (mins > 240 ? ' offline' : mins > 60 ? ' stale' : '');
  text.textContent = mins < 5 ? 'Active' : mins < 60 ? 'Recent' : mins < 240 ? 'Stale' : 'Offline';
  updated.textContent = 'Updated ' + timeAgo(new Date(DATA.lastUpdated));
}

// === OVERVIEW PAGE ===
function renderOverview(el) {
  const m = DATA.metrics || {};
  const done = TASKS.filter(t => t.status === 'done').length;
  const active = TASKS.filter(t => t.status === 'in-progress').length;
  const blocked = TASKS.filter(t => t.status === 'blocked').length;

  el.innerHTML = `
    ${renderTodaySummary()}

    <div class="section-header" style="margin-top:24px"><span class="section-title">Key Metrics</span></div>
    <div class="grid grid-4" style="margin-bottom:24px">
      <div class="stat-card"><div class="stat-label">Cities Live</div><div class="stat-value">${m.citiesLive || 0}</div></div>
      <div class="stat-card"><div class="stat-label">Buildings</div><div class="stat-value">${m.totalBuildings || 0}</div></div>
      <div class="stat-card"><div class="stat-label">Pinterest Pins</div><div class="stat-value">${m.pinterestPins || 0}</div><div class="stat-change positive">+${m.pinterestQueue || 0} queued</div></div>
      <div class="stat-card"><div class="stat-label">Tasks</div><div class="stat-value">${done}/${TASKS.length}</div><div class="stat-change">${active} active · ${blocked} blocked</div></div>
    </div>

    <div class="grid grid-2">
      <div class="card">
        <div class="card-header">
          <span class="card-title">⏳ Waiting on Nathan</span>
        </div>
        <div class="task-list">
          ${(DATA.waitingOnNathan || []).map((w, i) => `
            <div class="task-item waiting-item" style="cursor:pointer;flex-direction:column;align-items:stretch" onclick="toggleWaiting(${i})">
              <div style="display:flex;align-items:center;gap:8px">
                <span class="badge badge-${w.priority === 'high' ? 'danger' : w.priority === 'medium' ? 'warning' : 'info'}">${w.priority}</span>
                <div style="flex:1;font-weight:500">${w.item}</div>
                <span style="color:var(--text-dim);font-size:14px" id="waiting-chevron-${i}">▸</span>
              </div>
              <div id="waiting-detail-${i}" style="display:none;margin-top:10px;padding:10px 12px;background:var(--bg);border-radius:var(--radius);font-size:12px;line-height:1.6">
                <div style="color:var(--text-muted);margin-bottom:8px">${w.context}</div>
                ${w.steps ? '<div style="margin-bottom:8px"><strong>Steps:</strong></div><ol style="margin:0;padding-left:18px;color:var(--text)">' + w.steps.map(s => '<li style="margin-bottom:4px">' + s + '</li>').join('') + '</ol>' : ''}
                ${w.links ? '<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">' + w.links.map(l => '<a href="' + l.url + '" target="_blank" class="btn btn-ghost" style="font-size:11px;padding:4px 10px">' + l.label + '</a>').join('') + '</div>' : ''}
                ${w.added ? '<div style="margin-top:8px;font-size:11px;color:var(--text-dim)">Added: ' + w.added + '</div>' : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">📋 Recent Activity</span>
        </div>
        <div class="task-list">
          ${(DATA.recentActivity || []).slice(0, 8).map(a => `
            <div class="task-item" style="padding:8px 12px">
              <span style="font-size:11px;color:var(--text-dim);width:50px;flex-shrink:0">${formatTime(a.date)}</span>
              <span style="font-size:12px">${a.text}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderTodaySummary() {
  const s = DATA.todaySummary;
  if (!s) return '';
  return `
    <div class="card" style="border-color:var(--accent);margin-bottom:16px">
      <div class="card-header">
        <span class="card-title">📅 Today — ${s.date}</span>
        <span class="card-subtitle">${s.headline}</span>
      </div>
      <div class="summary-grid">
        ${(s.sections || []).map(sec => `
          <div class="summary-section">
            <div style="font-weight:600;font-size:13px;margin-bottom:8px">${sec.title}</div>
            <ul style="list-style:none;padding:0;margin:0">
              ${sec.items.map(i => `<li style="font-size:12px;color:var(--text-muted);padding:2px 0;padding-left:12px;position:relative"><span style="position:absolute;left:0">·</span>${i}</li>`).join('')}
            </ul>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// === PROJECTS ===
function renderProjects(el) {
  const m = DATA.metrics || {};
  el.innerHTML = `
    <div class="grid grid-3">
      <div class="project-card" onclick="location.hash='/projects/architecture-helper'">
        <div class="project-name">🏛️ Architecture Helper</div>
        <div class="project-desc">AI-powered architecture analysis with city guides, style pages, and building library</div>
        <div class="project-stats">
          <div class="project-stat"><strong>${m.citiesLive || 10}</strong> cities</div>
          <div class="project-stat"><strong>${m.totalBuildings || 530}</strong> buildings</div>
          <div class="project-stat"><strong>${m.totalStyles || 30}</strong> styles</div>
          <div class="project-stat"><strong>${m.prsMerged || 19}</strong> PRs</div>
        </div>
      </div>
      <div class="project-card" onclick="location.hash='/projects/cre-software'">
        <div class="project-name">🏢 CRE Software</div>
        <div class="project-desc">G2-style commercial real estate software directory</div>
        <div class="project-stats">
          <div class="project-stat"><strong>${m.creProducts || 174}</strong> products</div>
          <div class="project-stat"><strong>${m.creCategories || 14}</strong> categories</div>
        </div>
      </div>
      <div class="project-card" onclick="location.hash='/projects/plotzy'">
        <div class="project-name">📍 Plotzy</div>
        <div class="project-desc">Property intelligence, zoning data, development tools</div>
        <div class="project-stats">
          <div class="project-stat"><strong>${m.zoningCities || 10}</strong> cities zoned</div>
          <div class="project-stat"><strong>${(m.zoningZones||0).toLocaleString()}</strong> zones</div>
        </div>
      </div>
    </div>
  `;
}

function renderProjectAH(el) {
  const m = DATA.metrics || {};
  const p = DATA.pinterest || {};
  const live = m.citiesList || [];
  const pipeline = m.citiesInPipeline || [];
  el.innerHTML = `
    <a href="#/projects" class="back-link">← Projects</a>
    <div class="grid grid-4" style="margin-bottom:24px">
      <div class="stat-card"><div class="stat-label">Cities Live</div><div class="stat-value">${live.length}</div></div>
      <div class="stat-card"><div class="stat-label">Buildings</div><div class="stat-value">${m.totalBuildings || '~530'}</div></div>
      <div class="stat-card"><div class="stat-label">Style Pages</div><div class="stat-value">${m.totalStyles || 30}</div></div>
      <div class="stat-card"><div class="stat-label">PRs Merged</div><div class="stat-value">${m.prsMerged || 19}</div></div>
    </div>
    <div class="grid grid-2">
      <div class="card">
        <div class="card-header"><span class="card-title">Live Cities</span></div>
        <div class="task-list">${live.map(c => `<div class="task-item"><span class="task-status done"></span>
          <a href="${AH_URL}/places/${c.toLowerCase().replace(/\s+/g,'-')}" target="_blank" style="color:var(--text);text-decoration:none;flex:1">${c}</a>
          <span class="badge badge-success">Live</span></div>`).join('')}</div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Pipeline</span></div>
        <div class="task-list">${pipeline.map(c => `<div class="task-item"><span class="task-status pending"></span>
          <span class="task-name">${c}</span><span class="badge badge-warning">Queued</span></div>`).join('')}</div>
      </div>
    </div>
    <div class="card" style="margin-top:16px">
      <div class="card-header">
        <span class="card-title">📌 Pinterest Distribution</span>
        <span class="card-subtitle">${p.totalPins || m.pinterestPins || 0} live · ${p.queue || m.pinterestQueue || 0} queued · ${p.schedule || '4x daily'}</span>
      </div>
      <div class="grid grid-4" style="margin-bottom:16px">
        <div class="stat-card"><div class="stat-label">Pins Live</div><div class="stat-value">${p.totalPins || m.pinterestPins || 0}</div></div>
        <div class="stat-card"><div class="stat-label">Queue</div><div class="stat-value">${p.queue || m.pinterestQueue || 0}</div><div class="stat-change positive">~${Math.ceil((p.queue || m.pinterestQueue || 0)/4)}d content</div></div>
        <div class="stat-card"><div class="stat-label">Impressions</div><div class="stat-value">${(p.totalMetrics||{}).impressions || m.pinterestImpressions || 0}</div></div>
        <div class="stat-card"><div class="stat-label">Saves</div><div class="stat-value">${(p.totalMetrics||{}).saves || m.pinterestSaves || 0}</div></div>
      </div>
      <div style="margin-bottom:12px">
        <div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:8px">BOARDS</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${((p.boards||{}).city||[]).map(b => {
            const slug = b.toLowerCase().replace(/\s+/g,'-');
            return '<a href="https://pinterest.com/nathaninproduct/' + slug + '" target="_blank" class="btn btn-ghost" style="font-size:11px;padding:4px 10px">\u{1F3D9}\uFE0F ' + b + '</a>';
          }).join('')}
          ${((p.boards||{}).style||[]).map(b => {
            const slug = b.toLowerCase().replace(/\s+/g,'-');
            return '<a href="https://pinterest.com/nathaninproduct/' + slug + '" target="_blank" class="btn btn-ghost" style="font-size:11px;padding:4px 10px">\u{1F3A8} ' + b + '</a>';
          }).join('')}
        </div>
      </div>
      ${p.note ? '<div style="font-size:12px;color:var(--text-dim);padding:8px 12px;background:rgba(255,255,255,0.03);border-radius:var(--radius)">' + p.note + '</div>' : ''}
    </div>
    <div class="card" style="margin-top:16px">
      <div class="card-header"><span class="card-title">Links</span></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <a href="${AH_URL}" target="_blank" class="btn btn-ghost">🌐 Site</a>
        <a href="${AH_URL}/admin/building_analyses" target="_blank" class="btn btn-ghost">⚙️ Admin</a>
        <a href="${AH_URL}/building_library" target="_blank" class="btn btn-ghost">📚 Library</a>
        <a href="${AH_URL}/styles" target="_blank" class="btn btn-ghost">🎨 Styles</a>
        <a href="https://pinterest.com/nathaninproduct" target="_blank" class="btn btn-ghost">📌 Pinterest</a>
        <a href="https://github.com/sichuanlambda/feedback-loop" target="_blank" class="btn btn-ghost">GitHub</a>
      </div>
    </div>`;
}

function renderProjectCRE(el) {
  el.innerHTML = `
    <a href="#/projects" class="back-link">← Projects</a>
    <div class="grid grid-4" style="margin-bottom:24px">
      <div class="stat-card"><div class="stat-label">Products</div><div class="stat-value">174</div></div>
      <div class="stat-card"><div class="stat-label">Categories</div><div class="stat-value">14</div></div>
      <div class="stat-card"><div class="stat-label">Enriched</div><div class="stat-value">100%</div></div>
      <div class="stat-card"><div class="stat-label">SSL</div><div class="stat-value" style="color:var(--success)">✓</div></div>
    </div>
    <div class="card"><div class="card-header"><span class="card-title">Links</span></div>
      <div style="display:flex;gap:8px"><a href="${CRE_URL}" target="_blank" class="btn btn-ghost">🌐 Site</a>
      <a href="https://github.com/sichuanlambda/cre-directory" target="_blank" class="btn btn-ghost">GitHub</a></div></div>`;
}

function renderProjectPlotzy(el) {
  const m = DATA.metrics || {};
  el.innerHTML = `
    <a href="#/projects" class="back-link">← Projects</a>
    <div class="grid grid-4" style="margin-bottom:24px">
      <div class="stat-card"><div class="stat-label">Zoned Cities</div><div class="stat-value">${m.zoningCities || 10}</div></div>
      <div class="stat-card"><div class="stat-label">Total Zones</div><div class="stat-value">${((m.zoningZones||0)/1000).toFixed(0)}K</div></div>
      <div class="stat-card"><div class="stat-label">Data Size</div><div class="stat-value">566MB</div></div>
      <div class="stat-card"><div class="stat-label">Stage</div><div class="stat-value" style="font-size:16px">Research</div></div>
    </div>`;
}

// === TASKS ===
function renderTasks(el) {
  const filter = el._filter || 'all';
  const filtered = filter === 'all' ? TASKS : TASKS.filter(t => t.status === filter);
  const counts = { all: TASKS.length, done: 0, 'in-progress': 0, blocked: 0, pending: 0 };
  TASKS.forEach(t => counts[t.status] = (counts[t.status] || 0) + 1);
  el.innerHTML = `
    <div class="filter-bar">
      ${['all','in-progress','pending','blocked','done'].map(f =>
        `<button class="filter-btn ${filter===f?'active':''}" onclick="this.closest('.content-area')._filter='${f}';renderTasks(this.closest('.content-area'))">${f==='all'?'All':f.replace('-',' ')} (${counts[f]||0})</button>`
      ).join('')}
    </div>
    <div class="task-list">${filtered.map(taskItem).join('')}
      ${filtered.length===0?'<div style="color:var(--text-dim);padding:24px;text-align:center">No tasks</div>':''}
    </div>`;
}

function taskItem(t) {
  return `<div class="task-item">
    <span class="task-status ${t.status}"></span>
    <span class="task-name">${t.name||t.title||'Untitled'}</span>
    ${t.project?`<span class="badge badge-info">${t.project}</span>`:''}
    <span class="badge badge-${t.status==='done'?'success':t.status==='blocked'?'danger':t.status==='in-progress'?'info':'warning'}">${t.status}</span>
  </div>`;
}

// === NOTES ===
let NOTE_EDIT_MODE = false;
let NOTE_EDIT_SHA = null;

async function renderNotes(el) {
  const noteFiles = [
    { path: 'memory/MEMORY.md', name: 'MEMORY.md', icon: '🧠' },
    { path: 'memory/nathan-morning-briefing.md', name: 'Morning Briefing', icon: '☀️' },
    { path: 'memory/marketing-framework.md', name: 'Marketing Framework', icon: '📣' },
    { path: 'memory/marketing-plotzy-actions.md', name: 'Marketing: Plotzy', icon: '📍' },
    { path: 'memory/marketing-ah-actions.md', name: 'Marketing: AH', icon: '🏛️' },
    { path: 'memory/marketing-cre-actions.md', name: 'Marketing: CRE', icon: '🏢' },
    { path: 'memory/2026-02-19.md', name: '2026-02-19', icon: '📅' },
    { path: 'memory/2026-02-18.md', name: '2026-02-18', icon: '📅' },
    { path: 'memory/vision-architecture-helper.md', name: 'Vision: AH', icon: '🔭' },
    { path: 'memory/vision-cresoftware.md', name: 'Vision: CRE', icon: '🔭' },
    { path: 'memory/product-bookclub.md', name: 'Product: Book Club', icon: '📚' },
    { path: 'memory/next-cities-ranking.md', name: 'Next Cities', icon: '🏙️' },
    { path: 'memory/runbooks/building-submission.md', name: 'RB: Building Submit', icon: '📋' },
    { path: 'memory/runbooks/pinterest-pin-creation.md', name: 'RB: Pinterest', icon: '📋' },
    { path: 'memory/runbooks/city-guide-pipeline.md', name: 'RB: City Pipeline', icon: '📋' },
    { path: 'memory/runbooks/cre-product-enrichment.md', name: 'RB: CRE Enrichment', icon: '📋' },
  ];
  const selected = el._selectedNote || noteFiles[0].path;
  NOTE_EDIT_MODE = false;
  el.innerHTML = `
    <div class="split-panel">
      <div class="split-left">
        <div class="section-header"><span class="section-title">Files</span></div>
        <div class="note-list">${noteFiles.map(f => `
          <div class="note-item ${selected===f.path?'active':''}"
               onclick="this.closest('.content-area')._selectedNote='${f.path}';renderNotes(this.closest('.content-area'))">
            <span>${f.icon}</span><span>${f.name}</span>
          </div>`).join('')}</div>
      </div>
      <div class="split-right" style="display:flex;flex-direction:column">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <span style="font-size:13px;color:var(--text-muted)" id="note-filename">${selected.split('/').pop()}</span>
          <div style="display:flex;gap:6px">
            <button class="btn btn-ghost" style="font-size:12px;padding:4px 10px" onclick="toggleNoteEdit()" id="note-edit-btn">✏️ Edit</button>
            <button class="btn btn-primary" style="font-size:12px;padding:4px 10px;display:none" onclick="saveNote()" id="note-save-btn">💾 Save</button>
            <button class="btn btn-ghost" style="font-size:12px;padding:4px 10px;display:none" onclick="cancelNoteEdit()" id="note-cancel-btn">Cancel</button>
          </div>
        </div>
        <div class="note-content" id="note-display" style="flex:1;overflow-y:auto">Loading...</div>
        <textarea id="note-editor" style="display:none;flex:1;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:var(--radius);padding:12px;font-family:'SF Mono',Monaco,Consolas,monospace;font-size:13px;line-height:1.6;resize:none;outline:none"></textarea>
      </div>
    </div>`;
  loadNote(selected);
}

async function loadNote(path) {
  const display = document.getElementById('note-display');
  if (!display) return;
  display.innerHTML = '<div style="color:var(--text-dim)">Loading...</div>';
  try {
    const res = await fetch('https://raw.githubusercontent.com/' + REPO + '/main/' + path + '?' + Date.now());
    if (res.ok) {
      const text = await res.text();
      NOTES_CACHE[path] = text;
      display.innerHTML = renderMarkdown(text);
    } else {
      display.innerHTML = '<div style="color:var(--text-dim)">File not available (HTTP ' + res.status + ')</div>';
    }
  } catch (e) {
    display.innerHTML = '<div style="color:var(--text-dim)">Failed to load: ' + e.message + '</div>';
  }
}

function toggleNoteEdit() {
  const el = document.getElementById('content');
  const path = el._selectedNote || 'memory/MEMORY.md';
  const display = document.getElementById('note-display');
  const editor = document.getElementById('note-editor');
  const editBtn = document.getElementById('note-edit-btn');
  const saveBtn = document.getElementById('note-save-btn');
  const cancelBtn = document.getElementById('note-cancel-btn');
  
  NOTE_EDIT_MODE = true;
  editor.value = NOTES_CACHE[path] || '';
  display.style.display = 'none';
  editor.style.display = 'block';
  editBtn.style.display = 'none';
  saveBtn.style.display = 'inline-flex';
  cancelBtn.style.display = 'inline-flex';
  editor.focus();
}

function cancelNoteEdit() {
  const display = document.getElementById('note-display');
  const editor = document.getElementById('note-editor');
  const editBtn = document.getElementById('note-edit-btn');
  const saveBtn = document.getElementById('note-save-btn');
  const cancelBtn = document.getElementById('note-cancel-btn');
  
  NOTE_EDIT_MODE = false;
  display.style.display = 'block';
  editor.style.display = 'none';
  editBtn.style.display = 'inline-flex';
  saveBtn.style.display = 'none';
  cancelBtn.style.display = 'none';
}

async function saveNote() {
  const el = document.getElementById('content');
  const path = el._selectedNote || 'memory/MEMORY.md';
  const editor = document.getElementById('note-editor');
  const saveBtn = document.getElementById('note-save-btn');
  const token = localStorage.getItem('atlas_github_token');
  
  if (!token) {
    const t = prompt('Enter your GitHub personal access token (repo scope) to save files:');
    if (!t) return;
    localStorage.setItem('atlas_github_token', t);
    return saveNote();
  }
  
  saveBtn.textContent = '⏳ Saving...';
  
  try {
    // Get current file SHA
    const metaRes = await fetch('https://api.github.com/repos/' + REPO + '/contents/' + path, {
      headers: { 'Authorization': 'token ' + token }
    });
    const meta = await metaRes.json();
    const sha = meta.sha;
    
    // Update file
    const content = btoa(unescape(encodeURIComponent(editor.value)));
    const putRes = await fetch('https://api.github.com/repos/' + REPO + '/contents/' + path, {
      method: 'PUT',
      headers: { 'Authorization': 'token ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Nathan edit: ' + path.split('/').pop(), content: content, sha: sha })
    });
    
    if (putRes.ok) {
      NOTES_CACHE[path] = editor.value;
      const display = document.getElementById('note-display');
      display.innerHTML = renderMarkdown(editor.value);
      cancelNoteEdit();
      saveBtn.textContent = '✅ Saved!';
      setTimeout(() => { saveBtn.textContent = '💾 Save'; }, 2000);
    } else {
      const err = await putRes.json();
      alert('Save failed: ' + (err.message || putRes.status));
      saveBtn.textContent = '💾 Save';
    }
  } catch (e) {
    alert('Save failed: ' + e.message);
    saveBtn.textContent = '💾 Save';
  }
}

// === FLOWS ===
function renderFlows(el) {
  const flows = [
    { name: 'Pinterest Posting', schedule: '4x daily (09/13/17/21 UTC)', status: 'active', id: 'bc621e88', desc: 'Posts next building from queue to Pinterest' },
    { name: 'Pinterest Review', schedule: 'Every 3 days', status: 'active', id: '9bfc068d', desc: 'Reviews pin performance metrics' },
    { name: 'Atlas Heartbeat', schedule: 'Every 30 min', status: 'active', id: '3aad1143', desc: 'Reviews tasks, picks up work, updates dashboard' },
    { name: 'Hourly Status', schedule: 'Every hour', status: 'active', id: '0f53741f', desc: 'Brief status update to Nathan via Telegram' },
    { name: 'Dashboard Refresh', schedule: 'Every 3 hours', status: 'active', id: 'new', desc: 'Full data refresh — metrics, summary, activity log' },
  ];
  el.innerHTML = `
    <div class="section-header"><span class="section-title">Cron Jobs</span><span class="card-subtitle">${flows.length} active</span></div>
    <div class="grid grid-2">${flows.map(f => `
      <div class="flow-card">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <span class="flow-name">${f.name}</span><span class="badge badge-success">${f.status}</span>
        </div>
        <div class="flow-schedule">⏰ ${f.schedule}</div>
        <div class="flow-meta"><span>ID: ${f.id}</span><span>·</span><span>${f.desc}</span></div>
      </div>`).join('')}</div>`;
}

// === METRICS ===
function renderMetrics(el) {
  const m = DATA.metrics || {};
  const p = DATA.pinterest || {};
  el.innerHTML = `
    <div class="section-header"><span class="section-title">Architecture Helper</span></div>
    <div class="grid grid-4" style="margin-bottom:24px">
      <div class="stat-card"><div class="stat-label">Cities</div><div class="stat-value">${m.citiesLive||0}</div><div class="stat-change">+${(m.citiesInPipeline||[]).length} pipeline</div></div>
      <div class="stat-card"><div class="stat-label">Buildings</div><div class="stat-value">${m.totalBuildings||0}</div><div class="stat-change">${m.visibleBuildings||0} visible</div></div>
      <div class="stat-card"><div class="stat-label">Users</div><div class="stat-value">${m.totalUsers||0}</div></div>
      <div class="stat-card"><div class="stat-label">PRs Merged</div><div class="stat-value">${m.prsMerged||0}</div></div>
    </div>

    <div class="section-header"><span class="section-title">Pinterest</span></div>
    <div class="grid grid-4" style="margin-bottom:24px">
      <div class="stat-card"><div class="stat-label">Pins Live</div><div class="stat-value">${m.pinterestPins||0}</div></div>
      <div class="stat-card"><div class="stat-label">Queue</div><div class="stat-value">${m.pinterestQueue||0}</div><div class="stat-change positive">~${Math.ceil((m.pinterestQueue||0)/4)}d of content</div></div>
      <div class="stat-card"><div class="stat-label">Impressions</div><div class="stat-value">${m.pinterestImpressions||0}</div></div>
      <div class="stat-card"><div class="stat-label">Saves</div><div class="stat-value">${m.pinterestSaves||0}</div></div>
    </div>

    <div class="section-header"><span class="section-title">CRE Software</span></div>
    <div class="grid grid-4" style="margin-bottom:24px">
      <div class="stat-card"><div class="stat-label">Products</div><div class="stat-value">${m.creProducts||0}</div></div>
      <div class="stat-card"><div class="stat-label">Categories</div><div class="stat-value">${m.creCategories||0}</div></div>
      <div class="stat-card"><div class="stat-label">Enriched</div><div class="stat-value">100%</div></div>
      <div class="stat-card"><div class="stat-label">SSL</div><div class="stat-value" style="color:var(--success)">✓</div></div>
    </div>

    <div class="section-header"><span class="section-title">Zoning Data</span></div>
    <div class="grid grid-4">
      <div class="stat-card"><div class="stat-label">Cities</div><div class="stat-value">${m.zoningCities||0}</div></div>
      <div class="stat-card"><div class="stat-label">Zones</div><div class="stat-value">${((m.zoningZones||0)/1000).toFixed(0)}K</div></div>
      <div class="stat-card"><div class="stat-label">Data</div><div class="stat-value">566MB</div></div>
      <div class="stat-card"><div class="stat-label">Pipeline</div><div class="stat-value">DC, Philly, Boston</div></div>
    </div>
  `;
}

// === AGENTS ORG CHART ===
function renderAgents(el) {
  const agents = DATA.agents || {
    leader: { name: 'Nathan', role: 'Founder & CEO', status: 'active', color: '#f59e0b' },
    orchestrator: { name: 'Atlas', role: 'Orchestrator', status: 'active', color: '#06b6d4' },
    teams: [
      {
        name: 'Research',
        icon: '🔍',
        agents: [
          { name: 'Scout', role: 'CRE Product Research', status: 'idle', lastRun: 'Enriched 65 products' },
          { name: 'Cartographer', role: 'City Research', status: 'idle', lastRun: 'Ranked 14 cities' },
        ]
      },
      {
        name: 'Operations',
        icon: '⚙️',
        agents: [
          { name: 'Mason', role: 'Building Submission', status: 'blocked', lastRun: 'Boston 18/18 submitted' },
          { name: 'Curator', role: 'Image Pipeline', status: 'idle', lastRun: 'Fixed 25 images to S3' },
          { name: 'Herald', role: 'Pinterest Distribution', status: 'active', lastRun: 'Pin #10 posted' },
        ]
      },
      {
        name: 'Content',
        icon: '✍️',
        agents: [
          { name: 'Scribe', role: 'Editorial & SEO Copy', status: 'idle', lastRun: 'Boston Place page' },
          { name: 'Strategist', role: 'Vision & Planning', status: 'idle', lastRun: 'Morning briefing (5 docs)' },
        ]
      },
      {
        name: 'Technical',
        icon: '🔧',
        agents: [
          { name: 'Forge', role: 'PRs & Code', status: 'idle', lastRun: 'PR #20 (thumbnails)' },
          { name: 'Indexer', role: 'SEO & Search Console', status: 'blocked', lastRun: 'Waiting on API key' },
        ]
      }
    ]
  };

  const statusDot = (s) => {
    const colors = { active: '#22c55e', idle: '#6b7280', blocked: '#ef4444', running: '#f59e0b' };
    return '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' + (colors[s]||colors.idle) + ';margin-right:6px"></span>';
  };

  const agentCard = (a, accent) => {
    const border = accent || (a.status === 'active' ? '#22c55e' : a.status === 'blocked' ? '#ef4444' : 'var(--border)');
    return '<div class="agent-card" style="border:2px solid ' + border + ';border-radius:12px;padding:16px 20px;text-align:center;min-width:140px;background:var(--surface)">'
      + statusDot(a.status)
      + '<div style="font-weight:700;font-size:15px;margin-top:8px">' + a.name + '</div>'
      + '<div style="font-size:12px;color:var(--text-muted);margin-top:2px">' + a.role + '</div>'
      + (a.lastRun ? '<div style="font-size:11px;color:var(--text-dim);margin-top:8px;font-style:italic">' + a.lastRun + '</div>' : '')
      + '</div>';
  };

  const connector = '<div style="display:flex;justify-content:center"><div style="width:2px;height:32px;background:var(--border)"></div></div>';

  let teamsHTML = agents.teams.map(team => {
    const cards = team.agents.map(a => agentCard(a)).join('');
    return '<div class="agent-team">'
      + '<div style="font-size:12px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;text-align:center">'
      + team.icon + ' ' + team.name + '</div>'
      + '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">' + cards + '</div>'
      + '</div>';
  }).join('');

  el.innerHTML = '<div class="org-chart">'
    + '<div style="display:flex;justify-content:center">' + agentCard(agents.leader, agents.leader.color) + '</div>'
    + connector
    + '<div style="display:flex;justify-content:center">' + agentCard(agents.orchestrator, agents.orchestrator.color) + '</div>'
    + connector
    + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;margin-top:8px">' + teamsHTML + '</div>'
    + '</div>'
    + '<div class="card" style="margin-top:24px">'
    + '<div class="card-header"><span class="card-title">Agent Legend</span></div>'
    + '<div style="display:flex;gap:20px;flex-wrap:wrap;padding:4px 0">'
    + '<span>' + statusDot('active') + 'Active</span>'
    + '<span>' + statusDot('running') + 'Running</span>'
    + '<span>' + statusDot('idle') + 'Idle</span>'
    + '<span>' + statusDot('blocked') + 'Blocked</span>'
    + '</div>'
    + '</div>';
}

// === CHAT ===
function renderChat(el) {
  const chatList = Object.entries(CHATS).sort((a,b) => (b[1].updated||0) - (a[1].updated||0));

  el.innerHTML = `
    <div class="split-panel">
      <div class="split-left">
        <div class="section-header">
          <span class="section-title">Conversations</span>
          <button class="btn btn-primary" style="padding:4px 10px;font-size:12px" onclick="newChat()">+ New</button>
        </div>
        <div class="note-list" id="chat-list">
          ${chatList.map(([id, chat]) => `
            <div class="note-item ${ACTIVE_CHAT===id?'active':''}" onclick="openChat('${id}')">
              <span>💬</span><span>${chat.title||'Untitled'}</span>
            </div>
          `).join('')}
          ${chatList.length===0?'<div style="color:var(--text-dim);padding:16px;font-size:13px">No conversations yet. Click + New to start.</div>':''}
        </div>
      </div>
      <div class="split-right" style="display:flex;flex-direction:column">
        <div id="chat-messages" class="chat-messages" style="flex:1;overflow-y:auto;padding:16px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg) var(--radius-lg) 0 0">
          ${ACTIVE_CHAT && CHATS[ACTIVE_CHAT] ? renderMessages(CHATS[ACTIVE_CHAT].messages||[]) : '<div style="color:var(--text-dim);padding:40px;text-align:center">Select or start a conversation</div>'}
        </div>
        <div style="display:flex;gap:8px;padding:12px;background:var(--bg-card);border:1px solid var(--border);border-top:none;border-radius:0 0 var(--radius-lg) var(--radius-lg)">
          <input type="text" id="chat-input" placeholder="${ACTIVE_CHAT?'Type a message...':'Start a new conversation first'}" 
                 ${ACTIVE_CHAT?'':'disabled'}
                 style="flex:1;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:10px 14px;color:var(--text);font-size:13px;outline:none"
                 onkeydown="if(event.key==='Enter')sendMessage()">
          <button class="btn btn-primary" onclick="sendMessage()" ${ACTIVE_CHAT?'':'disabled'}>Send</button>
        </div>
      </div>
    </div>
  `;
}

function renderMessages(messages) {
  if (!messages.length) return '<div style="color:var(--text-dim);padding:40px;text-align:center">No messages yet</div>';
  return messages.map(m => `
    <div style="margin-bottom:12px;display:flex;flex-direction:column;align-items:${m.from==='nathan'?'flex-end':'flex-start'}">
      <div style="max-width:80%;padding:10px 14px;border-radius:12px;font-size:13px;line-height:1.5;
        background:${m.from==='nathan'?'var(--accent)':'var(--bg)'};
        color:${m.from==='nathan'?'white':'var(--text)'}">
        ${m.text}
      </div>
      <span style="font-size:10px;color:var(--text-dim);margin-top:2px">${m.from==='nathan'?'Nathan':'Atlas'} · ${timeAgo(new Date(m.time))}</span>
    </div>
  `).join('');
}

function newChat() {
  const title = prompt('Conversation name:');
  if (!title) return;
  const id = 'chat_' + Date.now();
  CHATS[id] = { title, messages: [], created: Date.now(), updated: Date.now() };
  ACTIVE_CHAT = id;
  saveChats();
  renderChat(document.getElementById('content'));
}

function openChat(id) {
  ACTIVE_CHAT = id;
  localStorage.setItem('atlas_active_chat', id);
  renderChat(document.getElementById('content'));
}

function sendMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text || !ACTIVE_CHAT) return;

  CHATS[ACTIVE_CHAT].messages.push({ from: 'nathan', text, time: new Date().toISOString() });
  CHATS[ACTIVE_CHAT].updated = Date.now();
  saveChats();
  input.value = '';

  // Write to messages file for Atlas to pick up
  writeMessageForAtlas(ACTIVE_CHAT, text);

  renderChat(document.getElementById('content'));
  const msgs = document.getElementById('chat-messages');
  if (msgs) msgs.scrollTop = msgs.scrollHeight;
}

async function writeMessageForAtlas(chatId, text) {
  // Store in task-messages.json via GitHub API (if token available)
  // For now, messages are stored locally and Atlas reads them during updates
  const msgData = { chatId, title: CHATS[chatId]?.title, text, time: new Date().toISOString() };
  const existing = JSON.parse(localStorage.getItem('atlas_pending_messages') || '[]');
  existing.push(msgData);
  localStorage.setItem('atlas_pending_messages', JSON.stringify(existing));
}

function saveChats() {
  localStorage.setItem('atlas_chats', JSON.stringify(CHATS));
  localStorage.setItem('atlas_active_chat', ACTIVE_CHAT);
}

// === WAITING ITEM EXPAND ===
function toggleWaiting(i) {
  const detail = document.getElementById('waiting-detail-' + i);
  const chevron = document.getElementById('waiting-chevron-' + i);
  if (!detail) return;
  const open = detail.style.display !== 'none';
  detail.style.display = open ? 'none' : 'block';
  chevron.textContent = open ? '▸' : '▾';
}

// === MARKDOWN RENDERER ===
function renderMarkdown(text) {
  if (!text) return '';
  let html = text
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre style="background:var(--bg);padding:12px;border-radius:var(--radius);overflow-x:auto;font-size:12px;margin:12px 0"><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code style="background:var(--bg);padding:2px 6px;border-radius:4px;font-size:12px">$1</code>')
    // Headers
    .replace(/^#### (.+)$/gm, '<h4 style="font-size:14px;font-weight:600;margin:16px 0 8px;color:var(--text)">$1</h4>')
    .replace(/^### (.+)$/gm, '<h3 style="font-size:15px;font-weight:600;margin:20px 0 8px;color:var(--text)">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:17px;font-weight:700;margin:24px 0 10px;color:var(--text)">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:20px;font-weight:700;margin:24px 0 12px;color:var(--text)">$1</h1>')
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color:var(--accent)">$1</a>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid var(--border);margin:16px 0">')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li style="margin:4px 0;list-style:disc;margin-left:20px">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li style="margin:4px 0;list-style:decimal;margin-left:20px">$1</li>')
    // Tables (basic)
    .replace(/^\|(.+)\|$/gm, (match, content) => {
      const cells = content.split('|').map(c => c.trim());
      if (cells.every(c => /^[-:]+$/.test(c))) return '';
      return '<tr>' + cells.map(c => '<td style="padding:6px 10px;border-bottom:1px solid var(--border)">' + c + '</td>').join('') + '</tr>';
    })
    // Paragraphs
    .replace(/\n\n/g, '</p><p style="margin:8px 0;line-height:1.6">')
    // Line breaks
    .replace(/\n/g, '<br>');
  
  // Wrap tables
  html = html.replace(/(<tr>[\s\S]*?<\/tr>)/g, '<table style="width:100%;border-collapse:collapse;font-size:13px;margin:12px 0">$1</table>');
  
  return '<div style="line-height:1.6;color:var(--text)">' + html + '</div>';
}

// === UTILITIES ===
function timeAgo(date) {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return Math.floor(secs/60) + 'm ago';
  if (secs < 86400) return Math.floor(secs/3600) + 'h ago';
  return Math.floor(secs/86400) + 'd ago';
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// === CONTENT QUEUE ===
function renderContent(el) {
  const q = CONTENT_Q.queue || [];
  const accounts = CONTENT_Q.accounts || {};
  const analytics = CONTENT_Q.analytics || [];
  const learnings = CONTENT_Q.learnings || [];

  // Group by account
  const byAccount = {};
  q.forEach(item => {
    if (!byAccount[item.account]) byAccount[item.account] = [];
    byAccount[item.account].push(item);
  });

  // Pinterest stats
  const pinQueue = (PINS.queue || []).length;
  const pinPublished = (PINS.published || []).length;

  const statusColors = {
    draft: '#6b7280',
    ready: '#3b82f6',
    posted: '#10b981',
    rejected: '#ef4444'
  };
  const statusLabels = {
    draft: '📝 Draft',
    ready: '🟢 Ready to Post',
    posted: '✅ Posted',
    rejected: '❌ Rejected'
  };

  let html = '<div style="max-width:900px;margin:0 auto;">';

  // Summary cards
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:32px;">';
  const readyCount = q.filter(i => i.status === 'ready').length;
  const draftCount = q.filter(i => i.status === 'draft').length;
  const postedCount = q.filter(i => i.status === 'posted').length;
  html += `<div style="background:#1a1a2e;border-radius:12px;padding:20px;text-align:center;">
    <div style="font-size:32px;font-weight:700;color:#3b82f6;">${readyCount}</div>
    <div style="color:#9ca3af;font-size:13px;">Ready for Nathan</div>
  </div>`;
  html += `<div style="background:#1a1a2e;border-radius:12px;padding:20px;text-align:center;">
    <div style="font-size:32px;font-weight:700;color:#6b7280;">${draftCount}</div>
    <div style="color:#9ca3af;font-size:13px;">Drafts</div>
  </div>`;
  html += `<div style="background:#1a1a2e;border-radius:12px;padding:20px;text-align:center;">
    <div style="font-size:32px;font-weight:700;color:#10b981;">${pinQueue}</div>
    <div style="color:#9ca3af;font-size:13px;">Pinterest Queued</div>
  </div>`;
  html += `<div style="background:#1a1a2e;border-radius:12px;padding:20px;text-align:center;">
    <div style="font-size:32px;font-weight:700;color:#f59e0b;">${postedCount + pinPublished}</div>
    <div style="color:#9ca3af;font-size:13px;">Total Posted</div>
  </div>`;
  html += '</div>';

  // Account sections
  Object.entries(accounts).forEach(([key, acct]) => {
    const items = byAccount[key] || [];
    const icon = acct.platform === 'pinterest' ? '📌' : '𝕏';
    const autoTag = acct.auto_post
      ? '<span style="background:#10b981;color:#fff;padding:2px 8px;border-radius:8px;font-size:11px;margin-left:8px;">AUTO</span>'
      : '<span style="background:#3b82f6;color:#fff;padding:2px 8px;border-radius:8px;font-size:11px;margin-left:8px;">NATHAN</span>';

    html += `<div style="background:#1a1a2e;border-radius:12px;padding:24px;margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
        <span style="font-size:20px;">${icon}</span>
        <h3 style="margin:0;font-size:18px;">${acct.name}</h3>
        ${autoTag}
      </div>
      <div style="color:#6b7280;font-size:12px;margin-bottom:16px;font-style:italic;">Voice: ${acct.voice.substring(0, 100)}...</div>`;

    if (acct.platform === 'pinterest') {
      html += `<div style="color:#9ca3af;">
        <strong>${pinQueue}</strong> pins queued (auto-posting 4x daily) &middot;
        <strong>${pinPublished}</strong> published
      </div>`;
    } else if (items.length === 0) {
      html += '<div style="color:#6b7280;padding:12px 0;">No content queued yet</div>';
    } else {
      items.forEach(item => {
        const color = statusColors[item.status] || '#6b7280';
        const label = statusLabels[item.status] || item.status;
        html += `<div style="border:1px solid #2a2a3e;border-radius:8px;padding:16px;margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span style="color:${color};font-size:13px;font-weight:600;">${label}</span>
            <span style="color:#6b7280;font-size:12px;">${item.created}</span>
          </div>
          <div style="background:#0f0f1a;border-radius:6px;padding:12px;font-size:14px;line-height:1.6;white-space:pre-wrap;color:#e5e7eb;">${item.content}</div>`;
        if (item.notes) {
          html += `<div style="margin-top:8px;color:#6b7280;font-size:12px;">💡 ${item.notes}</div>`;
        }
        if (item.feedback) {
          html += `<div style="margin-top:8px;padding:8px;background:#1e3a2e;border-radius:6px;color:#86efac;font-size:13px;">📣 Nathan: ${item.feedback}</div>`;
        }
        html += '</div>';
      });
    }
    html += '</div>';
  });

  // Analytics section
  html += `<div style="background:#1a1a2e;border-radius:12px;padding:24px;margin-bottom:20px;">
    <h3 style="margin:0 0 12px;">📊 Analytics & Learnings</h3>
    <p style="color:#9ca3af;font-size:14px;">Send Atlas screenshots of post analytics — he'll track engagement metrics and use them to improve future content.</p>
    <p style="color:#6b7280;font-size:13px;">Learnings so far:</p>`;
  if (learnings.length === 0) {
    html += '<div style="color:#4b5563;font-size:13px;padding:8px 0;">No learnings yet — post some content and share results!</div>';
  } else {
    learnings.forEach(l => {
      html += `<div style="padding:6px 0;color:#d1d5db;font-size:13px;">• ${l}</div>`;
    });
  }
  html += '</div>';

  // How it works
  html += `<div style="background:#1a1a2e;border-radius:12px;padding:24px;">
    <h3 style="margin:0 0 12px;">🔄 How This Works</h3>
    <div style="color:#9ca3af;font-size:14px;line-height:1.8;">
      <strong>Pinterest</strong> → Atlas auto-posts 4x daily. No action needed.<br>
      <strong>X Posts</strong> → Atlas drafts content → Nathan reviews here → Posts manually → Shares analytics screenshot → Atlas learns & improves.<br><br>
      <strong>Feedback loop:</strong> Tell Atlas "I changed the wording to X" or "this one got 50 likes" — he'll update the queue and adjust future content.
    </div>
  </div>`;

  html += '</div>';
  el.innerHTML = html;
}

// === MOBILE MENU ===
document.getElementById('mobile-menu').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});
document.querySelectorAll('.nav-item').forEach(el => {
  el.addEventListener('click', () => document.getElementById('sidebar').classList.remove('open'));
});

// === INIT ===
window.addEventListener('hashchange', navigate);
loadData().then(() => navigate());
setInterval(async () => { await loadData(); navigate(); }, 300000);
