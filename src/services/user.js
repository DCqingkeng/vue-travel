import http from './http'

export async function login({ username, password }) {
  if (!username || !password) throw new Error('username and password required')
  return http.post('/api/user/login', { username, password })
}

export default { login }
