'use client';

import { PageHeading } from '@/components/layout/page-heading';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { UploadCloud } from 'lucide-react';

export default function StudentSubmissionsPage() {
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <PageHeading embedded title={<>
          Təqdimatlar
        </>} description={<>
          Göndərilmiş layihə və tapşırıq həllərinin arxiv və qiymətləndirmə siyahısı
        </>} />
      </div>

      <Card className="border-slate-200 shadow-2xs">
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-4 border border-slate-200">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            Hələ heç bir təqdimat göndərilməyib.
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Tapşırıqlarınızı icra etdikdən sonra həllərinizi bu bölmədən təqdim edə və mentor rəylərini izləyə bilərsiniz.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
