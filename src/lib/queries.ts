import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'
import { getOverview, getSystemHealth } from './api'

export function useOverview() {
  return useQuery({ queryKey: ['overview'], queryFn: getOverview, refetchInterval: 60000 })
}

export function useSystemHealth() {
  return useQuery({ queryKey: ['system-health'], queryFn: getSystemHealth, refetchInterval: 300000 })
}

export function useMarketingQueue(status?: string) {
  return useQuery({
    queryKey: ['marketing-queue', status],
    queryFn: async () => {
      let q = supabase.from('marketing_queue').select('*').order('created_at', { ascending: false }).limit(100)
      if (status) q = q.eq('status', status)
      const { data } = await q
      return data || []
    },
    refetchInterval: 30000,
  })
}

export function useCometPosts(status?: string) {
  return useQuery({
    queryKey: ['comet-posts', status],
    queryFn: async () => {
      let q = supabase.from('comet_posts').select('*').order('created_at', { ascending: false }).limit(100)
      if (status) q = q.eq('status', status)
      const { data } = await q
      return data || []
    },
    refetchInterval: 30000,
  })
}

export function useEngagementEvents() {
  return useQuery({
    queryKey: ['engagement-events'],
    queryFn: async () => {
      const { data } = await supabase.from('engagement_events').select('*')
        .order('created_at', { ascending: false }).limit(100)
      return data || []
    },
    refetchInterval: 30000,
  })
}

export function useOutreachCampaigns() {
  return useQuery({
    queryKey: ['outreach-campaigns'],
    queryFn: async () => {
      const { data } = await supabase.from('outreach_campaigns').select('*').eq('status', 'active')
      return data || []
    },
  })
}

export function useOutreachTargets(campaignId?: string) {
  return useQuery({
    queryKey: ['outreach-targets', campaignId],
    queryFn: async () => {
      let q = supabase.from('outreach_targets').select('*')
      if (campaignId) q = q.eq('campaign_id', campaignId)
      const { data } = await q
      return data || []
    },
    enabled: !!campaignId,
  })
}

export function useOutreachLog() {
  return useQuery({
    queryKey: ['outreach-log'],
    queryFn: async () => {
      const { data } = await supabase.from('outreach_log').select('*').order('created_at', { ascending: false }).limit(50)
      return data || []
    },
  })
}

export function usePortfolioItems() {
  return useQuery({
    queryKey: ['portfolio-items'],
    queryFn: async () => {
      const { data } = await supabase.from('portfolio_items').select('*')
        .eq('active', true).order('last_promoted_at', { ascending: true, nullsFirst: true })
      return data || []
    },
  })
}

export function usePromotionLog() {
  return useQuery({
    queryKey: ['promotion-log'],
    queryFn: async () => {
      const { data } = await supabase.from('promotion_log').select('*').order('published_at', { ascending: false }).limit(50)
      return data || []
    },
  })
}

export function useStripeRevenue() {
  return useQuery({
    queryKey: ['stripe-revenue'],
    queryFn: async () => {
      const { data } = await supabase.from('stripe_revenue').select('*').order('synced_at', { ascending: false }).limit(6)
      return data || []
    },
  })
}

export function useKitSubscribers() {
  return useQuery({
    queryKey: ['kit-subscribers'],
    queryFn: async () => {
      const { data } = await supabase.from('kit_subscribers').select('*').order('synced_at', { ascending: false }).limit(10)
      return data || []
    },
  })
}

export function useBookSales() {
  return useQuery({
    queryKey: ['book-sales'],
    queryFn: async () => {
      const { data } = await supabase.from('book_sales').select('*').order('report_month', { ascending: false }).limit(20)
      return data || []
    },
  })
}

export function useAutonomyRules() {
  return useQuery({
    queryKey: ['autonomy-rules'],
    queryFn: async () => {
      const { data } = await supabase.from('autonomy_rules').select('*').order('autonomy_level').order('action_type')
      return data || []
    },
  })
}

export function useAutoActionsLog() {
  return useQuery({
    queryKey: ['auto-actions-log'],
    queryFn: async () => {
      const { data } = await supabase.from('auto_actions_log').select('*').order('created_at', { ascending: false }).limit(100)
      return data || []
    },
    refetchInterval: 30000,
  })
}

export function useBrandRules() {
  return useQuery({
    queryKey: ['brand-rules'],
    queryFn: async () => {
      const { data } = await supabase.from('brand_rules').select('*').order('rule_key')
      return data || []
    },
  })
}
