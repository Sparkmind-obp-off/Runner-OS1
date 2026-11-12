import { getAuthConfig, loadClerk, startGoogle, isClerkCallback, completeCallback, clerkSignOut } from './clerk-auth.js'
const app = document.querySelector('#app')
const localToday = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}
const routeView = () => location.pathname.startsWith('/runs/') ? 'detail' : ({'/runs':'runs','/activities':'activities','/schedule':'schedule','/events':'events','/profile':'profile','/ai':'ai'}[location.pathname] || 'home')
const state = {
  user: null, profile: null, home: null,
  runs: [], today: null, view: routeView(), detail: null, history: [],
  activities: [], recurring: [], events: [],
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
  if (isClerkCallback()) return handleClerkCallback()
  try {
    state.user = await api('/api/auth/me')
    if (!state.user) return renderAuth()
    state.profile = await api('/api/profile')
    if (!state.profile?.onboardingCompletedAt) return renderOnboarding()
    await loadData()
    render()
  } catch (error) {
    if (error.code === 'AUTH_REQUIRED') renderAuth()
    else renderFatal(error)
  }
}

async function handleClerkCallback() {
  app.innerHTML = '<section class="loading-state" aria-live="polite">Menyelesaikan login Google…</section>'
  try {
    const result = await completeCallback()
    if (result.status === 'pending') { history.replaceState({}, '', '/'); return renderAuth('login', 'Login Google belum selesai. Silakan coba lagi.') }
    history.replaceState({}, '', result.intent === 'link' ? '/profile' : '/')
    state.view = routeView()
    if (result.intent === 'link') toast('Akun Google berhasil dihubungkan')
    return boot()
  } catch (error) {
    history.replaceState({}, '', error.intent === 'link' ? '/profile' : '/')
    state.view = routeView()
    if (error.intent === 'link') { await boot(); return toast(error.message, true) }
    return renderAuth('login', error.message)
  }
}

async function googleButton(mode) {
  const config = await getAuthConfig()
  const slot = document.querySelector('#google-slot')
  if (!slot || !config.enabled) return
  // Only offer Google when the identity service is actually reachable; never show a dead button.
  try { await loadClerk() } catch { return }
  if (!document.body.contains(slot)) return
  slot.innerHTML = `<button id="google-signin" class="button ghost full google-button" type="button"><span aria-hidden="true" class="google-mark">G</span> ${mode==='register'?'Daftar':'Masuk'} dengan Google</button><div class="auth-divider" role="separator"><span>atau gunakan email</span></div>`
  const button = document.querySelector('#google-signin')
  button.onclick = async () => {
    button.disabled = true
    button.setAttribute('aria-busy', 'true')
    button.textContent = 'Menghubungkan ke Google…'
    try {
      const result = await startGoogle('signin')
      if (result?.status === 'ok') { history.replaceState({}, '', '/'); return boot() }
    } catch (error) {
      renderAuth(mode, error.message)
    }
  }
}

async function loadData() {
  const [runs, today, home] = await Promise.all([api('/api/runs'), api(`/api/today?date=${localToday()}`), api('/api/home')])
  state.runs = runs
  state.today = today
  state.home = home
  state.profile = home.profile
  state.activities = state.view === 'activities' ? await api('/api/activities') : home.recentActivities
  state.recurring = state.view === 'schedule' ? await api('/api/recurring-activities') : home.recurringActivities
  state.events = state.view === 'events' ? await api('/api/events') : home.events
  if (state.view === 'detail') {
    const id = location.pathname.split('/')[2]
    ;[state.detail, state.history] = await Promise.all([api(`/api/runs/${id}`), api(`/api/runs/${id}/history`)])
  }
}

function renderAuth(mode = 'welcome', message = '') {
  if (mode === 'welcome') {
    app.innerHTML = `<main class="welcome"><section><div class="brand-mark">RUNNER OS</div><div class="eyebrow welcome-eyebrow">PERSONAL RUNNING OS</div><h1>Bangun rutinitas lari yang terasa milikmu.</h1><p>Satukan catatan lari, jadwal, target, dan persiapan. Dapatkan arahan yang memahami konteksmu—tanpa harus bergantung pada Strava.</p><div class="welcome-points"><span>01 · Catat progresmu</span><span>02 · Susun rutinitas realistis</span><span>03 · Dapatkan bantuan AI yang terarah</span></div><div class="actions"><button id="start-setup" class="button">Mulai bangun rutinitas</button><button id="returning" class="button ghost">Saya sudah punya akun</button></div><p class="welcome-note">Data aktivitas tetap milik akunmu. Integrasi eksternal bersifat opsional.</p></section></main>`
    document.querySelector('#start-setup').onclick=()=>{onboardingStep=0;onboardingDraft={};renderAuth('register')}
    document.querySelector('#returning').onclick=()=>renderAuth('login')
    return
  }
  app.innerHTML = `<main class="auth-layout"><section class="brand-panel"><div class="brand-mark">Runner OS</div><div><h1>${mode==='login'?'Selamat datang kembali.':'Mulai dari konteksmu.'}</h1><p>Data larimu tetap pribadi dan terikat ke akunmu.</p></div><small>Rencana → Lari → Catat → Pulih</small></section><section class="auth-panel"><div class="auth-card"><div class="eyebrow">${mode==='login'?'Masuk':'Buat akun'}</div><h2>${mode==='login'?'Lanjutkan dari sini.':'Siapkan Runner OS.'}</h2>${message?`<div class="error-banner" role="alert">${escapeHtml(message)}</div>`:''}<div id="google-slot"></div><form id="auth-form">${mode==='register'?field('displayName','Nama panggilan','','text',true,'name'):''}${field('email','Email','','email',true,'email')}${field('password','Kata sandi','','password',true,mode==='register'?'new-password':'current-password',mode==='register'?12:1)}<button class="button full" type="submit">${mode==='login'?'Masuk':'Buat akun & mulai setup'}</button></form><p class="subtle"><button id="switch-auth" class="text-button">${mode==='login'?'Belum punya akun? Mulai Setup':'Sudah punya akun? Masuk'}</button></p></div></section></main>`
  document.querySelector('#switch-auth').onclick = () => renderAuth(mode === 'login' ? 'register' : 'login')
  googleButton(mode)
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
      state.view = 'home'
      state.profile = await api('/api/profile')
      if (!state.profile?.onboardingCompletedAt) return renderOnboarding()
      await loadData()
      render()
    } catch (error) {
      state.user = null
      renderAuth(mode, error.message)
    }
  }
}

function shell(content, active = state.view) {
  const nav=[['home','/','Hari ini'],['activities','/activities','Aktivitas'],['schedule','/schedule','Jadwal'],['events','/events','Event'],['runs','/runs','Rencana'],['profile','/profile','Profil'],['ai','/ai','Asisten AI']]
  return `<div class="shell"><aside class="sidebar"><div><div class="logo">Runner OS</div><div class="phase-label">Personal running cockpit</div></div><nav class="nav" aria-label="Navigasi utama">${nav.map(([key,path,label])=>`<button data-path="${path}" class="${active===key||(key==='runs'&&active==='detail')?'active':''}">${label}</button>`).join('')}</nav><footer class="sidebar-footer"><div class="user-name">${escapeHtml(state.profile?.displayName||state.user.displayName)}</div><div class="user-email">${escapeHtml(state.user.email)}</div><button id="logout" class="text-button">Keluar</button></footer></aside><main class="main">${content}</main></div>`
}

function render() {
  if (state.view === 'runs') renderRuns()
  else if (state.view === 'detail') renderDetail()
  else if (state.view === 'activities') renderActivities()
  else if (state.view === 'schedule') renderSchedule()
  else if (state.view === 'events') renderEvents()
  else if (state.view === 'profile') renderProfile()
  else if (state.view === 'ai') renderAI()
  else renderHome()
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

let onboardingStep=0
let onboardingDraft={}
function renderOnboarding(){
  const steps=[
    {title:'Kenalan dulu',copy:'Mulai dari informasi sederhana. Kamu bisa mengubahnya kapan saja.',fields:field('displayName','Nama panggilan',onboardingDraft.displayName||state.user.displayName,'text',true)+field('runningArea','Di mana biasanya kamu lari?',onboardingDraft.runningArea||'')},
    {title:'Apa tujuan larimu?',copy:'Pilih fokus yang paling penting sekarang. Tidak perlu punya target sempurna.',fields:field('primaryGoal','Target atau tujuan utama',onboardingDraft.primaryGoal||'')+field('preferredDistances','Jarak yang ingin dijelajahi (pisahkan koma)',onboardingDraft.preferredDistances||'')+field('preferredEventTypes','Event yang menarik bagimu (opsional)',onboardingDraft.preferredEventTypes||'')},
    {title:'Atur ritme yang realistis',copy:'Isi yang sudah kamu tahu. Jadwal fleksibel juga tidak masalah.',fields:field('preferredDays','Hari yang biasanya tersedia (pisahkan koma)',onboardingDraft.preferredDays||'')+field('preferredTime','Waktu yang nyaman untuk lari',onboardingDraft.preferredTime||'')+`<div class="field"><label for="m-runningWithOthersPreference">Lebih nyaman lari...</label><select id="m-runningWithOthersPreference" name="runningWithOthersPreference"><option value="" ${selected(onboardingDraft.runningWithOthersPreference,'')}>Belum tahu</option><option value="lebih_suka_bareng" ${selected(onboardingDraft.runningWithOthersPreference,'lebih_suka_bareng')}>Bersama orang lain</option><option value="fleksibel" ${selected(onboardingDraft.runningWithOthersPreference,'fleksibel')}>Fleksibel</option><option value="lebih_suka_sendiri" ${selected(onboardingDraft.runningWithOthersPreference,'lebih_suka_sendiri')}>Sendiri</option></select></div>`+field('communities','Komunitas lari (opsional)',onboardingDraft.communities||'')},
    {title:'Siapkan rutinitas pertamamu',copy:'Tambahkan jadwal berulang jika memang cocok. Semua pilihan bisa dilewati.',fields:`<label class="choice"><input type="checkbox" name="addMjw" ${onboardingDraft.addMjw?'checked':''}> Saya ingin menambahkan MJW (Mlayu Jumat Wengi)</label>`+field('weeklyName','Rutinitas lain (opsional)',onboardingDraft.weeklyName||'')+field('weeklyDay','Hari rutinitas (opsional)',onboardingDraft.weeklyDay||'')+`<div class="setup-summary"><strong>Ringkasan awal</strong><p>${escapeHtml(onboardingDraft.displayName||state.user.displayName)} · ${escapeHtml(onboardingDraft.runningArea||'Area belum ditentukan')}</p><p>Fokus: ${escapeHtml(onboardingDraft.primaryGoal||'Akan ditentukan nanti')}</p><p>Jadwal: ${escapeHtml(onboardingDraft.preferredDays||'Fleksibel')} · ${escapeHtml(onboardingDraft.preferredTime||'Waktu bebas')}</p><small>Kamu bisa mengubah semua informasi ini dari menu Profil.</small></div>`},
  ]
  const step=steps[onboardingStep]
  const progress=Math.round(((onboardingStep+1)/steps.length)*100)
  app.innerHTML=`<main class="onboarding"><section class="onboarding-card"><div class="onboarding-progress" role="progressbar" aria-label="Progres pengaturan profil" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><span style="width:${progress}%"></span></div><div class="eyebrow">LANGKAH ${onboardingStep+1} DARI ${steps.length}</div><h1>${step.title}</h1><p class="subtle">${step.copy}</p><form id="onboarding-form">${step.fields}<div class="onboarding-actions">${onboardingStep?'<button type="button" class="button ghost" id="back-step">Kembali</button>':''}<button type="button" class="text-button" id="skip-step">${onboardingStep===steps.length-1?'Kembali ke awal':'Lewati dulu'}</button><button class="button" type="submit">${onboardingStep===steps.length-1?'Simpan dan mulai':'Lanjut'}</button></div></form></section></main>`
  document.querySelector('#back-step')?.addEventListener('click',()=>{onboardingStep--;renderOnboarding()})
  document.querySelector('#skip-step').onclick=()=>{if(onboardingStep===steps.length-1){onboardingStep=0}else{onboardingStep++}renderOnboarding()}
  document.querySelector('#onboarding-form').onsubmit=async(e)=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.currentTarget).entries());onboardingDraft={...onboardingDraft,...f,addMjw:e.currentTarget.querySelector('[name="addMjw"]')?.checked??onboardingDraft.addMjw??false};if(onboardingStep<steps.length-1){onboardingStep++;return renderOnboarding()}const submit=e.currentTarget.querySelector('button[type="submit"]');submit.disabled=true;submit.textContent='Menyimpan…';try{await finishOnboarding()}catch(error){submit.disabled=false;submit.textContent='Simpan dan mulai';toast(error.message,true)}}
}
async function finishOnboarding(){
  const profile={displayName:onboardingDraft.displayName||state.user.displayName,runningArea:onboardingDraft.runningArea||null,preferredDays:splitList(onboardingDraft.preferredDays),preferredTime:onboardingDraft.preferredTime||null,preferredDistances:splitList(onboardingDraft.preferredDistances),primaryGoal:onboardingDraft.primaryGoal||null,preferredEventTypes:splitList(onboardingDraft.preferredEventTypes),runningWithOthersPreference:onboardingDraft.runningWithOthersPreference||null,communities:splitList(onboardingDraft.communities),notes:null,onboardingCompletedAt:new Date().toISOString()}
  await api('/api/profile',{method:'PUT',body:JSON.stringify(profile)})
  const existing=await api('/api/recurring-activities')
  if(onboardingDraft.addMjw&&!existing.some(item=>item.name.toLowerCase()==='mjw'))await api('/api/recurring-activities',{method:'POST',body:JSON.stringify({name:'MJW',activityType:'community_run',recurrenceRule:'FREQ=WEEKLY;BYDAY=FR',usualDay:'Jumat',usualTime:'malam',usualLocation:null,community:null,expectedDistanceMeters:null,notes:'Mlayu Jumat Wengi. Kehadiran tidak diasumsikan.',source:'user_confirmed',relevanceWeight:.85,active:true})})
  if(onboardingDraft.weeklyName&&!existing.some(item=>item.name.toLowerCase()===String(onboardingDraft.weeklyName).toLowerCase()))await api('/api/recurring-activities',{method:'POST',body:JSON.stringify({name:onboardingDraft.weeklyName,activityType:'running_training',recurrenceRule:`FREQ=WEEKLY${dayCode(onboardingDraft.weeklyDay)?`;BYDAY=${dayCode(onboardingDraft.weeklyDay)}`:''}`,usualDay:onboardingDraft.weeklyDay||null,usualTime:null,usualLocation:null,community:null,expectedDistanceMeters:null,notes:null,source:'user_confirmed',relevanceWeight:.6,active:true})})
  history.replaceState({},'','/');state.view='home';await loadData();render()
}
const splitList=v=>String(v||'').split(',').map(x=>x.trim()).filter(Boolean)
const selected=(actual,expected)=>String(actual||'')===expected?'selected':''
const dayCode=value=>({senin:'MO',selasa:'TU',rabu:'WE',kamis:'TH',jumat:'FR',sabtu:'SA',minggu:'SU'}[String(value||'').trim().toLowerCase()]||'')

function renderHome(){
  const p=state.profile,h=state.home,occurrence=h.todayContext,rec=occurrence?h.recurringActivities.find(item=>item.id===occurrence.recurringActivityId):h.recurringActivities?.[0],eventContext=h.eventContexts?.[0],event=eventContext?.event||h.events?.[0],activity=h.recentActivities?.[0]
  const eventDate=event?(event.eventDate?date(event.eventDate):`${event.monthHint||'Tanggal'} ${event.editionYear||''} — tanggal belum terverifikasi`):''
  const nextCopy=occurrence?`${date(occurrence.scheduledAt)} · status ${human(occurrence.status)}`:rec?`${escapeHtml(rec.usualDay||'Jadwal fleksibel')} · ${escapeHtml(rec.usualTime||'waktu belum diatur')}`:'Tambahkan rutinitas seperti MJW atau latihan mingguan.'
  app.innerHTML=shell(`${header('Hari ini',`Halo, ${escapeHtml(p.displayName)}.`,`Konteks yang paling relevan untuk lari dan persiapanmu.`,false)}<section class="cockpit-grid"><article class="hero-card"><div class="eyebrow">LANGKAH BERIKUTNYA</div><h2>${rec?escapeHtml(rec.name):'Mulai dari satu langkah kecil'}</h2><p>${nextCopy}</p>${rec?.name.toLowerCase()==='mjw'?'<small>Jadwal ini tersimpan sebagai rencana, bukan bukti kehadiran.</small>':''}<div class="actions"><button class="button secondary" data-path="/activities">Catat aktivitas</button><button class="button ghost" data-path="/schedule">Atur jadwal</button></div></article><article class="panel"><h3>Event terdekat</h3>${event?`<p><strong>${escapeHtml(event.name)}</strong></p><p class="subtle">${escapeHtml(eventDate)}</p>${eventContext?`<span class="badge">Relevansi ${escapeHtml(eventContext.relevance)}</span><small class="truth-note">Relevansi bukan prediksi kehadiran.</small>`:''}`:'<div class="empty">Belum ada event yang disimpan.</div>'}</article><article class="panel"><h3>Aktivitas terbaru</h3>${activity?`<p><strong>${date(activity.startedAt)}</strong></p><p class="subtle">${activity.distanceMeters?`${(activity.distanceMeters/1000).toFixed(1)} km`:'Jarak tidak dicatat'} ${activity.durationSeconds?`· ${Math.round(activity.durationSeconds/60)} menit`:'· durasi tidak dicatat'}</p>`:'<div class="empty">Belum ada riwayat lari. Metrik kosong tetap valid.</div>'}</article><article class="panel"><h3>Persiapan</h3><p class="subtle">Cek jadwal, cuaca, perlengkapan, hidrasi, dan waktu pemulihan sesuai kebutuhanmu.</p></article><article class="panel ai-entry"><h3>Tanya AI</h3><p class="subtle">Tanyakan jadwal, riwayat, event, atau persiapan berdasarkan data yang kamu simpan.</p><button class="button" data-path="/ai">Mulai bertanya</button></article></section>`, 'home')
}

function renderActivities(){app.innerHTML=shell(`${header('Riwayat lari','Aktivitas aktual','Catatan faktual dari input manual atau integrasi resmi.',false)}<button class="button" id="add-activity">+ Catat lari</button><section class="activity-list">${state.activities.map(a=>`<article class="panel"><strong>${date(a.startedAt)}</strong><p>${a.distanceMeters?`${(a.distanceMeters/1000).toFixed(2)} km`:'Jarak tidak dicatat'} · ${a.durationSeconds?`${Math.round(a.durationSeconds/60)} menit`:'Durasi tidak dicatat'}</p><small>Sumber: ${escapeHtml(a.source)}</small></article>`).join('')||'<div class="empty">Belum ada riwayat lari.</div>'}</section>`,'activities');document.querySelector('#add-activity').onclick=()=>modal('Catat lari',field('startedAt','Mulai',toLocalInput(new Date().toISOString()),'datetime-local',true)+field('distanceKm','Jarak (km)','','number')+field('durationMinutes','Durasi (menit)','','number')+field('notes','Catatan'),async d=>api('/api/activities',{method:'POST',body:JSON.stringify({startedAt:new Date(d.startedAt).toISOString(),endedAt:null,durationSeconds:d.durationMinutes?Number(d.durationMinutes)*60:null,distanceMeters:d.distanceKm?Number(d.distanceKm)*1000:null,paceSecondsPerKm:null,elevationMeters:null,effort:null,feeling:null,source:'manual',externalId:null,eventId:null,recurringActivityId:null,notes:d.notes||null})}),'Simpan aktivitas')}
function renderSchedule(){app.innerHTML=shell(`${header('Jadwal','Rutinitas mingguan','Rencana berulang terpisah dari fakta kehadiran.',false)}<button class="button" id="add-recurring">+ Tambah rutinitas</button><section class="activity-list">${state.recurring.map(r=>`<article class="panel"><div class="run-top"><strong>${escapeHtml(r.name)}</strong><span class="badge">${escapeHtml(r.activityType)}</span></div><p>${escapeHtml(r.usualDay||'Hari fleksibel')} · ${escapeHtml(r.usualTime||'waktu belum diatur')}</p><small>${r.name.toLowerCase()==='mjw'?'Mlayu Jumat Wengi · kehadiran tidak dijamin':escapeHtml(r.recurrenceRule)}</small><div class="card-actions"><button class="text-button" data-edit-recurring="${r.id}">Ubah</button><button class="text-button" data-record-occurrence="${r.id}">Catat kehadiran</button></div></article>`).join('')||'<div class="empty">Belum ada rutinitas.</div>'}</section>`,'schedule');document.querySelector('#add-recurring').onclick=()=>recurringModal();document.querySelectorAll('[data-edit-recurring]').forEach(button=>button.onclick=()=>recurringModal(state.recurring.find(item=>item.id===button.dataset.editRecurring)));document.querySelectorAll('[data-record-occurrence]').forEach(button=>button.onclick=()=>occurrenceModal(button.dataset.recordOccurrence))}
function renderEvents(){app.innerHTML=shell(`${header('Event','Event yang relevan','Relevansi membantu prioritas, bukan prediksi kehadiran.',false)}<button class="button" id="add-skybridge">+ Simpan Skybridge 2026</button><section class="activity-list">${state.events.map(e=>`<article class="panel"><div class="run-top"><strong>${escapeHtml(e.name)}</strong><span class="badge ${e.dateStatus==='unverified'?'upcoming':'active'}">${e.dateStatus}</span></div><p>${e.eventDate?date(e.eventDate):`${escapeHtml(e.monthHint||'Tanggal belum ada')} ${e.editionYear||''} — tanggal belum terverifikasi`}</p><small>Minat: ${escapeHtml(e.participationIntent)} · bukan kepastian hadir</small><div class="card-actions"><button class="text-button" data-add-evidence="${e.id}">Tambah sinyal / bukti</button></div></article>`).join('')||'<div class="empty">Belum ada event pribadi.</div>'}</section>`,'events');document.querySelector('#add-skybridge').onclick=async()=>{try{await api('/api/events',{method:'POST',body:JSON.stringify({name:'Skybridge Race Run',aliases:['Sky Bridge Run','Skybridge Run','KAI Daop 5 Skybridge Run'],editionYear:2026,monthHint:'November',eventDate:null,location:'Purwokerto',organizer:null,distanceOrCategory:null,registrationUrl:null,registrationDeadline:null,sourceUrl:null,status:'candidate',dateStatus:'unverified',participationIntent:'interested',notes:'Tanggal 2026 belum terverifikasi.'})});await loadData();render();toast('Skybridge Race Run disimpan dengan tanggal belum terverifikasi')}catch(e){toast(e.message,true)}};document.querySelectorAll('[data-add-evidence]').forEach(button=>button.onclick=()=>evidenceModal(button.dataset.addEvidence))}
function renderProfile(){const p=state.profile,i=state.home.integration;app.innerHTML=shell(`${header('Profil','Konteks larimu','Hanya informasi yang berguna untuk personalisasi.',false)}<div class="profile-grid"><section class="panel"><form id="profile-form">${field('displayName','Nama panggilan',p.displayName,'text',true)}${field('runningArea','Area lari',p.runningArea||'')}${field('preferredDays','Hari favorit',p.preferredDays.join(', '))}${field('preferredTime','Waktu favorit',p.preferredTime||'')}${field('preferredDistances','Jarak favorit',p.preferredDistances.join(', '))}${field('primaryGoal','Tujuan utama',p.primaryGoal||'')}${field('preferredEventTypes','Jenis event favorit',p.preferredEventTypes.join(', '))}${field('communities','Komunitas yang dikonfirmasi',p.communities.join(', '))}<div class="field"><label for="m-runningWithOthersPreference">Preferensi teman lari</label><select id="m-runningWithOthersPreference" name="runningWithOthersPreference"><option value="" ${selected(p.runningWithOthersPreference,'')}>Belum tahu</option><option value="lebih_suka_bareng" ${selected(p.runningWithOthersPreference,'lebih_suka_bareng')}>Lebih suka lari bareng</option><option value="fleksibel" ${selected(p.runningWithOthersPreference,'fleksibel')}>Fleksibel</option><option value="lebih_suka_sendiri" ${selected(p.runningWithOthersPreference,'lebih_suka_sendiri')}>Lebih suka sendiri</option></select></div><button class="button" type="submit">Simpan profil</button></form></section><aside class="panel integration-card" id="account-security"><div class="eyebrow">Keamanan akun</div><h3>Login Google</h3><p class="subtle" id="google-link-status">Memeriksa status…</p><button class="button ghost" id="google-link" hidden>Hubungkan akun Google</button></aside><aside class="panel integration-card"><div class="eyebrow">Integrasi opsional</div><h3>Strava</h3><p class="subtle">Status: ${human(i.status)}. Token tidak pernah dikirim ke browser.</p><button class="button ghost" id="strava-action" disabled aria-disabled="true">Strava belum tersedia</button><p id="strava-status" class="truth-note">Integrasi Strava sedang ditunda. Runner OS tetap berfungsi penuh tanpa Strava.</p></aside></div>`,'profile');document.querySelector('#profile-form').onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget).entries());await api('/api/profile',{method:'PUT',body:JSON.stringify({displayName:d.displayName,runningArea:d.runningArea||null,preferredDays:splitList(d.preferredDays),preferredTime:d.preferredTime||null,preferredDistances:splitList(d.preferredDistances),primaryGoal:d.primaryGoal||null,preferredEventTypes:splitList(d.preferredEventTypes),runningWithOthersPreference:d.runningWithOthersPreference||null,communities:splitList(d.communities),notes:p.notes,onboardingCompletedAt:p.onboardingCompletedAt})});await loadData();render();toast('Profil disimpan')};bindGoogleLink();document.querySelector('#strava-action').onclick=async()=>{const out=document.querySelector('#strava-status');try{if(i.status==='connected')await api('/api/integrations/strava/disconnect',{method:'POST'});else await api('/api/integrations/strava/connect',{method:'POST'});await loadData();render()}catch(error){out.textContent=error.message}}}
function renderAI(){app.innerHTML=shell(`${header('Tanya AI','Tanya tentang larimu','Konteks dipilih seperlunya. Tanya AI memberi saran untuk ditinjau dan tidak mengubah data.',false)}<section class="panel ai-console"><form id="ai-form">${field('question','Pertanyaan','','text',true)}<button class="button" type="submit">Tanya</button></form><div id="ai-answer" class="ai-answer subtle">Contoh: “Aku biasanya lari hari apa?”</div></section>`,'ai');document.querySelector('#ai-form').onsubmit=async e=>{e.preventDefault();const q=new FormData(e.currentTarget).get('question');const out=document.querySelector('#ai-answer');out.textContent='Menyiapkan konteks yang relevan…';try{const r=await api('/api/ai/ask',{method:'POST',body:JSON.stringify({question:q})});const suggestion=r.suggestion?`<section class="ai-suggestion"><strong>${escapeHtml(r.suggestion.title)}</strong><ul>${r.suggestion.items.map(item=>`<li>${escapeHtml(item)}</li>`).join('')}</ul><small>Saran saja — tinjau dan konfirmasi secara eksplisit sebelum melakukan perubahan.</small></section>`:'';out.innerHTML=`<p>${escapeHtml(r.answer)}</p>${suggestion}`}catch(err){out.innerHTML=`<div class="error-banner">${escapeHtml(err.message)}</div>`}}}

function recurringModal(item=null){
  const types=['community_run','running_training','structured_practice','coaching','learning','preparation','other']
  const fields=field('name','Nama',item?.name||'','text',true)+`<div class="field"><label for="m-activityType">Jenis aktivitas</label><select id="m-activityType" name="activityType">${types.map(type=>`<option value="${type}" ${selected(item?.activityType,type)}>${human(type)}</option>`).join('')}</select></div>`+field('recurrenceRule','Aturan pengulangan',item?.recurrenceRule||'FREQ=WEEKLY','text',true)+field('usualDay','Hari',item?.usualDay||'')+field('usualTime','Waktu',item?.usualTime||'')+field('usualLocation','Lokasi',item?.usualLocation||'')
  modal(item?'Ubah rutinitas':'Tambah rutinitas',fields,d=>api(item?`/api/recurring-activities/${item.id}`:'/api/recurring-activities',{method:item?'PUT':'POST',body:JSON.stringify({name:d.name,activityType:d.activityType,recurrenceRule:d.recurrenceRule,usualDay:d.usualDay||null,usualTime:d.usualTime||null,usualLocation:d.usualLocation||null,community:item?.community||null,expectedDistanceMeters:item?.expectedDistanceMeters||null,notes:item?.notes||null,source:item?.source||'user_confirmed',relevanceWeight:item?.relevanceWeight??.5,active:item?.active??true})}),'Simpan rutinitas')
}
function occurrenceModal(recurringActivityId){
  const fields=field('scheduledAt','Jadwal',toLocalInput(new Date().toISOString()),'datetime-local',true)+`<div class="field"><label for="m-status">Status aktual</label><select id="m-status" name="status"><option value="planned">Direncanakan</option><option value="attended">Hadir</option><option value="skipped">Tidak ikut</option><option value="unknown">Belum tahu</option></select></div>`+field('notes','Catatan')
  modal('Catat kehadiran',fields,d=>api(`/api/recurring-activities/${recurringActivityId}/occurrences`,{method:'PUT',body:JSON.stringify({scheduledAt:new Date(d.scheduledAt).toISOString(),status:d.status,linkedRunningActivityId:null,notes:d.notes||null})}),'Simpan kehadiran')
}
function evidenceModal(eventId){
  const types=['prior_participation','instagram_post','instagram_highlight','repost','explicit_confirmation','registration','public_event_listing']
  const strengths=['weak','moderate','strong','confirmed']
  const fields=`<div class="field"><label for="m-evidenceType">Jenis sinyal / bukti</label><select id="m-evidenceType" name="evidenceType">${types.map(type=>`<option value="${type}">${human(type)}</option>`).join('')}</select></div><div class="field"><label for="m-evidenceStrength">Kekuatan bukti</label><select id="m-evidenceStrength" name="evidenceStrength">${strengths.map(value=>`<option value="${value}">${human(value)}</option>`).join('')}</select></div>`+field('sourceUrl','URL sumber')+field('notes','Catatan')
  modal('Tambah sinyal event',fields,d=>api(`/api/events/${eventId}/evidence`,{method:'POST',body:JSON.stringify({evidenceType:d.evidenceType,evidenceStrength:d.evidenceStrength,sourceUrl:d.sourceUrl||null,observedAt:new Date().toISOString(),notes:d.notes||null})}),'Simpan bukti')
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
  document.querySelectorAll('[data-path]').forEach((button) => button.onclick = () => navigate(button.dataset.path))
  document.querySelectorAll('[data-create]').forEach((button) => button.onclick = showCreate)
  const logout = document.querySelector('#logout')
  if (logout) logout.onclick = async () => {
    try {
      await api('/api/auth/logout', { method:'POST' })
      await clerkSignOut()
      state.user = null
      state.runs = []
      state.today = null
      renderAuth('welcome')
    } catch (error) { toast(error.message, true) }
  }
  bindRunLinks()
}

function bindRunLinks() {
  document.querySelectorAll('[data-run]').forEach((link) => link.onclick = (event) => { event.preventDefault(); navigate(`/runs/${link.dataset.run}`) })
}

async function navigate(path) {
  history.pushState({}, '', path)
  state.view = routeView()
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
      toast('Perubahan disimpan')
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

async function bindGoogleLink() {
  const status = document.querySelector('#google-link-status')
  const button = document.querySelector('#google-link')
  if (!status || !button) return
  try {
    const { google } = await api('/api/auth/identities')
    if (google.linked) { status.textContent = `Terhubung sejak ${date(google.linkedAt)}. Kamu bisa masuk dengan Google.`; return }
    if (!google.available) { status.textContent = 'Login Google belum tersedia. Akunmu tetap memakai email dan kata sandi.'; return }
    status.textContent = 'Belum terhubung. Hubungkan agar bisa masuk dengan Google tanpa kehilangan data.'
    button.hidden = false
    button.onclick = async () => {
      button.disabled = true
      button.textContent = 'Menghubungkan…'
      try {
        const result = await startGoogle('link')
        if (result?.status === 'ok') { toast('Akun Google berhasil dihubungkan'); bindGoogleLink() }
      } catch (error) { button.disabled = false; button.textContent = 'Hubungkan akun Google'; toast(error.message, true) }
    }
  } catch (error) { status.textContent = error.message }
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
  state.view = routeView()
  loadData().then(render).catch(renderFatal)
})
boot()
