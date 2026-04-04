import { useQueryClient } from '@tanstack/react-query'
import { useEngagementEvents } from '@/lib/queries'
import { respondEvent, dismissEvent } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquare, Send, EyeOff, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'

type EngagementEvent = {
  id: string
  platform: string
  event_type: string
  status: string
  author_name?: string
  content?: string
  source_url?: string
  suggested_response?: string
  created_at: string
}

function urgencyOrder(status: string) {
  if (status === 'new') return 0
  if (status === 'notified') return 1
  if (status === 'responded') return 2
  return 3
}

function EventCard({ event }: { event: EngagementEvent }) {
  const [replying, setReplying] = useState(false)
  const [replyText, setReplyText] = useState(event.suggested_response || '')
  const [busy, setBusy] = useState('')
  const qc = useQueryClient()

  const handleRespond = async () => {
    setBusy('respond')
    await respondEvent(event.id, replyText)
    qc.invalidateQueries({ queryKey: ['engagement-events'] })
    setReplying(false)
    setBusy('')
  }

  const handleDismiss = async () => {
    setBusy('dismiss')
    await dismissEvent(event.id)
    qc.invalidateQueries({ queryKey: ['engagement-events'] })
    setBusy('')
  }

  return (
    <Card className={event.status === 'new' ? 'border-l-2 border-l-yellow-500' : ''}>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant={event.status === 'new' ? 'default' : 'outline'} className="text-[10px]">
            {event.status}
          </Badge>
          <Badge variant="secondary" className="text-[10px]">{event.platform}</Badge>
          <span className="text-[10px] text-muted-foreground">{event.event_type}</span>
          <span className="text-[10px] text-muted-foreground ml-auto">
            {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
          </span>
        </div>
        {event.author_name && (
          <p className="text-sm font-medium">{event.author_name}</p>
        )}
        {event.content && (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">{event.content}</p>
        )}
        {replying ? (
          <div className="space-y-2">
            <Textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={3} placeholder="Response..." />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleRespond} disabled={busy === 'respond'}>
                <Send className="w-3.5 h-3.5 mr-1" /> Send
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setReplying(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-1.5">
            {['new', 'notified'].includes(event.status) && (
              <>
                <Button size="sm" onClick={() => setReplying(true)}>
                  <MessageSquare className="w-3.5 h-3.5 mr-1" /> Respond
                </Button>
                <Button size="sm" variant="ghost" onClick={handleDismiss} disabled={!!busy}>
                  <EyeOff className="w-3.5 h-3.5 mr-1" /> Dismiss
                </Button>
              </>
            )}
            {event.source_url && (
              <a href={event.source_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 w-8 border border-input bg-background hover:bg-accent">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function EngagementFeed() {
  const { data: events = [] } = useEngagementEvents()
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all')

  const sorted = [...events].sort((a: EngagementEvent, b: EngagementEvent) =>
    urgencyOrder(a.status) - urgencyOrder(b.status) ||
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ) as EngagementEvent[]

  const filtered = filter === 'all' ? sorted
    : filter === 'active' ? sorted.filter(e => ['new', 'notified'].includes(e.status))
    : sorted.filter(e => ['responded', 'dismissed'].includes(e.status))

  const newCount = sorted.filter(e => e.status === 'new').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Engagement</h1>
        {newCount > 0 && (
          <Badge variant="destructive">{newCount} new</Badge>
        )}
      </div>

      <div className="flex gap-2">
        {(['all', 'active', 'resolved'] as const).map(f => (
          <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)} className="capitalize">
            {f}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No engagement events
            </CardContent>
          </Card>
        )}
        {filtered.map((e: EngagementEvent) => (
          <EventCard key={e.id} event={e} />
        ))}
      </div>
    </div>
  )
}
