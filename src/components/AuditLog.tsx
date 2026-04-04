import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Activity, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Action {
  id: string
  action_type: string
  agent: string
  description: string
  confidence_score: number | null
  result: string
  created_at: string
}

export function AuditLog() {
  const [actions, setActions] = useState<Action[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('auto_actions_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    setActions(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const resultColor = (r: string) => {
    if (r === 'success') return 'text-green-400'
    if (r === 'no_action') return 'text-slate-400'
    return 'text-red-400'
  }

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700">
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-400" />
          Audit Log
        </h2>
        <button onClick={refresh} className="text-xs px-3 py-1.5 bg-slate-700 rounded hover:bg-slate-600 transition">
          Refresh
        </button>
      </div>
      {loading ? (
        <div className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-500" /></div>
      ) : actions.length === 0 ? (
        <div className="p-8 text-center text-slate-500">No autonomous actions logged yet</div>
      ) : (
        <div className="divide-y divide-slate-700/50 max-h-64 overflow-y-auto">
          {actions.map(a => (
            <div key={a.id} className="p-3 hover:bg-slate-700/30 transition">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono ${resultColor(a.result)}`}>{a.result}</span>
                <span className="text-xs text-slate-500">{a.agent}</span>
                <span className="text-[10px] text-slate-600 ml-auto">
                  {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                </span>
              </div>
              <div className="text-sm text-slate-300 mt-1">{a.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
