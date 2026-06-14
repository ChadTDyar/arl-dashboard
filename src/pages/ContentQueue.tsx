import { useQueryClient } from '@tanstack/react-query'
import { useMarketingQueue, useCometPosts } from '@/lib/queries'
import { approveItem, rejectItem, editItem, dismissItem } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Check, X, Edit3, EyeOff, Send, Globe, Copy, CheckCircle, ChevronDown, ChevronUp, CheckCheck, XCircle } from 'lucide-react'
import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'

type QueueItem = {
  id: string
  title?: string
  body?: string
  content?: string
  content_summary?: string
  status: string
  platform?: string
  channel?: string
  cta_text?: string
  cta_url?: string
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
    mastodon: 'bg-indigo-600',
    dev_to: 'bg-gray-800',
    devto: 'bg-gray-800',
    substack: 'bg-orange-600',
    pinterest: 'bg-red-500',
  }
  return map[(p || '').toLowerCase()] || 'bg-zinc-600'
}

function ItemCard({ item, onAction, showMarkPosted }: { item: QueueItem; onAction: () => void; showMarkPosted?: boolean }) {
  const [editing, setEditing] = useState(false)
  const [editBody, setEditBody] = useState(item.body || item.content || item.content_summary || '')
  const [busy, setBusy] = useState('')
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)
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
      if (action === 'mark_posted') {
        const table = item.source === 'comet_posts' ? 'comet_posts' : 'marketing_queue'
        await supabase.from(table).update({ status: 'published', published_at: new Date().toISOString() }).eq('id', item.id)
        await supabase.from('content_distribution').insert({
          post_id: item.id,
          platform: item.platform || item.channel || 'unknown',
          content_summary: (item.title || '').slice(0, 200),
          publish_date: new Date().toISOString().split('T')[0],
          status: 'published',
          approval_source: 'human',
          vox_pass: false,
        })
      }
      qc.invalidateQueries({ queryKey: ['marketing-queue'] })
      qc.invalidateQueries({ queryKey: ['comet-posts'] })
      onAction()
    } finally {
      setBusy('')
    }
  }

  const copyBody = async () => {
    const text = item.body || item.content || item.content_summary || ''
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const platform = item.platform || item.channel || 'unknown'
  const text = item.body || item.content || item.content_summary || ''
  const isLong = text.length > 400

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] text-white px-1.5 py-0.5 rounded ${platformColor(platform)}`}>
            {platform}
          </span>
          <Badge variant="outline" className="text-[10px]">{item.status}</Badge>
          <Badge variant="outline" className="text-[10px]">{item.source === 'comet_posts' ? 'comet' : 'mq'}</Badge>
          <span className="text-[10px] text-muted-foreground ml-auto">
            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
          </span>
        </div>
        {item.title && <p className="text-sm font-medium">{item.title}</p>}
        {editing ? (
          <div className="space-y-2">
            <Textarea value={editBody} onChange={e => setEditBody(e.target.value)} rows={8} />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => act('save')} disabled={busy === 'save'}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div>
            <p className={`text-sm text-muted-foreground whitespace-pre-wrap ${isLong && !expanded ? 'line-clamp-6' : ''}`}>{text}</p>
            {isLong && (
              <Button size="sm" variant="link" className="px-0 h-6 text-xs" onClick={() => setExpanded(!expanded)}>
                {expanded ? <><ChevronUp className="w-3 h-3 mr-1" />Show less</> : <><ChevronDown className="w-3 h-3 mr-1" />Show full post</>}
              </Button>
            )}
          </div>
        )}
        {item.cta_url && (
          <p className="text-xs text-blue-500">CTA: {item.cta_text || 'Link'} &rarr; {item.cta_url}</p>
        )}
        {!editing && (
          <div className="flex gap-1.5 flex-wrap">
            <Button size="sm" variant="outline" onClick={copyBody} disabled={!!busy}>
              {copied ? <><CheckCircle className="w-3.5 h-3.5 mr-1" /> Copied</> : <><Copy className="w-3.5 h-3.5 mr-1" /> Copy</>}
            </Button>
            {showMarkPosted ? (
              <Button size="sm" onClick={() => act('mark_posted')} disabled={!!busy}>
                <Check className="w-3.5 h-3.5 mr-1" /> Mark Posted
              </Button>
            ) : (
              <Button size="sm" onClick={() => act('approve')} disabled={!!busy}>
                <Check className="w-3.5 h-3.5 mr-1" /> Approve
              </Button>
            )}
            <Button size="sm" variant="destructive" onClick={() => act('reject')} disabled={!!busy}>
              <X className="w-3.5 h-3.5 mr-1" /> Kill
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
  const [tab, setTab] = useState('needs_approval')
  const { data: mq = [], refetch: refetchMq } = useMarketingQueue()
  const { data: cp = [], refetch: refetchCp } = useCometPosts()

  const all: QueueItem[] = [
    ...(mq as QueueItem[]).map(i => ({ ...i, source: 'marketing_queue' as const })),
    ...(cp as QueueItem[]).map(i => ({ ...i, source: 'comet_posts' as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const needsApproval = all.filter(i => ['ready', 'human_required', 'manual_publish', 'pending', 'needs_revision'].includes(i.status))
  const linkedin = all.filter(i => (i.platform || i.channel || '').toLowerCase() === 'linkedin' && !['published', 'rejected', 'dismissed'].includes(i.status))
  const approved = all.filter(i => i.status === 'approved')
  const published = all.filter(i => i.status === 'published')
  const rejected = all.filter(i => ['rejected', 'dismissed', 'duplicate_skipped'].includes(i.status))

  const tabLabels: Record<string, string> = {
    needs_approval: 'Needs Approval',
    linkedin: 'LinkedIn',
    approved: 'Approved',
    published: 'Published',
    rejected: 'Rejected',
  }
  const lists: Record<string, QueueItem[]> = { needs_approval: needsApproval, linkedin, approved, published, rejected }
  const counts: Record<string, number> = Object.fromEntries(Object.entries(lists).map(([k, v]) => [k, v.length]))

  const [bulkBusy, setBulkBusy] = useState('')
  const refetch = () => { refetchMq(); refetchCp() }

  const qc = useQueryClient()

  const bulkAction = async (action: 'approve' | 'reject', items: QueueItem[]) => {
    setBulkBusy(action)
    const fn = action === 'approve' ? approveItem : rejectItem
    const results = { ok: 0, fail: 0 }
    for (const item of items) {
      try {
        await fn(item.id, item.source)
        results.ok++
      } catch {
        results.fail++
      }
    }
    qc.invalidateQueries({ queryKey: ['marketing-queue'] })
    qc.invalidateQueries({ queryKey: ['comet-posts'] })
    refetch()
    setBulkBusy('')
  }

  const nonLinkedinPending = needsApproval.filter(i => (i.platform || i.channel || '').toLowerCase() !== 'linkedin')
  const linkedinPending = needsApproval.filter(i => (i.platform || i.channel || '').toLowerCase() === 'linkedin')

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
            <TabsTrigger key={key} value={key}>
              {tabLabels[key] || key} {count > 0 && <span className="ml-1.5 text-[10px] bg-muted px-1.5 rounded-full">{count}</span>}
            </TabsTrigger>
          ))}
        </TabsList>
        {Object.entries(lists).map(([key, items]) => (
          <TabsContent key={key} value={key} className="space-y-3 mt-4">
            {key === 'needs_approval' && items.length > 0 && (
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                {nonLinkedinPending.length > 0 && (
                  <Button size="sm" onClick={() => bulkAction('approve', nonLinkedinPending)} disabled={!!bulkBusy}>
                    <CheckCheck className="w-3.5 h-3.5 mr-1" />
                    {bulkBusy === 'approve' ? 'Approving...' : `Approve All Non-LinkedIn (${nonLinkedinPending.length})`}
                  </Button>
                )}
                <Button size="sm" variant="destructive" onClick={() => bulkAction('reject', items)} disabled={!!bulkBusy}>
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  {bulkBusy === 'reject' ? 'Rejecting...' : `Reject All (${items.length})`}
                </Button>
                {linkedinPending.length > 0 && (
                  <span className="text-[11px] text-blue-400 ml-auto">
                    {linkedinPending.length} LinkedIn post{linkedinPending.length > 1 ? 's' : ''} require manual approval
                  </span>
                )}
              </div>
            )}
            {items.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground text-sm">
                  <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  No {tabLabels[key] || key} items
                </CardContent>
              </Card>
            )}
            {items.map(item => (
              <ItemCard key={`${item.source}-${item.id}`} item={item} onAction={refetch} showMarkPosted={key === 'linkedin'} />
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
