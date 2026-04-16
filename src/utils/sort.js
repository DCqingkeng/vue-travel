import createPlaceService from '../services/placeService'

const svc = createPlaceService({ getCoords: p => [p.lat, p.lon] })

// 混合排序：Introsort (快速排序 + 堆排序) 实现
// 提供 introsort(arr, compare) 函数，对传入数组进行就地排序

function swap(arr, i, j) {
  const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp
}

function insertionSort(arr, left = 0, right = arr.length - 1, compare = (a, b) => a - b) {
  for (let i = left + 1; i <= right; i++) {
    const key = arr[i]
    let j = i - 1
    while (j >= left && compare(arr[j], key) > 0) {
      arr[j + 1] = arr[j]
      j--
    }
    arr[j + 1] = key
  }
}

function heapify(arr, count, i, compare) {
  let root = i
  while (true) {
    let left = 2 * root + 1
    let right = left + 1
    let largest = root
    if (left < count && compare(arr[largest], arr[left]) < 0) largest = left
    if (right < count && compare(arr[largest], arr[right]) < 0) largest = right
    if (largest === root) return
    swap(arr, root, largest)
    root = largest
  }
}

function heapSort(arr, compare) {
  const count = arr.length
  for (let start = Math.floor((count - 2) / 2); start >= 0; start--) {
    heapify(arr, count, start, compare)
  }
  for (let end = count - 1; end > 0; end--) {
    swap(arr, end, 0)
    heapify(arr, end, 0, compare)
  }
}

function partition(arr, low, high, compare) {
  const pivot = arr[Math.floor((low + high) / 2)]
  let i = low
  let j = high
  while (i <= j) {
    while (compare(arr[i], pivot) < 0) i++
    while (compare(arr[j], pivot) > 0) j--
    if (i <= j) {
      swap(arr, i, j)
      i++
      j--
    }
  }
  return i
}

function quickSortRec(arr, low, high, depthLimit, compare) {
  const size = high - low + 1
  if (size <= 16) {
    insertionSort(arr, low, high, compare)
    return
  }
  if (depthLimit === 0) {
    const tmp = arr.slice(low, high + 1)
    heapSort(tmp, compare)
    for (let i = 0; i < tmp.length; i++) arr[low + i] = tmp[i]
    return
  }
  const index = partition(arr, low, high, compare)
  if (low < index - 1) quickSortRec(arr, low, index - 1, depthLimit - 1, compare)
  if (index < high) quickSortRec(arr, index, high, depthLimit - 1, compare)
}

export function introsort(arr, compare = (a, b) => a - b) {
  if (!Array.isArray(arr) || arr.length <= 1) return arr
  const len = arr.length
  const maxDepth = Math.max(0, Math.floor(Math.log2(len)) * 2)
  quickSortRec(arr, 0, len - 1, maxDepth, compare)
  return arr
}

// 兼容的默认导出（直接导出函数）
export default introsort

svc.load([
  { id: 1, name: 'A', lat: 39.9, lon: 116.4 },
  { id: 2, name: 'B', lat: 39.91, lon: 116.41 },
  // ...
])
