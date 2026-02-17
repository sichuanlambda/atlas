const TYPE_ICONS = { pr: '🔀', milestone: '🏁', task: '📝', research: '🔍' };

async function init() {
  const [dataRes, manifestRes] = await Promise.all([
    fetch('data.json'),
    fetch('files/manifest.json')
  ]);
  const d = await dataRes.json();
  const manifest = await manifestRes.json();
  document.getElementById('app').innerHTML = render(d, manifest);

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

function render(d, manifest) {
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

    <div class="metrics">
      ${metric(m.citiesLive, 'Cities Live')}
      ${metric(m.totalBuildings, 'Buildings')}
      ${metric(m.totalStyles, 'Styles')}
      ${metric(m.prsMerged, 'PRs Merged')}
      ${metric(m.totalUsers, 'Users')}
    </div>

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
