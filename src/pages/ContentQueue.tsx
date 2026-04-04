import { useQueryClient } from '@tanstack/react-query'
import { useMarketingQueue, useCometPosts } from '@/lib/queries'
import { approveItem, rejectItem, editItem, dismissItem } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Check, X, Edit3, EyeOff, Send, Globe } from 'lucide-react'
import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'

type QueueItem = {
  id: string
  title?: string
  body?: string
  content?: string
  status: string
  platform?: string
  channel?: string
  created_at: string
  source: 'marketing_queue' | 'comet_posts'
}

function platformColor(p?: string) {
  const map: Record<string, string> = {
    linkedin: 'bg-blue-600',
    twitter: 'bg-sky-500',
    medium: 'bg-green-600',
    blog: 'bg-orange-500',
    email: 'bg-purple-500',
    youtube: 'bg-red-600',
  }
  return map[(p || '').toLowerCase()] || 'bg-zinc-600'
}

function ItemCard({ item, onAction }: { item: QueueItem; onAction: () => void }) {
  const [editing, setEditing] = useState(false)
  const [editBody, setEditBody] = useState(item.body || item.content || '')
  const [busy, setBusy] = useState('')
  const qc = useQueryClient()

  const act = async (action: string) => {
    setBusy(action)
    try {
      if (action === 'approve') await approveItem(item.id, item.source)
      if (action === 'reject') await rejectItem(item.id, item.source)
      if (action === 'dismiss') await dismissItem(item.id, item.source)
      if (action === 'save') {
        await editItem(item.id, item.source, editBody, item.title)
        setEditing(false)
      }
      qc.invalidateQueries({ queryKey: ['marketing-queue'] })
      qc.invalidateQueries({ queryKey: ['comet-posts'] })
      onAction()
    } finally {
      setBusy('')
    }
  }

  const platform = item.platform || item.channel || 'unknown'
  const text = item.body || item.content || ''

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] text-white px-1.5 py-0.5 rounded ${platformColor(platform)}`}>
            {platform}
          </span>
          <Badge variant="outline" className="text-[10px]">{item.source === 'comet_posts' ? 'comet' : 'mq'}</Badge>
          <span className="text-[10px] text-muted-foreground ml-auto">
            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
          </span>
        </div>
        {item.title && <p className="text-sm font-medium">{item.title}</p>}
        {editing ? (
          <div className="space-y-2">
            <Textarea value={editBody} onChange={e => setEditBody(e.target.value)} rows={4} />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => act('save')} disabled={busy === 'save'}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">{text}</p>
        )}
        {!editing && (
          <div className="flex gap-1.5">
            <Button size="sm" onClick={() => act('approve')} disabled={!!busy}>
              <Check className="w-3.5 h-3.5 mr-1" /> Approve
            </Button>
            <Button size="sm" variant="destructive" onClick={() => act('reject')} disabled={!!busy}>
              <X className="w-3.5 h-3.5 mr-1" /> Reject
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)} disabled={!!busy}>
              <Edit3 className="w-3.5 h-3.5" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => act('dismiss')} disabled={!!busy}>
              <EyeOff className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function ContentQueue() {
  const [tab, setTab] = useState('pending')
  const { data: mq = [], refetch: refetchMq } = useMarketingQueue()
  const { data: cp = [], refetch: refetchCp } = useCometPosts()

  const all: QueueItem[] = [
    ...(mq as QueueItem[]).map(i => ({ ...i, source: 'marketing_queue' as const })),
    ...(cp as QueueItem[]).map(i => ({ ...i, source: 'comet_posts' as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const pending = all.filter(i => ['ready', 'ready_to_publish', 'pending_approval'].includes(i.status))
  const approved = all.filter(i => i.status === 'approved')
  const published = all.filter(i => i.status === 'published')
  const rejected = all.filter(i => ['rejected', 'dismissed'].includes(i.status))

  const lists: Record<string, QueueItem[]> = { pending, approved, published, rejected }
  const counts: Record<string, number> = {
    pending: pending.length,
    approved: approved.length,
    published: published.length,
    rejected: rejected.length,
  }

  const refetch = () => { refetchMq(); refetchCp() }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Content Queue</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Send className="w-4 h-4" /> {all.length} total items
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {Object.entries(counts).map(([key, count]) => (
            <TabsTrigger key={key} value={key} className="capitalize">
              {key} {count > 0 && <span className="ml-1.5 text-[10px] bg-muted px-1.5 rounded-full">{count}</span>}
            </TabsTrigger>
          ))}
        </TabsList>
        {Object.entries(lists).map(([key, items]) => (
          <TabsContent key={key} value={key} className="space-y-3 mt-4">
            {items.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground text-sm">
                  <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  No {key} items
                </CardContent>
              </Card>
            )}
            {items.map(item => (
              <ItemCard key={`${item.source}-${item.id}`} item={item} onAction={refetch} />
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
