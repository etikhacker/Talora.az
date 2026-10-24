'use client';

import { PageHeading } from '@/components/layout/page-heading';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Send } from 'lucide-react';

export default function AdminNotificationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <PageHeading embedded title={<>
            Bildirişlər və Elanlar
          </>} description={<>
            Tələbələrə və təcrübəçilərə kütləvi və ya fərdi bildirişlərin göndərilməsi
          </>} />
        </div>
        <Button size="sm" className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-semibold gap-1.5 shadow-xs">
          <Send className="w-4 h-4" />
          Yeni Elan Göndər
        </Button>
      </div>

      <Card className="bg-slate-900 border-slate-800 text-white">
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-slate-700">
            <Bell className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            Göndərilmiş elan tarixçəsi boşdur
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Platforma istifadəçilərinə vacib təcrübə elanlarını bildiriş kimi göndərə bilərsiniz.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
