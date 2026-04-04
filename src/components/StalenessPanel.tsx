import { useState, useEffect } from 'react'
import { getStaleness } from '../lib/supabase'
import { TrendingDown, Loader2 } from 'lucide-react'

interface PortfolioItem {
  id: string
  name: string
  type: string
  category: string
  promotion_count: number
  days_since_promoted: number | null
  never_promoted: boolean
}

export function StalenessPanel() {
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStaleness().then(data => {
      setItems(data.items || [])
      setLoading(false)
    })
  }, [])

  const heatColor = (days: number | null, never: boolean) => {
    if (never) return 'bg-red-500/30 text-red-400'
    if (days === null) return 'bg-slate-600/20 text-slate-400'
    if (days > 30) return 'bg-red-500/20 text-red-400'
    if (days > 14) return 'bg-orange-500/20 text-orange-400'
    if (days > 7) return 'bg-yellow-500/20 text-yellow-400'
    return 'bg-green-500/20 text-green-400'
  }

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-orange-400" />
          Portfolio Staleness
        </h2>
      </div>
      {loading ? (
        <div className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-500" /></div>
      ) : (
        <div className="divide-y divide-slate-700/50 max-h-72 overflow-y-auto">
          {items.map(item => (
            <div key={item.id} className="p-3 flex items-center gap-3 hover:bg-slate-700/30 transition">
              <span className={`text-[10px] px-2 py-1 rounded font-mono min-w-[60px] text-center ${heatColor(item.days_since_promoted, item.never_promoted)}`}>
                {item.never_promoted ? 'NEVER' : item.days_since_promoted !== null ? `${item.days_since_promoted}d` : '?'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{item.name}</div>
                <div className="text-[10px] text-slate-500">{item.type} / {item.category}</div>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">{item.promotion_count}x</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
