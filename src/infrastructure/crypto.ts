const encoder = new TextEncoder()

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

export function randomToken(byteLength = 32): string {
  return bytesToBase64(crypto.getRandomValues(new Uint8Array(byteLength)))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
}

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value))
  return bytesToBase64(new Uint8Array(digest))
}

export async function hashPassword(password: string, salt = bytesToBase64(crypto.getRandomValues(new Uint8Array(16)))): Promise<{ hash: string; salt: string }> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: base64ToBytes(salt).buffer as ArrayBuffer, iterations: 210_000 },
    key,
    256,
  )
  return { hash: bytesToBase64(new Uint8Array(bits)), salt }
}

export async function verifyPassword(password: string, expectedHash: string, salt: string): Promise<boolean> {
  const { hash } = await hashPassword(password, salt)
  if (hash.length !== expectedHash.length) return false
  let diff = 0
  for (let index = 0; index < hash.length; index += 1) diff |= hash.charCodeAt(index) ^ expectedHash.charCodeAt(index)
  return diff === 0
}
