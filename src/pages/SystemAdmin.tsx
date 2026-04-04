import { useQueryClient } from '@tanstack/react-query'
import { useAutonomyRules, useAutoActionsLog, useBrandRules, useSystemHealth } from '@/lib/queries'
import { updateRule, triggerGate, triggerVivian } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Settings, Shield, Zap, Brain, Activity } from 'lucide-react'
import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'

function RuleRow({ rule, onUpdate }: { rule: { id: number; action_type: string; autonomy_level: string; confidence_threshold?: number }; onUpdate: () => void }) {
  const [level, setLevel] = useState(rule.autonomy_level)
  const [threshold, setThreshold] = useState(rule.confidence_threshold ?? 0.8)
  const [saving, setSaving] = useState(false)
  const changed = level !== rule.autonomy_level || threshold !== (rule.confidence_threshold ?? 0.8)

  const save = async () => {
    setSaving(true)
    await updateRule(rule.id, level, threshold)
    setSaving(false)
    onUpdate()
  }

  const levelColor = level === 'auto' ? 'bg-green-500/20 text-green-400'
    : level === 'auto_if_confident' ? 'bg-yellow-500/20 text-yellow-400'
    : 'bg-red-500/20 text-red-400'

  return (
    <div className="flex items-center gap-3 py-2 border-b border-border last:border-0">
      <span className="text-sm flex-1 min-w-0 truncate">{rule.action_type}</span>
      <select
        value={level}
        onChange={e => setLevel(e.target.value)}
        className={`text-[11px] px-2 py-1 rounded border-0 ${levelColor} cursor-pointer`}
      >
        <option value="auto">auto</option>
        <option value="auto_if_confident">auto_if_confident</option>
        <option value="human_required">human_required</option>
      </select>
      <input
        type="number"
        min={0}
        max={1}
        step={0.05}
        value={threshold}
        onChange={e => setThreshold(Number(e.target.value))}
        className="w-16 text-xs text-center bg-muted rounded px-2 py-1"
      />
      {changed && (
        <Button size="sm" variant="secondary" onClick={save} disabled={saving} className="text-[10px] h-7">
          Save
        </Button>
      )}
    </div>
  )
}

export function SystemAdmin() {
  const qc = useQueryClient()
  const { data: rules = [] } = useAutonomyRules()
  const { data: actions = [] } = useAutoActionsLog()
  const { data: brandRules = [] } = useBrandRules()
  const { data: health } = useSystemHealth()
  const [gateRunning, setGateRunning] = useState(false)
  const [vivianRunning, setVivianRunning] = useState(false)

  const handleGate = async () => {
    setGateRunning(true)
    await triggerGate()
    setGateRunning(false)
    qc.invalidateQueries({ queryKey: ['auto-actions-log'] })
  }

  const handleVivian = async () => {
    setVivianRunning(true)
    await triggerVivian()
    setVivianRunning(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">System Admin</h1>
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

      {/* System Health */}
      {health && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4" /> System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {Object.entries(health as Record<string, unknown>).map(([key, val]) => (
                <div key={key}>
                  <p className="text-muted-foreground text-[11px]">{key.replace(/_/g, ' ')}</p>
                  <p className="font-mono">{String(val)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Autonomy Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4" /> Autonomy Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rules.length === 0 ? (
              <p className="text-sm text-muted-foreground">No rules configured</p>
            ) : (
              <div>
                {rules.map((r: { id: number; action_type: string; autonomy_level: string; confidence_threshold?: number }) => (
                  <RuleRow
                    key={r.id}
                    rule={r}
                    onUpdate={() => qc.invalidateQueries({ queryKey: ['autonomy-rules'] })}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Brand Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="w-4 h-4" /> Brand Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            {brandRules.length === 0 ? (
              <p className="text-sm text-muted-foreground">No brand rules</p>
            ) : (
              <div className="space-y-2">
                {brandRules.map((b: { id: string; rule_key: string; rule_value?: string }) => (
                  <div key={b.id} className="flex items-start gap-2 text-sm">
                    <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">{b.rule_key}</Badge>
                    <span className="text-muted-foreground text-xs">{b.rule_value || '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Audit Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audit Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {actions.slice(0, 50).map((a: { id: string; agent: string; action_type?: string; description: string; result: string; created_at: string }) => (
              <div key={a.id} className="flex items-start gap-2 text-sm">
                <Badge variant={a.result === 'success' ? 'default' : 'outline'} className="text-[10px] shrink-0 mt-0.5">
                  {a.result}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="truncate">{a.description}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {a.agent}{a.action_type ? ` · ${a.action_type}` : ''} · {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
            {actions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No actions logged</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
