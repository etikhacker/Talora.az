'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getPublicCertificate, getCertificateForEnrollment, getCertificateSignedUrl } from '@/lib/certificates/service';
import { formatDate } from '@/lib/utils/date';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  Award,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  GraduationCap,
  Calendar,
  User,
  Briefcase,
  Share2,
  Check,
  Sparkles,
  Lock,
} from 'lucide-react';

export default function PublicCertificateVerificationPage() {
  const params = useParams();
  const certificateId = typeof params?.certificateId === 'string' ? params.certificateId : '';

  const [loading, setLoading] = useState(true);
  const [certData, setCertData] = useState<{
    certificate_id: string;
    student_name: string;
    internship_title: string;
    issued_at: string;
    status: 'issued' | 'revoked';
  } | null>(null);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadCert() {
      if (!certificateId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const cert = await getPublicCertificate(certificateId);
        setCertData(cert);
      } catch (err) {
        console.error('Error fetching public certificate:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCert();
  }, [certificateId]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="w-full bg-white border-b border-slate-200 py-3.5 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base leading-tight block">
                Intern<span className="text-emerald-600">.az</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Rəsmi Təcrübə Portalı
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 text-xs px-2.5 py-1">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 inline text-emerald-600" />
              <span>İctimai Verifikasiya Reyestri</span>
            </Badge>
          </div>
        </div>
      </header>

      {/* Content Container */}
      <main id="main-content" className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col justify-center">
        {loading ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-500">
              Sertifikat məlumatları reyestrdən yoxlanılır...
            </p>
          </div>
        ) : !certData ? (
          <Card className="border-red-200 bg-white shadow-sm overflow-hidden text-center p-6 sm:p-10 space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="text-xl font-bold text-slate-900">
                Sertifikat Tapılmadı və ya Ləğv Edilib
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Daxil edilmiş <strong>&ldquo;{certificateId}&rdquo;</strong> seriya nömrəsinə uyğun aktiv və ya etibarlı sertifikat qeydiyyatı mövcud deyil.
              </p>
            </div>
            <div className="pt-2">
              <Link href="/">
                <Button size="sm" variant="outline" className="text-xs">
                  Talora.az Ana Səhifəsinə Qayıt
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Top Verification Status Banner */}
            {certData.status === 'revoked' ? (
              <div className="p-4 rounded-2xl bg-red-600 text-white shadow-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">
                      Sertifikat Ləğv Edilmişdir
                    </h3>
                    <p className="text-xs text-red-100">
                      Bu sertifikat etibarsızdır və Talora.az inzibatçısı tərəfindən ləğv edilmişdir.
                    </p>
                  </div>
                </div>
                <Badge className="bg-white text-red-800 text-xs font-bold px-2.5 py-1 border-0 shrink-0">
                  Status: Ləğv edilib
                </Badge>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-600 text-white shadow-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">
                      Rəsmi Təsdiqlənmiş Təcrübə Sertifikatı
                    </h3>
                    <p className="text-xs text-emerald-100">
                      Sənəd Talora.az reyestrində qeydiyyatdan keçmiş və həqiqidir.
                    </p>
                  </div>
                </div>
                <Badge className="bg-white text-emerald-800 text-xs font-bold px-2.5 py-1 border-0 shrink-0">
                  Status: Qüvvədədir
                </Badge>
              </div>
            )}

            {/* Certificate Card */}
            <Card className={`bg-white shadow-md overflow-hidden ${certData.status === 'revoked' ? 'border-red-300' : 'border-slate-200'}`}>
              <div className={`h-2 ${certData.status === 'revoked' ? 'bg-red-500' : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500'}`} />
              
              <CardContent className="p-6 sm:p-8 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-6 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      Verifikasiya Kodu
                    </span>
                    <p className="font-mono text-base sm:text-lg font-black text-slate-900 tracking-wider">
                      {certData.certificate_id}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyLink}
                    className="text-xs self-start sm:self-auto gap-1.5"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600 font-semibold">Kopyalandı</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5 text-slate-600" />
                        <span>Verifikasiya Linkini Kopyala</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Body Details */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Tələbənin Tam Adı
                    </span>
                    <p className="text-xl sm:text-2xl font-bold text-slate-900">
                      {certData.student_name}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      Uğurla Tamamlanmış Təcrübə Proqramı
                    </span>
                    <p className="text-base sm:text-lg font-semibold text-emerald-800">
                      {certData.internship_title}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div>
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Verilmə Tarixi
                      </span>
                      <p className="text-xs font-semibold text-slate-800 mt-1">
                        {formatDate(certData.issued_at)}
                      </p>
                    </div>

                    <div>
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        Təhlükəsizlik və Məxfilik
                      </span>
                      <p className="text-xs text-slate-600 mt-1">
                        GDPR və şəxsi məlumatların qorunması prinsiplərinə uyğun təsdiqlənmişdir.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Official Stamp & Verification Note */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div className="text-[11px] text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-800">
                      İşəgötürənlər və Şirkətlər üçün Məlumat:
                    </p>
                    <p className="leading-relaxed">
                      Bu sənəd sahibinin yuxarıda göstərilən təcrübə proqramının bütün praktiki modullarını, həftəlik tapşırıqlarını və yekun layihəsini müvəffəqiyyətlə icra etdiyini təsdiq edir.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} Talora.az — Bütün hüquqlar qorunur.</span>
          <span>Mingəçevir, Azərbaycan</span>
        </div>
      </footer>
    </div>
  );
}
