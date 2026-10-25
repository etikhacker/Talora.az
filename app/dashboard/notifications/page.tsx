'use client';

import Link from 'next/link';
import { Bell, CheckCheck, Check, ArrowUpRight, RefreshCw, ClipboardCheck, CalendarClock, FileCheck2 } from 'lucide-react';
import { PageHeading } from '@/components/layout/page-heading';
import { useNotifications } from '@/components/dashboard/notification-provider';
import { useLanguage } from '@/lib/i18n/language-context';
import { notificationLabel, notificationHref } from '@/lib/notifications/inbox';
import './notifications.css';

export default function StudentNotificationsPage() {
  const inbox = useNotifications();
  const { language } = useLanguage();
  const az = language === 'az';
  return <section className="notification-inbox" aria-labelledby="inbox-title">
    <PageHeading title={<span id="inbox-title">{az ? 'Bildirişlər' : 'Notifications'}</span>}
      description={az ? 'Müraciət nəticələri, tapşırıq rəyləri və son tarix xatırlatmaları' : 'Application decisions, assignment reviews and deadline reminders'} />
    <div className="notification-toolbar">
      <div className="notification-filters" aria-label={az ? 'Bildiriş filtri' : 'Notification filter'}>
        <button type="button" disabled={inbox.saving} aria-pressed={!inbox.unreadOnly} onClick={() => inbox.filter(false)}>{az ? 'Hamısı' : 'All'}</button>
        <button type="button" disabled={inbox.saving} aria-pressed={inbox.unreadOnly} onClick={() => inbox.filter(true)}>{az ? 'Oxunmamış' : 'Unread'} <span>{inbox.unreadCount}</span></button>
      </div>
      <div className="notification-actions">
        <button type="button" disabled={inbox.saving || inbox.loading || !inbox.items.length || !inbox.unreadCount} onClick={() => void inbox.markRead()}><CheckCheck size={17} />{az ? 'Hamısını oxunmuş et' : 'Mark all as read'}</button>
        <button type="button" disabled={inbox.loading || inbox.saving} onClick={() => void inbox.refresh()} aria-label={az ? 'Bildirişləri yenilə' : 'Refresh notifications'}><RefreshCw size={17} /></button>
      </div>
    </div>
    {inbox.error && <div role="alert" className="notification-error">{az ? 'Bildiriş əməliyyatı tamamlanmadı. Bağlantını yoxlayıb yenidən cəhd edin.' : 'Could not complete the notification request. Check your connection and try again.'} <button onClick={() => void inbox.refresh()}>{az ? 'Yenidən cəhd et' : 'Try again'}</button></div>}
    <div aria-busy={inbox.loading} aria-live="polite">
      {inbox.loading ? <div className="notification-empty" role="status"><RefreshCw className="animate-spin" size={24} /><p>{az ? 'Bildirişlər yüklənir…' : 'Loading notifications…'}</p></div>
      : !inbox.items.length && !inbox.error ? <div className="notification-empty"><Bell size={32} /><h2>{inbox.unreadOnly ? (az ? 'Hamısını oxumusunuz' : 'You’re all caught up') : (az ? 'Hələ bildiriş yoxdur' : 'No notifications yet')}</h2><p>{az ? 'Müraciətinizə və ya tapşırığınıza baxıldıqda nəticə burada görünəcək.' : 'When your application or assignment is reviewed, the result will appear here.'}</p></div>
      : <ul className="notification-list">{inbox.items.map(item => {
        const Icon = item.kind === 'application' ? FileCheck2 : item.kind === 'task_review' ? ClipboardCheck : CalendarClock;
        return <li key={item.id} className={`notification-item${!item.read_at ? ' notification-item--unread' : ''}`}>
          <div className="notification-icon"><Icon size={22} /></div>
          <div className="notification-content">
            <div className="notification-meta"><span>{item.read_at ? (az ? 'Oxunub' : 'Read') : (az ? 'Yeni' : 'New')}</span><time dateTime={item.created_at}>{new Intl.DateTimeFormat(az ? 'az-AZ' : 'en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(item.created_at))}</time></div>
            <h2>{notificationLabel(item, az)}</h2>
            <p className="notification-subject">{item.subject}</p>
            {item.body && <p className="notification-feedback">{item.body}</p>}
            <div className="notification-row-actions">
              <Link href={notificationHref(item)} onClick={() => { if (!item.read_at) void inbox.markRead(item.id); }}>{az ? 'Ətraflı bax' : 'View details'}<ArrowUpRight size={16} /></Link>
              {!item.read_at && <button type="button" disabled={inbox.saving} onClick={() => void inbox.markRead(item.id)}><Check size={16} />{az ? 'Oxunmuş et' : 'Mark as read'}</button>}
            </div>
          </div>
        </li>;
      })}</ul>}
    </div>
    {inbox.hasMore && !inbox.loading && <button className="notification-load-more" disabled={inbox.saving} onClick={inbox.loadMore}>{az ? 'Daha çox göstər' : 'Load more'}</button>}
  </section>;
}
