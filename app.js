const TYPE_ICONS = { pr: '🔀', milestone: '🏁', task: '📝', research: '🔍' };

async function init() {
  const [dataRes, manifestRes, heartbeatRes, tasksRes] = await Promise.all([
    fetch('data.json'),
    fetch('files/manifest.json'),
    fetch('heartbeat.json?t=' + Date.now()).catch(() => null),
    fetch('tasks.json?t=' + Date.now()).catch(() => null)
  ]);
  const d = await dataRes.json();
  const manifest = await manifestRes.json();
  const heartbeat = heartbeatRes && heartbeatRes.ok ? await heartbeatRes.json() : null;
  const tasksData = tasksRes && tasksRes.ok ? await tasksRes.json() : null;
  document.getElementById('app').innerHTML = render(d, manifest, heartbeat, tasksData);

  // Workstream expand/collapse
  document.querySelectorAll('.workstream').forEach(el => {
    el.addEventListener('click', () => el.querySelector('.ws-details')?.classList.toggle('open'));
  });

  // Folder expand/collapse
  document.querySelectorAll('.folder-header').forEach(el => {
    el.addEventListener('click', () => {
      el.querySelector('.arrow').classList.toggle('open');
      el.nextElementSibling.classList.toggle('open');
    });
  });

  // File click to preview
  document.querySelectorAll('.file-item[data-path]').forEach(el => {
    el.addEventListener('click', async (e) => {
      e.stopPropagation();
      const path = el.dataset.path;
      const name = el.dataset.name;
      try {
        const res = await fetch(path);
        const text = await res.text();
        showFileModal(name, text);
      } catch (err) {
        showFileModal(name, '(Could not load file)');
      }
    });
  });

  // Modal close
  document.querySelector('.file-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeFileModal();
  });
  document.querySelector('.file-modal-close')?.addEventListener('click', closeFileModal);

  // Heartbeat controls
  initHeartbeatControls();

  // Task filters
  initTaskFilters();
}

function showFileModal(name, content) {
  const overlay = document.querySelector('.file-modal-overlay');
  document.querySelector('.file-modal-header h3').textContent = name;
  document.querySelector('.file-modal-body').textContent = content;
  overlay.classList.add('open');
}

function closeFileModal() {
  document.querySelector('.file-modal-overlay').classList.remove('open');
}

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s/60) + 'm ago';
  if (s < 86400) return Math.floor(s/3600) + 'h ago';
  return Math.floor(s/86400) + 'd ago';
}

// === Heartbeat / Status Controls ===

function getHeartbeatStatus(heartbeat) {
  if (!heartbeat || !heartbeat.timestamp) return { state: 'unknown', label: 'Unknown', class: 'offline' };
  const age = Date.now() - new Date(heartbeat.timestamp).getTime();
  const mins = Math.floor(age / 60000);
  if (mins < 45) return { state: 'online', label: 'Online', class: 'online', ago: timeAgo(heartbeat.timestamp) };
  if (mins < 120) return { state: 'idle', label: 'Idle', class: 'idle', ago: timeAgo(heartbeat.timestamp) };
  return { state: 'offline', label: 'Offline', class: 'offline', ago: timeAgo(heartbeat.timestamp) };
}

function renderHeartbeat(heartbeat) {
  const s = getHeartbeatStatus(heartbeat);
  const hetznerToken = localStorage.getItem('atlas_hetzner_token') || '';
  const serverId = localStorage.getItem('atlas_hetzner_server_id') || '';
  const hasCredentials = hetznerToken && serverId;

  return `
    <div class="heartbeat-section">
      <div class="heartbeat-header">
        <div class="heartbeat-status">
          <span class="heartbeat-dot ${s.class}"></span>
          <span class="heartbeat-label">Atlas is <strong>${s.label}</strong></span>
          ${s.ago ? `<span class="heartbeat-ago">Last seen ${s.ago}</span>` : ''}
        </div>
        <button class="btn-settings" id="hb-settings-toggle" title="Configure restart credentials">⚙️</button>
      </div>

      ${heartbeat && heartbeat.lastAction ? `<div class="heartbeat-activity">📋 ${heartbeat.lastAction}</div>` : ''}
      ${heartbeat && heartbeat.activeJobs && heartbeat.activeJobs.length ? `
        <div class="heartbeat-jobs">${heartbeat.activeJobs.map(j => `<span class="job-tag">${j}</span>`).join('')}</div>
      ` : ''}

      <div class="heartbeat-controls ${s.state === 'offline' ? 'show' : ''}">
        ${s.state === 'offline' ? `<div class="offline-alert">⚠️ Atlas hasn't checked in for a while. You may need to restart.</div>` : ''}
        <div class="restart-buttons">
          <button class="btn-restart btn-reboot" id="btn-reboot" ${!hasCredentials ? 'disabled title="Configure Hetzner credentials first"' : 'title="Reboot the Hetzner VPS"'}>
            🔄 Reboot VPS
          </button>
          <button class="btn-restart btn-gateway" id="btn-gateway" ${!hasCredentials ? 'disabled title="Configure Hetzner credentials first"' : 'title="Restart OpenClaw gateway via SSH"'}>
            🚀 Restart Gateway
          </button>
        </div>
      </div>

      <div class="heartbeat-settings hidden" id="hb-settings">
        <div class="settings-note">Credentials stored in your browser only (localStorage). Never sent anywhere except Hetzner API.</div>
        <div class="settings-field">
          <label>Hetzner API Token</label>
          <input type="password" id="hetzner-token" value="${hetznerToken}" placeholder="Your Hetzner Cloud API token">
        </div>
        <div class="settings-field">
          <label>Server ID</label>
          <input type="text" id="hetzner-server-id" value="${serverId}" placeholder="e.g. 12345678">
        </div>
        <div class="settings-actions">
          <button class="btn-save" id="btn-save-creds">Save</button>
          <button class="btn-clear" id="btn-clear-creds">Clear</button>
        </div>
      </div>
    </div>
  `;
}

function initHeartbeatControls() {
  // Settings toggle
  document.getElementById('hb-settings-toggle')?.addEventListener('click', () => {
    document.getElementById('hb-settings')?.classList.toggle('hidden');
  });

  // Save credentials
  document.getElementById('btn-save-creds')?.addEventListener('click', () => {
    const token = document.getElementById('hetzner-token').value.trim();
    const serverId = document.getElementById('hetzner-server-id').value.trim();
    if (token) localStorage.setItem('atlas_hetzner_token', token);
    if (serverId) localStorage.setItem('atlas_hetzner_server_id', serverId);
    document.getElementById('hb-settings')?.classList.add('hidden');
    location.reload();
  });

  // Clear credentials
  document.getElementById('btn-clear-creds')?.addEventListener('click', () => {
    localStorage.removeItem('atlas_hetzner_token');
    localStorage.removeItem('atlas_hetzner_server_id');
    location.reload();
  });

  // Reboot VPS
  document.getElementById('btn-reboot')?.addEventListener('click', async () => {
    if (!confirm('Reboot the Hetzner VPS? Atlas will be offline for ~60 seconds.')) return;
    const token = localStorage.getItem('atlas_hetzner_token');
    const serverId = localStorage.getItem('atlas_hetzner_server_id');
    const btn = document.getElementById('btn-reboot');
    btn.textContent = '⏳ Rebooting...';
    btn.disabled = true;
    try {
      const res = await fetch(`https://api.hetzner.cloud/v1/servers/${serverId}/actions/reboot`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        btn.textContent = '✅ Reboot sent!';
        setTimeout(() => { btn.textContent = '🔄 Reboot VPS'; btn.disabled = false; }, 10000);
      } else {
        const err = await res.json();
        btn.textContent = '❌ Failed';
        alert('Reboot failed: ' + (err.error?.message || res.statusText));
        setTimeout(() => { btn.textContent = '🔄 Reboot VPS'; btn.disabled = false; }, 3000);
      }
    } catch (e) {
      btn.textContent = '❌ Error';
      alert('Network error: ' + e.message);
      setTimeout(() => { btn.textContent = '🔄 Reboot VPS'; btn.disabled = false; }, 3000);
    }
  });

  // Restart Gateway (reboot is enough — OpenClaw auto-starts on boot)
  document.getElementById('btn-gateway')?.addEventListener('click', async () => {
    if (!confirm('This will reboot the VPS to restart the gateway. Continue?')) return;
    // Gateway restart = same as VPS reboot since OpenClaw auto-starts
    document.getElementById('btn-reboot')?.click();
  });
}

// === Task Board ===

const STATUS_CONFIG = {
  'blocked_on_nathan': { icon: '🔴', label: 'Needs You', class: 'nathan', sort: 0 },
  'in_progress':       { icon: '🔵', label: 'In Progress', class: 'active', sort: 1 },
  'pending':           { icon: '⚪', label: 'Queued', class: 'pending', sort: 2 },
  'completed':         { icon: '✅', label: 'Done', class: 'done', sort: 3 }
};

const PROJECT_LABELS = {
  'architecture-helper': '🏛 Architecture Helper',
  'cresoftware': '💼 CRE Directory',
  'seo': '🔍 SEO',
  'atlas-infra': '⚙️ Atlas Infra',
  'pinterest': '📌 Pinterest'
};

function renderTasks(tasksData) {
  if (!tasksData || !tasksData.tasks) return '';
  const tasks = tasksData.tasks;
  
  // Split into Nathan's action items and Atlas's work
  const nathanTasks = tasks.filter(t => t.status === 'blocked_on_nathan');
  const activeTasks = tasks.filter(t => t.status === 'in_progress');
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const doneTasks = tasks.filter(t => t.status === 'completed');

  const reviewed = tasksData.lastReviewed ? timeAgo(tasksData.lastReviewed) : 'never';

  return `
    ${nathanTasks.length ? renderNathanSection(nathanTasks) : ''}
    
    <div class="section-title">📋 Task Board <span class="task-meta">Last reviewed ${reviewed} · ${tasks.length} tasks</span></div>
    
    <div class="task-filters">
      <button class="task-filter active" data-filter="all">All (${tasks.length})</button>
      <button class="task-filter" data-filter="in_progress">Active (${activeTasks.length})</button>
      <button class="task-filter" data-filter="pending">Queued (${pendingTasks.length})</button>
      <button class="task-filter" data-filter="blocked_on_nathan">Needs You (${nathanTasks.length})</button>
      <button class="task-filter" data-filter="completed">Done (${doneTasks.length})</button>
    </div>

    <div class="task-list" id="task-list">
      ${tasks
        .sort((a, b) => (STATUS_CONFIG[a.status]?.sort ?? 9) - (STATUS_CONFIG[b.status]?.sort ?? 9))
        .map(renderTaskCard).join('')}
    </div>
  `;
}

function renderNathanSection(tasks) {
  return `
    <div class="nathan-action-section">
      <div class="section-title">🎯 Needs Your Attention <span class="nathan-count">${tasks.length} item${tasks.length !== 1 ? 's' : ''}</span></div>
      ${tasks.map(t => `
        <div class="nathan-action-card priority-${t.priority}">
          <div class="nathan-card-header">
            <span class="nathan-card-title">${t.title}</span>
            <span class="priority-pill ${t.priority}">${t.priority}</span>
          </div>
          ${t.blockedReason ? `<div class="blocked-reason">⏸ ${t.blockedReason}</div>` : ''}
          ${t.progress ? `<div class="task-progress-text">${t.progress}</div>` : ''}
          ${t.nathanSteps ? `
            <div class="nathan-steps">
              <div class="steps-label">Steps:</div>
              <ol>
                ${t.nathanSteps.map(step => {
                  // Auto-linkify URLs
                  const linked = step.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
                  return `<li>${linked}</li>`;
                }).join('')}
              </ol>
            </div>
          ` : ''}
          ${t.notes ? `<div class="task-note">${t.notes}</div>` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

function renderTaskCard(t) {
  const sc = STATUS_CONFIG[t.status] || { icon: '❓', label: t.status, class: 'unknown' };
  const project = PROJECT_LABELS[t.project] || t.project;
  const deps = t.dependsOn ? `<span class="task-dep">⛓ Depends on: ${t.dependsOn.join(', ')}</span>` : '';
  
  return `
    <div class="task-card status-${sc.class}" data-status="${t.status}">
      <div class="task-card-top">
        <span class="task-status-icon">${sc.icon}</span>
        <span class="task-title">${t.title}</span>
        <span class="priority-pill ${t.priority}">${t.priority}</span>
      </div>
      <div class="task-card-meta">
        <span class="task-project">${project}</span>
        ${t.progress ? `<span class="task-progress">${t.progress}</span>` : ''}
        ${deps}
        <span class="task-updated">Updated ${timeAgo(t.updated)}</span>
      </div>
      ${t.atlasCanDo ? '<span class="atlas-badge">🤖 Atlas can handle</span>' : ''}
      ${t.notes ? `<div class="task-note">${t.notes}</div>` : ''}
    </div>
  `;
}

function initTaskFilters() {
  document.querySelectorAll('.task-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.task-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      document.querySelectorAll('.task-card').forEach(card => {
        card.style.display = (filter === 'all' || card.dataset.status === filter) ? '' : 'none';
      });
    });
  });
}

function renderFileSection(manifest) {
  return manifest.folders.map(folder => {
    const fileCount = folder.files.length;
    const isFromNathan = folder.path.includes('from-nathan');
    
    let contents = '';
    if (fileCount === 0) {
      contents = `<div class="empty-folder">No files yet</div>`;
    } else {
      contents = folder.files.map(f => `
        <div class="file-item" data-path="${folder.path}${f.name}" data-name="${f.name}">
          <span class="file-icon">📄</span>
          <span class="file-name">${f.name}</span>
          <span class="file-desc">${f.description}</span>
          <div class="file-meta">
            <span class="file-date">${f.added}</span>
            <span class="file-status ${f.status}">${f.status}</span>
          </div>
        </div>
      `).join('');
    }
    
    if (isFromNathan) {
      contents += `<div class="folder-note">📤 Upload files via GitHub: <a href="https://github.com/sichuanlambda/atlas/tree/main/files/from-nathan" target="_blank">github.com/sichuanlambda/atlas/tree/main/files/from-nathan</a></div>`;
    }

    return `
      <div class="folder">
        <div class="folder-header">
          <span class="arrow">▶</span>
          <span class="folder-icon">📁</span>
          <span>${folder.name}</span>
          <span class="folder-count">${fileCount} file${fileCount !== 1 ? 's' : ''}</span>
        </div>
        <div class="folder-contents">${contents}</div>
      </div>
    `;
  }).join('');
}

function renderPinterest(p) {
  const nextReview = new Date(p.nextReview);
  const now = Date.now();
  const daysUntil = Math.max(0, Math.ceil((nextReview - now) / 86400000));
  const reviewText = daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`;

  return `
    <div class="section-title">📌 Pinterest</div>
    <div class="metrics">
      ${metric(p.totalPins, 'Pins Published')}
      ${metric(p.totalBoards, 'Boards')}
      ${metric(p.queue, 'In Queue')}
      ${metric(p.account, 'Account')}
    </div>
    <div class="pinterest-schedule">
      <strong>Schedule:</strong> ${p.schedule} &nbsp;|&nbsp; <strong>Next Review:</strong> ${reviewText} (${nextReview.toLocaleDateString()})
    </div>

    <div class="section-subtitle">Recent Pins</div>
    <table class="pins-table">
      <thead><tr><th>Title</th><th>Board</th><th>Template</th><th>Date</th><th>Impressions</th><th>Saves</th><th>Clicks</th></tr></thead>
      <tbody>
        ${p.recentPins.map(pin => `<tr>
          <td><a href="${pin.url}" target="_blank">${pin.title}</a></td>
          <td>${pin.board}</td>
          <td>${pin.template}</td>
          <td>${timeAgo(pin.created)}</td>
          <td>${pin.metrics.impressions}</td>
          <td>${pin.metrics.saves}</td>
          <td>${pin.metrics.clicks}</td>
        </tr>`).join('')}
      </tbody>
    </table>

    <div class="section-subtitle">Content Template (${p.currentTemplate.version})</div>
    <div class="template-display">
      <div><strong>Title:</strong> <code>${p.currentTemplate.title}</code></div>
      <div><strong>Description:</strong> <code>${p.currentTemplate.description}</code></div>
    </div>

    <div class="section-subtitle">Boards</div>
    <div class="boards-grid">
      <div class="board-group">
        <strong>🏙 City Boards (${p.boards.city.length})</strong>
        <ul>${p.boards.city.map(b => `<li>${b}</li>`).join('')}</ul>
      </div>
      <div class="board-group">
        <strong>🎨 Style Boards (${p.boards.style.length})</strong>
        <ul>${p.boards.style.map(b => `<li>${b}</li>`).join('')}</ul>
      </div>
    </div>
  `;
}

function render(d, manifest, heartbeat, tasksData) {
  const m = d.metrics;
  return `
    <div class="header">
      <h1>🏛 Atlas Dashboard</h1>
      <div class="header-meta">
        <span class="status-dot ${d.status}"></span>
        <span>${d.currentWork}</span>
        <span>Updated ${timeAgo(d.lastUpdated)}</span>
      </div>
    </div>

    ${renderHeartbeat(heartbeat)}

    <div class="metrics">
      ${metric(m.citiesLive, 'Cities Live')}
      ${metric(m.totalBuildings, 'Buildings')}
      ${metric(m.totalStyles, 'Styles')}
      ${metric(m.prsMerged, 'PRs Merged')}
      ${metric(m.totalUsers, 'Users')}
    </div>

    ${renderTasks(tasksData)}

    <div class="section-title">📊 Workstreams</div>
    ${d.workstreams.map(w => `
      <div class="workstream status-${w.status}">
        <div class="ws-header">
          <span class="ws-name">${w.emoji} ${w.name}</span>
          <span class="ws-badge ${w.status}">${w.status}</span>
        </div>
        <div class="ws-summary">${w.summary}</div>
        <ul class="ws-details">${w.details.map(x => `<li>${x}</li>`).join('')}</ul>
      </div>
    `).join('')}

    ${d.pinterest ? renderPinterest(d.pinterest) : ''}

    ${d.zoningCoverage ? renderZoningCoverage(d.zoningCoverage) : ''}

    <div class="section-title">📂 Shared Workspace</div>
    <div class="file-browser">
      ${renderFileSection(manifest)}
    </div>

    <div class="section-title">⚠️ Waiting on Nathan</div>
    <div class="nathan-section">
      ${d.waitingOnNathan.map(n => `
        <div class="nathan-item">
          <div><span class="item-name">${n.item}</span><span class="priority-badge ${n.priority}">${n.priority}</span></div>
          <div class="item-context">${n.context}</div>
        </div>
      `).join('')}
    </div>

    <div class="section-title">💡 Ideas & Backlog</div>
    ${d.ideas.map(i => `
      <div class="idea-card">
        <div class="idea-title">${i.title}</div>
        <div class="idea-desc">${i.description}</div>
        <div class="idea-badges">
          <span class="impact-badge ${i.impact}">Impact: ${i.impact}</span>
          <span class="effort-badge ${i.effort}">Effort: ${i.effort}</span>
        </div>
      </div>
    `).join('')}

    <div class="section-title">🕐 Recent Activity</div>
    ${d.recentActivity.map(a => `
      <div class="activity-item">
        <span class="activity-icon">${TYPE_ICONS[a.type] || '📌'}</span>
        <div>
          <div class="activity-text">${a.text}</div>
          <div class="activity-time">${timeAgo(a.date)}</div>
        </div>
      </div>
    `).join('')}

    <div class="file-modal-overlay">
      <div class="file-modal">
        <div class="file-modal-header">
          <h3></h3>
          <button class="file-modal-close">✕</button>
        </div>
        <div class="file-modal-body"></div>
      </div>
    </div>
  `;
}

function renderZoningCoverage(z) {
  const statusIcon = { downloaded: '✅', in_progress: '🔄', not_started: '⬜' };
  const statusLabel = { downloaded: 'Downloaded', in_progress: 'In Progress', not_started: 'Not Started' };
  const cities = z.cities || [];
  const downloaded = cities.filter(c => c.status === 'downloaded').length;
  const totalZones = cities.reduce((s, c) => s + (c.zoneCount || 0), 0);

  const totalSize = cities.reduce((s, c) => s + (c.fileSizeMB || 0), 0);
  const slugify = name => name.toLowerCase().replace(/\s+/g, '-').replace(/\//g, '-');

  return `
    <div class="section-title">🗺️ Zoning Data Coverage</div>
    <div class="metrics">
      ${metric(downloaded + '/' + cities.length, 'Cities Downloaded')}
      ${metric(totalZones.toLocaleString(), 'Total Zones')}
      ${metric(totalSize.toFixed(0) + ' MB', 'Raw Data')}
    </div>

    <a href="zoning-map.html" class="map-explorer-card">
      <div class="map-explorer-inner">
        <div class="map-explorer-icon">🗺️</div>
        <div class="map-explorer-text">
          <div class="map-explorer-title">Open Interactive Zoning Map</div>
          <div class="map-explorer-desc">Explore zoning boundaries for ${downloaded} cities — click zones to identify, color-coded by type</div>
        </div>
        <div class="map-explorer-arrow">→</div>
      </div>
    </a>

    <table class="pins-table">
      <thead><tr><th>City</th><th>State</th><th>Status</th><th>Zones</th><th>Unique Codes</th><th>Size (MB)</th></tr></thead>
      <tbody>
        ${cities.map(c => {
          const slug = slugify(c.city);
          const isDownloaded = c.status === 'downloaded';
          return `<tr class="${isDownloaded ? 'clickable-row' : ''}" ${isDownloaded ? `onclick="window.open('zoning-map.html#${slug}','_blank')"` : ''}>
            <td>${isDownloaded ? `<a href="zoning-map.html#${slug}" target="_blank" style="color:var(--accent,#4a90a4);text-decoration:none;">${c.city}</a>` : c.city}</td>
            <td>${c.state}</td>
            <td>${statusIcon[c.status] || '⬜'} ${statusLabel[c.status] || c.status}</td>
            <td>${c.zoneCount ? c.zoneCount.toLocaleString() : '—'}</td>
            <td>${c.uniqueZoneCodes || '—'}</td>
            <td>${c.fileSizeMB ? c.fileSizeMB.toFixed(1) : '—'}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
    ${cities.length === 0 ? '<div class="empty-folder">No zoning data collected yet</div>' : ''}
  `;
}

function metric(val, label) {
  return `<div class="metric-card"><div class="value">${val}</div><div class="label">${label}</div></div>`;
}

init();
