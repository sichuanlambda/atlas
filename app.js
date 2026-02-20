// === Atlas Control Center ===
const REPO = 'sichuanlambda/atlas';
const AH_URL = 'https://app.architecturehelper.com';
const CRE_URL = 'https://cresoftware.tech';

let DATA = {};
let TASKS = [];
let PINS = {};
let CONTENT_Q = {};
let USAGE_DATA = {};
let FS_DATA = {};
let COST_DATA = {};
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
  '/analytics': { title: 'Analytics', render: renderAnalytics },
  '/cron': { title: 'Agents & Cron', render: renderCron },
  '/content': { title: 'Content Hub', render: renderContent },
  '/usage': { title: 'Usage & Costs', render: renderUsage },
  '/filesystem': { title: 'File System', render: renderFilesystem },
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
    const [dataRes, tasksRes, pinsRes, contentRes, usageRes, fsRes, costRes] = await Promise.all([
      fetch('data.json?' + Date.now()),
      fetch('tasks.json?' + Date.now()),
      fetch('memory/pinterest-pins.json?' + Date.now()).catch(() => null),
      fetch('content-queue.json?' + Date.now()).catch(() => null),
      fetch('usage-data.json?' + Date.now()).catch(() => null),
      fetch('filesystem-data.json?' + Date.now()).catch(() => null),
      fetch('cost-data.json?' + Date.now()).catch(() => null),
    ]);
    DATA = await dataRes.json();
    TASKS = (await tasksRes.json()).tasks || [];
    if (pinsRes && pinsRes.ok) PINS = await pinsRes.json();
    if (contentRes && contentRes.ok) CONTENT_Q = await contentRes.json();
    if (usageRes && usageRes.ok) USAGE_DATA = await usageRes.json();
    if (fsRes && fsRes.ok) FS_DATA = await fsRes.json();
    if (costRes && costRes.ok) COST_DATA = await costRes.json();
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

    <div class="grid grid-4" style="margin-bottom:24px">
      <div class="stat-card">
        <div class="stat-label">Cost Today</div>
        <div class="stat-value" style="color:#ef4444;">$${(() => {
          if (!COST_DATA.daily || !COST_DATA.daily[0]) return '0.00';
          const today = COST_DATA.daily[0];
          return Object.values(today.models).reduce((sum, m) => sum + m.cost_usd, 0).toFixed(2);
        })()}</div>
        <div class="stat-change"><a href="#/analytics" style="color:#3b82f6;text-decoration:none;">View Analytics →</a></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Active Agents</div>
        <div class="stat-value" style="color:#22c55e;">${COST_DATA.agents ? COST_DATA.agents.length : 0}</div>
        <div class="stat-change"><a href="#/cron" style="color:#3b82f6;text-decoration:none;">Manage →</a></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Cron Jobs</div>
        <div class="stat-value">${COST_DATA.cron_jobs ? COST_DATA.cron_jobs.filter(j => j.status === 'active').length : 0}/${COST_DATA.cron_jobs ? COST_DATA.cron_jobs.length : 0}</div>
        <div class="stat-change">Active/Total</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Monthly Est.</div>
        <div class="stat-value" style="color:#8b5cf6;">$${(() => {
          if (!COST_DATA.daily || COST_DATA.daily.length === 0) return '0';
          const avgDaily = COST_DATA.daily.slice(0, 7).reduce((sum, day) => 
            sum + Object.values(day.models).reduce((s, m) => s + m.cost_usd, 0), 0) / Math.min(7, COST_DATA.daily.length);
          return (avgDaily * 30).toFixed(0);
        })()}</div>
        <div class="stat-change">7-day avg</div>
      </div>
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

function renderLatestSection(projectKey) {
  const latest = (DATA.projectLatest || {})[projectKey];
  if (!latest || !latest.items?.length) return '';
  const typeStyles = {
    milestone: { icon: '🏆', color: '#f59e0b', label: 'Milestone' },
    builds: { icon: '🔨', color: '#3b82f6', label: 'Shipped' },
    fix: { icon: '🔧', color: '#10b981', label: 'Fix' },
    content: { icon: '✍️', color: '#8b5cf6', label: 'Content' },
    automation: { icon: '⚡', color: '#06b6d4', label: 'Automation' },
    pending: { icon: '⏳', color: '#f97316', label: 'Pending' },
    decision: { icon: '🎯', color: '#ec4899', label: 'Decision' },
    learning: { icon: '💡', color: '#eab308', label: 'Learning' },
    idea: { icon: '💭', color: '#a78bfa', label: 'Idea' },
    stats: { icon: '📊', color: '#6b7280', label: 'Stats' }
  };
  const rows = latest.items.map(item => {
    const s = typeStyles[item.type] || typeStyles.stats;
    const dateTag = item.date ? `<span style="color:var(--text-dim);font-size:11px;margin-left:auto;white-space:nowrap;">${item.date}</span>` : '';
    return `<div style="display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
      <span style="font-size:14px;flex-shrink:0;margin-top:1px;">${s.icon}</span>
      <div style="flex:1;min-width:0;">
        <span style="display:inline-block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:${s.color};background:${s.color}18;padding:2px 6px;border-radius:4px;margin-bottom:4px;">${s.label}</span>
        <div style="font-size:13px;color:var(--text);line-height:1.5;">${item.text}</div>
      </div>
      ${dateTag}
    </div>`;
  }).join('');
  const updatedStr = latest.updated ? new Date(latest.updated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
  return `<div class="card" style="margin-top:16px;">
    <div class="card-header">
      <span class="card-title">🔄 Latest Activity</span>
      <span class="card-subtitle">Updated ${updatedStr}</span>
    </div>
    ${latest.summary ? `<div style="font-size:14px;color:var(--text);padding:0 0 12px;line-height:1.6;font-weight:500;">${latest.summary}</div>` : ''}
    <div>${rows}</div>
  </div>`;
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
        <span class="card-title">🤖 Involved Agents & Models</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:12px;padding:4px 0;">
        ${(() => {
          if (!COST_DATA.agents) return '<span style="color:#6b7280;font-size:12px;">Loading agent data...</span>';
          const relevantAgents = COST_DATA.agents.filter(a => 
            a.id === 'sub_building' || a.id === 'cron_pinterest' || a.id === 'cron_content' || a.id === 'main'
          );
          return relevantAgents.map(agent => {
            const model = COST_DATA.models[agent.model];
            if (!model) return '';
            return '<div style="display:flex;align-items:center;gap:8px;background:#0d1117;border-radius:8px;padding:8px 12px;border:1px solid #2a2a3e;">' +
              '<span style="background:' + model.color + '22;color:' + model.color + ';padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600;">' + model.label.split(' ')[1] + '</span>' +
              '<span style="color:#e5e7eb;font-size:12px;font-weight:500;">' + agent.name + '</span>' +
              '<div style="color:#9ca3af;font-size:11px;">' + agent.description + '</div>' +
            '</div>';
          }).join('');
        })()}
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
    ${renderLatestSection('architecture-helper')}
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
    ${renderLatestSection('cre-software')}
    <div class="card" style="margin-top:16px"><div class="card-header"><span class="card-title">Links</span></div>
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
    </div>
    ${renderLatestSection('plotzy')}`;
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
          <a href="#/cron" class="flow-name" style="color:#3b82f6;text-decoration:none;font-weight:600;">${f.name}</a><span class="badge badge-success">${f.status}</span>
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
  const drafts = CONTENT_Q.drafts || [];
  const pinQueue = (PINS.queue || []).length;
  const pinPublished = (PINS.published || []).length;

  const statusColors = { draft: '#6b7280', scheduled: '#3b82f6', published: '#10b981', publishing: '#f59e0b', error: '#ef4444' };
  const statusIcons = { draft: '📝', scheduled: '🕐', published: '✅', publishing: '⏳', error: '❌' };

  // Group by status for board columns
  const byStatus = { draft: [], scheduled: [], published: [] };
  drafts.forEach(d => {
    const s = d.status || 'draft';
    if (!byStatus[s]) byStatus[s] = [];
    byStatus[s].push(d);
  });

  const totalPosts = drafts.length;
  const threadCount = drafts.filter(d => d.is_thread).length;
  const imageCount = drafts.reduce((sum, d) => sum + (d.image_count || 0), 0);

  let html = '<div style="max-width:1200px;margin:0 auto;">';

  // Compact summary row
  html += '<div style="display:flex;gap:16px;margin-bottom:20px;flex-wrap:wrap;align-items:center;">';
  html += `<span style="color:#9ca3af;font-size:13px;">${totalPosts} posts</span>`;
  html += `<span style="color:#9ca3af;font-size:13px;">🧵 ${threadCount} threads</span>`;
  html += `<span style="color:#9ca3af;font-size:13px;">🖼 ${imageCount} images</span>`;
  html += `<span style="color:#9ca3af;font-size:13px;">📌 ${pinQueue} pins queued</span>`;
  html += '</div>';

  // Board view: 3 columns
  html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;align-items:start;">';

  function renderColumn(title, color, icon, items) {
    let col = `<div>
      <div style="background:${color}22;border-radius:10px 10px 0 0;padding:12px 16px;border-bottom:2px solid ${color};display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:14px;font-weight:700;color:${color};">${icon} ${title}</span>
        <span style="background:${color}33;color:${color};padding:2px 8px;border-radius:10px;font-size:12px;font-weight:600;">${items.length}</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;padding-top:8px;">`;

    if (items.length === 0) {
      col += '<div style="padding:20px;text-align:center;color:#4b5563;font-size:13px;">Empty</div>';
    }

    items.forEach(draft => {
      const acctColor = draft.account?.includes('CRE') ? '#f59e0b' : '#1d9bf0';
      const acctLabel = draft.account?.includes('CRE') ? 'CRE' : 'AH';
      const threadBadge = draft.is_thread ? `<span style="background:#8b5cf622;color:#8b5cf6;padding:1px 6px;border-radius:6px;font-size:10px;">🧵${draft.post_count}</span>` : '';
      const imgBadge = draft.image_count > 0 ? `<span style="background:#3b82f622;color:#60a5fa;padding:1px 6px;border-radius:6px;font-size:10px;">🖼${draft.image_count}</span>` : '';

      // First post text preview
      const firstPost = (draft.posts || [])[0];
      const preview = firstPost ? firstPost.text.substring(0, 120).replace(/\n/g, ' ') + (firstPost.text.length > 120 ? '...' : '') : '';

      col += `<div style="background:#1a1a2e;border-radius:10px;padding:14px;border:1px solid #2a2a3e;cursor:pointer;" ${draft.private_url ? `onclick="window.open('${draft.private_url}','_blank')"` : ''}>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <div style="display:flex;gap:4px;align-items:center;">
            <span style="background:${acctColor}22;color:${acctColor};padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700;">${acctLabel}</span>
            ${threadBadge}${imgBadge}
          </div>
          <span style="color:#4b5563;font-size:11px;">${draft.created || ''}</span>
        </div>`;

      if (draft.title) {
        col += `<div style="font-size:12px;font-weight:600;color:#d1d5db;margin-bottom:6px;">${draft.title}</div>`;
      }

      col += `<div style="font-size:12px;color:#9ca3af;line-height:1.5;">${preview}</div>`;
      col += '</div>';
    });

    col += '</div></div>';
    return col;
  }

  html += renderColumn('Drafts', '#6b7280', '📝', byStatus.draft || []);
  html += renderColumn('Scheduled', '#3b82f6', '🕐', byStatus.scheduled || []);
  html += renderColumn('Published', '#10b981', '✅', byStatus.published || []);

  html += '</div>';

  // Pinterest row
  html += `<div style="background:#1a1a2e;border-radius:12px;padding:16px;margin-top:20px;display:flex;justify-content:space-between;align-items:center;">
    <div style="display:flex;align-items:center;gap:8px;">
      <span style="font-size:16px;">📌</span>
      <span style="font-size:14px;color:#e5e7eb;">Pinterest</span>
    </div>
    <div style="color:#9ca3af;font-size:13px;">
      <strong>${pinQueue}</strong> queued &middot; <strong>${pinPublished}</strong> published &middot; 4x daily auto-post
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

// === USAGE & COSTS ===
function renderUsage(el) {
  const u = USAGE_DATA;
  if (!u.cron_jobs) { el.innerHTML = '<p style="color:#6b7280;">Loading usage data...</p>'; return; }

  const cronTotal = u.totals?.daily_cron || 0;
  const interactiveTotal = u.interactive_estimate?.daily_cost_estimate || 0;
  const subagentTotal = u.subagent_estimate?.daily_cost_estimate || 0;
  const dailyTotal = u.totals?.daily_total || 0;
  const monthlyTotal = u.totals?.monthly_total || 0;

  let html = '<div style="max-width:900px;margin:0 auto;">';

  // Summary cards
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:28px;">';
  html += `<div style="background:#1a1a2e;border-radius:12px;padding:18px;text-align:center;">
    <div style="font-size:24px;font-weight:700;color:#ef4444;">$${dailyTotal.toFixed(0)}</div>
    <div style="color:#9ca3af;font-size:12px;">Est. Daily</div></div>`;
  html += `<div style="background:#1a1a2e;border-radius:12px;padding:18px;text-align:center;">
    <div style="font-size:24px;font-weight:700;color:#f59e0b;">$${monthlyTotal.toFixed(0)}</div>
    <div style="color:#9ca3af;font-size:12px;">Est. Monthly</div></div>`;
  html += `<div style="background:#1a1a2e;border-radius:12px;padding:18px;text-align:center;">
    <div style="font-size:24px;font-weight:700;color:#3b82f6;">$${cronTotal.toFixed(0)}</div>
    <div style="color:#9ca3af;font-size:12px;">Cron/Day</div></div>`;
  html += `<div style="background:#1a1a2e;border-radius:12px;padding:18px;text-align:center;">
    <div style="font-size:24px;font-weight:700;color:#8b5cf6;">$${interactiveTotal.toFixed(0)}</div>
    <div style="color:#9ca3af;font-size:12px;">Interactive/Day</div></div>`;
  html += `<div style="background:#1a1a2e;border-radius:12px;padding:18px;text-align:center;">
    <div style="font-size:24px;font-weight:700;color:#10b981;">$${subagentTotal.toFixed(0)}</div>
    <div style="color:#9ca3af;font-size:12px;">Sub-agents/Day</div></div>`;
  html += '</div>';

  // Cost breakdown bar
  const total = cronTotal + interactiveTotal + subagentTotal;
  const cronPct = total > 0 ? (cronTotal / total * 100) : 0;
  const intPct = total > 0 ? (interactiveTotal / total * 100) : 0;
  const subPct = total > 0 ? (subagentTotal / total * 100) : 0;
  html += `<div style="background:#1a1a2e;border-radius:12px;padding:20px;margin-bottom:20px;">
    <h3 style="margin:0 0 12px;font-size:15px;color:#fff;">Daily Cost Breakdown</h3>
    <div style="display:flex;border-radius:6px;overflow:hidden;height:24px;margin-bottom:12px;">
      <div style="width:${cronPct}%;background:#3b82f6;" title="Cron: $${cronTotal.toFixed(2)}"></div>
      <div style="width:${intPct}%;background:#8b5cf6;" title="Interactive: $${interactiveTotal.toFixed(2)}"></div>
      <div style="width:${subPct}%;background:#10b981;" title="Sub-agents: $${subagentTotal.toFixed(2)}"></div>
    </div>
    <div style="display:flex;gap:16px;flex-wrap:wrap;">
      <span style="font-size:12px;color:#9ca3af;"><span style="color:#3b82f6;">●</span> Cron ${cronPct.toFixed(0)}%</span>
      <span style="font-size:12px;color:#9ca3af;"><span style="color:#8b5cf6;">●</span> Interactive ${intPct.toFixed(0)}%</span>
      <span style="font-size:12px;color:#9ca3af;"><span style="color:#10b981;">●</span> Sub-agents ${subPct.toFixed(0)}%</span>
    </div>
  </div>`;

  // Cron job table
  html += `<div style="background:#1a1a2e;border-radius:12px;padding:20px;margin-bottom:20px;">
    <h3 style="margin:0 0 16px;font-size:15px;color:#fff;">Cron Job Costs</h3>
    <div style="overflow-x:auto;">
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
    <thead><tr style="border-bottom:1px solid #2a2a3e;">
      <th style="text-align:left;padding:8px;color:#9ca3af;">Job</th>
      <th style="text-align:left;padding:8px;color:#9ca3af;">Frequency</th>
      <th style="text-align:right;padding:8px;color:#9ca3af;">Runs/Day</th>
      <th style="text-align:right;padding:8px;color:#9ca3af;">$/Day</th>
      <th style="text-align:right;padding:8px;color:#9ca3af;">$/Month</th>
    </tr></thead><tbody>`;

  u.cron_jobs.sort((a, b) => b.daily_cost - a.daily_cost).forEach(job => {
    const isHot = job.daily_cost > 5;
    html += `<tr style="border-bottom:1px solid #1a1a2e;">
      <td style="padding:8px;color:#e5e7eb;">${job.name} ${isHot ? '🔥' : ''}</td>
      <td style="padding:8px;color:#9ca3af;">${job.freq}</td>
      <td style="padding:8px;text-align:right;color:#9ca3af;">${job.runs_per_day}</td>
      <td style="padding:8px;text-align:right;color:${isHot ? '#ef4444' : '#e5e7eb'};">$${job.daily_cost.toFixed(2)}</td>
      <td style="padding:8px;text-align:right;color:${isHot ? '#ef4444' : '#e5e7eb'};">$${job.monthly_cost.toFixed(2)}</td>
    </tr>`;
  });
  html += '</tbody></table></div></div>';

  // Model info
  html += `<div style="background:#1a1a2e;border-radius:12px;padding:20px;margin-bottom:20px;">
    <h3 style="margin:0 0 12px;font-size:15px;color:#fff;">Model & Pricing</h3>
    <div style="color:#9ca3af;font-size:13px;line-height:1.8;">
      <strong style="color:#e5e7eb;">Model:</strong> ${u.model || 'claude-opus-4'}<br>
      <strong style="color:#e5e7eb;">Input:</strong> $${u.pricing?.input_per_1m}/1M tokens<br>
      <strong style="color:#e5e7eb;">Output:</strong> $${u.pricing?.output_per_1m}/1M tokens<br>
      <strong style="color:#e5e7eb;">Cache Read:</strong> $${u.pricing?.cache_read_per_1m}/1M tokens
    </div>
  </div>`;

  // Optimization notes
  if (u.optimization_notes?.length) {
    html += `<div style="background:#1a1a2e;border-radius:12px;padding:20px;">
      <h3 style="margin:0 0 12px;font-size:15px;color:#fff;">💡 Optimization Ideas</h3>`;
    u.optimization_notes.forEach(note => {
      html += `<div style="padding:6px 0;color:#d1d5db;font-size:13px;">• ${note}</div>`;
    });
    html += '</div>';
  }

  html += '</div>';
  el.innerHTML = html;
}

// === FILE SYSTEM ===
function fsSection(id, icon, title, count, content, startOpen) {
  const open = startOpen ? 'true' : 'false';
  return `<div style="background:#1a1a2e;border-radius:12px;margin-bottom:20px;overflow:hidden;">
    <div onclick="toggleFsSection('${id}')" style="padding:20px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;user-select:none;">
      <h3 style="margin:0;font-size:15px;color:#fff;">${icon} ${title}${count != null ? ' (' + count + ')' : ''}</h3>
      <span id="${id}-arrow" style="color:#6b7280;font-size:18px;transition:transform 0.2s;transform:rotate(${startOpen ? '180' : '0'}deg);">▼</span>
    </div>
    <div id="${id}-body" style="padding:0 20px 20px;display:${startOpen ? 'block' : 'none'};">${content}</div>
  </div>`;
}

window.toggleFsSection = function(id) {
  const body = document.getElementById(id + '-body');
  const arrow = document.getElementById(id + '-arrow');
  if (!body) return;
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : 'block';
  arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
};

window.viewFile = function(name, path) {
  const modal = document.getElementById('fs-file-modal');
  const title = document.getElementById('fs-file-title');
  const content = document.getElementById('fs-file-content');
  if (!modal) return;
  title.textContent = name;
  content.textContent = 'Loading...';
  modal.style.display = 'flex';
  // Load from filesystem-contents using -- as path separator
  const fullPath = path || name;
  const flatName = fullPath.replace(/\//g, '--');
  fetch('filesystem-contents/' + flatName + '?' + Date.now())
    .then(r => r.ok ? r.text() : Promise.reject())
    .then(text => { content.textContent = text; })
    .catch(() => { content.textContent = '(File contents not available. Path: ' + fullPath + ')'; });
};

window.closeFsModal = function() {
  const modal = document.getElementById('fs-file-modal');
  if (modal) modal.style.display = 'none';
};

function fsFileItem(name, desc, path) {
  const p = path || name;
  return `<div onclick="viewFile('${name.replace(/'/g,"\\'")}','${p.replace(/'/g,"\\'")}')" style="background:#0d1117;border-radius:8px;padding:12px;border:1px solid #2a2a3e;cursor:pointer;transition:border-color 0.2s;" onmouseover="this.style.borderColor='#3b82f6'" onmouseout="this.style.borderColor='#2a2a3e'">
    <div style="font-size:13px;font-weight:600;color:#e5e7eb;">📄 ${name}</div>
    ${desc ? `<div style="font-size:11px;color:#6b7280;margin-top:4px;">${desc}</div>` : ''}
  </div>`;
}

function renderFilesystem(el) {
  const fs = FS_DATA;
  if (!fs.workspace) { el.innerHTML = '<p style="color:#6b7280;">Loading filesystem data...</p>'; return; }

  let html = '<div style="max-width:900px;margin:0 auto;">';

  // Modal for file viewing
  html += `<div id="fs-file-modal" onclick="if(event.target===this)closeFsModal()" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:1000;align-items:center;justify-content:center;padding:20px;">
    <div style="background:#0d1117;border:1px solid #2a2a3e;border-radius:12px;max-width:800px;width:100%;max-height:80vh;display:flex;flex-direction:column;">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #2a2a3e;">
        <h3 id="fs-file-title" style="margin:0;font-size:14px;color:#e5e7eb;">File</h3>
        <button onclick="closeFsModal()" style="background:none;border:none;color:#6b7280;font-size:20px;cursor:pointer;padding:0 4px;">✕</button>
      </div>
      <pre id="fs-file-content" style="margin:0;padding:20px;overflow:auto;flex:1;font-size:12px;color:#d1d5db;line-height:1.6;white-space:pre-wrap;word-break:break-word;"></pre>
    </div>
  </div>`;

  // Core System Files — open by default
  let coreHtml = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;">';
  (fs.workspace || []).forEach(f => { coreHtml += fsFileItem(f.name, f.desc, 'workspace/' + f.name); });
  coreHtml += '</div>';
  html += fsSection('fs-core', '🏛️', 'Core System Files', (fs.workspace||[]).length, coreHtml, true);

  // Skills
  const activeSkills = ['humanizer', 'blogwatcher', 'coding-agent', 'healthcheck', 'skill-creator', 'tmux', 'weather', 'underwriting'];
  let skillsHtml = '<p style="color:#6b7280;font-size:12px;margin:0 0 12px;">Installed OpenClaw skills</p><div style="display:flex;flex-wrap:wrap;gap:6px;">';
  (fs.skills || []).forEach(s => {
    const isActive = activeSkills.includes(s.name);
    const bg = isActive ? '#1e3a5e' : '#0d1117';
    const border = isActive ? '#3b82f6' : '#2a2a3e';
    const color = isActive ? '#60a5fa' : '#6b7280';
    skillsHtml += `<span style="background:${bg};border:1px solid ${border};border-radius:6px;padding:4px 10px;font-size:12px;color:${color};cursor:pointer;" onclick="viewFile('${s.name}/SKILL.md','skills/${s.name}/SKILL.md')">${s.name}</span>`;
  });
  skillsHtml += '</div>';
  html += fsSection('fs-skills', '🧩', 'Skills', `${fs.skills_ready}/${fs.skills_count}`, skillsHtml, false);

  // Agent configs
  let agentHtml = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;">';
  (fs.agent_configs || []).forEach(f => {
    const icon = f.name === 'mason.md' ? '🧱' : f.name === 'scout.md' ? '🔍' : f.name === 'scribe.md' ? '✍️' : '📄';
    agentHtml += `<div onclick="viewFile('${f.name.replace(/'/g,"\\'")}','agents/${f.name}')" style="background:#0d1117;border-radius:8px;padding:12px;border:1px solid #2a2a3e;cursor:pointer;transition:border-color 0.2s;" onmouseover="this.style.borderColor='#3b82f6'" onmouseout="this.style.borderColor='#2a2a3e'">
      <div style="font-size:13px;font-weight:600;color:#e5e7eb;">${icon} ${f.name}</div>
    </div>`;
  });
  agentHtml += '</div>';
  html += fsSection('fs-agents', '🤖', 'Agent Configs', (fs.agent_configs||[]).length, agentHtml, false);

  // Memory files
  const memFiles = fs.memory_files || [];
  const dailyLogs = memFiles.filter(f => f.name && f.name.match(/^\d{4}-\d{2}-\d{2}/));
  const reports = memFiles.filter(f => f.name && !f.name.match(/^\d{4}-\d{2}-\d{2}/) && f.type === 'file');
  const dirs = memFiles.filter(f => f.type === 'dir');

  let memHtml = '<p style="color:#6b7280;font-size:12px;margin:0 0 12px;">Daily logs, research, reports, and tracking data</p><div style="max-height:400px;overflow-y:auto;">';

  if (dailyLogs.length) {
    memHtml += '<div style="margin-bottom:12px;"><div style="font-size:12px;font-weight:600;color:#9ca3af;margin-bottom:6px;">📅 Daily Logs</div>';
    dailyLogs.slice(-7).reverse().forEach(f => {
      const sizeKB = f.size ? (f.size / 1024).toFixed(1) + 'KB' : '';
      memHtml += `<div onclick="viewFile('${f.name}','memory/${f.name}')" style="padding:4px 8px;font-size:12px;color:#d1d5db;display:flex;justify-content:space-between;cursor:pointer;border-radius:4px;transition:background 0.15s;" onmouseover="this.style.background='#1e1e3e'" onmouseout="this.style.background='none'">
        <span>📝 ${f.name}</span><span style="color:#6b7280;">${sizeKB}</span></div>`;
    });
    memHtml += '</div>';
  }

  if (dirs.length) {
    dirs.forEach(d => {
      memHtml += `<div style="margin-bottom:12px;"><div style="font-size:12px;font-weight:600;color:#9ca3af;margin-bottom:6px;">📁 ${d.name}/ (${d.count} files)</div>`;
      (d.children || []).slice(0, 10).forEach(f => {
        memHtml += `<div onclick="viewFile('${f.name}','memory/${d.name}/${f.name}')" style="padding:4px 8px 4px 16px;font-size:12px;color:#d1d5db;cursor:pointer;border-radius:4px;transition:background 0.15s;" onmouseover="this.style.background='#1e1e3e'" onmouseout="this.style.background='none'">📄 ${f.name}</div>`;
      });
      memHtml += '</div>';
    });
  }

  if (reports.length) {
    memHtml += '<div style="margin-bottom:12px;"><div style="font-size:12px;font-weight:600;color:#9ca3af;margin-bottom:6px;">📊 Reports & Research</div>';
    reports.forEach(f => {
      const sizeKB = f.size ? (f.size / 1024).toFixed(1) + 'KB' : '';
      memHtml += `<div onclick="viewFile('${f.name}','memory/${f.name}')" style="padding:4px 8px;font-size:12px;color:#d1d5db;display:flex;justify-content:space-between;cursor:pointer;border-radius:4px;transition:background 0.15s;" onmouseover="this.style.background='#1e1e3e'" onmouseout="this.style.background='none'">
        <span>📄 ${f.name}</span><span style="color:#6b7280;">${sizeKB}</span></div>`;
    });
    memHtml += '</div>';
  }

  memHtml += '</div>';
  html += fsSection('fs-memory', '🧠', 'Memory Files', memFiles.length, memHtml, false);

  // Runbooks
  if (fs.runbooks?.length) {
    let rbHtml = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;">';
    fs.runbooks.forEach(f => {
      rbHtml += `<div onclick="viewFile('${f.name}','memory/runbooks/${f.name}')" style="background:#0d1117;border-radius:8px;padding:12px;border:1px solid #2a2a3e;cursor:pointer;transition:border-color 0.2s;" onmouseover="this.style.borderColor='#3b82f6'" onmouseout="this.style.borderColor='#2a2a3e'">
        <div style="font-size:13px;font-weight:600;color:#e5e7eb;">📋 ${f.name}</div>
      </div>`;
    });
    rbHtml += '</div>';
    html += fsSection('fs-runbooks', '📋', 'Runbooks', fs.runbooks.length, rbHtml, false);
  }

  // Scripts
  if (fs.scripts?.length) {
    let scHtml = '<div style="display:flex;flex-wrap:wrap;gap:6px;">';
    fs.scripts.forEach(f => {
      const color = f.ext === '.py' ? '#3572A5' : f.ext === '.sh' ? '#89e051' : f.ext === '.rb' ? '#CC342D' : '#6b7280';
      scHtml += `<span onclick="viewFile('${f.name}','scripts/${f.name}')" style="background:#0d1117;border:1px solid #2a2a3e;border-radius:6px;padding:4px 10px;font-size:12px;color:${color};cursor:pointer;transition:border-color 0.2s;" onmouseover="this.style.borderColor='#3b82f6'" onmouseout="this.style.borderColor='#2a2a3e'">${f.name}</span>`;
    });
    scHtml += '</div>';
    html += fsSection('fs-scripts', '⚡', 'Scripts', fs.scripts.length, scHtml, false);
  }

  html += '</div>';
  el.innerHTML = html;
}

// === ANALYTICS PAGE ===
function renderAnalytics(el) {
  if (!COST_DATA.daily || COST_DATA.daily.length === 0) {
    el.innerHTML = '<p style="color:#6b7280;">Loading analytics data...</p>';
    return;
  }

  // Calculate totals and summary data
  const today = COST_DATA.daily[0];
  const last7Days = COST_DATA.daily.slice(0, Math.min(7, COST_DATA.daily.length));
  const last30Days = COST_DATA.daily.slice(0, Math.min(30, COST_DATA.daily.length));

  const todayCost = Object.values(today.models).reduce((sum, m) => sum + m.cost_usd, 0);
  const week7Cost = last7Days.reduce((sum, day) => sum + Object.values(day.models).reduce((s, m) => s + m.cost_usd, 0), 0);
  const month30Cost = last30Days.reduce((sum, day) => sum + Object.values(day.models).reduce((s, m) => s + m.cost_usd, 0), 0);
  const projectedMonthlyCost = (month30Cost / last30Days.length) * 30;

  // Model breakdown for today
  const modelTotals = {};
  Object.entries(today.models).forEach(([model, data]) => {
    modelTotals[model] = data.cost_usd;
  });

  let html = '<div style="max-width:1200px;margin:0 auto;">';

  // Cost summary cards
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:32px;">';
  html += `<div class="stat-card">
    <div class="stat-label">Today's Cost</div>
    <div class="stat-value" style="color:#ef4444;">$${todayCost.toFixed(2)}</div>
  </div>`;
  html += `<div class="stat-card">
    <div class="stat-label">7-Day Cost</div>
    <div class="stat-value" style="color:#f59e0b;">$${week7Cost.toFixed(2)}</div>
  </div>`;
  html += `<div class="stat-card">
    <div class="stat-label">30-Day Cost</div>
    <div class="stat-value" style="color:#8b5cf6;">$${month30Cost.toFixed(2)}</div>
  </div>`;
  html += `<div class="stat-card">
    <div class="stat-label">Projected Monthly</div>
    <div class="stat-value" style="color:#3b82f6;">$${projectedMonthlyCost.toFixed(0)}</div>
  </div>`;
  html += '</div>';

  // Cost over time chart (bar chart)
  html += '<div style="display:grid;grid-template-columns:2fr 1fr;gap:24px;margin-bottom:32px;">';
  html += '<div style="background:#1a1a2e;border-radius:12px;padding:24px;">';
  html += '<h3 style="margin:0 0 16px;font-size:16px;color:#fff;">Cost Over Time (Last 7 Days)</h3>';

  // Bar chart using CSS grid
  const maxDailyCost = Math.max(...last7Days.map(day => Object.values(day.models).reduce((s, m) => s + m.cost_usd, 0)));
  html += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px;height:200px;align-items:end;margin-bottom:16px;">';

  last7Days.reverse().forEach(day => {
    const dayTotal = Object.values(day.models).reduce((s, m) => s + m.cost_usd, 0);
    const heightPct = (dayTotal / maxDailyCost) * 100;
    
    // Stacked bar
    const opusHeight = (day.models.opus.cost_usd / dayTotal) * heightPct;
    const sonnetHeight = (day.models.sonnet.cost_usd / dayTotal) * heightPct;
    const haikuHeight = (day.models.haiku.cost_usd / dayTotal) * heightPct;

    html += '<div style="display:flex;flex-direction:column;justify-content:end;height:100%;text-align:center;">';
    html += `<div style="background:#10b981;height:${haikuHeight}%;border-radius:4px 4px 0 0;margin-bottom:1px;" title="Haiku: $${day.models.haiku.cost_usd.toFixed(2)}"></div>`;
    html += `<div style="background:#3b82f6;height:${sonnetHeight}%;margin-bottom:1px;" title="Sonnet: $${day.models.sonnet.cost_usd.toFixed(2)}"></div>`;
    html += `<div style="background:#f59e0b;height:${opusHeight}%;border-radius:0 0 4px 4px;" title="Opus: $${day.models.opus.cost_usd.toFixed(2)}"></div>`;
    html += `<div style="font-size:10px;color:#9ca3af;margin-top:8px;">${day.date.slice(-2)}</div>`;
    html += '</div>';
  });
  html += '</div>';

  // Legend
  html += '<div style="display:flex;justify-content:center;gap:16px;font-size:12px;">';
  html += '<span style="color:#f59e0b;"><span style="display:inline-block;width:12px;height:12px;background:#f59e0b;border-radius:2px;margin-right:4px;"></span>Opus</span>';
  html += '<span style="color:#3b82f6;"><span style="display:inline-block;width:12px;height:12px;background:#3b82f6;border-radius:2px;margin-right:4px;"></span>Sonnet</span>';
  html += '<span style="color:#10b981;"><span style="display:inline-block;width:12px;height:12px;background:#10b981;border-radius:2px;margin-right:4px;"></span>Haiku</span>';
  html += '</div>';
  html += '</div>';

  // Model breakdown donut chart
  const totalCost = Object.values(modelTotals).reduce((s, c) => s + c, 0);
  const opusPct = (modelTotals.opus / totalCost) * 100;
  const sonnetPct = (modelTotals.sonnet / totalCost) * 100;
  const haikuPct = (modelTotals.haiku / totalCost) * 100;

  html += '<div style="background:#1a1a2e;border-radius:12px;padding:24px;">';
  html += '<h3 style="margin:0 0 16px;font-size:16px;color:#fff;">Today\'s Model Breakdown</h3>';
  html += '<div style="display:flex;flex-direction:column;align-items:center;gap:16px;">';

  // CSS donut chart
  html += `<div style="width:120px;height:120px;border-radius:50%;background:conic-gradient(#f59e0b ${opusPct}%, #3b82f6 0 ${opusPct + sonnetPct}%, #10b981 0);position:relative;">`;
  html += '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:60px;height:60px;background:#1a1a2e;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:#fff;">$' + todayCost.toFixed(0) + '</div>';
  html += '</div>';

  // Legend
  html += '<div style="display:flex;flex-direction:column;gap:8px;font-size:12px;">';
  html += `<div style="display:flex;align-items:center;gap:8px;"><span style="display:inline-block;width:12px;height:12px;background:#f59e0b;border-radius:2px;"></span><span style="color:#e5e7eb;">Opus ${opusPct.toFixed(0)}% ($${modelTotals.opus.toFixed(2)})</span></div>`;
  html += `<div style="display:flex;align-items:center;gap:8px;"><span style="display:inline-block;width:12px;height:12px;background:#3b82f6;border-radius:2px;"></span><span style="color:#e5e7eb;">Sonnet ${sonnetPct.toFixed(0)}% ($${modelTotals.sonnet.toFixed(2)})</span></div>`;
  html += `<div style="display:flex;align-items:center;gap:8px;"><span style="display:inline-block;width:12px;height:12px;background:#10b981;border-radius:2px;"></span><span style="color:#e5e7eb;">Haiku ${haikuPct.toFixed(0)}% ($${modelTotals.haiku.toFixed(2)})</span></div>`;
  html += '</div>';
  html += '</div>';
  html += '</div>';
  html += '</div>';

  // Agent activity table
  html += '<div style="background:#1a1a2e;border-radius:12px;padding:24px;margin-bottom:24px;">';
  html += '<h3 style="margin:0 0 16px;font-size:16px;color:#fff;">Agent Activity</h3>';
  html += '<div style="overflow-x:auto;">';
  html += '<table style="width:100%;border-collapse:collapse;font-size:13px;">';
  html += '<thead><tr style="border-bottom:2px solid #2a2a3e;">';
  html += '<th style="text-align:left;padding:12px 8px;color:#9ca3af;">Agent</th>';
  html += '<th style="text-align:center;padding:12px 8px;color:#9ca3af;">Model</th>';
  html += '<th style="text-align:center;padding:12px 8px;color:#9ca3af;">Status</th>';
  html += '<th style="text-align:right;padding:12px 8px;color:#9ca3af;">Est. Cost Today</th>';
  html += '</tr></thead><tbody>';

  COST_DATA.agents.forEach(agent => {
    const model = COST_DATA.models[agent.model];
    const activityData = today.by_activity[agent.id] || {cost_usd: 0};
    const status = agent.id.startsWith('cron') ? 'scheduled' : 'active';
    const statusColor = status === 'active' ? '#22c55e' : '#f59e0b';
    
    html += '<tr style="border-bottom:1px solid #2a2a3e;">';
    html += `<td style="padding:8px;color:#e5e7eb;">
      <div style="font-weight:500;">${agent.name}</div>
      <div style="font-size:11px;color:#9ca3af;">${agent.description}</div>
    </td>`;
    html += `<td style="padding:8px;text-align:center;">
      <span style="background:${model.color}22;color:${model.color};padding:4px 8px;border-radius:4px;font-size:11px;font-weight:600;">${model.label.split(' ')[1]}</span>
    </td>`;
    html += `<td style="padding:8px;text-align:center;">
      <span style="color:${statusColor};">●</span> ${status}
    </td>`;
    html += `<td style="padding:8px;text-align:right;color:#e5e7eb;font-weight:500;">$${activityData.cost_usd.toFixed(2)}</td>`;
    html += '</tr>';
  });

  html += '</tbody></table>';
  html += '</div>';
  html += '</div>';

  html += '</div>';
  el.innerHTML = html;
}

// === CRON JOBS PAGE ===
function renderCron(el) {
  if (!COST_DATA.cron_jobs || COST_DATA.cron_jobs.length === 0) {
    el.innerHTML = '<p style="color:#6b7280;">Loading cron jobs data...</p>';
    return;
  }

  const activeJobs = COST_DATA.cron_jobs.filter(job => job.status === 'active');
  const disabledJobs = COST_DATA.cron_jobs.filter(job => job.status === 'disabled');

  let html = '<div style="max-width:1000px;margin:0 auto;">';

  // Summary
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:16px;margin-bottom:32px;">';
  html += `<div class="stat-card">
    <div class="stat-label">Total Jobs</div>
    <div class="stat-value">${COST_DATA.cron_jobs.length}</div>
  </div>`;
  html += `<div class="stat-card">
    <div class="stat-label">Active</div>
    <div class="stat-value" style="color:#22c55e;">${activeJobs.length}</div>
  </div>`;
  html += `<div class="stat-card">
    <div class="stat-label">Disabled</div>
    <div class="stat-value" style="color:#6b7280;">${disabledJobs.length}</div>
  </div>`;
  html += `<div class="stat-card">
    <div class="stat-label">Active Agents</div>
    <div class="stat-value" style="color:#3b82f6;">${COST_DATA.agents.length}</div>
  </div>`;
  html += '</div>';

  // Active jobs
  html += '<div style="background:#1a1a2e;border-radius:12px;padding:24px;margin-bottom:24px;">';
  html += '<h3 style="margin:0 0 20px;font-size:16px;color:#fff;">🟢 Active Cron Jobs</h3>';
  
  if (activeJobs.length === 0) {
    html += '<p style="color:#6b7280;text-align:center;padding:20px;">No active cron jobs</p>';
  } else {
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;">';
    activeJobs.forEach(job => {
      const model = COST_DATA.models[job.model];
      const lastRun = job.last_run ? new Date(job.last_run).toLocaleString() : 'Never';
      
      html += `<div style="background:#0d1117;border:2px solid #22c55e;border-radius:12px;padding:16px;cursor:pointer;transition:transform 0.2s;position:relative;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">`;
      html += `<div style="position:absolute;top:8px;right:8px;width:8px;height:8px;background:#22c55e;border-radius:50%;"></div>`;
      html += `<div style="font-size:14px;font-weight:600;color:#e5e7eb;margin-bottom:8px;">${job.name}</div>`;
      html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">`;
      html += `<span style="background:${model.color}22;color:${model.color};padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">${model.label.split(' ')[1]}</span>`;
      html += `<span style="color:#9ca3af;font-size:12px;">${job.schedule}</span>`;
      html += `</div>`;
      html += `<div style="color:#9ca3af;font-size:11px;">Last run: ${lastRun}</div>`;
      html += `</div>`;
    });
    html += '</div>';
  }
  html += '</div>';

  // Disabled jobs
  if (disabledJobs.length > 0) {
    html += '<div style="background:#1a1a2e;border-radius:12px;padding:24px;margin-bottom:24px;">';
    html += '<h3 style="margin:0 0 20px;font-size:16px;color:#fff;">⚫ Disabled Cron Jobs</h3>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;">';
    disabledJobs.forEach(job => {
      const model = COST_DATA.models[job.model];
      const lastRun = job.last_run ? new Date(job.last_run).toLocaleString() : 'Never';
      
      html += `<div style="background:#0d1117;border:2px solid #6b7280;border-radius:12px;padding:16px;cursor:pointer;opacity:0.7;position:relative;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='0.7'">`;
      html += `<div style="position:absolute;top:8px;right:8px;width:8px;height:8px;background:#6b7280;border-radius:50%;"></div>`;
      html += `<div style="font-size:14px;font-weight:600;color:#e5e7eb;margin-bottom:8px;">${job.name}</div>`;
      html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">`;
      html += `<span style="background:${model.color}22;color:${model.color};padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">${model.label.split(' ')[1]}</span>`;
      html += `<span style="color:#9ca3af;font-size:12px;">${job.schedule}</span>`;
      html += `</div>`;
      html += `<div style="color:#9ca3af;font-size:11px;">Last run: ${lastRun}</div>`;
      html += `</div>`;
    });
    html += '</div>';
    html += '</div>';
  }

  // All agents overview
  html += '<div style="background:#1a1a2e;border-radius:12px;padding:24px;">';
  html += '<h3 style="margin:0 0 20px;font-size:16px;color:#fff;">🤖 All Agents</h3>';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;">';
  
  COST_DATA.agents.forEach(agent => {
    const model = COST_DATA.models[agent.model];
    const isCron = agent.id.startsWith('cron');
    const border = isCron ? '#f59e0b' : '#3b82f6';
    const icon = isCron ? '⚙️' : '🤖';
    
    html += `<div style="background:#0d1117;border-left:4px solid ${border};border-radius:8px;padding:14px;">`;
    html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">`;
    html += `<span>${icon}</span>`;
    html += `<span style="font-size:13px;font-weight:600;color:#e5e7eb;">${agent.name}</span>`;
    html += `</div>`;
    html += `<div style="font-size:11px;color:#9ca3af;margin-bottom:8px;">${agent.description}</div>`;
    html += `<span style="background:${model.color}22;color:${model.color};padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600;">${model.label}</span>`;
    html += `</div>`;
  });
  
  html += '</div>';
  html += '</div>';

  html += '</div>';
  el.innerHTML = html;
}

// === INIT ===
window.addEventListener('hashchange', navigate);
loadData().then(() => navigate());
setInterval(async () => { await loadData(); navigate(); }, 300000);
