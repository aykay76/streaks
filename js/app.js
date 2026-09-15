document.addEventListener('DOMContentLoaded', () => {
  const KEY = 'streaks-data-v1';
  const defaultStreaks = [
    { id: crypto.randomUUID(), name: 'Read for 30 minutes', icon: '📚', history: [] },
    { id: crypto.randomUUID(), name: 'Morning walk', icon: '🚶', history: [] },
    { id: crypto.randomUUID(), name: 'Drink 2L of water', icon: '💧', history: [] }
  ];
  let data = JSON.parse(localStorage.getItem(KEY) || 'null') || { streaks: defaultStreaks };
  const $ = (id) => document.getElementById(id);
  const today = () => new Date().toISOString().slice(0, 10);
  const save = () => localStorage.setItem(KEY, JSON.stringify(data));
  const dateOffset = (days) => { const d = new Date(); d.setDate(d.getDate() - days); return d.toISOString().slice(0, 10); };
  const getRun = (history) => { let run = 0; for (let i = 0; history.includes(dateOffset(i)); i += 1) run += 1; return run; };
  const tierFor = (run) => run >= 365 ? ['emerald', '✦'] : run >= 180 ? ['ruby', '◆'] : run >= 90 ? ['gold', '●'] : run >= 30 ? ['silver', '●'] : run >= 7 ? ['bronze', '●'] : ['iron', '●'];
  const render = () => {
    const list = $('streak-list');
    if (!data.streaks.length) list.innerHTML = '<div class="empty-state">Your next chapter starts with one tiny promise.<br><button class="button button-primary empty-add" id="empty-add" type="button">Create a streak</button></div>';
    else list.innerHTML = data.streaks.map((s) => {
      const run = getRun(s.history), tier = tierFor(run), checked = s.history.includes(today());
      return `<article class="streak-card"><div class="streak-emoji">${s.icon}</div><div><p class="streak-title">${escapeHtml(s.name)} <span class="tier">${tier[1]} ${tier[0]}</span></p><p class="streak-subtitle">${run ? `${run} day${run === 1 ? '' : 's'} in a row` : 'Ready when you are'} · best ${Math.max(run, longestRun(s.history))} days</p><div class="streak-bar"><span style="width:${Math.min(100, (run / 30) * 100)}%"></span></div></div><button class="check-button ${checked ? 'checked' : ''}" data-check="${s.id}" type="button" aria-label="${checked ? 'Undo' : 'Complete'} ${escapeHtml(s.name)}">${checked ? '✓' : '○'}</button><button class="delete-button" data-delete="${s.id}" type="button" aria-label="Delete ${escapeHtml(s.name)}">×</button></article>`;
    }).join('');
    updateStats(); renderHeatmap();
  };
  const longestRun = (history) => { let best = 0, run = 0; [...history].sort().forEach((d, i, a) => { run = i && (new Date(d) - new Date(a[i - 1]) === 86400000) ? run + 1 : 1; best = Math.max(best, run); }); return best; };
  const updateStats = () => {
    const total = data.streaks.reduce((n, s) => n + s.history.length, 0), checked = data.streaks.filter(s => s.history.includes(today())).length;
    const best = data.streaks.reduce((a, s) => getRun(s.history) > getRun(a.history) ? s : a, data.streaks[0]);
    $('total-days').innerHTML = `${total} <small>days</small>`; $('best-streak').innerHTML = `${best ? Math.max(getRun(best.history), longestRun(best.history)) : 0} <small>days</small>`;
    $('best-name').textContent = best ? best.name : 'Start your first one'; $('today-progress').innerHTML = `${checked}<small> / ${data.streaks.length}</small>`; $('today-label').textContent = checked === data.streaks.length && checked ? 'Perfect day ✨' : `${data.streaks.length - checked} left to go`;
    const week = Array.from({ length: 7 }, (_, i) => dateOffset(i)).reduce((n, day) => n + data.streaks.filter(s => s.history.includes(day)).length, 0); $('week-trend').textContent = `+${week} this week`;
  };
  const renderHeatmap = () => {
    const counts = {}; data.streaks.forEach(s => s.history.forEach(d => { counts[d] = (counts[d] || 0) + 1; }));
    const cells = Array.from({ length: 365 }, (_, i) => { const d = dateOffset(364 - i), n = counts[d] || 0, level = n ? Math.min(4, Math.ceil((n / Math.max(1, data.streaks.length)) * 4)) : 0; return `<span class="cell level-${level}" title="${d}: ${n} check-in${n === 1 ? '' : 's'}"></span>`; });
    $('heatmap').innerHTML = cells.join(''); $('activity-total').textContent = `${Object.values(counts).reduce((a, b) => a + b, 0)} check-ins`; $('activity-start').textContent = new Date(dateOffset(364)).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const active = Object.keys(counts).sort().length; $('activity-streak').textContent = active ? `${active} active day${active === 1 ? '' : 's'} — keep going ✨` : 'Keep going — your future self is watching ✨';
  };
  const escapeHtml = (text) => text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
  const confetti = () => { const colors = ['#ff9966', '#f76d9b', '#a889ff', '#68d9b0', '#fff']; for (let i = 0; i < 42; i += 1) { const p = document.createElement('i'); p.style.left = '50%'; p.style.background = colors[i % colors.length]; p.style.setProperty('--x', `${(Math.random() - .5) * 90}vw`); p.style.setProperty('--y', `${(Math.random() * 80 + 10)}vh`); p.style.transform = `rotate(${Math.random() * 360}deg)`; $('confetti').appendChild(p); setTimeout(() => p.remove(), 1300); } };
  document.addEventListener('click', (e) => {
    const check = e.target.closest('[data-check]'); if (check) { const s = data.streaks.find(x => x.id === check.dataset.check), wasChecked = s.history.includes(today()); s.history = wasChecked ? s.history.filter(d => d !== today()) : [...s.history, today()]; save(); render(); if (!wasChecked) { confetti(); showToast('Nice work — momentum unlocked ✨'); } return; }
    const del = e.target.closest('[data-delete]'); if (del && confirm('Remove this streak? Its history will be deleted.')) { data.streaks = data.streaks.filter(s => s.id !== del.dataset.delete); save(); render(); }
    if (e.target.closest('#empty-add')) openModal();
  });
  const modal = $('modal'); const openModal = () => { modal.hidden = false; $('streak-name').focus(); }; const closeModal = () => { modal.hidden = true; };
  $('add-streak').addEventListener('click', openModal); $('modal-close').addEventListener('click', closeModal); modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.querySelectorAll('.icon-picker button').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('.icon-picker button').forEach(b => b.classList.remove('selected')); button.classList.add('selected'); $('streak-icon').value = button.dataset.icon; }));
  $('streak-form').addEventListener('submit', (e) => { e.preventDefault(); data.streaks.push({ id: crypto.randomUUID(), name: $('streak-name').value.trim(), icon: $('streak-icon').value, history: [] }); save(); render(); closeModal(); e.target.reset(); showToast('New ritual added — you’ve got this.'); });
  const savedTheme = localStorage.getItem('streaks-theme') || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'); document.documentElement.dataset.theme = savedTheme;
  $('theme-toggle').addEventListener('click', () => { const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = next; localStorage.setItem('streaks-theme', next); $('theme-toggle').textContent = next === 'dark' ? '☼' : '☾'; });
  $('theme-toggle').textContent = savedTheme === 'dark' ? '☼' : '☾';
  $('export-data').addEventListener('click', () => { const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `streaks-backup-${today()}.json`; link.click(); URL.revokeObjectURL(link.href); showToast('Your backup is ready to download.'); });
  $('import-data').addEventListener('click', () => $('import-file').click()); $('import-file').addEventListener('change', (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { const imported = JSON.parse(reader.result); if (!Array.isArray(imported.streaks)) throw new Error('Invalid format'); data = imported; save(); render(); showToast('Data imported successfully.'); } catch { showToast('That file could not be imported.'); } }; reader.readAsText(file); e.target.value = ''; });
  let toastTimer; const showToast = (message) => { $('toast').textContent = message; $('toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('show'), 2600); };
  render();
});
