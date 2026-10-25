'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { InboxNotification } from '@/lib/notifications/inbox';

const PAGE_SIZE = 30;
interface InboxState {
  items: InboxNotification[];
  unreadCount: number;
  loading: boolean;
  error: boolean;
  saving: boolean;
  hasMore: boolean;
  unreadOnly: boolean;
  refresh: () => Promise<void>;
  filter: (unread: boolean) => void;
  loadMore: () => void;
  markRead: (id?: string) => Promise<boolean>;
}
const Context = createContext<InboxState | null>(null);

export function NotificationProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  const [items, setItems] = useState<InboxNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const request = useRef(0);
  const mutating = useRef(false);

  const refresh = useCallback(async () => {
    if (mutating.current) return;
    const ticket = ++request.current;
    try {
      const client = createClient();
      if (!client) throw new Error('NOT_CONFIGURED');
      let query = client.from('student_notifications')
        .select('id,kind,subject,status,body,href,read_at,created_at', { count: 'exact' })
        .eq('user_id', userId).order('created_at', { ascending: false }).order('id', { ascending: false }).range(0, limit - 1);
      if (unreadOnly) query = query.is('read_at', null);
      const [list, unread] = await Promise.all([
        query,
        client.from('student_notifications').select('id', { count: 'exact', head: true }).eq('user_id', userId).is('read_at', null),
      ]);
      if (ticket !== request.current) return;
      if (list.error || unread.error) throw new Error('LOAD_FAILED');
      setItems((list.data || []) as InboxNotification[]);
      setUnreadCount(unread.count || 0);
      setHasMore((list.count || 0) > limit);
      setError(false);
    } catch {
      if (ticket === request.current) setError(true);
    } finally {
      if (ticket === request.current) setLoading(false);
    }
  }, [userId, limit, unreadOnly]);

  useEffect(() => {
    const requestCounter = request;
    const initialTimer = window.setTimeout(() => void refresh(), 0);
    const onVisible = () => { if (document.visibilityState === 'visible') void refresh(); };
    const timer = window.setInterval(onVisible, 60000);
    window.addEventListener('focus', onVisible);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      ++requestCounter.current;
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
      window.removeEventListener('focus', onVisible);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  const markRead = async (id?: string) => {
    if (mutating.current) return false;
    mutating.current = true;
    ++request.current;
    setSaving(true);
    let success = false;
    try {
      const client = createClient();
      if (!client) throw new Error('NOT_CONFIGURED');
      let query = client.from('student_notifications').update({ read_at: new Date().toISOString() })
        .eq('user_id', userId).is('read_at', null);
      if (id) query = query.eq('id', id);
      else {
        // Only consume events at or before the displayed snapshot.
        if (!items[0]) return false;
        query = query.lte('created_at', items[0].created_at);
      }
      const result = await query.select('id');
      if (result.error) throw result.error;
      const readIds = new Set((result.data || []).map((row: { id: string }) => row.id));
      setItems(current => current.map(item => readIds.has(item.id) ? { ...item, read_at: new Date().toISOString() } : item));
      setUnreadCount(current => Math.max(0, current - readIds.size));
      setError(false);
      success = true;
    } catch {
      setError(true);
    } finally {
      mutating.current = false;
      setSaving(false);
    }
    if (success) await refresh();
    return success;
  };

  return <Context.Provider value={{ items, unreadCount, loading, error, saving, hasMore, unreadOnly, refresh,
    filter: unread => { if (unread !== unreadOnly) { setLoading(true); setUnreadOnly(unread); setLimit(PAGE_SIZE); } },
    loadMore: () => { setLoading(true); setLimit(current => current + PAGE_SIZE); }, markRead,
  }}>{children}</Context.Provider>;
}

export function useNotifications() {
  const state = useContext(Context);
  if (!state) throw new Error('NotificationProvider is required');
  return state;
}
