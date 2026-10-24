'use client';

import { PageHeading } from '@/components/layout/page-heading';

import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ContactMessage } from '@/types/database';
import {
  Archive,
  Check,
  Mail,
  RefreshCw,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import {
  deleteContactMessage,
  getContactMessages,
  updateContactMessageStatus,
} from '@/lib/contact/service';
import { formatDateTime } from '@/lib/utils/date';

const statusLabel: Record<ContactMessage['status'], string> = {
  new: 'Yeni',
  read: 'Oxunub',
  archived: 'Arxivləndi',
};

export default function AdminContactMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unreadCount = messages.filter((message) => message.status === 'new').length;

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setMessages(await getContactMessages());
    } catch {
      setError('Əlaqə mesajları yüklənmədi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initialLoad() {
      setLoading(true);
      setError(null);
      try {
        const data = await getContactMessages();
        if (isMounted) setMessages(data);
      } catch {
        if (isMounted) setError('Əlaqə mesajları yüklənmədi.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initialLoad();
    return () => {
      isMounted = false;
    };
  }, []);

  const changeStatus = async (message: ContactMessage, status: ContactMessage['status']) => {
    const result = await updateContactMessageStatus(message.id, status);
    if (!result.success) {
      setError(result.error || 'Mesajın statusu dəyişdirilmədi.');
      return;
    }
    setMessages((current) => current.map((item) =>
      item.id === message.id
        ? { ...item, status, read_at: status === 'new' ? null : new Date().toISOString() }
        : item
    ));
  };

  const handleDelete = async (message: ContactMessage) => {
    if (!window.confirm(`"${message.subject}" mesajını silmək istəyirsiniz?`)) return;

    const result = await deleteContactMessage(message.id);
    if (!result.success) {
      setError(result.error || 'Mesaj silinmədi.');
      return;
    }
    setMessages((current) => current.filter((item) => item.id !== message.id));
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <PageHeading embedded title={<>Əlaqə Mesajları</>} description={<>
            Saytdakı əlaqə formasından göndərilən mesajlar burada görünür.
          </>} />
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-amber-400/20 text-amber-300 border-amber-400/30">
            {unreadCount} yeni
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={loadMessages}
            disabled={loading}
            className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Yenilə
          </Button>
        </div>
      </div>

      {error && <p className="rounded-lg border border-red-800 bg-red-950/40 p-3 text-xs text-red-200">{error}</p>}

      {loading ? (
        <div className="py-16 flex justify-center">
          <RefreshCw className="w-7 h-7 text-amber-400 animate-spin" />
        </div>
      ) : messages.length === 0 ? (
        <Card className="border-dashed border-slate-700 bg-slate-900/60">
          <CardContent className="flex flex-col items-center gap-4 px-6 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800/80">
              <Mail className="h-6 w-6 text-slate-400" aria-hidden="true" />
            </div>
            <div className="max-w-md space-y-1.5">
              <h2 className="text-sm font-semibold text-white">
                Hələ heç bir mesaj yoxdur
              </h2>
              <p className="text-xs leading-relaxed text-slate-400">
                Əlaqə formundan gönderilən hər mesaj burada görünəcək.
                Yeni mesaj gəldikdə yuxarıdakı göstərici yenilənir.
              </p>
            </div>
            <a
              href="/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-700 px-3 text-xs font-medium text-slate-300 transition-colors hover:border-amber-400/50 hover:text-white"
            >
              Əlaqə səhifəsini yoxla
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {messages.map((message) => (
            <Card key={message.id} className={`border-slate-800 bg-slate-900 ${message.status === 'new' ? 'border-l-amber-400 border-l-4' : ''}`}>
              <CardContent className="p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-white">{message.subject}</h2>
                      <Badge className={message.status === 'new' ? 'bg-amber-400/20 text-amber-300 border-amber-400/30' : 'bg-slate-800 text-slate-400 border-slate-700'}>
                        {statusLabel[message.status]}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {message.name} · {formatDateTime(message.created_at)}
                    </p>
                  </div>
                  <a
                    href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`}
                    className="inline-flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200"
                  >
                    Cavab yaz <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="rounded-lg bg-slate-950 border border-slate-800 p-3 text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {message.message}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <a href={`mailto:${message.email}`} className="text-slate-400 hover:text-white">
                    {message.email}
                  </a>
                  <div className="flex items-center gap-2">
                    {message.status === 'new' && (
                      <Button size="sm" variant="outline" onClick={() => changeStatus(message, 'read')} className="h-8 border-slate-700 text-slate-300 hover:text-white">
                        <Check className="w-3.5 h-3.5 mr-1.5" /> Oxundu kimi işarələ
                      </Button>
                    )}
                    {message.status !== 'archived' && (
                      <Button size="sm" variant="outline" onClick={() => changeStatus(message, 'archived')} className="h-8 border-slate-700 text-slate-300 hover:text-white">
                        <Archive className="w-3.5 h-3.5 mr-1.5" /> Arxivlə
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleDelete(message)} className="h-8 border-red-900 text-red-300 hover:bg-red-950/50">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
