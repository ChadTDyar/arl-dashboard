import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { DollarSign, Users, Loader2 } from 'lucide-react'

interface StripeRow {
  id: string
  app_name: string
  mrr: number
  total_customers: number
  period: string
}

interface KitRow {
  id: string
  tag_name: string
  subscriber_count: number
  synced_at: string
}

export function RevenuePanel() {
  const [stripe, setStripe] = useState<StripeRow[]>([])
  const [kit, setKit] = useState<KitRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('stripe_revenue').select('*').order('app_name'),
      supabase.from('kit_subscribers').select('*').order('subscriber_count', { ascending: false }),
    ]).then(([s, k]) => {
      setStripe(s.data || [])
      setKit(k.data || [])
      setLoading(false)
    })
  }, [])

  const totalMRR = stripe.reduce((sum, r) => sum + (r.mrr || 0), 0)
  const totalSubs = kit.reduce((sum, r) => sum + (r.subscriber_count || 0), 0)

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-500" /></div>

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-slate-800/50 rounded-lg border border-slate-700">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            Stripe MRR
            <span className="ml-auto text-green-400 font-mono">${totalMRR.toFixed(2)}</span>
          </h2>
        </div>
        <div className="divide-y divide-slate-700/50">
          {stripe.map(r => (
            <div key={r.id} className="p-3 flex items-center justify-between">
              <span className="text-sm">{r.app_name}</span>
              <div className="text-right">
                <span className="text-sm font-mono text-green-400">${r.mrr?.toFixed(2) || '0.00'}</span>
                <span className="text-[10px] text-slate-500 ml-2">{r.total_customers} customers</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-lg border border-slate-700">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Kit Subscribers
            <span className="ml-auto text-blue-400 font-mono">{totalSubs}</span>
          </h2>
        </div>
        <div className="divide-y divide-slate-700/50">
          {kit.map(r => (
            <div key={r.id} className="p-3 flex items-center justify-between">
              <span className="text-sm truncate">{r.tag_name}</span>
              <span className="text-sm font-mono text-blue-400">{r.subscriber_count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
