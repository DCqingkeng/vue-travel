const foodImageModules = import.meta.glob('../../assets/food/*.{svg,png,jpg,jpeg,webp}', {
  eager: true,
  import: 'default'
})

const dishPhotoModules = import.meta.glob('../../../photo/food_1/*.{png,jpg,jpeg,webp}', {
  eager: true,
  import: 'default'
})

const dishPhotoModules2 = import.meta.glob('../../../photo/food_2/*.{png,jpg,jpeg,webp}', {
  eager: true,
  import: 'default'
})

const localFoodImages = Object.fromEntries(
  Object.entries(foodImageModules).map(([path, url]) => {
    const filename = path.split('/').pop() || ''
    const key = filename.replace(/\.[^.]+$/, '')
    return [key, url]
  })
)

const localDishPhotos = Object.fromEntries(
  Object.entries(dishPhotoModules).map(([path, url]) => {
    const filename = path.split('/').pop() || ''
    const key = normalizeDishName(filename.replace(/\.[^.]+$/, ''))
    return [key, url]
  })
)

const localDishPhotos2 = Object.fromEntries(
  Object.entries(dishPhotoModules2).map(([path, url]) => {
    const filename = path.split('/').pop() || ''
    const key = normalizeDishName(filename.replace(/\.[^.]+$/, ''))
    return [key, url]
  })
)

const allLocalDishPhotos = {
  ...localDishPhotos,
  ...localDishPhotos2
}

const FOOD_IMAGE_RULES = [
  { key: 'hotpot', pattern: /hot\s*pot|\u706b\u9505|\u9ebb\u8fa3\u70eb|\u5192\u83dc|\u4e32\u4e32|\u6bdb\u809a/ },
  { key: 'barbecue', pattern: /barbecue|bbq|\u70e7\u70e4|\u70e4\u8089|\u70e4\u4e32|\u70e7\u9e1f|\u70e4\u9c7c|\u97e9\u5f0f\u70e4\u8089/ },
  { key: 'noodles', pattern: /noodle|ramen|pasta|\u9762|\u62c9\u9762|\u62cc\u9762|\u6c64\u9762|\u5200\u524a\u9762|\u7c73\u7ebf|\u7c73\u7c89|\u7c89\u4e1d|\u87ba\u86f3\u7c89|\u9178\u8fa3\u7c89/ },
  { key: 'dumplings', pattern: /dumpling|wonton|gyoza|\u997a|\u9505\u8d34|\u5305\u5b50|\u5c0f\u7b3c|\u751f\u714e|\u9984\u9968|\u4e91\u541e|\u84b8\u997a/ },
  { key: 'rice', pattern: /rice|\u76d6\u996d|\u7092\u996d|\u7c73\u996d|\u7172\u4ed4\u996d|\u5364\u8089\u996d|\u77f3\u9505\u62cc\u996d|\u5496\u55b1\u996d|\u7117\u996d/ },
  { key: 'seafood', pattern: /seafood|fish|shrimp|crab|oyster|salmon|\u6d77\u9c9c|\u9c7c|\u867e|\u87f9|\u751f\u868c|\u6247\u8d1d|\u4e09\u6587\u9c7c/ },
  { key: 'dessert', pattern: /dessert|cake|ice\s*cream|sweet|pastry|bakery|\u751c\u54c1|\u86cb\u7cd5|\u51b0\u6dc7\u6dcb|\u5e03\u4e01|\u9762\u5305|\u828b\u5706|\u7cd6\u6c34|\u6ce1\u8299/ },
  { key: 'coffee', pattern: /coffee|cafe|espresso|latte|mocha|\u5496\u5561|\u7f8e\u5f0f|\u62ff\u94c1|\u6469\u5361/ },
  { key: 'tea', pattern: /tea|milk\s*tea|fruit\s*tea|boba|\u5976\u8336|\u679c\u8336|\u67e0\u6aac\u8336|\u8336\u996e|\u73cd\u73e0\u5976\u8336/ },
  { key: 'burger', pattern: /burger|sandwich|fries|\u6c49\u5821|\u4e09\u660e\u6cbb|\u85af\u6761|\u70ed\u72d7/ },
  { key: 'sushi', pattern: /sushi|sashimi|japanese|maki|\u5bff\u53f8|\u523a\u8eab|\u65e5\u6599|\u996d\u56e2/ },
  { key: 'steak', pattern: /steak|western|pizza|grill|\u725b\u6392|\u62ab\u8428|\u610f\u9762|\u897f\u9910/ },
  { key: 'spicy-stirfry', pattern: /spicy|sichuan|hunan|stir|dry\s*pot|\u9ebb\u8fa3\u9999\u9505|\u9999\u9505|\u5ddd\u83dc|\u6e58\u83dc|\u8fa3\u5b50\u9e21|\u5bab\u4fdd\u9e21\u4e01|\u5c0f\u7092|\u7092\u83dc/ }
]

const CUISINE_IMAGE_FALLBACKS = [
  { key: 'sushi', pattern: /japanese|\u65e5\u6599|\u5bff\u53f8/ },
  { key: 'barbecue', pattern: /korean|\u97e9\u9910|\u97e9\u5f0f/ },
  { key: 'steak', pattern: /western|\u897f\u9910|\u610f\u5f0f|\u6cd5\u5f0f|\u7f8e\u5f0f/ },
  { key: 'seafood', pattern: /seafood|\u6d77\u9c9c/ },
  { key: 'spicy-stirfry', pattern: /sichuan|\u5ddd\u83dc|hunan|\u6e58\u83dc|\u8fa3/ },
  { key: 'rice', pattern: /cantonese|\u7ca4\u83dc|\u76d6\u996d|\u5feb\u9910/ },
  { key: 'noodles', pattern: /\u9762\u9986|\u7c89\u9762|\u9762\u98df/ },
  { key: 'dessert', pattern: /dessert|\u751c\u54c1/ },
  { key: 'coffee', pattern: /cafe|\u5496\u5561/ },
  { key: 'tea', pattern: /\u5976\u8336|\u8336\u996e/ }
]

export const FOOD_SORT_OPTIONS = [
  { label: 'Recommended', value: 'comprehensive' },
  { label: 'Highest Rated', value: 'rating' },
  { label: 'Nearest', value: 'distance' },
  { label: 'Most Popular', value: 'heat' }
]

export const DESTINATION_TYPE_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Scenic Spot', value: 'SCENIC_SPOT' },
  { label: 'School', value: 'SCHOOL' }
]

export function normalizeDestinationRecord(item) {
  if (!item) return null

  const typeValue = typeof item.type === 'string' ? item.type : ''
  const typeLabel = typeValue === 'SCHOOL' || /school|\u6821\u56ed|\u5b66\u6821/i.test(typeValue)
    ? 'School'
    : 'Scenic Spot'
  const latitude = normalizeCoordinate(item.latitude)
  const longitude = normalizeCoordinate(item.longitude)

  return {
    id: item.id,
    name: item.name || `Destination #${item.id}`,
    type: typeValue || 'SCENIC_SPOT',
    typeLabel,
    latitude,
    longitude,
    category: item.category || '',
    description: item.description || '',
    keywords: item.keywords || '',
    heatScore: Number(item.heatScore || 0),
    rating: Number(item.rating || 0)
  }
}

export function normalizeFoodRecord(item) {
  if (!item) return null

  const cuisineType = item.cuisineType || 'Unknown Cuisine'
  const foodName = item.foodName || 'Unnamed Dish'
  const restaurantName = item.restaurantName || 'Unnamed Restaurant'
  const distance = Number(item.distance)
  const rating = Number(item.rating)
  const heatScore = Number(item.heatScore)
  const restaurantLatitude = normalizeCoordinate(item.restaurantLatitude)
  const restaurantLongitude = normalizeCoordinate(item.restaurantLongitude)
  const coverImage = resolveFoodImage(item, { cuisineType, foodName, restaurantName })
  const gallery = resolveGallery(item, coverImage)

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
    coverImage,
    gallery,
    signatureDishes: Array.isArray(item.signatureDishes) ? item.signatureDishes : [],
    tags: normalizeTags(item, cuisineType, foodName),
    nearestNodeId: item.nearestNodeId ?? null,
    restaurantLatitude,
    restaurantLongitude
  }
}

function normalizeTags(item, cuisineType, foodName) {
  if (Array.isArray(item.tags) && item.tags.length) return item.tags

  const tags = [`#${cuisineType}`]
  if (foodName) tags.push(`#${foodName}`)
  if (item.distance != null && Number(item.distance) > 0) tags.push('#Distance')
  return tags.slice(0, 3)
}

function buildLocationText(lat, lng) {
  const latitude = normalizeCoordinate(lat)
  const longitude = normalizeCoordinate(lng)

  if (latitude == null || longitude == null) {
    return ''
  }

  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
}

function normalizeCoordinate(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return null
  if (number === 0) return null
  return number
}

function resolveFoodImage(item, context) {
  const matchedDishPhoto = findDishPhotoByName(context.foodName)
  if (matchedDishPhoto) return matchedDishPhoto

  const directImage = pickFirstImage([
    item.coverImage,
    item.image,
    item.photo,
    item.picture,
    item.thumbnail,
    item.imgUrl,
    item.imageUrl,
    item.photoUrl,
    item.cover,
    item.poster
  ])

  if (directImage) return directImage
  return findLocalFoodImage(context) || localFoodImages['spicy-stirfry'] || ''
}

function resolveGallery(item, coverImage) {
  const gallery = Array.isArray(item.gallery) ? item.gallery.filter(Boolean) : []
  const normalized = [...new Set(gallery)]

  if (coverImage && !normalized.includes(coverImage)) {
    normalized.unshift(coverImage)
  }

  return normalized.length ? normalized.slice(0, 4) : (coverImage ? [coverImage] : [])
}

function pickFirstImage(values) {
  return values.find((value) => typeof value === 'string' && value.trim()) || ''
}

function findDishPhotoByName(foodName) {
  const normalized = normalizeDishName(foodName)
  if (!normalized) return ''
  if (allLocalDishPhotos[normalized]) return allLocalDishPhotos[normalized]

  const specialZhaopaiChaofan = normalizeDishName('招牌炒饭')
  if (normalized.includes(specialZhaopaiChaofan)) {
    return allLocalDishPhotos[specialZhaopaiChaofan] || ''
  }

  return ''
}

function normalizeDishName(value) {
  return String(value || '')
    .trim()
    .replace(/\.[^.]+$/, '')
    .replace(/\s+/g, '')
    .replace(/[()（）\-_.·,，、/]/g, '')
    .toLowerCase()
}

function findLocalFoodImage({ cuisineType, foodName, restaurantName }) {
  const source = `${foodName} ${cuisineType} ${restaurantName}`.toLowerCase()

  for (const rule of FOOD_IMAGE_RULES) {
    if (rule.pattern.test(source) && localFoodImages[rule.key]) {
      return localFoodImages[rule.key]
    }
  }

  const cuisine = String(cuisineType || '').toLowerCase()
  for (const rule of CUISINE_IMAGE_FALLBACKS) {
    if (rule.pattern.test(cuisine) && localFoodImages[rule.key]) {
      return localFoodImages[rule.key]
    }
  }

  return localFoodImages.rice || ''
}
