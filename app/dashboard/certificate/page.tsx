'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { useLanguage } from '@/lib/i18n/language-context';
import {
  getStudentCertificateEligibility,
  getPaymentReceiptSignedUrl,
  getCertificateSignedUrl,
  submitCertificatePayment,
} from '@/lib/certificates/service';
import {
  CertificateSettings,
  CertificatePayment,
  Certificate,
  Enrollment,
} from '@/types/database';
import { formatDate } from '@/lib/utils/date';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Award,
  CreditCard,
  Copy,
  Check,
  Upload,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
  ExternalLink,
  Download,
  ShieldCheck,
  Info,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Share2,
  Smartphone,
} from 'lucide-react';

export default function StudentCertificatePage() {
  const { profile } = useAuth();
  const { t, language } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [eligible, setEligible] = useState(false);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [settings, setSettings] = useState<CertificateSettings | null>(null);
  const [payment, setPayment] = useState<CertificatePayment | null>(null);
  const [certificate, setCertificate] = useState<Certificate | null>(null);

  // Form states
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [copiedCard, setCopiedCard] = useState(false);
  const [copiedM10, setCopiedM10] = useState(false);
  const [copiedCertUrl, setCopiedCertUrl] = useState(false);
  const [receiptSignedUrl, setReceiptSignedUrl] = useState<string | null>(null);
  const [certSignedUrl, setCertSignedUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = React.useCallback(async () => {
    if (!profile?.id) return;
    setSubmitError(null);
    try {
      const res = await getStudentCertificateEligibility(profile.id);
      setEligible(res.eligible);
      setEnrollment(res.eligibleEnrollment);
      setSettings(res.settings);
      setPayment(res.currentPayment);
      setCertificate(res.currentCertificate);

      // Load signed URLs if available
      if (res.currentPayment?.receipt_path) {
        const rUrl = await getPaymentReceiptSignedUrl(res.currentPayment.receipt_path);
        setReceiptSignedUrl(rUrl);
      }
      if (res.currentCertificate?.certificate_file_path) {
        const cUrl = await getCertificateSignedUrl(res.currentCertificate.certificate_file_path);
        setCertSignedUrl(cUrl);
      }
    } catch (err) {
      console.error('Error loading certificate info:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      if (!profile?.id) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const res = await getStudentCertificateEligibility(profile.id);
        if (isMounted) {
          setEligible(res.eligible);
          setEnrollment(res.eligibleEnrollment);
          setSettings(res.settings);
          setPayment(res.currentPayment);
          setCertificate(res.currentCertificate);

          if (res.currentPayment?.receipt_path) {
            const rUrl = await getPaymentReceiptSignedUrl(res.currentPayment.receipt_path);
            if (isMounted) setReceiptSignedUrl(rUrl);
          }
          if (res.currentCertificate?.certificate_file_path) {
            const cUrl = await getCertificateSignedUrl(res.currentCertificate.certificate_file_path);
            if (isMounted) setCertSignedUrl(cUrl);
          }
        }
      } catch (err) {
        console.error('Error loading certificate info:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [profile?.id]);

  const handleCopyCard = (cardNum: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(cardNum.replace(/\s+/g, ''));
      setCopiedCard(true);
      setTimeout(() => setCopiedCard(false), 2500);
    }
  };

  const handleCopyM10 = (phoneNumber: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(phoneNumber);
      setCopiedM10(true);
      setTimeout(() => setCopiedM10(false), 2500);
    }
  };

  const handleCopyCertUrl = (certId: string) => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      const url = `${window.location.origin}/certificate/${certId}`;
      navigator.clipboard.writeText(url);
      setCopiedCertUrl(true);
      setTimeout(() => setCopiedCertUrl(false), 2500);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(selected.type)) {
      setFile(null);
      setFilePreview(null);
      e.currentTarget.value = '';
      setSubmitError(language === 'az' ? 'Yalnız JPG, PNG, WEBP və PDF faylları dəstəklənir.' : 'Only JPG, PNG, WEBP and PDF files are supported.');
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      setFile(null);
      setFilePreview(null);
      e.currentTarget.value = '';
      setSubmitError(language === 'az' ? 'Faylın həcmi 10MB-dan çox ola bilməz.' : 'File size cannot exceed 10MB.');
      return;
    }

    setFile(selected);
    setSubmitError(null);

    if (selected.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(selected);
    } else {
      setFilePreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!validTypes.includes(dropped.type)) {
        setFile(null);
        setFilePreview(null);
        setSubmitError(language === 'az' ? 'Yalnız JPG, PNG, WEBP və PDF faylları dəstəklənir.' : 'Only JPG, PNG, WEBP and PDF files are supported.');
        return;
      }
      if (dropped.size > 10 * 1024 * 1024) {
        setFile(null);
        setFilePreview(null);
        setSubmitError(language === 'az' ? 'Faylın həcmi 10MB-dan çox ola bilməz.' : 'File size cannot exceed 10MB.');
        return;
      }
      setFile(dropped);
      setSubmitError(null);
      if (dropped.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => setFilePreview(reader.result as string);
        reader.readAsDataURL(dropped);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id || !enrollment || !settings || !file) {
      setSubmitError(language === 'az' ? 'Zəhmət olmasa ödəniş qəbzi faylını seçin.' : 'Please select a payment receipt file.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const res = await submitCertificatePayment({
        studentId: profile.id,
        internshipId: enrollment.internship_id,
        enrollmentId: enrollment.id,
        amount: settings.price,
        currency: settings.currency || 'AZN',
        receiptFile: file,
      });

      if (res.success && res.payment) {
        setPayment(res.payment);
        setSubmitSuccess(true);
        setFile(null);
        setFilePreview(null);
        // Refresh signed URL
        if (res.payment.receipt_path) {
          const rUrl = await getPaymentReceiptSignedUrl(res.payment.receipt_path);
          setReceiptSignedUrl(rUrl);
        }
      } else {
        setSubmitError(res.error || (language === 'az' ? 'Qəbz göndərilərkən xəta baş verdi.' : 'Failed to submit payment receipt.'));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xəta baş verdi';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">
          {language === 'az' ? 'Sertifikat məlumatları yüklənir...' : 'Loading certificate status...'}
        </p>
      </div>
    );
  }

  // Case 1: NOT ELIGIBLE
  if (!eligible || !enrollment) {
    return (
      <div className="space-y-6 max-w-5xl">
        <div className="pb-4 border-b border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t('certificate')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('certificateSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info Card */}
          <Card className="lg:col-span-2 border-slate-200 shadow-2xs">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-base text-slate-900">
                    {t('notEligibleTitle')}
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {t('notEligibleDesc')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                {language === 'az' ? 'Sertifikat almaq üçün addımlar:' : 'Steps to earn your certificate:'}
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      {language === 'az' ? 'Bütün məcburi tapşırıqları tamamlayın' : 'Complete all mandatory assignments'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {language === 'az'
                        ? 'Təcrübə proqramınızın həftəlik modullarındakı "is_required" işarəli tapşırıqları icra edin və təqdim edin.'
                        : 'Submit all assignments marked as required in your weekly internship syllabus.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      {language === 'az' ? 'Mentor rəyini və təsdiqini əldə edin' : 'Receive mentor review and approval'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {language === 'az'
                        ? 'Tapşırıqlarınız mentor tərəfindən yoxlanılıb təsdiqləndikdən sonra təcrübə statusunuz tamamlanmış qeyd olunur.'
                        : 'Once submissions are reviewed and approved, your enrollment will transition to completed status.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      {language === 'az' ? 'Ödəniş qəbzini təqdim edin və rəsmi PDF sertifikatı əldə edin' : 'Submit receipt and receive your official verified PDF credential'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {language === 'az'
                        ? 'Rəsmi təsdiqlənmiş unikal nömrəli sertifikatınız və LinkedIn ictimai verifikasiya linkiniz burada aktivləşəcək.'
                        : 'Your official certificate with unique verification QR/code and LinkedIn link will be issued here.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <Link href="/dashboard/tasks">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5">
                    <span>{language === 'az' ? 'Tapşırıqlara keç' : 'Go to Assignments'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
                <Link href="/dashboard/internship">
                  <Button size="sm" variant="outline" className="text-xs">
                    {language === 'az' ? 'Mənim təcrübəm' : 'My Internship'}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Sample Preview Card */}
          <Card className="border-slate-200 shadow-2xs flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-900">
                {language === 'az' ? 'Rəsmi Sertifikat Nümunəsi' : 'Official Certificate Sample'}
              </CardTitle>
              <CardDescription className="text-xs">
                {language === 'az' ? 'Təcrübə sonrası təqdim edilən sənəd' : 'Credential issued upon completion'}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-4">
              <div className="w-20 h-20 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-inner">
                <Award className="w-10 h-10 text-emerald-600" />
              </div>
              <p className="text-xs font-bold text-slate-800">
                Talora.az Verified Credential
              </p>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                {language === 'az'
                  ? 'Bütün sertifikatlar unikal seriya nömrəsi ilə təmin olunur və istənilən işəgötürən tərəfindən ictimaiyyətə açıq yoxlanıla bilir.'
                  : 'Every certificate comes with a unique verification code that can be verified publicly by employers.'}
              </p>
            </CardContent>
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
              <span className="text-[11px] font-medium text-slate-600 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {language === 'az' ? 'Rəsmi Reyestr Qeydiyyatı' : 'Official Registry Verification'}
              </span>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Case 2: ELIGIBLE - Certificate is ISSUED
  if (certificate && certificate.status === 'issued') {
    return (
      <div className="space-y-6 max-w-5xl">
        <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {t('certificate')}
              </h1>
              <Badge variant="default" className="bg-emerald-500 text-white border-0 text-[10px] px-2 py-0.5">
                {language === 'az' ? 'Rəsmi Təsdiqlənmişdir' : 'Verified & Issued'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {t('certificateSubtitle')}
            </p>
          </div>

          {/* Direct Actions */}
          <div className="flex items-center gap-2.5">
            {certSignedUrl && certSignedUrl !== '#' ? (
              <a href={certSignedUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shadow-xs">
                  <Download className="w-3.5 h-3.5" />
                  <span>{t('downloadCertificate')} (PDF)</span>
                </Button>
              </a>
            ) : null}
            <Link href={`/certificate/${certificate.certificate_id}`} target="_blank">
              <Button size="sm" variant="outline" className="text-xs gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{t('verifyCertificate')}</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Certificate Display Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-emerald-200 bg-gradient-to-br from-emerald-50/40 via-white to-slate-50/50 shadow-xs">
            <CardHeader className="border-b border-emerald-100/70 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'az' ? 'Təcrübə Bitirmə Sertifikatı' : 'Internship Completion Certificate'}</span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-md">
                  {certificate.certificate_id}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">
                  {language === 'az' ? 'Tələbə' : 'Student Name'}
                </p>
                <h2 className="text-2xl font-bold text-slate-900">
                  {certificate.student_name}
                </h2>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">
                  {language === 'az' ? 'Tamamlanmış Proqram' : 'Internship Program'}
                </p>
                <p className="text-base font-semibold text-slate-800">
                  {certificate.internship_title}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200/60">
                <div>
                  <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">
                    {t('issuedDate')}
                  </p>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5">
                    {formatDate(certificate.issued_at)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">
                    {language === 'az' ? 'Verifikasiya Statusu' : 'Verification Status'}
                  </p>
                  <p className="text-xs font-semibold text-emerald-700 mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {language === 'az' ? 'Qüvvədədir (Etibarlı)' : 'Active & Valid'}
                  </p>
                </div>
              </div>

              {/* Public link share capsule */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800">
                    {language === 'az' ? 'İctimai Verifikasiya Linki' : 'Public Verification URL'}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono truncate mt-0.5">
                    {typeof window !== 'undefined' ? `${window.location.origin}/certificate/${certificate.certificate_id}` : `/certificate/${certificate.certificate_id}`}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopyCertUrl(certificate.certificate_id)}
                  className="text-xs shrink-0 gap-1.5"
                >
                  {copiedCertUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-semibold">{t('cardNumberCopied')}</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-slate-600" />
                      <span>{language === 'az' ? 'Linki kopyala' : 'Copy Link'}</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lateral Info */}
          <div className="space-y-4">
            <Card className="border-slate-200 shadow-2xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  {language === 'az' ? 'Karyera və LinkedIn' : 'Career & LinkedIn'}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-3">
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  {language === 'az'
                    ? 'Sertifikatınızı LinkedIn profilinizin "Licenses & Certifications" bölməsinə əlavə edərək işəgötürənlərə təqdim edə bilərsiniz.'
                    : 'Add this credential to your LinkedIn profile under "Licenses & Certifications" to showcase verified experience.'}
                </p>
                <div className="pt-2">
                  <a
                    href={`https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(
                      certificate.internship_title
                    )}&organizationName=Talora.az&issueYear=${new Date(
                      certificate.issued_at
                    ).getFullYear()}&issueMonth=${
                      new Date(certificate.issued_at).getMonth() + 1
                    }&certUrl=${encodeURIComponent(
                      typeof window !== 'undefined'
                        ? `${window.location.origin}/certificate/${certificate.certificate_id}`
                        : `https://talora-az.vercel.app/certificate/${certificate.certificate_id}`
                    )}&certId=${encodeURIComponent(certificate.certificate_id)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" variant="outline" className="w-full text-xs text-blue-700 hover:bg-blue-50 border-blue-200">
                      {language === 'az' ? 'LinkedIn-ə əlavə et' : 'Add to LinkedIn'}
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-2xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-slate-800">
                  {language === 'az' ? 'Təcrübə Nəticəsi' : 'Internship Summary'}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2 text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">{language === 'az' ? 'Status' : 'Status'}</span>
                  <span className="font-semibold text-emerald-600">{language === 'az' ? 'Müvəffəqiyyətlə tamamlandı' : 'Successfully completed'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">{language === 'az' ? 'Təcrübə müddəti' : 'Duration'}</span>
                  <span className="font-medium text-slate-800">{enrollment.internship?.duration_weeks || 4} {t('durationWeeks')}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">{language === 'az' ? 'Ödəniş qəbzi' : 'Payment receipt'}</span>
                  <span className="font-medium text-emerald-600">{language === 'az' ? 'Təsdiqlənib' : 'Approved'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Case 3: ELIGIBLE - PAYMENT IS APPROVED BUT CERTIFICATE IS PREPARING (NOT YET ISSUED)
  if (payment && payment.status === 'approved') {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="pb-4 border-b border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t('certificate')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('certificateSubtitle')}
          </p>
        </div>

        <Card className="border-blue-200 bg-blue-50/30 shadow-2xs">
          <CardContent className="p-6 md:p-8 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    {t('certificatePreparing')}
                  </h3>
                  <Badge variant="default" className="bg-blue-600 text-white text-[10px]">
                    {t('paymentApproved')}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {t('paymentApprovedDesc')}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-blue-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">{t('certificatePrice')}</span>
                <span className="font-bold text-slate-900 mt-0.5 block">{payment.amount} {payment.currency}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">{language === 'az' ? 'Təsdiqlənmə Tarixi' : 'Approval Date'}</span>
                <span className="font-medium text-slate-800 mt-0.5 block">
                  {formatDate(payment.reviewed_at || new Date())}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">{t('uploadReceipt')}</span>
                {receiptSignedUrl && receiptSignedUrl !== '#' ? (
                  <a href={receiptSignedUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-semibold underline mt-0.5 block">
                    {language === 'az' ? 'Qəbzə bax' : 'View receipt'}
                  </a>
                ) : (
                  <span className="text-slate-600 font-medium mt-0.5 block">{language === 'az' ? 'Yüklənib' : 'Uploaded'}</span>
                )}
              </div>
            </div>

            <div className="pt-2 text-center text-xs text-slate-500">
              {language === 'az'
                ? 'Sertifikat hazır olduqda bu səhifədə dərhal endirmə və ictimai verifikasiya linki aktivləşəcək.'
                : 'As soon as the certificate is generated, download and public verification will be enabled here.'}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Case 4: ELIGIBLE - PAYMENT IS PENDING REVIEW
  if (payment && payment.status === 'pending') {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="pb-4 border-b border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t('certificate')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('certificateSubtitle')}
          </p>
        </div>

        <Card className="border-amber-200 bg-amber-50/20 shadow-2xs">
          <CardContent className="p-6 md:p-8 space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    {t('paymentPending')}
                  </h3>
                  <Badge variant="warning" className="text-[10px]">
                    {t('statusPending')}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {t('paymentUnderReviewDesc')}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-amber-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">{t('certificatePrice')}</span>
                <span className="font-bold text-slate-900 mt-0.5 block">{payment.amount} {payment.currency}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">{language === 'az' ? 'Göndərilmə Tarixi' : 'Submission Date'}</span>
                <span className="font-medium text-slate-800 mt-0.5 block">{formatDate(payment.created_at)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">{t('uploadReceipt')}</span>
                {receiptSignedUrl && receiptSignedUrl !== '#' ? (
                  <a href={receiptSignedUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-semibold underline mt-0.5 block">
                    {language === 'az' ? 'Yüklənmiş qəbzə bax' : 'View submitted receipt'}
                  </a>
                ) : (
                  <span className="text-slate-600 font-medium mt-0.5 block">{language === 'az' ? 'Yüklənib' : 'Uploaded'}</span>
                )}
              </div>
            </div>

            {/* Option to re-upload receipt if student made a mistake */}
            <div className="pt-4 border-t border-amber-100/80">
              <details className="text-xs group">
                <summary className="cursor-pointer text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1.5">
                  <span>{language === 'az' ? 'Qəbzi yeniləmək istəyirsiniz?' : 'Need to update your receipt?'}</span>
                </summary>
                <div className="mt-4 p-4 bg-white rounded-xl border border-slate-200">
                  <form onSubmit={handleSubmitPayment} className="space-y-4">
                    <div>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.pdf"
                        onChange={handleFileChange}
                        className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                      />
                    </div>
                    {submitError && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {submitError}
                      </p>
                    )}
                    <Button type="submit" size="sm" disabled={!file || submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                      {submitting ? t('submitting') : (language === 'az' ? 'Yeni qəbzi yadda saxla' : 'Update Receipt')}
                    </Button>
                  </form>
                </div>
              </details>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Case 5: ELIGIBLE - NO PAYMENT YET OR PAYMENT WAS REJECTED
  const price = settings?.price ?? 25;
  const currency = settings?.currency ?? 'AZN';
  const cardNumber = settings?.card_number?.trim() || '';
  const m10PhoneNumber = settings?.m10_phone_number?.trim() || '';
  const isEnabled = settings?.is_enabled ?? true;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {t('certificate')}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {t('certificateSubtitle')}
        </p>
      </div>

      {/* If previous payment was rejected, show notice */}
      {payment && payment.status === 'rejected' && (
        <Card className="border-red-200 bg-red-50/40 shadow-2xs">
          <CardContent className="p-4 sm:p-5 flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-red-900">
                {t('paymentRejected')}
              </p>
              <p className="text-xs text-red-700 leading-relaxed">
                {payment.admin_note || t('paymentRejectedDesc')}
              </p>
              <p className="text-[11px] text-red-600 font-medium pt-1">
                {language === 'az'
                  ? 'Zəhmət olmasa göstərilən bank kartı və ya M10 nömrəsinə ödəniş edib düzgün qəbzi yenidən yükləyin.'
                  : 'Please transfer to the bank card or M10 number shown below and upload a clear receipt.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Internship Completion Banner */}
      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-900">
              {language === 'az' ? 'Təbriklər! Təcrübə proqramını uğurla tamamladınız.' : 'Congratulations! You have completed the internship.'}
            </p>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              {enrollment.internship?.title || 'Təcrübə Proqramı'}
            </p>
          </div>
        </div>
        <Badge variant="default" className="bg-emerald-600 text-white text-[10px] shrink-0">
          {language === 'az' ? 'Tamamlanıb' : 'Completed'}
        </Badge>
      </div>

      {!isEnabled ? (
        <Card className="border-slate-200">
          <CardContent className="p-6 text-center text-xs text-slate-500">
            {language === 'az'
              ? 'Bu təcrübə proqramı üçün sertifikat verilməsi hazırda inzibatçı tərəfindən dayandırılmışdır.'
              : 'Certificate issuance is currently disabled for this program.'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Step 1: Payment Info & Card Box */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="border-slate-200 shadow-2xs">
              <CardHeader className="bg-slate-50/60 border-b border-slate-100 pb-3.5">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  {language === 'az' ? '1. Ödəniş Məlumatları' : '1. Payment Instructions'}
                </CardTitle>
                <CardDescription className="text-xs">
                    {language === 'az'
                      ? (m10PhoneNumber ? 'Bank kartına və ya M10 nömrəsinə əl ilə köçürmə' : 'Bank kartına əl ilə köçürmə')
                      : (m10PhoneNumber ? 'Manual transfer to a bank card or M10 number' : 'Manual bank card transfer')}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-5">
                {/* Price Display */}
                <div className="flex items-baseline justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-xs font-medium text-slate-600">
                    {t('certificatePrice')}:
                  </span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-slate-900">
                      {price}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 ml-1.5">
                      {currency}
                    </span>
                  </div>
                </div>

                {cardNumber && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 block">{t('paymentCardNumber')}</label>
                    <div className="p-3.5 rounded-xl bg-slate-900 text-white flex items-center justify-between gap-2 shadow-xs">
                      <div className="font-mono text-sm sm:text-base font-bold tracking-widest text-amber-300">{cardNumber}</div>
                      <Button size="sm" type="button" onClick={() => handleCopyCard(cardNumber)} className="h-8 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 gap-1.5 shrink-0">
                        {copiedCard ? <><Check className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400 font-semibold">{t('cardNumberCopied')}</span></> : <><Copy className="w-3.5 h-3.5 text-slate-300" /><span>{t('copyCardNumber')}</span></>}
                      </Button>
                    </div>
                  </div>
                )}

                {m10PhoneNumber && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 block">{t('paymentM10Number')}</label>
                    <div className="p-3.5 rounded-xl bg-slate-900 text-white flex items-center justify-between gap-2 shadow-xs">
                      <div className="min-w-0 flex items-center gap-2 font-mono text-sm sm:text-base font-bold tracking-widest text-emerald-300">
                        <Smartphone className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span className="truncate">{m10PhoneNumber}</span>
                      </div>
                      <Button size="sm" type="button" onClick={() => handleCopyM10(m10PhoneNumber)} className="h-8 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 gap-1.5 shrink-0">
                        {copiedM10 ? <><Check className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400 font-semibold">{t('m10NumberCopied')}</span></> : <><Copy className="w-3.5 h-3.5 text-slate-300" /><span>{t('copyM10Number')}</span></>}
                      </Button>
                    </div>
                  </div>
                )}

                {!cardNumber && !m10PhoneNumber && (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                    {language === 'az' ? 'Ödəniş rekvizitləri hələ təyin edilməyib. Zəhmət olmasa administratorla əlaqə saxlayın.' : 'Payment details are not configured yet. Please contact the administrator.'}
                  </p>
                )}

                {/* Instructions text */}
                <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200/60 text-[11px] text-amber-900 space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    {language === 'az' ? 'Ödəniş Təlimatı:' : 'Payment Guide:'}
                  </p>
                  <p className="text-amber-800 leading-relaxed">
                    {language === 'az'
                      ? (m10PhoneNumber && cardNumber
                          ? 'Tam məbləği yuxarıdakı bank kartına və ya M10 tətbiqində göstərilən M10 nömrəsinə köçürün. Sonra qəbzi sağdakı formaya yükləyin.'
                          : m10PhoneNumber
                            ? 'M10 tətbiqində yuxarıdakı nömrəyə tam məbləği köçürün. Sonra əməliyyat qəbzini sağdakı formaya yükləyin.'
                            : 'İstənilən bank tətbiqi ilə yuxarıdakı karta tam məbləği köçürün və qəbzi sağdakı formaya yükləyin.')
                      : (m10PhoneNumber && cardNumber
                          ? 'Transfer the full amount to the bank card above or to the M10 number in the M10 app, then upload the receipt in the form.'
                          : m10PhoneNumber
                            ? 'Transfer the full amount to the number above in the M10 app, then upload the transaction receipt in the form.'
                            : 'Transfer the full amount to the card above using your bank app, then upload the receipt in the form.')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Step 2: Upload Receipt Form */}
          <div className="lg:col-span-7">
            <Card className="border-slate-200 shadow-2xs h-full flex flex-col justify-between">
              <CardHeader className="bg-slate-50/60 border-b border-slate-100 pb-3.5">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  {language === 'az' ? '2. Ödəniş Qəbzini Təqdim Edin' : '2. Upload Payment Receipt'}
                </CardTitle>
                <CardDescription className="text-xs">
                  {t('uploadReceiptDesc')}
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleSubmitPayment} className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Dropzone */}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                      file
                        ? 'border-emerald-400 bg-emerald-50/30'
                        : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {file ? (
                      <div className="space-y-2">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                          <FileText className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-bold text-slate-900 truncate max-w-xs mx-auto">
                          {file.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type || 'fayl'}
                        </p>
                        <span className="inline-block text-[11px] text-emerald-700 font-semibold underline mt-1">
                          {language === 'az' ? 'Başqa fayl seç' : 'Change file'}
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto group-hover:text-emerald-600">
                          <Upload className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-semibold text-slate-800">
                          {language === 'az' ? 'Qəbz faylını bura sürükləyin və ya klikləyin' : 'Drag & drop your receipt or browse'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          JPG, JPEG, PNG, WEBP və ya PDF (Maks. 10MB)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Image preview if image */}
                  {filePreview && (
                    <div className="p-2 border border-slate-200 rounded-xl bg-slate-50 max-h-48 overflow-hidden flex items-center justify-center">
                      <img src={filePreview} alt="Receipt preview" className="max-h-44 object-contain rounded-lg" />
                    </div>
                  )}

                  {submitError && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  {submitSuccess && (
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>{language === 'az' ? 'Qəbz uğurla göndərildi! İnzibatçı tərəfindən yoxlanılır.' : 'Receipt submitted successfully! Pending verification.'}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <Button
                    type="submit"
                    disabled={!file || submitting}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-10 shadow-xs"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        {t('submitting')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        {t('submitPayment')}
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
