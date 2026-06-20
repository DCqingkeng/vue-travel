import http from './services/http'

/**
 * Recommendation and destination API wrapper
 */

export async function getTopDestinations({ userId, type, keyword, topK = 10 } = {}) {
  if (userId == null) throw new Error('userId is required')
  const params = { userId, topK }
  if (type != null) params.type = type
  if (keyword != null) params.keyword = keyword
  return http.get('/api/recommendation/top-destinations', { params })
}

export async function recommendPost(requestBody = {}) {
  // requestBody should match RecommendationRequest DTO on backend
  return http.post('/api/recommendation/recommend', requestBody)
}

export async function recordBehavior({ userId, destinationId, action = 'VIEW', weight = 1.0 } = {}) {
  if (userId == null || destinationId == null) throw new Error('userId and destinationId are required')
  const params = { userId, destinationId, action, weight }
  // backend expects POST with request params
  return http.post('/api/recommendation/record-behavior', null, { params })
}

export async function getDestinationById(id) {
  if (id == null) throw new Error('id is required')
  return http.get(`/api/destination/${id}`)
}

export async function getHotDestinations({ type, limit = 10 } = {}) {
  const params = { limit }
  if (type != null) params.type = type
  return http.get('/api/destination/hot', { params })
}

export async function searchDestinations({ keyword = '', type, limit = 20 } = {}) {
  const params = { keyword, limit }
  if (type != null) params.type = type
  return http.get('/api/destination/search', { params })
}

export default {
  getTopDestinations,
  recommendPost,
  recordBehavior,
  getDestinationById,
  getHotDestinations,
  searchDestinations
}
