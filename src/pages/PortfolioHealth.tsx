import { usePortfolioItems, usePromotionLog } from '@/lib/queries'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package, Clock } from 'lucide-react'
import { formatDistanceToNow, differenceInDays } from 'date-fns'

function stalenessColor(days: number) {
  if (days <= 7) return 'bg-green-500'
  if (days <= 14) return 'bg-yellow-500'
  if (days <= 30) return 'bg-orange-500'
  return 'bg-red-500'
}

function stalenessLabel(days: number) {
  if (days <= 7) return 'Fresh'
  if (days <= 14) return 'OK'
  if (days <= 30) return 'Stale'
  return 'Overdue'
}

export function PortfolioHealth() {
  const { data: items = [] } = usePortfolioItems()
  const { data: promoLog = [] } = usePromotionLog()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Portfolio Health</h1>

      <div className="space-y-4">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Package className="w-4 h-4" /> Products
        </h2>
        {items.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">No portfolio items</CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item: { id: string; name: string; product_type?: string; url?: string; last_promoted_at?: string }) => {
              const days = item.last_promoted_at
                ? differenceInDays(new Date(), new Date(item.last_promoted_at))
                : 999
              return (
                <Card key={item.id}>
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${stalenessColor(days)}`} />
                        <span className="text-[10px] text-muted-foreground">{stalenessLabel(days)}</span>
                      </div>
                    </div>
                    {item.product_type && (
                      <Badge variant="outline" className="text-[10px]">{item.product_type}</Badge>
                    )}
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {item.last_promoted_at
                        ? `Promoted ${formatDistanceToNow(new Date(item.last_promoted_at), { addSuffix: true })}`
                        : 'Never promoted'}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4" /> Promotion Timeline
        </h2>
        <Card>
          <CardContent className="pt-4">
            {promoLog.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No promotions logged</p>
            ) : (
              <div className="space-y-2">
                {promoLog.slice(0, 20).map((p: { id: string; product_name?: string; platform?: string; channel?: string; published_at: string }) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate">{p.product_name || '—'}</span>
                      <Badge variant="secondary" className="text-[10px] shrink-0">{p.platform || p.channel || '—'}</Badge>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                      {formatDistanceToNow(new Date(p.published_at), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
