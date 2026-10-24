'use client';

import { PageHeading } from '@/components/layout/page-heading';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils/date';
import { profileUpdateSchema, ProfileUpdateFormData } from '@/lib/validations/profile';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Profile } from '@/types/database';
import {
  User,
  Phone,
  GraduationCap,
  Lock,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

interface ProfileFormProps {
  profile: Profile | null;
  user: { id: string; email: string } | null;
  updateProfile: (input: {
    full_name?: string;
    phone?: string | null;
    university?: string | null;
    avatar_url?: string | null;
  }) => Promise<{ success: boolean; error?: string; profile?: Profile }>;
}

function ProfileForm({ profile, user, updateProfile }: ProfileFormProps) {
  const [formData, setFormData] = useState<ProfileUpdateFormData>({
    fullName: profile?.full_name || '',
    phone: profile?.phone || '',
    university: profile?.university || '',
    avatarUrl: profile?.avatar_url || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    setServerError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setSuccessMessage(null);
    setErrors({});

    const result = profileUpdateSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await updateProfile({
        full_name: result.data.fullName,
        phone: result.data.phone || null,
        university: result.data.university || null,
        avatar_url: result.data.avatarUrl || null,
      });

      if (!res.success) {
        setServerError(res.error || 'Profil məlumatları yenilənərkən xəta baş verdi.');
      } else {
        setSuccessMessage('Profil məlumatlarınız uğurla yadda saxlanıldı.');
      }
    } catch {
      setServerError('Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      setServerError('Zəhmət olmasa şəkil faylı seçin.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setServerError('Profil şəkli maksimum 5 MB ola bilər.');
      return;
    }

    setIsUploadingAvatar(true);
    setServerError(null);
    setSuccessMessage(null);

    try {
      const supabase = createClient();
      if (!supabase) throw new Error('Supabase bağlantısı qurulmadı.');

      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${user.id}/profile.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, cacheControl: '3600', contentType: file.type });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      setFormData((prev) => ({ ...prev, avatarUrl: data.publicUrl }));
      setSuccessMessage('Şəkil yükləndi. Dəyişiklikləri yadda saxlamağı unutmayın.');
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Profil şəkli yüklənmədi.');
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const formattedDate = profile?.created_at ? formatDate(profile.created_at) : '—';

  return (
    <div className="space-y-6">
      {successMessage && (
        <Alert variant="success" className="text-xs">
          <CheckCircle2 className="w-4 h-4" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {serverError && (
        <Alert variant="destructive" className="text-xs">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Avatar Preview & Account Info */}
        <Card className="border-slate-200 shadow-2xs h-fit">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-3">
              <Avatar
                src={formData.avatarUrl || profile?.avatar_url}
                fallback={formData.fullName || profile?.full_name || 'ST'}
                size="xl"
                className="ring-4 ring-emerald-50 border-2 border-emerald-200"
              />
            </div>
            <CardTitle className="text-base text-slate-900 truncate">
              {formData.fullName || profile?.full_name || 'Tələbə'}
            </CardTitle>
            <CardDescription className="text-xs truncate">
              {profile?.email || user?.email}
            </CardDescription>
            <div className="pt-2 flex justify-center">
              <Badge variant="default" className="text-xs capitalize">
                Tələbə
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-4 border-t border-slate-100 space-y-3 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-400">Hesab statusu:</span>
              <span className="font-semibold text-emerald-700">Təsdiqlənmiş</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-400">Təşkilat:</span>
              <span className="font-semibold text-slate-800">
                {profile?.university || '—'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Right 2 Columns: Editable & Protected Fields */}
        <div className="md:col-span-2 space-y-6">
          {/* Editable Fields Form */}
          <Card className="border-slate-200 shadow-2xs">
            <CardHeader className="pb-4 border-b border-slate-100">
              <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                Şəxsi Məlumatlar
              </CardTitle>
              <CardDescription className="text-xs">
                Ad, universitet və əlaqə məlumatlarınızı yeniləyin.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="pt-6 space-y-4">
                {/* Full Name */}
                <div>
                  <Label htmlFor="fullName" className="text-xs font-semibold text-slate-700">
                    Ad və Soyad
                  </Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="məs. Leyla Məmmədova"
                    value={formData.fullName}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="mt-1"
                    required
                  />
                  {errors.fullName && (
                    <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>
                  )}
                </div>

                {/* University */}
                <div>
                  <Label htmlFor="university" className="text-xs font-semibold text-slate-700">
                    Universitet / Ali Təhsil Müəssisəsi
                  </Label>
                  <Input
                    id="university"
                    name="university"
                    type="text"
                    placeholder="məs. universitetinizin tam adı"
                    value={formData.university || ''}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="mt-1"
                  />
                  {errors.university && (
                    <p className="text-xs text-red-600 mt-1">{errors.university}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <Label htmlFor="phone" className="text-xs font-semibold text-slate-700">
                    Əlaqə Nömrəsi (İstəyə bağlı)
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+994 50 123 45 67"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="mt-1"
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
                  )}
                </div>

                {/* Avatar upload */}
                <div>
                  <Label htmlFor="avatarFile" className="text-xs font-semibold text-slate-700">
                    Profil Şəkli (İstəyə bağlı)
                  </Label>
                  <div className="mt-1 flex items-center gap-3">
                    <Input
                      id="avatarFile"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleAvatarUpload}
                      disabled={isSubmitting || isUploadingAvatar}
                      className="file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-emerald-700"
                    />
                    {isUploadingAvatar && <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">PNG, JPG və ya WEBP — maksimum 5 MB.</p>
                </div>
              </CardContent>

              <CardFooter className="bg-slate-50/60 border-t border-slate-100 flex items-center justify-between py-4">
                <span className="text-xs text-slate-400">
                  Dəyişikliklər profilinizdə saxlanılır
                </span>
                <Button
                  type="submit"
                  id="save-profile-btn"
                  disabled={isSubmitting}
                  className="gap-2 shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Yadda saxlanılır...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Dəyişiklikləri saxla
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Account Details Card */}
          <Card className="border-slate-200/80 bg-slate-50/50 shadow-2xs">
            <CardHeader className="pb-3 border-b border-slate-200/60">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-600" />
                <CardTitle className="text-sm text-slate-800">
                  Hesab Parametrləri
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200/70 gap-1">
                <div>
                  <span className="font-semibold text-slate-700 block">Qeydiyyat E-poçtu:</span>
                  <span className="text-slate-500 font-mono text-[11px]">
                    {profile?.email || user?.email || '—'}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>Qorunur</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200/70 gap-1">
                <div>
                  <span className="font-semibold text-slate-700 block">Qeydiyyat Tarixi:</span>
                  <span className="text-slate-500 font-mono text-[11px]">
                    {formattedDate}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Təsdiqlənib</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { profile, user, updateProfile } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <PageHeading embedded title={<>
          Tələbə Profili
        </>} description={<>
          Universitet və şəxsi əlaqə məlumatlarınızı idarə edin.
        </>} />
      </div>

      <ProfileForm
        key={profile ? `${profile.user_id}-${profile.updated_at}` : 'empty'}
        profile={profile}
        user={user}
        updateProfile={updateProfile}
      />
    </div>
  );
}
