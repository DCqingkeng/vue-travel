const AMAP_JS_API_URL = 'https://webapi.amap.com/maps'
const AMAP_REST_API_BASE = 'https://restapi.amap.com'

export const amapConfig = {
  key: import.meta.env.VITE_AMAP_KEY || '',
  securityJsCode: import.meta.env.VITE_AMAP_SECURITY_JS_CODE || '',
  webServiceKey: import.meta.env.VITE_AMAP_WEB_SERVICE_KEY || ''
}

let amapLoaderPromise = null

export function initAmapSecurityConfig() {
  if (typeof window === 'undefined' || !amapConfig.securityJsCode) return

  window._AMapSecurityConfig = Object.assign(
    {},
    window._AMapSecurityConfig || {},
    { securityJsCode: amapConfig.securityJsCode }
  )
}

export function loadAmapSdk({
  version = '2.0',
  plugins = []
} = {}) {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('AMap SDK can only be loaded in browser'))
  }

  if (!amapConfig.key) {
    return Promise.reject(new Error('Missing VITE_AMAP_KEY'))
  }

  if (window.AMap) {
    return ensureAmapPlugins(window.AMap, plugins)
  }

  if (amapLoaderPromise) return amapLoaderPromise

  initAmapSecurityConfig()

  amapLoaderPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    const params = new URLSearchParams({
      key: amapConfig.key,
      v: version
    })

    if (plugins.length) {
      params.set('plugin', plugins.join(','))
    }

    script.src = `${AMAP_JS_API_URL}?${params.toString()}`
    script.async = true
    script.defer = true

    script.onload = () => {
      if (window.AMap) {
        ensureAmapPlugins(window.AMap, plugins)
          .then(resolve)
          .catch(reject)
        return
      }
      reject(new Error('AMap SDK loaded but window.AMap is unavailable'))
    }

    script.onerror = () => {
      reject(new Error('Failed to load AMap SDK'))
    }

    document.head.appendChild(script)
  }).catch((error) => {
    amapLoaderPromise = null
    throw error
  })

  return amapLoaderPromise
}

function ensureAmapPlugins(AMap, plugins = []) {
  if (!plugins.length) return Promise.resolve(AMap)

  const missingPlugins = plugins.filter((pluginName) => !hasAmapPlugin(AMap, pluginName))
  if (!missingPlugins.length) return Promise.resolve(AMap)

  return new Promise((resolve, reject) => {
    AMap.plugin(missingPlugins, () => resolve(AMap))
    window.setTimeout(() => {
      const unresolved = missingPlugins.filter((pluginName) => !hasAmapPlugin(AMap, pluginName))
      if (unresolved.length) {
        reject(new Error(`Failed to load AMap plugins: ${unresolved.join(', ')}`))
      }
    }, 3000)
  })
}

function hasAmapPlugin(AMap, pluginName) {
  const pluginKey = pluginName.split('.').pop()
  return Boolean(AMap?.[pluginKey])
}

export async function amapWebService(path, params = {}) {
  if (!amapConfig.webServiceKey) {
    throw new Error('Missing VITE_AMAP_WEB_SERVICE_KEY')
  }

  const query = new URLSearchParams({
    key: amapConfig.webServiceKey,
    ...params
  })

  const response = await fetch(`${AMAP_REST_API_BASE}${path}?${query.toString()}`)
  const data = await response.json()

  if (!response.ok || data.status === '0') {
    throw new Error(data.info || `AMap service request failed: ${response.status}`)
  }

  return data
}
