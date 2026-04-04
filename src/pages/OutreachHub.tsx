import { useOutreachCampaigns, useOutreachLog } from '@/lib/queries'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Target, Send } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export function OutreachHub() {
  const { data: campaigns = [] } = useOutreachCampaigns()
  const { data: log = [] } = useOutreachLog()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Outreach</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Target className="w-4 h-4" /> Active Campaigns
          </h2>
          {campaigns.length === 0 && (
            <Card>
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                No active campaigns
              </CardContent>
            </Card>
          )}
          {campaigns.map((c: { id: string; name: string; status: string; platform?: string; target_count?: number; created_at: string }) => (
            <Card key={c.id}>
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{c.name}</p>
                  <Badge variant="secondary" className="text-[10px]">{c.status}</Badge>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  {c.platform && <span>{c.platform}</span>}
                  {c.target_count != null && <span>{c.target_count} targets</span>}
                  <span>{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Send className="w-4 h-4" /> Recent Outreach
          </h2>
          {log.length === 0 && (
            <Card>
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                No outreach logged
              </CardContent>
            </Card>
          )}
          <div className="space-y-2">
            {log.map((l: { id: string; action?: string; platform?: string; target_name?: string; result?: string; created_at: string }) => (
              <div key={l.id} className="flex items-start gap-2 text-sm">
                <Badge variant={l.result === 'sent' ? 'default' : 'outline'} className="text-[10px] shrink-0 mt-0.5">
                  {l.result || l.action || '—'}
                </Badge>
                <div className="min-w-0">
                  <p className="truncate">{l.target_name || l.action || 'outreach'}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {l.platform} · {formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
