import http from './http'

function unwrapList(value) {
  if (Array.isArray(value)) return value
  if (value == null) return []
  return [value]
}

export async function getDiaryHotFeed({ topK = 24 } = {}) {
  return unwrapList(await http.get('/api/diary/hot', { params: { topK } }))
}

export async function getDiaryDetail(id) {
  if (id == null) throw new Error('id is required')
  return http.get(`/api/diary/${id}`)
}

export async function getDiaryStatistics(id) {
  if (id == null) throw new Error('id is required')
  return http.get(`/api/diary/${id}/statistics`)
}

export async function exactSearchDiary(title) {
  if (!title) throw new Error('title is required')
  return http.get('/api/diary/exact', { params: { title } })
}

export async function searchDiaryByDestination(destinationName, topK = 24) {
  if (!destinationName) throw new Error('destinationName is required')
  return unwrapList(
    await http.get('/api/diary/search', {
      params: { destinationName, topK }
    })
  )
}

export async function searchDiaryByContent(keyword, topK = 24) {
  if (!keyword) throw new Error('keyword is required')
  return unwrapList(
    await http.get('/api/diary/content-search', {
      params: { keyword, topK }
    })
  )
}

export async function createDiary(payload = {}) {
  return http.post('/api/diary/create', payload)
}

export async function rateDiary(payload = {}) {
  return http.post('/api/diary/rate', payload)
}

export async function searchDiaryCollection({ mode, keyword, topK = 24 } = {}) {
  if (mode === 'title') {
    return unwrapList(await exactSearchDiary(keyword))
  }

  if (mode === 'destination') {
    return searchDiaryByDestination(keyword, topK)
  }

  if (mode === 'content') {
    return searchDiaryByContent(keyword, topK)
  }

  return getDiaryHotFeed({ topK })
}

export async function searchDestinationOptions({ keyword, limit = 6 } = {}) {
  if (!keyword) return []

  return unwrapList(
    await http.get('/api/destination/search', {
      params: { keyword, limit }
    })
  )
}

export default {
  getDiaryHotFeed,
  getDiaryDetail,
  getDiaryStatistics,
  exactSearchDiary,
  searchDiaryByDestination,
  searchDiaryByContent,
  createDiary,
  rateDiary,
  searchDiaryCollection,
  searchDestinationOptions
}
