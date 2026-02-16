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

function metric(val, label) {
  return `<div class="metric-card"><div class="value">${val}</div><div class="label">${label}</div></div>`;
}

init();
