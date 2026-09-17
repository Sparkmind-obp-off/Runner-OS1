const app = document.querySelector('#app')
const localToday = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}
const state = {
  user: null,
  runs: [],
  today: null,
  view: location.pathname.startsWith('/runs/') ? 'detail' : location.pathname === '/runs' ? 'runs' : 'today',
  detail: null,
  history: [],
  filters: { search: '', status: '', priority: '', type: '', tag: '', sort: 'priority', direction: 'asc' },
}

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]))
const human = (value) => String(value).replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase())
const date = (value) => new Intl.DateTimeFormat(undefined, { dateStyle:'medium', timeStyle:'short' }).format(new Date(value))
const toLocalInput = (value) => value ? new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60_000).toISOString().slice(0, 16) : ''
const terminal = (run) => run.status === 'completed' || run.status === 'archived'

async function api(path, options = {}) {
  const response = await fetch(path, { credentials:'same-origin', headers:{ ...(options.body ? {'Content-Type':'application/json'} : {}), ...options.headers }, ...options })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(payload.error?.message || 'Request failed')
    error.code = payload.error?.code
    error.details = payload.error?.details
    if (response.status === 401 && error.code === 'AUTH_REQUIRED') {
      state.user = null
      renderAuth('login', 'Your session expired. Sign in again to continue.')
    }
    throw error
  }
  return payload.data
}

async function boot() {
  try {
    state.user = await api('/api/auth/me')
    if (!state.user) return renderAuth()
    await loadData()
    render()
  } catch (error) {
    if (error.code === 'AUTH_REQUIRED') renderAuth()
    else renderFatal(error)
  }
}

async function loadData() {
  const [runs, today] = await Promise.all([api('/api/runs'), api(`/api/today?date=${localToday()}`)])
  state.runs = runs
  state.today = today
  if (state.view === 'detail') {
    const id = location.pathname.split('/')[2]
    ;[state.detail, state.history] = await Promise.all([api(`/api/runs/${id}`), api(`/api/runs/${id}/history`)])
  }
}

function renderAuth(mode = 'login', message = '') {
  app.innerHTML = `<main class="auth-layout"><section class="brand-panel"><div class="brand-mark">Runner OS / Productivity</div><div><h1>Run what matters.</h1><p>Turn commitments into clear execution loops—with focus, next actions, recovery, and an honest history.</p></div><small>Capture → Focus → Run → Track → Recover</small></section><section class="auth-panel"><div class="auth-card"><div class="eyebrow">${mode === 'login' ? 'Welcome back' : 'Create your workspace'}</div><h2>${mode === 'login' ? 'Continue running.' : 'Start with clarity.'}</h2><p class="subtle">${mode === 'login' ? 'Sign in to your private Runner OS.' : 'Every Run remains scoped to your authenticated account.'}</p>${message ? `<div class="error-banner">${escapeHtml(message)}</div>` : ''}<form id="auth-form">${mode === 'register' ? field('displayName', 'Name', '', 'text', true, 'name') : ''}${field('email', 'Email', '', 'email', true, 'email')}${field('password', 'Password', '', 'password', true, mode === 'register' ? 'new-password' : 'current-password', mode === 'register' ? 12 : 1)}<button class="button full" type="submit">${mode === 'login' ? 'Sign in' : 'Create account'}</button></form><p class="subtle">${mode === 'login' ? 'New to Runner OS?' : 'Already have an account?'} <button id="switch-auth" class="text-button">${mode === 'login' ? 'Create account' : 'Sign in'}</button></p></div></section></main>`
  document.querySelector('#switch-auth').onclick = () => renderAuth(mode === 'login' ? 'register' : 'login')
  document.querySelector('#auth-form').onsubmit = async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    const submit = form.querySelector('button[type="submit"]')
    const body = Object.fromEntries(new FormData(form).entries())
    submit.disabled = true
    submit.setAttribute('aria-busy', 'true')
    submit.textContent = mode === 'login' ? 'Signing in…' : 'Creating account…'
    try {
      await api(`/api/auth/${mode}`, { method:'POST', body:JSON.stringify(body) })
      state.user = await api('/api/auth/me')
      if (!state.user) throw new Error('The server did not confirm the new session. Please try again.')
      history.replaceState({}, '', '/')
      state.view = 'today'
      await loadData()
      render()
    } catch (error) {
      state.user = null
      renderAuth(mode, error.message)
    }
  }
}

function shell(content, active = state.view) {
  return `<div class="shell"><aside class="sidebar"><div><div class="logo">Runner OS</div><div class="phase-label">Productivity layer</div></div><nav class="nav" aria-label="Primary"><button data-nav="today" class="${active === 'today' ? 'active' : ''}">Today</button><button data-nav="runs" class="${active === 'runs' || active === 'detail' ? 'active' : ''}">Runs</button></nav><footer class="sidebar-footer"><div class="user-name">${escapeHtml(state.user.displayName)}</div><div class="user-email">${escapeHtml(state.user.email)}</div><button id="logout" class="text-button">Sign out</button></footer></aside><main class="main">${content}</main></div>`
}

function render() {
  if (state.view === 'runs') renderRuns()
  else if (state.view === 'detail') renderDetail()
  else renderToday()
  bindShell()
}

function header(eyebrow, title, subtitle, action = true) {
  return `<header class="page-header"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${subtitle}</p></div>${action ? '<button class="button" data-create>+ New Run</button>' : ''}</header>`
}

function dueState(run) {
  if (!run.dueAt || terminal(run)) return ''
  const now = state.today?.generatedAt || new Date().toISOString()
  if (run.dueAt < now) return 'overdue'
  const soon = new Date(new Date(now).getTime() + 7 * 86_400_000).toISOString()
  return run.dueAt <= soon ? 'upcoming' : ''
}

function runCard(run, options = {}) {
  const due = dueState(run)
  return `<article class="run-card ${due}"><div class="run-top"><a class="run-title" href="/runs/${run.id}" data-run="${run.id}">${escapeHtml(run.title)}</a><span class="badge ${run.status}">${human(run.status)}</span></div><div class="run-meta"><span class="badge priority-${run.priority}">${human(run.priority)}</span><span class="badge">${human(run.type)}</span>${run.focusDate === state.today?.focusDate ? '<span class="badge focus">Today focus</span>' : ''}${due ? `<span class="badge ${due}">${due === 'overdue' ? 'Overdue' : 'Due soon'}</span>` : ''}</div>${run.nextAction ? `<p class="next-action"><span>Next</span>${escapeHtml(run.nextAction)}</p>` : '<p class="next-action missing"><span>Next</span>Define a concrete action</p>'}${run.dueAt ? `<p class="due-copy">Due ${date(run.dueAt)}</p>` : ''}${run.tags.length ? `<div class="tag-list">${run.tags.map((tag) => `<span class="tag">#${escapeHtml(tag)}</span>`).join('')}</div>` : ''}<div class="progress-track" aria-label="${run.progress}% complete"><div class="progress-fill" style="width:${run.progress}%"></div></div>${options.focusControls ? `<div class="card-actions">${run.focusDate === state.today.focusDate ? '<button class="text-button" data-unfocus="'+run.id+'">Remove from focus</button>' : '<button class="text-button" data-focus="'+run.id+'">Focus today</button>'}</div>` : ''}</article>`
}

function section(title, items, emptyText, tone = '') {
  return `<section class="panel ${tone}"><div class="panel-header"><h3>${title}</h3><span class="count">${items.length}</span></div><div class="run-list">${items.length ? items.map((run) => runCard(run, { focusControls:true })).join('') : `<div class="empty">${emptyText}</div>`}</div></section>`
}

function renderToday() {
  const today = state.today
  app.innerHTML = shell(`${header('Today', 'What should I run now?', 'Choose a small focus set, see time pressure, and continue one clear next action.')}<section class="summary-strip"><div class="metric focus-metric"><strong>${today.focusRuns.length}</strong><span>Focused today</span></div><div class="metric"><strong>${state.runs.filter((run) => run.status === 'active').length}</strong><span>Active</span></div><div class="metric overdue-metric"><strong>${today.overdue.length}</strong><span>Overdue</span></div><div class="metric"><strong>${today.blocked.length}</strong><span>Blocked</span></div></section>${section('Today focus', today.focusRuns, 'Choose up to three Runs from priority or due work.', 'focus-panel')}<div class="dashboard-grid"><div class="stack">${section('Overdue', today.overdue, 'Nothing overdue.', 'attention-panel')}${section('Due in the next 7 days', today.upcoming, 'No upcoming deadlines.')}${section('Blocked — needs recovery', today.blocked, 'Nothing blocked.')}</div><div class="stack">${section('Priority Runs', today.priorityRuns, 'No high-priority active Runs.')}${section('Resume', today.resumable, 'No paused Runs waiting.')}<section class="panel"><div class="panel-header"><h3>Recent changes</h3><span class="count">${today.recentChanges.length}</span></div><div class="timeline">${events(today.recentChanges)}</div></section></div></div>`, 'today')
  bindFocusControls()
}

function filterQuery() {
  const query = new URLSearchParams()
  Object.entries(state.filters).forEach(([key, value]) => { if (value) query.set(key, value) })
  return query.toString()
}

function renderRuns() {
  const options = (values, selected) => values.map((value) => `<option value="${value}" ${selected === value ? 'selected' : ''}>${human(value)}</option>`).join('')
  app.innerHTML = shell(`${header('Runner Core', 'All Runs', 'Search, filter, and sort without losing paused or blocked work.')}<section class="runs-toolbar" aria-label="Run filters"><div class="search-field"><label for="search-filter">Search Runs</label><input id="search-filter" type="search" value="${escapeHtml(state.filters.search)}" placeholder="Title, outcome, next action, tag"></div><div><label for="status-filter">Status</label><select id="status-filter"><option value="">All</option>${options(['planned','active','paused','blocked','completed','archived'], state.filters.status)}</select></div><div><label for="priority-filter">Priority</label><select id="priority-filter"><option value="">All</option>${options(['critical','high','normal','low'], state.filters.priority)}</select></div><div><label for="type-filter">Type</label><select id="type-filter"><option value="">All</option>${options(['project','task_stream','habit','fitness','learning','hobby','custom'], state.filters.type)}</select></div><div><label for="sort-filter">Sort</label><select id="sort-filter">${options(['priority','due','updated','title'], state.filters.sort)}</select></div><button class="button secondary clear-filters" id="clear-filters">Clear</button></section><div id="filter-status" class="results-summary" aria-live="polite">${state.runs.length} matching Run${state.runs.length === 1 ? '' : 's'}</div><section id="runs-grid" class="runs-grid">${state.runs.map((run) => runCard(run, { focusControls:true })).join('') || '<div class="empty">No matching Runs. Clear filters or create a new Run.</div>'}</section>`, 'runs')
  bindRunFilters()
  bindFocusControls()
}

function availableActions(status) {
  return { planned:['start'], active:['pause','block','complete','archive'], paused:['resume','complete','archive'], blocked:['resume','complete','archive'], completed:[], archived:[] }[status]
}

function events(items) {
  return items.length ? items.map((event) => `<article class="event"><strong>${human(event.eventType.replace('run.', ''))}</strong>${event.previousState !== event.newState ? `<div class="subtle">${event.previousState ? human(event.previousState) : 'Created'} → ${human(event.newState)}</div>` : ''}<time datetime="${event.createdAt}">${date(event.createdAt)}</time></article>`).join('') : '<div class="empty">No history yet.</div>'
}

function renderDetail() {
  const run = state.detail
  const blocked = run.status === 'blocked'
  const focused = run.focusDate === state.today.focusDate
  const due = dueState(run)
  app.innerHTML = shell(`${header('Run detail', escapeHtml(run.title), `${human(run.type)} · Updated ${date(run.updatedAt)}`, false)}<div class="detail-grid"><div class="stack"><section class="panel"><div class="run-top"><div class="run-meta"><span class="badge ${run.status}">${human(run.status)}</span><span class="badge priority-${run.priority}">${human(run.priority)} priority</span>${focused ? '<span class="badge focus">Today focus</span>' : ''}${due ? `<span class="badge ${due}">${due === 'overdue' ? 'Overdue' : 'Due soon'}</span>` : ''}</div></div><h3>Desired outcome</h3><p class="detail-copy">${escapeHtml(run.outcome) || 'No outcome clarified yet.'}</p><div class="facts"><div class="fact"><span>Next action</span><strong>${escapeHtml(run.nextAction) || 'Not set'}</strong></div><div class="fact"><span>Progress</span><strong>${run.progress}%</strong></div><div class="fact"><span>Due</span><strong>${run.dueAt ? date(run.dueAt) : 'No due date'}</strong></div><div class="fact"><span>Blocker</span><strong>${escapeHtml(run.blocker) || 'None'}</strong></div></div>${run.tags.length ? `<div class="tag-list">${run.tags.map((tag) => `<span class="tag">#${escapeHtml(tag)}</span>`).join('')}</div>` : ''}<div class="progress-track"><div class="progress-fill" style="width:${run.progress}%"></div></div>${blocked ? '<div class="recovery"><strong>Recovery path</strong><br>Identify the blocker → set a useful next action → resume.</div>' : ''}<div class="actions"><button class="button secondary" data-edit>Edit details</button><button class="button ghost" data-next>Set next action</button><button class="button ghost" data-progress>Update progress</button>${!terminal(run) ? `<button class="button ghost" data-detail-focus>${focused ? 'Remove from today' : 'Focus today'}</button>` : ''}${availableActions(run.status).map((action) => `<button class="button ${action === 'archive' ? 'danger' : ''}" data-action="${action}">${human(action)}</button>`).join('')}</div></section></div><aside class="panel"><div class="panel-header"><h3>History</h3><span class="count">${state.history.length}</span></div><div class="timeline">${events(state.history)}</div></aside></div>`, 'detail')
  bindDetail()
}

function bindShell() {
  document.querySelectorAll('[data-nav]').forEach((button) => button.onclick = () => navigate(button.dataset.nav === 'today' ? '/' : '/runs'))
  document.querySelectorAll('[data-create]').forEach((button) => button.onclick = showCreate)
  const logout = document.querySelector('#logout')
  if (logout) logout.onclick = async () => {
    try {
      await api('/api/auth/logout', { method:'POST' })
      state.user = null
      state.runs = []
      state.today = null
      renderAuth()
    } catch (error) { toast(error.message, true) }
  }
  bindRunLinks()
}

function bindRunLinks() {
  document.querySelectorAll('[data-run]').forEach((link) => link.onclick = (event) => { event.preventDefault(); navigate(`/runs/${link.dataset.run}`) })
}

async function navigate(path) {
  history.pushState({}, '', path)
  state.view = path === '/' ? 'today' : path === '/runs' ? 'runs' : 'detail'
  await loadData()
  render()
}

function modal(title, fields, onSubmit, submitLabel = 'Save') {
  const node = document.createElement('div')
  node.className = 'modal-backdrop'
  node.innerHTML = `<section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header class="modal-header"><h3 id="modal-title">${title}</h3><button class="icon-button" type="button" aria-label="Close">×</button></header><form>${fields}<div id="modal-error"></div><button class="button full" type="submit">${submitLabel}</button></form></section>`
  document.body.append(node)
  const close = () => node.remove()
  node.querySelector('.icon-button').onclick = close
  node.onclick = (event) => { if (event.target === node) close() }
  node.querySelector('form').onsubmit = async (event) => {
    event.preventDefault()
    try {
      await onSubmit(Object.fromEntries(new FormData(event.currentTarget).entries()))
      close()
      await loadData()
      render()
      toast('Run updated')
    } catch (error) { node.querySelector('#modal-error').innerHTML = `<div class="error-banner">${escapeHtml(error.message)}</div>` }
  }
  node.querySelector('input, select, textarea')?.focus()
}

function field(name, label, value = '', type = 'text', required = false, autocomplete = 'off', minlength = '') {
  return `<div class="field"><label for="m-${name}">${label}</label><input id="m-${name}" name="${name}" type="${type}" value="${escapeHtml(value ?? '')}" ${required ? 'required' : ''} autocomplete="${autocomplete}" ${minlength ? `minlength="${minlength}"` : ''}></div>`
}

function tagsFrom(value) { return [...new Set(String(value).split(',').map((tag) => tag.trim().toLowerCase()).filter(Boolean))] }
function runForm(run = {}) {
  return `<div class="form-grid">${field('title', 'Title', run.title, 'text', true)}<div class="field"><label for="m-type">Type</label><select id="m-type" name="type">${['project','task_stream','habit','fitness','learning','hobby','custom'].map((value) => `<option value="${value}" ${run.type === value ? 'selected' : ''}>${human(value)}</option>`).join('')}</select></div><div class="field span-2"><label for="m-outcome">Desired outcome</label><textarea id="m-outcome" name="outcome" maxlength="1000">${escapeHtml(run.outcome || '')}</textarea></div><div class="field"><label for="m-priority">Priority</label><select id="m-priority" name="priority">${['normal','high','critical','low'].map((value) => `<option value="${value}" ${run.priority === value ? 'selected' : ''}>${human(value)}</option>`).join('')}</select></div>${field('dueAt', 'Due time', toLocalInput(run.dueAt), 'datetime-local')}${field('tags', 'Tags (comma separated)', (run.tags || []).join(', '))}${run.id ? '' : field('nextAction', 'Next action', run.nextAction || '')}</div>`
}

function normalizeRunForm(data) {
  data.tags = tagsFrom(data.tags)
  data.dueAt = data.dueAt ? new Date(data.dueAt).toISOString() : null
  return data
}

function showCreate() {
  modal('Create a Run', runForm(), (data) => api('/api/runs', { method:'POST', body:JSON.stringify(normalizeRunForm(data)) }), 'Create Run')
}

function bindDetail() {
  document.querySelector('[data-edit]').onclick = () => modal('Edit Run', runForm(state.detail), (data) => {
    delete data.nextAction
    return api(`/api/runs/${state.detail.id}`, { method:'PATCH', body:JSON.stringify(normalizeRunForm(data)) })
  })
  document.querySelector('[data-next]').onclick = () => modal('Set next action', field('nextAction', 'What is the next concrete action?', state.detail.nextAction, 'text', true), (data) => api(`/api/runs/${state.detail.id}/next-action`, { method:'PATCH', body:JSON.stringify(data) }))
  document.querySelector('[data-progress]').onclick = () => modal('Update progress', field('progress', 'Progress (0–100)', state.detail.progress, 'number', true), (data) => api(`/api/runs/${state.detail.id}/progress`, { method:'PATCH', body:JSON.stringify({ progress:Number(data.progress) }) }))
  document.querySelector('[data-detail-focus]')?.addEventListener('click', () => setFocus(state.detail.id, state.detail.focusDate === state.today.focusDate ? null : state.today.focusDate))
  document.querySelectorAll('[data-action]').forEach((button) => button.onclick = () => runAction(button.dataset.action))
}

function bindFocusControls() {
  document.querySelectorAll('[data-focus]').forEach((button) => button.onclick = () => setFocus(button.dataset.focus, state.today.focusDate))
  document.querySelectorAll('[data-unfocus]').forEach((button) => button.onclick = () => setFocus(button.dataset.unfocus, null))
}

async function setFocus(id, focusDate) {
  if (focusDate && state.today.focusRuns.length >= 3 && !state.today.focusRuns.some((run) => run.id === id)) {
    return toast('Today focus is intentionally limited to three Runs.', true)
  }
  try {
    const focusOrder = focusDate ? Math.min(state.today.focusRuns.length + 1, 3) : null
    await api(`/api/runs/${id}/focus`, { method:'PATCH', body:JSON.stringify({ focusDate, focusOrder }) })
    await loadData()
    render()
    toast(focusDate ? 'Added to today focus' : 'Removed from today focus')
  } catch (error) { toast(error.message, true) }
}

function bindRunFilters() {
  let timer
  const update = async () => {
    const params = filterQuery()
    try {
      state.runs = await api(`/api/runs${params ? `?${params}` : ''}`)
      renderRuns()
      bindShell()
    } catch (error) { toast(error.message, true) }
  }
  document.querySelector('#search-filter').oninput = (event) => {
    state.filters.search = event.target.value.trim()
    clearTimeout(timer)
    timer = setTimeout(update, 250)
  }
  for (const key of ['status','priority','type','sort']) {
    document.querySelector(`#${key}-filter`).onchange = (event) => {
      state.filters[key] = event.target.value
      state.filters.direction = key === 'sort' && event.target.value === 'updated' ? 'desc' : 'asc'
      update()
    }
  }
  document.querySelector('#clear-filters').onclick = () => {
    state.filters = { search:'', status:'', priority:'', type:'', tag:'', sort:'priority', direction:'asc' }
    update()
  }
}

async function runAction(action) {
  try {
    if (action === 'block') return modal('Block Run', field('blocker', 'What is blocking this Run?', '', 'text', true), (data) => api(`/api/runs/${state.detail.id}/block`, { method:'POST', body:JSON.stringify(data) }), 'Block Run')
    await api(`/api/runs/${state.detail.id}/${action}`, { method:'POST' })
    await loadData()
    render()
    toast(`Run ${action === 'complete' ? 'completed' : action === 'pause' ? 'paused' : action === 'archive' ? 'archived' : action === 'resume' ? 'resumed' : 'started'}`)
  } catch (error) { toast(error.message, true) }
}

function toast(message, isError = false) {
  const node = document.createElement('div')
  node.className = `toast ${isError ? 'toast-error' : ''}`
  node.textContent = message
  document.body.append(node)
  setTimeout(() => node.remove(), 3000)
}

function renderFatal(error) {
  app.innerHTML = `<main class="loading-state"><h2>Runner OS could not load</h2><p>${escapeHtml(error.message)}</p><button class="button" onclick="location.reload()">Retry</button></main>`
}

window.addEventListener('popstate', () => {
  state.view = location.pathname === '/' ? 'today' : location.pathname === '/runs' ? 'runs' : 'detail'
  loadData().then(render).catch(renderFatal)
})
boot()
