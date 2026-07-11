// Centralized API helper — normalizes the base URL and wraps fetch calls.
let baseUrl = import.meta.env.VITE_API_URL || ''
if (baseUrl) {
  baseUrl = baseUrl.trim()
  if (!baseUrl.startsWith('http') && !baseUrl.startsWith('/')) baseUrl = `https://${baseUrl}`
  baseUrl = baseUrl.replace(/\/$/, '')
}

export const API_BASE = baseUrl

async function request(method, path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data
}

export const api = {
  login: (username, password) => request('POST', '/api/login', { username, password }),
  register: (username, password) => request('POST', '/api/register', { username, password }),
  getCharacters: (userId) => request('GET', `/api/users/${userId}/characters`),
  createCharacter: (userId, payload) => request('POST', `/api/users/${userId}/characters`, payload),
  deleteCharacter: (charId) => request('DELETE', `/api/characters/${charId}`),
  saveCharacter: (charId, payload) => request('PUT', `/api/characters/${charId}/save`, payload)
}
