const BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dashboard-api`
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

async function call(action: string, method: 'GET' | 'POST' = 'GET', body?: unknown) {
  const opts: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
  }
  if (body && method === 'POST') opts.body = JSON.stringify(body)
  const res = await fetch(`${BASE}?action=${action}`, opts)
  if (!res.ok) throw new Error(`API ${action}: ${res.status}`)
  return res.json()
}

// Reads
export const getOverview = () => call('overview')
export const getSystemHealth = () => call('system-health')

// Actions
export const triggerGate = () => call('trigger-gate', 'POST', {})
export const triggerVivian = () => call('trigger-vivian', 'POST', {})

// Queue writes
export const approveItem = (id: string, source: string) => call('approve-item', 'POST', { id, source })
export const rejectItem = (id: string, source: string) => call('reject-item', 'POST', { id, source })
export const editItem = (id: string, source: string, body: string, title?: string) =>
  call('edit-item', 'POST', { id, source, body, title })
export const dismissItem = (id: string, source: string) => call('dismiss-item', 'POST', { id, source })

// Engagement writes
export const respondEvent = (id: string, text?: string) => call('respond-event', 'POST', { id, response_text: text })
export const dismissEvent = (id: string) => call('dismiss-event', 'POST', { id })

// Admin writes
export const updateRule = (id: number, level?: string, threshold?: number) =>
  call('update-rule', 'POST', { id, autonomy_level: level, confidence_threshold: threshold })
