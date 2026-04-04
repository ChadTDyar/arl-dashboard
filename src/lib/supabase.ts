import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(url, key)

const EDGE_BASE = `${url}/functions/v1`

async function edgeCall(fn: string, action: string, method: 'GET' | 'POST' = 'GET', body?: unknown) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${key}`,
  }
  const opts: RequestInit = { method, headers }
  if (body && method === 'POST') opts.body = JSON.stringify(body)
  const res = await fetch(`${EDGE_BASE}/${fn}?action=${action}`, opts)
  return res.json()
}

// Autonomy Gate
export const autoApprove = () => edgeCall('autonomy-gate', 'auto-approve', 'POST')
export const getDigest = (since?: string) =>
  edgeCall('autonomy-gate', `digest${since ? `&since=${since}` : ''}`)
export const getRules = () => edgeCall('autonomy-gate', 'rules')

// Link Queue
export const getPending = () => edgeCall('link-queue', 'pending')
export const getQueueSummary = () => edgeCall('link-queue', 'summary')
export const markPublished = (id: string, source: string, url?: string) =>
  edgeCall('link-queue', 'publish', 'POST', { id, source, platform_url: url })

// Vivian Brief
export const getResearchPacket = () => edgeCall('vivian-brief', 'research-packet')
export const getLatestBrief = () => edgeCall('vivian-brief', 'latest-brief')
export const getStaleness = () => edgeCall('vivian-brief', 'staleness')

// Engagement Hub
export const getPendingEngagement = () => edgeCall('engagement-hub', 'pending')
export const getEngagementStats = () => edgeCall('engagement-hub', 'stats')
export const respondToEvent = (id: string, text: string) =>
  edgeCall('engagement-hub', 'respond', 'POST', { id, response_text: text })

// Campaign Engine
export const getWeeklyPlan = () => edgeCall('campaign-engine', 'weekly-plan')
export const getCampaignStats = () => edgeCall('campaign-engine', 'stats')
