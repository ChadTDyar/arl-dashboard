import { useState, useEffect, useCallback } from 'react'
import { supabase, autoApprove } from './lib/supabase'
import { StatCard } from './components/StatCard'
import { QueuePanel } from './components/QueuePanel'
import { EngagementPanel } from './components/EngagementPanel'
import { AuditLog } from './components/AuditLog'
import { StalenessPanel } from './components/StalenessPanel'
import { RevenuePanel } from './components/RevenuePanel'
import { CampaignPanel } from './components/CampaignPanel'
import { LayoutDashboard, RefreshCw, Zap } from 'lucide-react'

interface Stats {
  queueReady: number
  queueApproved: number
  engagementPending: number
  autoActions: number
  totalPublished: number
}

export default function App() {
  const [stats, setStats] = useState<Stats>({ queueReady: 0, queueApproved: 0, engagementPending: 0, autoActions: 0, totalPublished: 0 })
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [triggering, setTriggering] = useState(false)

  const loadStats = useCallback(async () => {
    const [mqReady, mqApproved, cpReady, cpApproved, engPending, actions, mqPub, cpPub] = await Promise.all([
      supabase.from('marketing_queue').select('id', { count: 'exact', head: true }).eq('status', 'ready'),
      supabase.from('marketing_queue').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('comet_posts').select('id', { count: 'exact', head: true }).eq('status', 'ready_to_publish'),
      supabase.from('comet_posts').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('engagement_events').select('id', { count: 'exact', head: true }).in('status', ['new', 'notified']),
      supabase.from('auto_actions_log').select('id', { count: 'exact', head: true }),
      supabase.from('marketing_queue').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('comet_posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    ])

    setStats({
      queueReady: (mqReady.count || 0) + (cpReady.count || 0),
      queueApproved: (mqApproved.count || 0) + (cpApproved.count || 0),
      engagementPending: engPending.count || 0,
      autoActions: actions.count || 0,
      totalPublished: (mqPub.count || 0) + (cpPub.count || 0),
    })
    setLastRefresh(new Date())
  }, [])

  useEffect(() => { loadStats() }, [loadStats])

  useEffect(() => {
    const interval = setInterval(loadStats, 60000)
    return () => clearInterval(interval)
  }, [loadStats])

  useEffect(() => {
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'marketing_queue' }, () => loadStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comet_posts' }, () => loadStats())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'auto_actions_log' }, () => loadStats())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'engagement_events' }, () => loadStats())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadStats])

  const handleTriggerGate = async () => {
    setTriggering(true)
    await autoApprove()
    setTriggering(false)
    loadStats()
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="border-b border-slate-700 bg-slate-800/80 sticky top-0 z-10 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-6 h-6 text-blue-400" />
            <h1 className="text-lg font-bold">ARL Dashboard</h1>
            <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">LIVE</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-500">
              Updated {lastRefresh.toLocaleTimeString()}
            </span>
            <button
              onClick={handleTriggerGate}
              disabled={triggering}
              className="text-xs px-3 py-1.5 bg-blue-600 rounded hover:bg-blue-500 transition disabled:opacity-50 flex items-center gap-1"
            >
              <Zap className="w-3 h-3" />
              Run Gate
            </button>
            <button onClick={loadStats} className="text-xs px-3 py-1.5 bg-slate-700 rounded hover:bg-slate-600 transition flex items-center gap-1">
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label="Ready to Approve" value={stats.queueReady} color={stats.queueReady > 0 ? 'text-yellow-400' : 'text-slate-400'} />
          <StatCard label="Approved" value={stats.queueApproved} color="text-green-400" />
          <StatCard label="Published" value={stats.totalPublished} color="text-blue-400" />
          <StatCard label="Engagement Pending" value={stats.engagementPending} color={stats.engagementPending > 0 ? 'text-orange-400' : 'text-slate-400'} />
          <StatCard label="Auto Actions" value={stats.autoActions} color="text-purple-400" />
        </div>

        <RevenuePanel />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QueuePanel />
          <EngagementPanel />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StalenessPanel />
          <CampaignPanel />
        </div>

        <AuditLog />
      </main>
    </div>
  )
}
