'use client';
import { PageHeading } from '@/components/layout/page-heading';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { useLanguage } from '@/lib/i18n/language-context';
import {
  getCertificateCandidates,
  getAdminCertificates,
  issueCertificate,
  revokeCertificate,
  getCertificateSignedUrl,
} from '@/lib/certificates/service';
import {
  Certificate,
  CertificateCandidate,
  CertificateStatus,
} from '@/types/database';
import { formatDate } from '@/lib/utils/date';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Award,
  Upload,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  RefreshCw,
  FileText,
  Download,
  ExternalLink,
  ShieldCheck,
  User,
  Briefcase,
  Share2,
  Check,
  Clock,
  Ban,
  X,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

export default function AdminCertificatesPage() {
  const { profile } = useAuth();
  const { t, language } = useLanguage();

  const [candidates, setCandidates] = useState<CertificateCandidate[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Issuance Modal
  const [issuingCandidate, setIssuingCandidate] = useState<CertificateCandidate | null>(null);
  const [studentName, setStudentName] = useState('');
  const [internshipTitle, setInternshipTitle] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [issuedSuccessCert, setIssuedSuccessCert] = useState<Certificate | null>(null);

  // Signed URLs cache
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = React.useCallback(async () => {
    try {
      const [candList, certList] = await Promise.all([
        getCertificateCandidates(),
        getAdminCertificates({
          status: statusFilter,
          search: searchQuery,
        }),
      ]);
      setCandidates(candList);
      setCertificates(certList);

      // Preload signed URLs for issued certs
      const urlMap: Record<string, string> = {};
      for (const c of certList) {
        if (c.certificate_file_path) {
          const url = await getCertificateSignedUrl(c.certificate_file_path);
          urlMap[c.id] = url;
        }
      }
      setSignedUrls(urlMap);
    } catch (err) {
      console.error('Failed to load certificates data:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      try {
        const [candList, certList] = await Promise.all([
          getCertificateCandidates(),
          getAdminCertificates({
            status: statusFilter,
            search: searchQuery,
          }),
        ]);
        if (isMounted) {
          setCandidates(candList);
          setCertificates(certList);

          const urlMap: Record<string, string> = {};
          for (const c of certList) {
            if (c.certificate_file_path) {
              const url = await getCertificateSignedUrl(c.certificate_file_path);
              urlMap[c.id] = url;
            }
          }
          setSignedUrls(urlMap);
        }
      } catch (err) {
        console.error('Failed to load certificates data:', err);
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
  }, [statusFilter, searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenIssueModal = (cand: CertificateCandidate) => {
    setIssuingCandidate(cand);
    setStudentName(cand.student.full_name || '');
    setInternshipTitle(cand.internship.title || '');
    setPdfFile(null);
    setModalError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setModalError('Yalnız PDF faylı qəbul olunur.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setModalError('Faylın həcmi 20MB-dan çox ola bilməz.');
      return;
    }

    setPdfFile(file);
    setModalError(null);
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issuingCandidate || !pdfFile) {
      setModalError('Zəhmət olmasa tərtib edilmiş sertifikat PDF faylını seçin.');
      return;
    }

    if (!studentName.trim() || !internshipTitle.trim()) {
      setModalError('Tələbə adı və təcrübə adı boş ola bilməz.');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      const res = await issueCertificate({
        studentId: issuingCandidate.student.id,
        internshipId: issuingCandidate.internship.id,
        enrollmentId: issuingCandidate.enrollment.id,
        studentName: studentName.trim(),
        internshipTitle: internshipTitle.trim(),
        certificateFile: pdfFile,
      });

      if (res.success && res.certificate) {
        const created = res.certificate;
        setIssuingCandidate(null);
        setIssuedSuccessCert(created);
        await loadData();
      } else {
        setModalError(res.error || 'Sertifikat təqdim edilərkən xəta baş verdi.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xəta baş verdi';
      setModalError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (cert: Certificate) => {
    if (!confirm(`"${cert.certificate_id}" seriyalı sertifikatı ləğv etmək istəyirsiniz? Ləğv edildikdən sonra ictimai verifikasiya səhifəsində etibarsız sayılacaq.`)) {
      return;
    }

    try {
      const res = await revokeCertificate(cert.id);
      if (res.success) {
        await loadData();
      } else {
        alert(res.error || 'Sertifikat ləğv edilərkən xəta baş verdi');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xəta baş verdi';
      alert(msg);
    }
  };

  const handleCopyLink = (certId: string) => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      const url = `${window.location.origin}/certificate/${certId}`;
      navigator.clipboard.writeText(url);
      setCopiedId(certId);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <PageHeading embedded title={<>
              Sertifikat İdarəetməsi
            </>} description={<>
            Ödənişi təsdiqlənmiş tələbələrə Canva və ya dizayn şablonunda tərtib edilmiş PDF sertifikatları yükləyin və verifikasiya reyestrinə nəzarət edin.
          </>} />
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={loadData}
          disabled={loading}
          className="text-xs border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Yenilə</span>
        </Button>
      </div>

      {/* SECTION 1: Candidates Awaiting Certificate Issuance */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Sertifikat Tərtibatı Gözləyən Tələbələr
            </h2>
            {candidates.length > 0 && (
              <Badge variant="warning" className="text-[10px] py-0 px-1.5 font-bold">
                {candidates.length} namizəd
              </Badge>
            )}
          </div>
        </div>

        {candidates.length === 0 ? (
          <Card className="border-slate-800 bg-slate-900/40">
            <CardContent className="p-6 text-center text-xs text-slate-500">
              Hazırda sertifikat tərtibatı gözləyən yeni namizəd yoxdur (bütün təsdiqlənmiş ödənişlərə sertifikat verilib).
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {candidates.map((cand) => (
              <Card
                key={cand.enrollment.id}
                className="border-amber-500/30 bg-slate-900/90 shadow-xs flex flex-col justify-between"
              >
                <CardHeader className="p-4 pb-3 border-b border-slate-800">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        {cand.student.full_name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {cand.student.email}
                      </p>
                    </div>
                    <Badge variant="default" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[9px] shrink-0">
                      Ödəniş Təsdiqlənib
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-3 text-xs flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                      <Briefcase className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{cand.internship.title}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                      <span>Ödəniş: {cand.payment.amount} {cand.payment.currency}</span>
                      <span>{formatDate(cand.payment.reviewed_at || cand.payment.created_at)}</span>
                    </div>
                  </div>

                  <div className="pt-3">
                    <Button
                      size="sm"
                      onClick={() => handleOpenIssueModal(cand)}
                      className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs gap-1.5 h-8 shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Sertifikat PDF Yüklə və Təqdim Et</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: Issued Certificates Registry */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Verilmiş Sertifikatlar Reyestri
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Platforma üzrə verilmiş bütün rəsmi sertifikatlar, statuslar və PDF sənədlər.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Status filter */}
            <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
              {[
                { id: 'all', label: 'Bütün' },
                { id: 'issued', label: 'Qüvvədə olan' },
                { id: 'revoked', label: 'Ləğv edilmiş' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === tab.id
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ID, tələbə və ya proqram..."
                  className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:border-amber-400 focus:outline-hidden w-48 sm:w-64"
                />
              </div>
            </form>
          </div>
        </div>

        {/* Certificates Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[200px] space-y-3">
            <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
            <p className="text-xs text-slate-400">Sertifikatlar yüklənir...</p>
          </div>
        ) : certificates.length === 0 ? (
          <Card className="border-slate-800 bg-slate-900/60">
            <CardContent className="p-10 text-center text-xs text-slate-400 space-y-2">
              <Award className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="font-semibold text-slate-300">Heç bir verilmiş sertifikat tapılmadı.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {certificates.map((cert) => {
              const isRevoked = cert.status === 'revoked';
              const signedUrl = signedUrls[cert.id];

              return (
                <Card
                  key={cert.id}
                  className={`border transition-all ${
                    isRevoked
                      ? 'border-red-900/40 bg-slate-900/40 opacity-75'
                      : 'border-slate-800 bg-slate-900/70'
                  }`}
                >
                  <CardContent className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Certificate info */}
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono text-xs font-bold text-amber-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {cert.certificate_id}
                        </span>
                        <span className="text-sm font-bold text-white">
                          {cert.student_name}
                        </span>
                        {isRevoked ? (
                          <Badge variant="destructive" className="text-[10px]">
                            Ləğv edilib
                          </Badge>
                        ) : (
                          <Badge variant="default" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                            Qüvvədədir
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                        <span className="text-slate-300 font-medium">
                          {cert.internship_title}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span>
                          Verilmə tarixi: {formatDate(cert.issued_at)}
                        </span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                      {/* View PDF */}
                      {signedUrl && signedUrl !== '#' ? (
                        <a href={signedUrl} target="_blank" rel="noopener noreferrer">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2.5 text-xs border-slate-700 bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5 text-amber-400" />
                            <span>PDF</span>
                          </Button>
                        </a>
                      ) : null}

                      {/* Copy Public Link */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyLink(cert.certificate_id)}
                        className="h-8 px-2.5 text-xs border-slate-700 text-slate-300 hover:text-white gap-1.5"
                      >
                        {copiedId === cert.certificate_id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Kopyalandı</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>Link</span>
                          </>
                        )}
                      </Button>

                      {/* Direct Public Verify Page */}
                      <Link href={`/certificate/${cert.certificate_id}`} target="_blank">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-xs text-slate-400 hover:text-white"
                          title="İctimai Verifikasiya Səhifəsinə bax"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </Link>

                      {/* Revoke Button */}
                      {!isRevoked && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRevoke(cert)}
                          className="h-8 px-2.5 text-xs gap-1.5"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Ləğv et</span>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload & Issue Modal */}
      {issuingCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-2xs">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Sertifikat Tərtibatı və Təqdimatı</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tələbə: {issuingCandidate.student.full_name}
                </p>
              </div>
              <button
                onClick={() => setIssuingCandidate(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleIssueSubmit} className="p-5 space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
                    Sertifikat ID İdentifikatoru
                  </span>
                  <p className="text-xs text-slate-300">
                    Təsdiq zamanı verilənlər bazası tərəfindən unikal olaraq generasiya ediləcək
                  </p>
                </div>
                <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-300 font-mono text-[10px] shrink-0">
                  AZ-INT-YYYY-XXXX
                </Badge>
              </div>

              {/* Student Name */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">
                  Sertifikatda Qeyd Olunan Tələbə Adı və Soyadı *
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-amber-400 focus:outline-hidden"
                />
              </div>

              {/* Internship Title */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">
                  Təcrübə Proqramının Adı *
                </label>
                <input
                  type="text"
                  value={internshipTitle}
                  onChange={(e) => setInternshipTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-amber-400 focus:outline-hidden"
                />
              </div>

              {/* PDF File Upload */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">
                  Tərtib Edilmiş Sertifikat PDF Faylı *
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                    pdfFile
                      ? 'border-amber-400 bg-amber-400/10'
                      : 'border-slate-700 hover:border-amber-400/80 bg-slate-950'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {pdfFile ? (
                    <div className="space-y-1">
                      <FileText className="w-8 h-8 text-amber-400 mx-auto" />
                      <p className="text-xs font-bold text-white truncate max-w-xs mx-auto">
                        {pdfFile.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {(pdfFile.size / (1024 * 1024)).toFixed(2)} MB • PDF
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                      <p className="text-xs font-semibold text-slate-300">
                        Canva və ya qrafik redaktorda hazırlanmış PDF-i seçin
                      </p>
                      <p className="text-[10px] text-slate-500">Maks. 20MB</p>
                    </div>
                  )}
                </div>
              </div>

              {modalError && (
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-800 text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIssuingCandidate(null)}
                  className="text-xs border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  Ləğv et
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !pdfFile}
                  className="text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Təqdim olunur...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Sertifikatı Təsdiqlə və Təqdim Et</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issuance Success Modal */}
      {issuedSuccessCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-2xs">
          <div className="relative w-full max-w-md bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Sertifikat Uğurla Təqdim Edildi!</h3>
              <p className="text-xs text-slate-400">
                {issuedSuccessCert.student_name} üçün rəsmi sertifikat bazada qeydə alındı.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Rəsmi Təsdiqlənmiş Sertifikat ID
              </span>
              <span className="font-mono text-sm font-bold text-amber-300 block">
                {issuedSuccessCert.certificate_id}
              </span>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopyLink(issuedSuccessCert.certificate_id)}
                className="text-xs border-slate-700 text-slate-300 hover:text-white gap-1.5"
              >
                {copiedId === issuedSuccessCert.certificate_id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Kopyalandı</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Linki Kopyala</span>
                  </>
                )}
              </Button>

              <Link href={`/certificate/${issuedSuccessCert.certificate_id}`} target="_blank">
                <Button
                  size="sm"
                  className="text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Səhifəyə Bax</span>
                </Button>
              </Link>
            </div>

            <div className="pt-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIssuedSuccessCert(null)}
                className="w-full text-xs text-slate-400 hover:text-white"
              >
                Bağla
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
