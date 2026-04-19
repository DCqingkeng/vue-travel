// Lightweight sort utility for frontend usage.
// Intentionally simple: delegate to Array.prototype.sort with provided compare.
export function introsort(arr, compare = (a, b) => a - b) {
  if (!Array.isArray(arr) || arr.length <= 1) return arr
  // Use native sort for maintainability and performance in JS engines.
  try {
    arr.sort(compare)
  } catch (e) {
    // fallback: convert to array of indices and stable sort
    const decorated = arr.map((v, i) => ({ v, i }))
    decorated.sort((A, B) => {
      const r = compare(A.v, B.v)
      return r === 0 ? A.i - B.i : r
    })
    for (let i = 0; i < arr.length; i++) arr[i] = decorated[i].v
  }
  return arr
}

export default introsort
