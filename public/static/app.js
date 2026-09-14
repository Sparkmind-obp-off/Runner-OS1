const app = document.querySelector('#app')
const state = { user: null, runs: [], today: null, view: location.pathname.startsWith('/runs/') ? 'detail' : location.pathname === '/runs' ? 'runs' : 'today', detail: null, history: [] }

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[char]))
const human = (value) => String(value).replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
const date = (value) => new Intl.DateTimeFormat(undefined, { dateStyle:'medium', timeStyle:'short' }).format(new Date(value))

async function api(path, options = {}) {
  const response = await fetch(path, { credentials:'same-origin', headers:{ ...(options.body ? {'Content-Type':'application/json'} : {}), ...options.headers }, ...options })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) { const error = new Error(payload.error?.message || 'Request failed'); error.code = payload.error?.code; throw error }
  return payload.data
}

async function boot() {
  try { state.user = await api('/api/auth/me'); if (!state.user) return renderAuth(); await loadData(); render() }
  catch (error) { if (error.code === 'AUTH_REQUIRED') renderAuth(); else renderFatal(error) }
}

async function loadData() {
  const [runs, today] = await Promise.all([api('/api/runs'), api('/api/today')])
  state.runs = runs; state.today = today
  if (state.view === 'detail') {
    const id = location.pathname.split('/')[2]
    ;[state.detail, state.history] = await Promise.all([api(`/api/runs/${id}`), api(`/api/runs/${id}/history`)])
  }
}

function renderAuth(mode = 'login', message = '') {
  app.innerHTML = `<main class="auth-layout"><section class="brand-panel"><div class="brand-mark">Runner OS / Core</div><div><h1>Run what matters.</h1><p>Turn commitments into clear execution loops—with state, next actions, recovery, and an honest history.</p></div><small>Capture → Clarify → Run → Track → Recover</small></section><section class="auth-panel"><div class="auth-card"><div class="eyebrow">${mode === 'login' ? 'Welcome back' : 'Create your workspace'}</div><h2>${mode === 'login' ? 'Continue running.' : 'Start with clarity.'}</h2><p class="subtle">${mode === 'login' ? 'Sign in to your private Runner Core.' : 'Your Runs remain scoped to your authenticated account.'}</p>${message ? `<div class="error-banner">${escapeHtml(message)}</div>` : ''}<form id="auth-form">${mode === 'register' ? '<div class="field"><label for="displayName">Name</label><input id="displayName" name="displayName" required maxlength="80" autocomplete="name"></div>' : ''}<div class="field"><label for="email">Email</label><input id="email" name="email" type="email" required autocomplete="email"></div><div class="field"><label for="password">Password</label><input id="password" name="password" type="password" required minlength="${mode === 'register' ? '12' : '1'}" autocomplete="${mode === 'register' ? 'new-password' : 'current-password'}"></div><button class="button full" type="submit">${mode === 'login' ? 'Sign in' : 'Create account'}</button></form><p class="subtle">${mode === 'login' ? 'New to Runner OS?' : 'Already have an account?'} <button id="switch-auth" class="text-button">${mode === 'login' ? 'Create account' : 'Sign in'}</button></p></div></section></main>`
  document.querySelector('#switch-auth').onclick = () => renderAuth(mode === 'login' ? 'register' : 'login')
  document.querySelector('#auth-form').onsubmit = async (event) => {
    event.preventDefault(); const form = new FormData(event.currentTarget); const body = Object.fromEntries(form.entries())
    try { state.user = await api(`/api/auth/${mode}`, { method:'POST', body:JSON.stringify(body) }); history.replaceState({},'', '/'); state.view = 'today'; await loadData(); render() }
    catch (error) { renderAuth(mode, error.message) }
  }
}

function shell(content, active = state.view) {
  return `<div class="shell"><aside class="sidebar"><div class="logo">Runner OS</div><nav class="nav" aria-label="Primary"><button data-nav="today" class="${active === 'today' ? 'active' : ''}">Today</button><button data-nav="runs" class="${active === 'runs' || active === 'detail' ? 'active' : ''}">Runs</button></nav><footer class="sidebar-footer"><div class="user-name">${escapeHtml(state.user.displayName)}</div><div class="user-email">${escapeHtml(state.user.email)}</div><button id="logout" class="text-button">Sign out</button></footer></aside><main class="main">${content}</main></div>`
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

function runCard(run) {
  return `<article class="run-card"><div class="run-top"><a class="run-title" href="/runs/${run.id}" data-run="${run.id}">${escapeHtml(run.title)}</a><span class="badge ${run.status}">${human(run.status)}</span></div><div class="run-meta"><span class="badge">${human(run.type)}</span><span class="badge">${human(run.priority)}</span></div>${run.nextAction ? `<p class="next-action">Next · ${escapeHtml(run.nextAction)}</p>` : ''}<div class="progress-track" aria-label="${run.progress}% complete"><div class="progress-fill" style="width:${run.progress}%"></div></div></article>`
}

function section(title, items, emptyText) {
  return `<section class="panel"><div class="panel-header"><h3>${title}</h3><span class="count">${items.length}</span></div><div class="run-list">${items.length ? items.map(runCard).join('') : `<div class="empty">${emptyText}</div>`}</div></section>`
}

function renderToday() {
  const t = state.today
  app.innerHTML = shell(`${header('Today', 'What should I run now?', 'A focused view of priority, friction, and the next useful move.')}<section class="summary-strip"><div class="metric"><strong>${state.runs.filter(r=>r.status==='active').length}</strong><span>Active Runs</span></div><div class="metric"><strong>${t.priorityRuns.length}</strong><span>High priority</span></div><div class="metric"><strong>${t.blocked.length}</strong><span>Blocked</span></div><div class="metric"><strong>${t.resumable.length}</strong><span>Ready to resume</span></div></section><div class="dashboard-grid"><div class="stack">${section('Priority Runs', t.priorityRuns, 'No high-priority active Runs.')}${section('Next Actions', t.nextActions, 'Start a Run and define its next action.')}${section('Blocked — needs recovery', t.blocked, 'Nothing blocked.')}</div><div class="stack">${section('Resume', t.resumable, 'No paused Runs waiting.')}<section class="panel"><div class="panel-header"><h3>Recent changes</h3><span class="count">${t.recentChanges.length}</span></div><div class="timeline">${events(t.recentChanges)}</div></section></div></div>`, 'today')
}

function renderRuns() {
  app.innerHTML = shell(`${header('Runner Core', 'All Runs', 'Every active commitment, without losing blocked or paused work.')}<div class="runs-toolbar"><select id="status-filter" aria-label="Filter status"><option value="">All statuses</option>${['planned','active','paused','blocked','completed','archived'].map(s=>`<option value="${s}">${human(s)}</option>`).join('')}</select></div><section id="runs-grid" class="runs-grid">${state.runs.map(runCard).join('') || '<div class="empty">No Runs yet.</div>'}</section>`, 'runs')
  document.querySelector('#status-filter').onchange = (e) => { const filtered = e.target.value ? state.runs.filter(r=>r.status===e.target.value) : state.runs; document.querySelector('#runs-grid').innerHTML = filtered.map(runCard).join('') || '<div class="empty">No matching Runs.</div>'; bindRunLinks() }
}

function availableActions(status) {
  return { planned:['start'], active:['pause','block','complete','archive'], paused:['resume','complete','archive'], blocked:['resume','complete','archive'], completed:[], archived:[] }[status]
}
function events(items) {
  return items.length ? items.map(event => `<article class="event"><strong>${human(event.eventType.replace('run.',''))}</strong>${event.previousState !== event.newState ? `<div class="subtle">${event.previousState ? human(event.previousState) : 'Created'} → ${human(event.newState)}</div>` : ''}<time datetime="${event.createdAt}">${date(event.createdAt)}</time></article>`).join('') : '<div class="empty">No history yet.</div>'
}

function renderDetail() {
  const r = state.detail
  const blocked = r.status === 'blocked'
  app.innerHTML = shell(`${header('Run detail', escapeHtml(r.title), `${human(r.type)} · Updated ${date(r.updatedAt)}`, false)}<div class="detail-grid"><div class="stack"><section class="panel"><div class="run-top"><span class="badge ${r.status}">${human(r.status)}</span><span class="badge">${human(r.priority)} priority</span></div><h3>Desired outcome</h3><p class="detail-copy">${escapeHtml(r.outcome) || 'No outcome clarified yet.'}</p><div class="facts"><div class="fact"><span>Next action</span><strong>${escapeHtml(r.nextAction) || 'Not set'}</strong></div><div class="fact"><span>Progress</span><strong>${r.progress}%</strong></div><div class="fact"><span>Due</span><strong>${r.dueAt ? date(r.dueAt) : 'No due date'}</strong></div><div class="fact"><span>Blocker</span><strong>${escapeHtml(r.blocker) || 'None'}</strong></div></div><div class="progress-track"><div class="progress-fill" style="width:${r.progress}%"></div></div>${blocked ? '<div class="recovery"><strong>Recovery path</strong><br>Identify the blocker → set a useful next action → resume.</div>' : ''}<div class="actions"><button class="button secondary" data-edit>Edit metadata</button><button class="button ghost" data-next>Set next action</button><button class="button ghost" data-progress>Update progress</button>${availableActions(r.status).map(a=>`<button class="button ${a==='archive'?'danger':''}" data-action="${a}">${human(a)}</button>`).join('')}</div></section></div><aside class="panel"><div class="panel-header"><h3>History</h3><span class="count">${state.history.length}</span></div><div class="timeline">${events(state.history)}</div></aside></div>`, 'detail')
  bindDetail()
}

function bindShell() {
  document.querySelectorAll('[data-nav]').forEach(button => button.onclick = () => navigate(button.dataset.nav === 'today' ? '/' : '/runs'))
  document.querySelectorAll('[data-create]').forEach(button => button.onclick = showCreate)
  const logout = document.querySelector('#logout'); if (logout) logout.onclick = async () => { await api('/api/auth/logout',{method:'POST'}); state.user=null; renderAuth() }
  bindRunLinks()
}
function bindRunLinks() { document.querySelectorAll('[data-run]').forEach(link => link.onclick = (e) => { e.preventDefault(); navigate(`/runs/${link.dataset.run}`) }) }
async function navigate(path) { history.pushState({},'',path); state.view = path === '/' ? 'today' : path === '/runs' ? 'runs' : 'detail'; await loadData(); render() }

function modal(title, fields, onSubmit) {
  const node = document.createElement('div'); node.className='modal-backdrop'; node.innerHTML=`<section class="modal" role="dialog" aria-modal="true"><header class="modal-header"><h3>${title}</h3><button class="icon-button" type="button" aria-label="Close">×</button></header><form>${fields}<div id="modal-error"></div><button class="button full" type="submit">Save</button></form></section>`; document.body.append(node)
  const close=()=>node.remove(); node.querySelector('.icon-button').onclick=close; node.onclick=(e)=>{if(e.target===node)close()}; node.querySelector('form').onsubmit=async(e)=>{e.preventDefault();try{await onSubmit(Object.fromEntries(new FormData(e.currentTarget).entries()));close();await loadData();render();toast('Run updated')}catch(error){node.querySelector('#modal-error').innerHTML=`<div class="error-banner">${escapeHtml(error.message)}</div>`}}
}
const field=(name,label,value='',type='text',required=false)=>`<div class="field"><label for="m-${name}">${label}</label><input id="m-${name}" name="${name}" type="${type}" value="${escapeHtml(value??'')}" ${required?'required':''}></div>`
function showCreate(){modal('Create a Run',`<div class="form-grid">${field('title','Title','','text',true)}<div class="field"><label for="m-type">Type</label><select id="m-type" name="type">${['project','task_stream','habit','fitness','learning','hobby','custom'].map(x=>`<option value="${x}">${human(x)}</option>`).join('')}</select></div><div class="field span-2"><label for="m-outcome">Desired outcome</label><textarea id="m-outcome" name="outcome"></textarea></div>${field('nextAction','Next action')}${field('dueAt','Due date','','datetime-local')}</div>`,async data=>{if(!data.dueAt)delete data.dueAt;else data.dueAt=new Date(data.dueAt).toISOString();await api('/api/runs',{method:'POST',body:JSON.stringify(data)})})}
function bindDetail(){
  document.querySelector('[data-edit]').onclick=()=>modal('Edit Run',`${field('title','Title',state.detail.title,'text',true)}<div class="field"><label for="m-outcome">Desired outcome</label><textarea id="m-outcome" name="outcome">${escapeHtml(state.detail.outcome)}</textarea></div><div class="field"><label for="m-priority">Priority</label><select id="m-priority" name="priority">${['low','normal','high','critical'].map(x=>`<option ${x===state.detail.priority?'selected':''}>${x}</option>`).join('')}</select></div>`,data=>api(`/api/runs/${state.detail.id}`,{method:'PATCH',body:JSON.stringify(data)}))
  document.querySelector('[data-next]').onclick=()=>modal('Set next action',field('nextAction','What is the next concrete action?',state.detail.nextAction,'text',true),data=>api(`/api/runs/${state.detail.id}/next-action`,{method:'PATCH',body:JSON.stringify(data)}))
  document.querySelector('[data-progress]').onclick=()=>modal('Update progress',field('progress','Progress (0–100)',state.detail.progress,'number',true),data=>api(`/api/runs/${state.detail.id}/progress`,{method:'PATCH',body:JSON.stringify({progress:Number(data.progress)})}))
  document.querySelectorAll('[data-action]').forEach(button=>button.onclick=()=>runAction(button.dataset.action))
}
async function runAction(action){try{if(action==='block')return modal('Block Run',field('blocker','What is blocking this Run?','','text',true),data=>api(`/api/runs/${state.detail.id}/block`,{method:'POST',body:JSON.stringify(data)}));await api(`/api/runs/${state.detail.id}/${action}`,{method:'POST'});await loadData();render();toast(`Run ${action}d`)}catch(error){toast(error.message,true)}}
function toast(message,isError=false){const node=document.createElement('div');node.className='toast';node.textContent=message;if(isError)node.style.background='#8f302b';document.body.append(node);setTimeout(()=>node.remove(),2800)}
function renderFatal(error){app.innerHTML=`<main class="loading-state"><h2>Runner OS could not load</h2><p>${escapeHtml(error.message)}</p><button class="button" onclick="location.reload()">Retry</button></main>`}
window.addEventListener('popstate',()=>{state.view=location.pathname==='/'?'today':location.pathname==='/runs'?'runs':'detail';loadData().then(render)})
boot()
