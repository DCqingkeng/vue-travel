import axios from 'axios'
import router from '../router'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080'

const instance = axios.create({
  baseURL: API_BASE,
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' }
})

// Request interceptor: attach JWT token if present
instance.interceptors.request.use(
  config => {
    try {
      const token = localStorage.getItem('authToken')
      if (token) {
        config.headers = config.headers || {}
        config.headers['Authorization'] = `Bearer ${token}`
      }
    } catch (e) {
      // ignore
    }
    return config
  },
  err => Promise.reject(err)
)

// Response interceptor: unwrap { code, message, data } and handle errors
instance.interceptors.response.use(
  resp => {
    const d = resp.data
    if (d && typeof d.code !== 'undefined') {
      if (d.code === 200) return d.data
      const err = new Error(d.message || 'API error')
      err.code = d.code
      err.data = d.data
      // on auth related codes, redirect to login
      if (d.code === 401) {
        try { router.push({ name: 'Login' }) } catch (e) {}
      }
      throw err
    }
    // if no wrapper, return data
    return d
  },
  err => {
    if (err.response) {
      // HTTP status based handling
      if (err.response.status === 401) {
        try { router.push({ name: 'Login' }) } catch (e) {}
        return Promise.reject(new Error('Unauthorized'))
      }
      if (err.response.data) {
        const d = err.response.data
        const e = new Error(d.message || 'HTTP error')
        e.status = err.response.status
        e.data = d
        return Promise.reject(e)
      }
    }
    if (err.code === 'ECONNABORTED' || (err.message && err.message.includes('timeout'))) {
      return Promise.reject(new Error('Request timeout'))
    }
    return Promise.reject(err)
  }
)

export default instance
