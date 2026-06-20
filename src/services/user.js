import http from './http'

export async function login({ username, password }) {
  if (!username || !password) throw new Error('username and password required')
  return http.post('/api/auth/login', { username, password })
}

export async function register({ username, password, nickname }) {
  if (!username || !password) throw new Error('username and password required')
  return http.post('/api/auth/register', { username, password, nickname })
}

export default { login, register }
