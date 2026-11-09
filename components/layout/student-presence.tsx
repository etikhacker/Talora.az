'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { createClient } from '@/lib/supabase/client';

/**
 * Records only a last-seen timestamp for a signed-in student.
 * No page paths, clicks, IP addresses, or device identifiers are stored.
 * Both browser and DB throttle writes to protect the Supabase Free quota.
 */
export function StudentPresence() {
  const { user, profile } = useAuth();
  const pathname = usePathname();
  const lastPingAt = useRef(0);
  const previousUser = useRef<string | null>(null);

  useEffect(() => {
    if (previousUser.current !== (user?.id ?? null)) {
      previousUser.current = user?.id ?? null;
      lastPingAt.current = 0;
    }
    if (!user?.id || profile?.role !== 'student') return;

    let active = true;
    const ping = () => {
      if (!active || document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - lastPingAt.current < 120_000) return;
      const supabase = createClient();
      if (!supabase) return;
      lastPingAt.current = now;
      void (async () => {
        try {
          const result: { error: { code?: string } | null } = await supabase.rpc('touch_student_presence');
          if (result.error) {
            // Feature is optional while migration is pending. Do not disrupt UX.
            console.warn('Presence update unavailable:', result.error.code);
          }
        } catch {
          // Presence collection must never block navigation.
        }
      })();
    };
    ping();
    const timer = window.setInterval(ping, 180_000);
    document.addEventListener('visibilitychange', ping);
    window.addEventListener('focus', ping);
    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', ping);
      window.removeEventListener('focus', ping);
    };
  }, [user?.id, profile?.role, pathname]);

  return null;
}
