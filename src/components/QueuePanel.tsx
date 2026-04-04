import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { autoApprove } from '../lib/supabase'
import { Check, Loader2, Send } from 'lucide-react'

interface QueueItem {
  id: string
  platform: string
  title: string | null
  body: string | null
  status: string
  content_summary?: string
  source?: string
  created_at: string
}

export function QueuePanel() {
  const [mqItems, setMqItems] = useState<QueueItem[]>([])
  const [cpItems, setCpItems] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    const [mq, cp] = await Promise.all([
      supabase.from('marketing_queue').select('*').in('status', ['ready', 'approved', 'pending']).order('created_at', { ascending: false }).limit(50),
      supabase.from('comet_posts').select('*').in('status', ['ready_to_publish', 'approved']).order('created_at', { ascending: false }).limit(50),
    ])
    setMqItems(mq.data || [])
    setCpItems(cp.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const handleAutoApprove = async () => {
    setApproving(true)
    const result = await autoApprove()
    setApproving(false)
    if (result.success) refresh()
  }

  const handleApproveOne = async (id: string, table: 'marketing_queue' | 'comet_posts') => {
    if (table === 'marketing_queue') {
      await supabase.from('marketing_queue').update({ status: 'approved', approved_at: new Date().toISOString() }).eq('id', id)
    } else {
      await supabase.from('comet_posts').update({ status: 'approved' }).eq('id', id)
    }
    refresh()
  }

  const statusColor = (s: string) => {
    if (s === 'approved') return 'bg-green-500/20 text-green-400'
    if (s === 'ready' || s === 'ready_to_publish') return 'bg-yellow-500/20 text-yellow-400'
    return 'bg-slate-600/20 text-slate-400'
  }

  const platformColor = (p: string) => {
    const colors: Record<string, string> = {
      linkedin: 'bg-blue-600', medium: 'bg-slate-600', substack: 'bg-orange-600',
      blog: 'bg-purple-600', pinterest: 'bg-red-600', quora: 'bg-red-500',
      indiehackers: 'bg-blue-500', devto: 'bg-slate-500', mastodon: 'bg-indigo-600',
      bluesky: 'bg-sky-500',
    }
    return colors[p] || 'bg-slate-600'
  }

  const allItems = [
    ...mqItems.map(i => ({ ...i, _table: 'marketing_queue' as const })),
    ...cpItems.map(i => ({ ...i, _table: 'comet_posts' as const, title: i.content_summary })),
  ]

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700">
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Send className="w-5 h-5 text-blue-400" />
          Content Queue
          <span className="text-xs bg-slate-700 px-2 py-0.5 rounded-full text-slate-300">{allItems.length}</span>
        </h2>
        <div className="flex gap-2">
          <button onClick={refresh} className="text-xs px-3 py-1.5 bg-slate-700 rounded hover:bg-slate-600 transition">
            Refresh
          </button>
          <button
            onClick={handleAutoApprove}
            disabled={approving}
            className="text-xs px-3 py-1.5 bg-blue-600 rounded hover:bg-blue-500 transition disabled:opacity-50 flex items-center gap-1"
          >
            {approving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            Auto-Approve All
          </button>
        </div>
      </div>
      {loading ? (
        <div className="p-8 text-center text-slate-500"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
      ) : allItems.length === 0 ? (
        <div className="p-8 text-center text-slate-500">Queue empty</div>
      ) : (
        <div className="divide-y divide-slate-700/50 max-h-96 overflow-y-auto">
          {allItems.map(item => (
            <div key={item.id} className="p-3 flex items-start gap-3 hover:bg-slate-700/30 transition">
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium text-white ${platformColor(item.platform)}`}>
                {item.platform}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{item.title || item.body?.slice(0, 80) || 'Untitled'}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusColor(item.status)}`}>{item.status}</span>
                  <span className="text-[10px] text-slate-500">{item._table === 'comet_posts' ? 'comet' : 'mq'}</span>
                </div>
              </div>
              {(item.status === 'ready' || item.status === 'ready_to_publish' || item.status === 'pending') && (
                <button
                  onClick={() => handleApproveOne(item.id, item._table)}
                  className="text-xs px-2 py-1 bg-green-600/20 text-green-400 rounded hover:bg-green-600/40 transition flex items-center gap-1"
                >
                  <Check className="w-3 h-3" /> Approve
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
