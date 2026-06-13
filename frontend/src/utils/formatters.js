/** Format currency values */
export const formatCurrency = (value, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value || 0)

/** Format date strings */
export const formatDate = (isoString) => {
  if (!isoString) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  }).format(new Date(isoString))
}

/** Format date with time */
export const formatDateTime = (isoString) => {
  if (!isoString) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(isoString))
}

/** Truncate long strings */
export const truncate = (str, length = 50) =>
  str && str.length > length ? `${str.substring(0, length)}...` : str

/** Format kg values */
export const formatKg = (kg) => {
  if (!kg) return '0 kg'
  return `${kg.toFixed(1)} kg`
}

/** Format large numbers */
export const formatNumber = (n) =>
  new Intl.NumberFormat('en-US').format(Math.round(n || 0))

/** Return relative time string */
export const timeAgo = (isoString) => {
  if (!isoString) return ''
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}
