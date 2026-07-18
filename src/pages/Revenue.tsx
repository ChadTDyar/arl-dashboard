import { useStripeRevenue, useKitSubscribers, useBookSales, useOverview, useAppDashboard } from '@/lib/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, Users, BookOpen, TrendingUp, Smartphone } from 'lucide-react'

export function Revenue() {
  const { data: overview } = useOverview()
  const { data: revenue = [] } = useStripeRevenue()
  const { data: subscribers = [] } = useKitSubscribers()
  const { data: bookSales = [] } = useBookSales()
  const { data: apps = [] } = useAppDashboard()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Revenue</h1>

      {/* Top-line stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" /> MRR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">
              ${(overview?.mrr || 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Users className="w-4 h-4" /> Subscribers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overview?.total_subscribers || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" /> Active Subs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overview?.subscription_count || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" /> Book Titles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{bookSales.length > 0 ? new Set(bookSales.map((b: { title?: string }) => b.title)).size : 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Per-App Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Smartphone className="w-4 h-4" /> Apps
          </CardTitle>
        </CardHeader>
        <CardContent>
          {apps.length === 0 ? (
            <p className="text-sm text-muted-foreground">No app data</p>
          ) : (
            <div className="space-y-0">
              <div className="grid grid-cols-6 gap-2 text-[11px] text-muted-foreground font-medium pb-2 border-b border-border">
                <span className="col-span-1">App</span>
                <span className="text-right">Total Users</span>
                <span className="text-right">Paid</span>
                <span className="text-right">Free</span>
                <span className="text-right">Conv %</span>
                <span className="text-right">MRR</span>
              </div>
              {(apps as Array<{ app_id: string; app_name: string; total_users: number; paid_users: number; mrr: number; conversion_rate: number; new_signups: number }>)
                .sort((a, b) => b.mrr - a.mrr || b.total_users - a.total_users)
                .map((app) => (
                <div key={app.app_id} className="grid grid-cols-6 gap-2 text-sm py-1.5 border-b border-border/50 last:border-0">
                  <span className="col-span-1 truncate font-medium">{app.app_name}</span>
                  <span className="text-right font-mono">
                    {app.total_users}
                    {app.new_signups > 0 && (
                      <Badge variant="secondary" className="text-[9px] ml-1 px-1">+{app.new_signups}</Badge>
                    )}
                  </span>
                  <span className="text-right font-mono">{app.paid_users}</span>
                  <span className="text-right font-mono text-muted-foreground">{app.total_users - app.paid_users}</span>
                  <span className={`text-right font-mono ${app.conversion_rate > 0 ? 'text-blue-400' : 'text-muted-foreground'}`}>
                    {app.conversion_rate.toFixed(1)}%
                  </span>
                  <span className={`text-right font-mono ${app.mrr > 0 ? 'text-green-400' : 'text-muted-foreground'}`}>
                    ${app.mrr.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stripe Revenue History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Stripe Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenue.length === 0 ? (
              <p className="text-sm text-muted-foreground">No revenue data</p>
            ) : (
              <div className="space-y-2">
                {revenue.map((r: { id: string; period?: string; mrr?: number; total_revenue?: number; synced_at: string }) => (
                  <div key={r.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{r.period || r.synced_at?.slice(0, 10)}</span>
                    <div className="flex items-center gap-3">
                      {r.mrr != null && <span className="text-green-400 font-mono">${r.mrr.toFixed(2)}</span>}
                      {r.total_revenue != null && (
                        <span className="text-muted-foreground font-mono text-xs">(${r.total_revenue.toFixed(2)} total)</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Kit Subscribers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" /> Kit Subscribers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subscribers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No subscriber data</p>
            ) : (
              <div className="space-y-2">
                {subscribers.map((s: { id: string; total_subscribers?: number; new_today?: number; snapshot_date: string }) => (
                  <div key={s.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{s.snapshot_date}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono">{s.total_subscribers || 0} total</span>
                      {s.new_today != null && s.new_today > 0 && (
                        <Badge variant="secondary" className="text-[10px]">+{s.new_today}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Book Sales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Book Sales
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bookSales.length === 0 ? (
            <p className="text-sm text-muted-foreground">No book sales data</p>
          ) : (
            <div className="space-y-2">
              {bookSales.slice(0, 15).map((b: { id: string; title?: string; units_sold?: number; royalties_usd?: number; report_month: string }) => (
                <div key={b.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate">{b.title || '—'}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{b.report_month}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {b.units_sold != null && <span className="text-muted-foreground font-mono text-xs">{b.units_sold} units</span>}
                    {b.royalties_usd != null && <span className="font-mono text-green-400">${b.royalties_usd.toFixed(2)}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
