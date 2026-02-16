const TYPE_ICONS = { pr: '🔀', milestone: '🏁', task: '📝', research: '🔍' };

async function init() {
  const res = await fetch('data.json');
  const d = await res.json();
  document.getElementById('app').innerHTML = render(d);
  document.querySelectorAll('.workstream').forEach(el => {
    el.addEventListener('click', () => el.querySelector('.ws-details')?.classList.toggle('open'));
  });
}

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s/60) + 'm ago';
  if (s < 86400) return Math.floor(s/3600) + 'h ago';
  return Math.floor(s/86400) + 'd ago';
}

function render(d) {
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
  `;
}

function metric(val, label) {
  return `<div class="metric-card"><div class="value">${val}</div><div class="label">${label}</div></div>`;
}

init();
