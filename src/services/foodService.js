// Food recommendation service with Trie-based prefix search and fuzzy (approximate) search.
// Provides:
// - insert / bulk insert food items
// - prefix search (fast using Trie)
// - fuzzy search (approximate match using dynamic programming on Trie)
// - simple recommend by tags and popularity

function normalize(s) {
  if (!s) return ''
  try { s = String(s).normalize('NFKD') } catch (e) {}
  return String(s).toLowerCase().trim()
}

class TrieNode {
  constructor() {
    this.children = new Map()
    this.isWord = false
    this.items = [] // list of item ids that end here
  }
}

class Trie {
  constructor() { this.root = new TrieNode() }

  insert(word, itemId) {
    let node = this.root
    for (let ch of word) {
      if (!node.children.has(ch)) node.children.set(ch, new TrieNode())
      node = node.children.get(ch)
    }
    node.isWord = true
    if (!node.items.includes(itemId)) node.items.push(itemId)
  }

  // find node for prefix
  findNode(prefix) {
    let node = this.root
    for (let ch of prefix) {
      node = node.children.get(ch)
      if (!node) return null
    }
    return node
  }

  // collect up to limit itemIds from subtree (BFS)
  collectFrom(node, limit = 50) {
    if (!node) return []
    const out = []
    const q = [node]
    while (q.length && out.length < limit) {
      const n = q.shift()
      if (n.isWord) out.push(...n.items)
      for (const child of n.children.values()) q.push(child)
    }
    // dedupe while preserving order
    return Array.from(new Set(out)).slice(0, limit)
  }

  // prefix search returns item ids
  searchPrefix(prefix, limit = 50) {
    const node = this.findNode(prefix)
    if (!node) return []
    return this.collectFrom(node, limit)
  }

  // fuzzy search: approximate matching using Levenshtein DP across trie
  // fuzzy search: simpler approach - compute Levenshtein distance against candidate names
  // Accepts optional allItems array and itemsMap map to enable service-provided data
  fuzzySearch(word, maxDist = 2, limit = 50, allItems = [], itemsMap = null) {
    if (!word) return []
    const q = word
    const candidates = new Set()
    // use prefix matches as candidates first (returns ids)
    const pref = this.searchPrefix(q, limit)
    pref.forEach(id => candidates.add(id))
    // also consider all items (but limit to first 200 for performance)
    let count = 0
    for (const it of (allItems || [])) {
      if (count++ > 200) break
      candidates.add(it.id)
    }

    function levenshtein(a, b, max) {
      if (a === b) return 0
      if (!a || !b) return (a || b).length
      const m = a.length, n = b.length
      if (Math.abs(m - n) > (max || Infinity)) return Infinity
      const dp = new Array(n + 1)
      for (let j = 0; j <= n; j++) dp[j] = j
      for (let i = 1; i <= m; i++) {
        let prev = dp[0]
        dp[0] = i
        let minRow = dp[0]
        for (let j = 1; j <= n; j++) {
          const tmp = dp[j]
          const cost = a[i - 1] === b[j - 1] ? 0 : 1
          dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost)
          prev = tmp
          if (dp[j] < minRow) minRow = dp[j]
        }
        if (max !== undefined && minRow > max) return Infinity
      }
      return dp[n]
    }

    const results = []
    for (const id of candidates) {
      const it = itemsMap ? itemsMap.get(id) : null
      if (!it) continue
      const name = normalize(it.name || '')
      const d = levenshtein(q, name, maxDist)
      if (d <= maxDist) results.push({ id: it.id, d })
    }
    results.sort((a, b) => a.d - b.d)
    return results.slice(0, limit).map(r => r.id)
  }
}

// Food recommendation service
export function createFoodService(options = {}) {
  const items = new Map() // id -> item { id, name, tags, score }
  const trie = new Trie()
  const popularity = new Map() // id -> views/popularity
  // keep auxiliary collections for simpler fuzzy search
  const _itemsList = []
  const _itemsMap = items

  const opts = Object.assign({ maxPrefixResults: 50, maxFuzzyResults: 50 }, options)

  function indexItem(it) {
    const id = it.id
    const name = normalize(it.name || '')
    if (!name) return
    // insert whole name
    trie.insert(name, id)
    // also insert tokenized words (split on non-word)
    const words = name.split(/[^0-9a-z\u4E00-\u9FFF]+/).filter(Boolean)
    for (const w of words) {
      trie.insert(w, id)
    }
  }

  function add(item) {
    if (!item || !item.id || !item.name) throw new Error('item must have id and name')
    const it = Object.assign({ tags: [] }, item)
    items.set(it.id, it)
    popularity.set(it.id, 0)
    indexItem(it)
    _itemsList.push(it)
    return it
  }

  function bulkAdd(list) {
    ;(list || []).forEach(add)
    // keep itemsMap reference for fuzzySearch convenience
    // expose internal arrays
    // store on trie for backward compatibility access
    trie._allItems = _itemsList
    trie._itemsMap = _itemsMap
  }

  function get(id) { return items.get(id) || null }

  function list() { return Array.from(items.values()) }

  function searchPrefix(q, topK = opts.maxPrefixResults) {
    if (!q) return []
    const nq = normalize(q)
    const ids = trie.searchPrefix(nq, topK)
    // sort by popularity then name
    ids.sort((a, b) => (popularity.get(b) || 0) - (popularity.get(a) || 0) || (items.get(a).name.localeCompare(items.get(b).name)))
    return ids.slice(0, topK).map(id => items.get(id))
  }

  function fuzzySearch(q, maxDist = 2, topK = opts.maxFuzzyResults) {
    if (!q) return []
    const nq = normalize(q)
    const ids = trie.fuzzySearch(nq, maxDist, topK)
    ids.sort((a, b) => (popularity.get(b) || 0) - (popularity.get(a) || 0))
    return ids.slice(0, topK).map(id => items.get(id))
  }

  function recommendByTags(tags = [], topK = 10) {
    const tset = new Set((tags || []).map(normalize))
    const all = []
    for (const it of items.values()) {
      let score = 0
      for (const t of it.tags || []) if (tset.has(normalize(t))) score += 1
      // boost by popularity
      score += Math.log(1 + (popularity.get(it.id) || 0)) * 0.1
      all.push({ id: it.id, score })
    }
    all.sort((a, b) => b.score - a.score)
    return all.slice(0, topK).map(x => items.get(x.id))
  }

  function incrementPopularity(id) { popularity.set(id, (popularity.get(id) || 0) + 1) }

  return {
    add,
    bulkAdd,
    get,
    list,
    searchPrefix,
    fuzzySearch,
    recommendByTags,
    incrementPopularity,
    // expose trie for debugging
    _internal: () => ({ size: items.size, trieRootChildren: trie.root.children.size })
  }
}

export default createFoodService
