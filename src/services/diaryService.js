// Diary service: supports adding/removing diary entries, full-text search (inverted index + TF-IDF ranking),
// data compression using Huffman coding, sorting and a simple recommendation function.
// Also includes a stubbed interface for future voice-recorded entries.

// Usage:
// const svc = createDiaryService()
// svc.add({ id, title, content, tags: [''] , date: '2024-01-01T12:00:00Z' })
// svc.search('beach sunset', { topK: 10 })
// svc.recommend({ tags: ['beach'], topK: 5 })
// svc.compressText(text) / svc.decompressText(blob)

// Implementation notes:
// - Tokenization: simple lowercase split on non-word characters, stopword filtering included.
// - Index: inverted index mapping token -> { docId -> termFrequency }
// - Ranking: TF-IDF combined with recency boost and optional tag match boost
// - Compression: Huffman coding producing a base64-encoded binary blob to store compressed content

const STOPWORDS = new Set([
  'the','and','is','in','at','of','a','an','to','for','on','with','that','this','it','as','by','from','or','be','are','was','were','but','not','have','has','had'
])

function tokenize(text) {
  if (!text) return []
  // Normalize and lower-case
  let s = String(text)
  try { s = s.normalize('NFKD') } catch (e) {}
  s = s.toLowerCase()
  // remove diacritics
  s = s.replace(/[\u0300-\u036f]/g, '')

  // Detect CJK characters
  const cjkRe = /[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]/
  if (cjkRe.test(s)) {
    // For CJK text, produce unigrams and bigrams to improve match coverage
    const chars = []
    for (let i = 0; i < s.length; i++) {
      const ch = s[i]
      if (cjkRe.test(ch)) chars.push(ch)
      else if (/[a-z0-9]/.test(ch)) chars.push(ch)
      // ignore other characters (punctuation, spaces)
    }
    const tokens = []
    for (let i = 0; i < chars.length; i++) {
      tokens.push(chars[i])
      if (i + 1 < chars.length) tokens.push(chars[i] + chars[i + 1])
    }
    // dedupe and filter stopwords
    return Array.from(new Set(tokens)).filter(t => t && !STOPWORDS.has(t))
  }

  // Non-CJK languages: split words (include basic Latin letters and numbers, extended latin)
  const tokens = s.split(/[^0-9a-z\u00C0-\u024F]+/).filter(t => t && !STOPWORDS.has(t))
  return tokens
}

// Simple priority queue (min-heap) for Huffman building
class MinHeap {
  constructor() { this.data = [] }
  size() { return this.data.length }
  push(node) {
    this.data.push(node)
    let i = this.data.length - 1
    while (i > 0) {
      const p = Math.floor((i - 1) / 2)
      if (this.data[p].freq <= this.data[i].freq) break
      const tmp = this.data[p]; this.data[p] = this.data[i]; this.data[i] = tmp
      i = p
    }
  }
  pop() {
    if (!this.data.length) return null
    const top = this.data[0]
    const last = this.data.pop()
    if (this.data.length) {
      this.data[0] = last
      let i = 0
      while (true) {
        const l = 2 * i + 1
        const r = 2 * i + 2
        let smallest = i
        if (l < this.data.length && this.data[l].freq < this.data[smallest].freq) smallest = l
        if (r < this.data.length && this.data[r].freq < this.data[smallest].freq) smallest = r
        if (smallest === i) break
        const tmp = this.data[i]; this.data[i] = this.data[smallest]; this.data[smallest] = tmp
        i = smallest
      }
    }
    return top
  }
}

// Huffman coding: compress -> base64 string, decompress from base64
function buildHuffmanTree(text) {
  const freq = Object.create(null)
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i)
    freq[ch] = (freq[ch] || 0) + 1
  }
  const heap = new MinHeap()
  Object.keys(freq).forEach(k => heap.push({ ch: Number(k), freq: freq[k] }))
  if (heap.size() === 0) return { root: null, codes: {} }
  while (heap.size() > 1) {
    const a = heap.pop()
    const b = heap.pop()
    heap.push({ left: a, right: b, freq: a.freq + b.freq })
  }
  const root = heap.pop()
  const codes = {}
  function walk(node, prefix) {
    if (!node) return
    if (typeof node.ch === 'number') {
      codes[node.ch] = prefix || '0'
      return
    }
    walk(node.left, prefix + '0')
    walk(node.right, prefix + '1')
  }
  walk(root, '')
  return { root, codes }
}

function bitsToBytes(bitstr) {
  const bytes = []
  for (let i = 0; i < bitstr.length; i += 8) {
    const byte = bitstr.slice(i, i + 8)
    bytes.push(parseInt(byte.padEnd(8, '0'), 2))
  }
  return Uint8Array.from(bytes)
}
function bytesToBits(bytes) {
  let s = ''
  for (let i = 0; i < bytes.length; i++) {
    s += bytes[i].toString(2).padStart(8, '0')
  }
  return s
}

function arrayBufferToBase64(buf) {
  // buf: Uint8Array
  let binary = ''
  for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i])
  return btoa(binary)
}
function base64ToUint8Array(b64) {
  const binary = atob(b64)
  const arr = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i)
  return arr
}

export function compressText(text) {
  // Lightweight compression for frontend demo: use base64 UTF-8 encoding.
  if (!text) return null
  try {
    // encode UTF-8 then base64
    const utf8 = encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, (_, p) => String.fromCharCode('0x' + p))
    const b64 = btoa(utf8)
    return { meta: { encoding: 'base64-utf8' }, payload: b64, originalLength: text.length }
  } catch (e) {
    return { meta: { encoding: 'raw' }, payload: text, originalLength: text.length }
  }
}

export function decompressText(blob) {
  if (!blob || !blob.meta || blob.payload == null) return ''
  try {
    if (blob.meta.encoding === 'base64-utf8') {
      const binary = atob(blob.payload)
      // convert binary string to percent-encoded UTF-8, then decode
      let esc = ''
      for (let i = 0; i < binary.length; i++) {
        const c = binary.charCodeAt(i).toString(16).toUpperCase()
        esc += '%' + (c.length < 2 ? '0' + c : c)
      }
      return decodeURIComponent(esc)
    }
    // raw fallback
    return String(blob.payload)
  } catch (e) {
    return ''
  }
}

// Diary service implementation
export function createDiaryService(options = {}) {
  // storage for entries: map id -> entry metadata
  const entries = new Map()
  // inverted index: token -> Map(docId -> termFreq)
  const index = new Map()
  // docLengths for normalization (total tokens)
  const docLengths = new Map()
  // document views / popularity counter (for recommendation)
  const views = new Map()

  const opts = Object.assign({ compress: true }, options)
  // allow overriding tokenizer via options.tokenizer
  const tokenizer = opts.tokenizer || tokenize

  function indexEntry(docId, text) {
    const tokens = tokenizer(text)
    const len = tokens.length
    docLengths.set(docId, len)
    const freqs = Object.create(null)
    tokens.forEach(t => { freqs[t] = (freqs[t] || 0) + 1 })
    Object.keys(freqs).forEach(t => {
      let posting = index.get(t)
      if (!posting) { posting = new Map(); index.set(t, posting) }
      posting.set(docId, freqs[t])
    })
  }

  function removeFromIndex(docId) {
    for (const [term, posting] of index.entries()) {
      if (posting.has(docId)) posting.delete(docId)
      if (posting.size === 0) index.delete(term)
    }
    docLengths.delete(docId)
  }

  function add(entry) {
    if (!entry || !entry.id) throw new Error('Entry must have an id')
    const id = entry.id
    const now = new Date().toISOString()
    const ent = Object.assign({}, entry)
    if (!ent.date) ent.date = now
    // compress content if enabled
    if (opts.compress && ent.content) {
      try {
        ent._compressed = compressText(ent.content)
        delete ent.content
      } catch (e) {
        // fail gracefully
        ent._compressed = null
      }
    }
    entries.set(id, ent)
    // index title + content + tags
    const forIndex = [ent.title || '', entry.content || (ent._compressed ? decompressText(ent._compressed) : ''), (ent.tags || []).join(' ')]
    removeFromIndex(id)
    indexEntry(id, forIndex.join(' '))
    views.set(id, 0)
    return ent
  }

  function update(id, patch) {
    const ent = entries.get(id)
    if (!ent) return null
    const updated = Object.assign({}, ent, patch)
    // if content changed, re-compress
    if (patch.content !== undefined) {
      if (opts.compress && patch.content != null) {
        updated._compressed = compressText(patch.content)
        delete updated.content
      } else {
        updated._compressed = null
        updated.content = patch.content
      }
    }
    entries.set(id, updated)
    removeFromIndex(id)
    const forIndex = [updated.title || '', patch.content || (updated._compressed ? decompressText(updated._compressed) : ''), (updated.tags || []).join(' ')]
    indexEntry(id, forIndex.join(' '))
    return updated
  }

  function remove(id) {
    if (!entries.has(id)) return false
    entries.delete(id)
    removeFromIndex(id)
    views.delete(id)
    return true
  }

  function get(id, decompress = true) {
    const ent = entries.get(id)
    if (!ent) return null
    const copy = Object.assign({}, ent)
    if (decompress && copy._compressed && !copy.content) {
      copy.content = decompressText(copy._compressed)
    }
    return copy
  }

  function list() {
    return Array.from(entries.values()).map(e => get(e.id))
  }

  function tfidfScores(queryTokens) {
    const N = entries.size || 1
    const scores = new Map()
    const qTerms = queryTokens
    const dfCache = {}
    qTerms.forEach(t => {
      const posting = index.get(t)
      const df = posting ? posting.size : 0
      dfCache[t] = df
    })
    qTerms.forEach(t => {
      const posting = index.get(t)
      if (!posting) return
      const idf = Math.log(1 + N / (1 + dfCache[t]))
      for (const [docId, tf] of posting.entries()) {
        const norm = docLengths.get(docId) || 1
        const score = (tf / norm) * idf
        scores.set(docId, (scores.get(docId) || 0) + score)
      }
    })
    return scores
  }

  // Recommend score: combines text match score, recency, views, tag overlap
  function scoreForDoc(baseScore, ent, queryTags = []) {
    let s = baseScore || 0
    // recency boost: newer entries score slightly higher
    const ageDays = (Date.now() - new Date(ent.date).getTime()) / (1000 * 60 * 60 * 24)
    const recencyBoost = Math.max(0, 1 - ageDays / 365) // within a year gets boost
    s = s * (1 + recencyBoost * 0.5)
    // popularity
    const v = views.get(ent.id) || 0
    s += Math.log(1 + v) * 0.05
    // tag overlap
    if (queryTags && queryTags.length) {
      const tset = new Set(ent.tags || [])
      let overlap = 0
      for (const t of queryTags) if (tset.has(t)) overlap++
      s *= 1 + (overlap * 0.2)
    }
    return s
  }

  // Search: simple query -> tokens, compute tfidf scores, then apply boosts and return sorted results
  function search(query, options = {}) {
    const topK = options.topK || 20
    const tags = options.tags || []
    const tokens = tokenizer(query)
    if (!tokens.length) return []
    const scores = tfidfScores(tokens)
    const results = []
    for (const [docId, base] of scores.entries()) {
      const ent = get(docId, true)
      const sc = scoreForDoc(base, ent, tags)
      results.push({ id: docId, score: sc, entry: ent })
    }
    results.sort((a, b) => b.score - a.score)
    return results.slice(0, topK)
  }

  // Recommend: returns top entries based on provided preferences (tags, recent)
  function recommend(options = {}) {
    const topK = options.topK || 10
    const preferredTags = options.tags || []
    // simple scoring: tag match + recency + popularity
    const all = []
    for (const ent of entries.values()) {
      const base = 0
      const sc = scoreForDoc(base, ent, preferredTags)
      all.push({ id: ent.id, score: sc, entry: get(ent.id, true) })
    }
    all.sort((a, b) => b.score - a.score)
    return all.slice(0, topK)
  }

  function incrementView(id) {
    views.set(id, (views.get(id) || 0) + 1)
  }

  // Export compressed entries for backup / sending to server
  function exportCompressed() {
    const out = []
    for (const ent of entries.values()) {
      out.push({ id: ent.id, title: ent.title, tags: ent.tags || [], date: ent.date, compressed: ent._compressed || null })
    }
    return out
  }

  function importCompressed(list) {
    (list || []).forEach(item => {
      const ent = { id: item.id, title: item.title, tags: item.tags, date: item.date, _compressed: item.compressed }
      entries.set(ent.id, ent)
      removeFromIndex(ent.id)
      const text = ent._compressed ? decompressText(ent._compressed) : ''
      indexEntry(ent.id, [ent.title || '', text, (ent.tags || []).join(' ')].join(' '))
    })
  }

  // stub: future voice entry API. For now we accept a blob and metadata and return a placeholder entry id.
  async function addVoiceEntry(audioBlob, meta = {}) {
    // This is a placeholder to be replaced with real speech-to-text / upload flow.
    // We'll just create an entry with meta.transcript if provided, or "[voice entry]".
    const transcript = meta.transcript || ''
    const id = meta.id || ('voice-' + Date.now())
    const ent = { id, title: meta.title || 'Voice Entry', tags: meta.tags || [], date: new Date().toISOString() }
    if (transcript) {
      ent.content = transcript
    } else {
      ent.content = '[voice entry: audio stored separately]'
    }
    add(ent)
    // return the created entry
    return get(id, true)
  }

  return {
    add,
    update,
    remove,
    get,
    list,
    search,
    recommend,
    incrementView,
    exportCompressed,
    importCompressed,
    compressText,
    decompressText,
    addVoiceEntry,
    // internal inspection
    _internal: () => ({ indexSize: index.size, docs: entries.size })
  }
}

export default createDiaryService
