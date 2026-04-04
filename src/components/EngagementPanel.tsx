import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { respondToEvent } from '../lib/supabase'
import { MessageSquare, Loader2, CheckCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface EngagementEvent {
  id: string
  event_type: string
  platform: string
  sender_name: string | null
  subject: string | null
  body_preview: string | null
  urgency: string
  status: string
  response_draft: string | null
  created_at: string
}

export function EngagementPanel() {
  const [events, setEvents] = useState<EngagementEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('engagement_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30)
    setEvents(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const handleRespond = async (id: string, draft: string) => {
    setResponding(id)
    await respondToEvent(id, draft)
    setResponding(null)
    refresh()
  }

  const urgencyBadge = (u: string) => {
    if (u === 'critical') return 'bg-red-500/20 text-red-400'
    if (u === 'high') return 'bg-orange-500/20 text-orange-400'
    return 'bg-slate-600/20 text-slate-400'
  }

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700">
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-green-400" />
          Engagement
          <span className="text-xs bg-slate-700 px-2 py-0.5 rounded-full text-slate-300">
            {events.filter(e => e.status === 'new' || e.status === 'notified').length} pending
          </span>
        </h2>
        <button onClick={refresh} className="text-xs px-3 py-1.5 bg-slate-700 rounded hover:bg-slate-600 transition">
          Refresh
        </button>
      </div>
      {loading ? (
        <div className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-500" /></div>
      ) : events.length === 0 ? (
        <div className="p-8 text-center text-slate-500">No engagement events</div>
      ) : (
        <div className="divide-y divide-slate-700/50 max-h-96 overflow-y-auto">
          {events.map(ev => (
            <div key={ev.id} className="p-3 hover:bg-slate-700/30 transition">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-300">{ev.sender_name || 'Unknown'}</span>
                    <span className="text-[10px] text-slate-500">{ev.platform}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${urgencyBadge(ev.urgency)}`}>{ev.urgency}</span>
                    {ev.status === 'responded' && <CheckCircle className="w-3 h-3 text-green-500" />}
                  </div>
                  <div className="text-sm mt-1">{ev.subject || ev.body_preview?.slice(0, 100) || ev.event_type}</div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {formatDistanceToNow(new Date(ev.created_at), { addSuffix: true })}
                  </div>
                </div>
                {(ev.status === 'new' || ev.status === 'notified') && ev.response_draft && (
                  <button
                    onClick={() => handleRespond(ev.id, ev.response_draft!)}
                    disabled={responding === ev.id}
                    className="text-xs px-2 py-1 bg-green-600/20 text-green-400 rounded hover:bg-green-600/40 transition shrink-0"
                  >
                    {responding === ev.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Send Draft'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
