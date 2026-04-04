import { useQueryClient } from '@tanstack/react-query'
import { useOverview, useAutoActionsLog } from '@/lib/queries'
import { triggerGate, triggerVivian } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Zap, Brain, AlertCircle, DollarSign, Users, Activity } from 'lucide-react'
import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'

export function CommandCenter() {
  const { data: overview, isLoading } = useOverview()
  const { data: actions } = useAutoActionsLog()
  const qc = useQueryClient()
  const [gateRunning, setGateRunning] = useState(false)
  const [vivianRunning, setVivianRunning] = useState(false)

  const handleGate = async () => {
    setGateRunning(true)
    await triggerGate()
    setGateRunning(false)
    qc.invalidateQueries({ queryKey: ['overview'] })
    qc.invalidateQueries({ queryKey: ['auto-actions-log'] })
  }

  const handleVivian = async () => {
    setVivianRunning(true)
    await triggerVivian()
    setVivianRunning(false)
  }

  const recentActions = actions?.slice(0, 5) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Command Center</h1>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleGate} disabled={gateRunning}>
            <Zap className="w-4 h-4 mr-1.5" />
            {gateRunning ? 'Running...' : 'Run Gate'}
          </Button>
          <Button size="sm" variant="secondary" onClick={handleVivian} disabled={vivianRunning}>
            <Brain className="w-4 h-4 mr-1.5" />
            {vivianRunning ? 'Running...' : 'Vivian Brief'}
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> Awaiting Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{isLoading ? '...' : overview?.pending_approval || 0}</div>
            {overview?.linkedin_pending > 0 && (
              <p className="text-xs text-blue-400 mt-1">{overview.linkedin_pending} LinkedIn (human required)</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Activity className="w-4 h-4" /> Unread Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{isLoading ? '...' : overview?.unread_engagement || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" /> MRR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">
              ${isLoading ? '...' : (overview?.mrr || 0).toFixed(2)}
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
            <div className="text-3xl font-bold">{isLoading ? '...' : overview?.subscribers || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Queue summary + Recent actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Queue Status</CardTitle>
          </CardHeader>
          <CardContent>
            {overview?.queue_summary ? (
              <div className="space-y-2">
                {Object.entries(overview.queue_summary as Record<string, number>).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <Badge variant={status === 'published' ? 'default' : status === 'approved' ? 'secondary' : 'outline'}>
                      {status}
                    </Badge>
                    <span className="font-mono text-sm">{count as number}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Loading...</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Auto-Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActions.map((a: { id: string; agent: string; description: string; result: string; created_at: string }) => (
                <div key={a.id} className="flex items-start gap-2">
                  <Badge variant={a.result === 'success' ? 'default' : 'outline'} className="text-[10px] shrink-0 mt-0.5">
                    {a.result}
                  </Badge>
                  <div className="min-w-0">
                    <p className="text-sm truncate">{a.description}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {a.agent} · {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
              {recentActions.length === 0 && (
                <p className="text-sm text-muted-foreground">No actions yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
