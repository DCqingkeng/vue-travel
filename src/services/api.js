// Lightweight API service wrapper using fetch with timeout and error handling.
const DEFAULT_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:8080')
const DEFAULT_TIMEOUT = 8000

function buildUrl(path) {
  if (!path) return DEFAULT_BASE
  if (path.startsWith('http')) return path
  return `${DEFAULT_BASE.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}

async function request(method, path, { params, body, timeout = DEFAULT_TIMEOUT, headers = {} } = {}) {
  const url = buildUrl(path) + (params ? ('?' + new URLSearchParams(params).toString()) : '')
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  const opts = {
    method,
    headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
    signal: controller.signal
  }
  if (body != null && method !== 'GET' && method !== 'HEAD') {
    opts.body = typeof body === 'string' ? body : JSON.stringify(body)
  }
  try {
    const res = await fetch(url, opts)
    clearTimeout(id)
    const text = await res.text()
    let data = null
    try { data = text ? JSON.parse(text) : null } catch (e) { data = text }
    if (!res.ok) {
      const err = new Error(data && data.message ? data.message : `HTTP ${res.status}`)
      err.status = res.status
      err.data = data
      throw err
    }
    return data
  } catch (e) {
    clearTimeout(id)
    if (e.name === 'AbortError') {
      const err = new Error('Request timeout')
      err.timeout = true
      throw err
    }
    throw e
  }
}

export const api = {
  get(path, opts) { return request('GET', path, opts) },
  post(path, body, opts = {}) { return request('POST', path, Object.assign({}, opts, { body })) },
  put(path, body, opts = {}) { return request('PUT', path, Object.assign({}, opts, { body })) },
  del(path, opts) { return request('DELETE', path, opts) },

  // Specific endpoints
  async getTopDestinations({ userId = 1, type, keyword, topK = 10 } = {}) {
    const params = { userId, topK }
    if (type) params.type = type
    if (keyword) params.keyword = keyword
    const res = await api.get('/api/recommendation/top-destinations', { params })
    return res && res.data ? res.data : res
  },

  async recordBehavior({ userId, destinationId, action = 'VIEW', weight = 1.0 } = {}) {
    return api.post('/api/recommendation/record-behavior', null, { params: { userId, destinationId, action, weight } })
  },

  async getDestinationById(id) {
    return api.get(`/api/destination/${id}`)
  },

  async getHotDestinations({ type, limit = 10 } = {}) {
    const params = { limit }
    if (type) params.type = type
    const res = await api.get('/api/destination/hot', { params })
    return res && res.data ? res.data : res
  },

  async searchDestinations({ keyword = '', type, limit = 20 } = {}) {
    const params = { keyword, limit }
    if (type) params.type = type
    const res = await api.get('/api/destination/search', { params })
    return res && res.data ? res.data : res
  },

  async getUserInterests(userId) {
    const res = await api.get(`/api/user/${userId}/interests`)
    return res && res.data ? res.data : res
  }
}

export default api
