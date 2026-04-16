// Simple in-memory user service for authentication and profile management.
// This is intentionally simple for demo / local usage. For production, replace with server API.

const users = new Map() // username -> { username, passwordHash, id, favorites: Set, diaryIds: [] }
let idCounter = 1

function hash(pw) {
  // simple hash stub (do NOT use in production)
  let h = 2166136261
  for (let i = 0; i < pw.length; i++) {
    h ^= pw.charCodeAt(i)
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)
  }
  return (h >>> 0).toString(16)
}

export function createUserService() {
  const sessions = new Map() // token -> username

  function register({ username, password }) {
    if (!username || !password) throw new Error('username and password required')
    if (users.has(username)) throw new Error('user exists')
    const id = 'u' + (idCounter++)
    users.set(username, { username, passwordHash: hash(password), id, favorites: new Set(), diaryIds: [] })
    return { username, id }
  }

  function login({ username, password }) {
    const u = users.get(username)
    if (!u) throw new Error('user not found')
    if (u.passwordHash !== hash(password)) throw new Error('invalid credentials')
    const token = 't' + Date.now() + Math.random().toString(36).slice(2)
    sessions.set(token, username)
    return { token, user: { username: u.username, id: u.id } }
  }

  function logout(token) {
    sessions.delete(token)
  }

  function getUserByToken(token) {
    const username = sessions.get(token)
    if (!username) return null
    const u = users.get(username)
    if (!u) return null
    return { username: u.username, id: u.id, favorites: Array.from(u.favorites), diaryIds: Array.from(u.diaryIds) }
  }

  function addFavorite(token, item) {
    const username = sessions.get(token)
    if (!username) throw new Error('not authenticated')
    const u = users.get(username)
    u.favorites.add(item)
    return true
  }

  function removeFavorite(token, item) {
    const username = sessions.get(token)
    if (!username) throw new Error('not authenticated')
    const u = users.get(username)
    u.favorites.delete(item)
    return true
  }

  function addDiaryId(token, diaryId) {
    const username = sessions.get(token)
    if (!username) throw new Error('not authenticated')
    const u = users.get(username)
    u.diaryIds.push(diaryId)
  }

  return { register, login, logout, getUserByToken, addFavorite, removeFavorite, addDiaryId }
}

export default createUserService()
