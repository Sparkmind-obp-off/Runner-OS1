// Clerk (Google sign-in only) for the static Runner OS frontend.
// The browser never decides identity: it only forwards a short-lived Clerk session token
// to the server, which verifies it and issues the HttpOnly Runner OS session cookie.

let configPromise = null
let clerkPromise = null
const INTENT_KEY = 'runneros_clerk_intent'
export const CALLBACK_PATH = '/sso-callback'

export function getAuthConfig() {
  if (!configPromise) {
    configPromise = fetch('/api/auth/config', { credentials: 'same-origin' })
      .then((response) => response.ok ? response.json() : { data: null })
      .then((payload) => payload.data?.clerk ?? { enabled: false })
      .catch(() => ({ enabled: false }))
  }
  return configPromise
}

export async function loadClerk() {
  const config = await getAuthConfig()
  if (!config.enabled) throw new Error('Login Google belum dikonfigurasi.')
  if (!clerkPromise) {
    clerkPromise = new Promise((resolve, reject) => {
      if (window.Clerk) return resolve(window.Clerk)
      const script = document.createElement('script')
      script.src = `${config.frontendApi}/npm/@clerk/clerk-js@5/dist/clerk.browser.js`
      script.async = true
      script.crossOrigin = 'anonymous'
      script.dataset.clerkPublishableKey = config.publishableKey
      const timer = setTimeout(() => reject(new Error('Layanan login Google belum dapat dihubungi. Coba lagi nanti atau gunakan email dan kata sandi.')), 15000)
      script.onload = () => { clearTimeout(timer); window.Clerk ? resolve(window.Clerk) : reject(new Error('Layanan login Google gagal dimuat.')) }
      script.onerror = () => { clearTimeout(timer); reject(new Error('Layanan login Google belum dapat dihubungi. Coba lagi nanti atau gunakan email dan kata sandi.')) }
      document.head.append(script)
    }).then(async (clerk) => { await clerk.load(); return clerk })
    clerkPromise.catch(() => { clerkPromise = null })
  }
  return clerkPromise
}

/** Starts the Google OAuth redirect. intent = 'signin' | 'link'. */
export async function startGoogle(intent = 'signin') {
  const clerk = await loadClerk()
  sessionStorage.setItem(INTENT_KEY, intent)
  if (clerk.session) return exchange(clerk) // already signed in at Clerk → finish immediately
  await clerk.client.signIn.authenticateWithRedirect({
    strategy: 'oauth_google',
    redirectUrl: `${location.origin}${CALLBACK_PATH}`,
    redirectUrlComplete: `${location.origin}${CALLBACK_PATH}?done=1`,
  })
  return null
}

export function isClerkCallback() {
  return location.pathname === CALLBACK_PATH
}

/** Handles the return from Google/Clerk and exchanges the token for a Runner OS session. */
export async function completeCallback() {
  const clerk = await loadClerk()
  if (!new URLSearchParams(location.search).has('done') && !clerk.session) {
    await clerk.handleRedirectCallback({ signInFallbackRedirectUrl: `${CALLBACK_PATH}?done=1`, signUpFallbackRedirectUrl: `${CALLBACK_PATH}?done=1` })
    if (!clerk.session) return { status: 'pending' }
  }
  return exchange(clerk)
}

async function exchange(clerk) {
  const intent = sessionStorage.getItem(INTENT_KEY) || 'signin'
  sessionStorage.removeItem(INTENT_KEY)
  const token = await clerk.session?.getToken()
  if (!token) throw new Error('Sesi Google tidak ditemukan. Silakan coba lagi.')
  const path = intent === 'link' ? '/api/auth/clerk/link' : '/api/auth/clerk/session'
  const response = await fetch(path, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    // The Clerk session is only a bridge; never leave it dangling after a refused exchange.
    if (intent !== 'link') await clerk.signOut().catch(() => {})
    const error = new Error(payload.error?.message || 'Login Google gagal.')
    error.code = payload.error?.code
    error.intent = intent
    throw error
  }
  return { status: 'ok', intent, data: payload.data }
}

/** Ends the Clerk browser session too (best effort) so a shared device does not stay signed in to Google via Clerk. */
export async function clerkSignOut() {
  const config = await getAuthConfig()
  if (!config.enabled) return
  try { const clerk = await loadClerk(); if (clerk.session) await clerk.signOut() } catch { /* Runner OS session is already revoked server-side */ }
}
