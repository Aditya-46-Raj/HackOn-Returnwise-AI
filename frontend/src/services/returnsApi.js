import apiFetch from './api'
import useAuthStore from '../store/authStore'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

/**
 * Upload images to backend storage (S3 or Local folder fallback) and return their URLs.
 */
export async function uploadReturnImages(returnId, files) {
  const token = useAuthStore.getState().token
  const formData = new FormData()
  for (const file of files) {
    formData.append('files', file)
  }
  
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
  
  const response = await fetch(`${BASE_URL}/api/returns/${returnId}/upload`, {
    method: 'POST',
    headers,
    body: formData
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Image upload failed')
  }
  
  const data = await response.json()
  return data.urls
}

/**
 * Create a new return record.
 */
export async function createReturn(data) {
  return apiFetch('/api/returns', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Trigger AI analysis for a return.
 */
export async function analyzeReturn(data) {
  return apiFetch('/api/analyze', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * List returns with optional filters.
 */
export async function listReturns({ grade, action, category, status, page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams()
  if (grade)    params.append('grade', grade)
  if (action)   params.append('action', action)
  if (category) params.append('category', category)
  if (status)   params.append('status', status)
  params.append('page', page)
  params.append('limit', limit)
  return apiFetch(`/api/returns?${params}`)
}

/**
 * Get a single return + its report.
 */
export async function getReturn(returnId) {
  return apiFetch(`/api/returns/${returnId}`)
}

/**
 * Admin override routing action.
 */
export async function overrideReturnAction(returnId, finalAction, adminNote) {
  return apiFetch(`/api/returns/${returnId}/action`, {
    method: 'PATCH',
    body: JSON.stringify({ final_action: finalAction, admin_note: adminNote }),
  })
}

/**
 * Dashboard stats.
 */
export async function getDashboardStats() {
  return apiFetch('/api/dashboard/stats')
}

/**
 * Green credits for a user.
 */
export async function getUserCredits(userId) {
  return apiFetch(`/api/credits/${userId}`)
}

/**
 * Credits leaderboard.
 */
export async function getLeaderboard() {
  return apiFetch('/api/credits/leaderboard')
}

/**
 * Return risk for a category.
 */
export async function getReturnRisk(category) {
  return apiFetch(`/api/prevention/${encodeURIComponent(category)}`)
}

/**
 * Marketplace listings.
 */
export async function getListings({ category, grade, minPrice, maxPrice, sortBy } = {}) {
  const params = new URLSearchParams()
  if (category)  params.append('category', category)
  if (grade)     params.append('grade', grade)
  if (minPrice)  params.append('min_price', minPrice)
  if (maxPrice)  params.append('max_price', maxPrice)
  if (sortBy)    params.append('sort_by', sortBy)
  return apiFetch(`/api/listings?${params}`)
}
