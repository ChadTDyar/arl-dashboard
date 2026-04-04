import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'

export function useTable<T>(table: string, query?: { column: string; value: string }, orderBy?: string) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    let q = supabase.from(table).select('*')
    if (query) q = q.eq(query.column, query.value)
    if (orderBy) q = q.order(orderBy, { ascending: false })
    q = q.limit(100)
    const { data: rows } = await q
    setData((rows as T[]) || [])
    setLoading(false)
  }, [table, query?.column, query?.value, orderBy])

  useEffect(() => { refresh() }, [refresh])

  return { data, loading, refresh }
}

export function useRealtime<T>(table: string, callback: (payload: T) => void) {
  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        callback(payload.new as T)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [table, callback])
}
