export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  const headers: Record<string, string> = { ...(options.headers as Record<string, string> || {}) }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  if (!headers['Content-Type'] && options.body) {
    headers['Content-Type'] = 'application/json'
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  return res
}
