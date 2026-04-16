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
  fuzzySearch(word, maxDist = 2, limit = 50) {
    const results = new Map() // itemId -> distance
    const w = word
    const len = w.length
    // initial row: 0..len
    const currentRow = new Array(len + 1)
    for (let i = 0; i <= len; i++) currentRow[i] = i

    const recurse = (node, prefix, prevRow) => {
      // prevRow corresponds to distances for prefix
      // Try each child
      for (const [ch, child] of node.children.entries()) {
        const newRow = [prevRow[0] + 1]
        let min = newRow[0]
        for (let j = 1; j <= len; j++) {
          const cost = w[j - 1] === ch ? 0 : 1
          const ins = newRow[j - 1] + 1
          const del = prevRow[j] + 1
          const sub = prevRow[j - 1] + cost
          const val = Math.min(ins, del, sub)
          newRow[j] = val
          if (val < min) min = val
        }
        const newPrefix = prefix + ch
        if (child.isWord && newRow[len] <= maxDist) {
          for (const id of child.items) {
            const existing = results.get(id)
            if (existing === undefined || newRow[len] < existing) results.set(id, newRow[len])
          }
        }
        if (min <= maxDist) recurse(child, newPrefix, newRow)
      }
    }

    recurse(this.root, '', currentRow)

    // sort results by distance asc
    const sorted = Array.from(results.entries()).sort((a, b) => a[1] - b[1]).slice(0, limit)
    return sorted.map(([id]) => id)
  }
}

// Food recommendation service
export function createFoodService(options = {}) {
  const items = new Map() // id -> item { id, name, tags, score }
  const trie = new Trie()
  const popularity = new Map() // id -> views/popularity

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
    return it
  }

  function bulkAdd(list) {
    ;(list || []).forEach(add)
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
