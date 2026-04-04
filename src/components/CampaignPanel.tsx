import { useState, useEffect } from 'react'
import { getWeeklyPlan } from '../lib/supabase'
import { Target, Loader2 } from 'lucide-react'

interface CampaignPlan {
  campaign_name: string
  portfolio_category: string
  goal: string
  progress: {
    total_targets: number
    verified: number
    contacted: number
    sent_this_week: number
    total_sent: number
    replied: number
    response_rate: number
  }
  needs: {
    research: boolean
    pitches: boolean
    pitches_remaining: number
  }
}

export function CampaignPanel() {
  const [plans, setPlans] = useState<CampaignPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getWeeklyPlan().then(data => {
      setPlans(data.plan || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-500" /></div>

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Target className="w-5 h-5 text-cyan-400" />
          Outreach Campaigns
        </h2>
      </div>
      {plans.length === 0 ? (
        <div className="p-8 text-center text-slate-500">No active campaigns</div>
      ) : (
        <div className="divide-y divide-slate-700/50">
          {plans.map(p => (
            <div key={p.campaign_name} className="p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{p.campaign_name}</span>
                <span className="text-[10px] text-slate-500">{p.portfolio_category}</span>
              </div>
              <div className="flex gap-4 mt-2 text-[10px]">
                <span className="text-slate-400">Targets: <span className="text-slate-300 font-mono">{p.progress.total_targets}</span></span>
                <span className="text-slate-400">Sent: <span className="text-slate-300 font-mono">{p.progress.total_sent}</span></span>
                <span className="text-slate-400">Replied: <span className="text-green-400 font-mono">{p.progress.replied}</span></span>
                <span className="text-slate-400">Rate: <span className="text-blue-400 font-mono">{p.progress.response_rate}%</span></span>
              </div>
              {p.needs.pitches && (
                <div className="mt-1 text-[10px] text-orange-400">
                  {p.needs.pitches_remaining} pitches remaining this week
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
