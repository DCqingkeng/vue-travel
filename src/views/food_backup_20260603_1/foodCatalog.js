export const FOOD_SORT_OPTIONS = [
  { label: 'Recommended 推荐优先', value: 'comprehensive' },
  { label: 'Highest Rated 评分最高', value: 'rating' },
  { label: 'Nearest 距离最近', value: 'distance' },
  { label: 'Most Popular 热度最高', value: 'heat' }
]

export const DESTINATION_TYPE_OPTIONS = [
  { label: 'All 全部', value: '' },
  { label: 'Scenic Spot 景点', value: 'SCENIC_SPOT' },
  { label: 'School 学校', value: 'SCHOOL' }
]

export function normalizeDestinationRecord(item) {
  if (!item) return null

  const typeValue = typeof item.type === 'string' ? item.type : ''
  const typeLabel = typeValue === 'SCHOOL' || typeValue.includes('学校')
    ? 'School 学校'
    : 'Scenic Spot 景点'

  return {
    id: item.id,
    name: item.name || `Destination #${item.id}`,
    type: typeValue || 'SCENIC_SPOT',
    typeLabel,
    latitude: Number(item.latitude || 0),
    longitude: Number(item.longitude || 0),
    category: item.category || '',
    description: item.description || '',
    keywords: item.keywords || '',
    heatScore: Number(item.heatScore || 0),
    rating: Number(item.rating || 0)
  }
}

export function normalizeFoodRecord(item) {
  if (!item) return null

  const cuisineType = item.cuisineType || 'Unknown 未知菜系'
  const foodName = item.foodName || 'Unnamed Dish 未命名菜品'
  const restaurantName = item.restaurantName || 'Unnamed Restaurant 未命名餐厅'
  const distance = Number(item.distance)
  const rating = Number(item.rating)
  const heatScore = Number(item.heatScore)

  return {
    foodId: item.foodId ?? item.id,
    id: item.foodId ?? item.id,
    restaurantId: item.restaurantId ?? null,
    foodName,
    restaurantName,
    cuisineType,
    heatScore: Number.isFinite(heatScore) ? heatScore : 0,
    rating: Number.isFinite(rating) ? rating : 0,
    distance: Number.isFinite(distance) ? distance : -1,
    price: item.price || item.priceRange || '',
    location: item.location || buildLocationText(item.restaurantLatitude, item.restaurantLongitude),
    address: item.address || '',
    businessHours: item.businessHours || '',
    description: item.description || '',
    coverImage: item.coverImage || '',
    gallery: Array.isArray(item.gallery) ? item.gallery : [],
    signatureDishes: Array.isArray(item.signatureDishes) ? item.signatureDishes : [],
    tags: normalizeTags(item, cuisineType, foodName),
    nearestNodeId: item.nearestNodeId ?? null,
    restaurantLatitude: Number(item.restaurantLatitude || 0),
    restaurantLongitude: Number(item.restaurantLongitude || 0)
  }
}

function normalizeTags(item, cuisineType, foodName) {
  if (Array.isArray(item.tags) && item.tags.length) return item.tags

  const tags = [`#${cuisineType}`]
  if (foodName) tags.push(`#${foodName}`)
  if (item.distance != null && Number(item.distance) > 0) tags.push('#Distance 距离')
  return tags.slice(0, 3)
}

function buildLocationText(lat, lng) {
  const latitude = Number(lat)
  const longitude = Number(lng)

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || (latitude === 0 && longitude === 0)) {
    return ''
  }

  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
}
