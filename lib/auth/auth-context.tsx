'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { isSoleAdminEmail, SOLE_ADMIN_EMAIL } from '@/lib/auth/admin';
import { Profile, ProfileUpdateInput, UserRole } from '@/types/database';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  role: UserRole | null;
  isLoading: boolean;
  isConfigured: boolean;
  error: string | null;
  signUp: (params: { fullName: string; email: string; password: string; university: string }) => Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }>;
  signIn: (params: { email: string; password: string }) => Promise<{ success: boolean; error?: string; role?: UserRole }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (input: ProfileUpdateInput) => Promise<{ success: boolean; error?: string; profile?: Profile }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const isConfigured = isSupabaseConfigured();

  // Fetch real profile from Supabase
  const fetchSupabaseProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    const supabase = createClient();
    if (!supabase) return null;

    try {
      const { data, error: fetchErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchErr) {
        console.warn('Profile fetch warning:', fetchErr.message);
        return null;
      }
      return (data as Profile) || null;
    } catch (err) {
      console.warn('Profile fetch exception:', err);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const fresh = await fetchSupabaseProfile(user.id);
    if (fresh) {
      setProfile(fresh);
    }
  }, [user, fetchSupabaseProfile]);

  // Initial Auth Check & Session Listener
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      setIsLoading(true);

      if (!isConfigured) {
        setError('Supabase konfiqurasiyası tapılmadı. Zəhmət olmasa NEXT_PUBLIC_SUPABASE_URL və NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY parametrlərini yoxlayın.');
        if (isMounted) setIsLoading(false);
        return;
      }

      const supabase = createClient();
      if (!supabase) {
        setError('Supabase müştərisi aktivləşdirilə bilmədi.');
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.warn('Supabase getSession error:', sessionError.message);
        }

        if (session?.user && isMounted) {
          const userEmail = (session.user.email || '').trim().toLowerCase();
          setUser({ id: session.user.id, email: userEmail });
          const prof = await fetchSupabaseProfile(session.user.id);
          if (prof && isMounted) {
            setProfile(prof);
          }
        }

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
          if (!isMounted) return;
          if (session?.user) {
            const userEmail = (session.user.email || '').trim().toLowerCase();
            setUser({ id: session.user.id, email: userEmail });
            const prof = await fetchSupabaseProfile(session.user.id);
            if (isMounted) setProfile(prof);
          } else {
            setUser(null);
            setProfile(null);
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error('Supabase auth init exception:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [isConfigured, fetchSupabaseProfile]);

  // Real Registration with Supabase Auth
  const signUp = async ({
    fullName,
    email,
    password,
    university,
  }: {
    fullName: string;
    email: string;
    password: string;
    university: string;
  }): Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }> => {
    setError(null);

    if (!isConfigured) {
      return { success: false, error: 'Supabase konfiqurasiya edilməyib. Zəhmət olmasa parametrləri tamamlayın.' };
    }

    if (isSoleAdminEmail(email)) {
      return {
        success: false,
        error: 'Administrator hesabı public qeydiyyatla yaradıla bilməz. Bu hesab Supabase Auth panelindən yaradılmalıdır.',
      };
    }

    const supabase = createClient();
    if (!supabase) return { success: false, error: 'Verilənlər bazası ilə əlaqə qurulmadı.' };

    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            university: university.trim(),
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('User already registered') || signUpError.message.includes('already registered')) {
          return { success: false, error: 'Bu e-poçt ünvanı ilə artıq qeydiyyatdan keçilmişdir.' };
        }
        if (signUpError.message.includes('Password should be')) {
          return { success: false, error: 'Şifrə minimum 8 simvoldan ibarət olmalıdır.' };
        }
        return { success: false, error: signUpError.message };
      }

      if (data.user) {
        // When email confirmation is enabled, Supabase creates the user but returns no session.
        // Do not treat that user as signed in; let the UI ask them to confirm their email.
        if (!data.session) {
          return { success: true, requiresEmailConfirmation: true };
        }

        // Fetch newly created profile (or create fallback if trigger delayed)
        let prof = await fetchSupabaseProfile(data.user.id);
        if (!prof) {
          const isSoleAdmin = cleanEmail === SOLE_ADMIN_EMAIL.toLowerCase();
          const { data: newProfile } = await supabase
            .from('profiles')
            .insert({
              user_id: data.user.id,
              full_name: fullName.trim(),
              email: cleanEmail,
              university: university.trim(),
              role: isSoleAdmin ? 'admin' : 'student',
            })
            .select()
            .maybeSingle();

          if (newProfile) prof = newProfile as Profile;
        }

        setUser({ id: data.user.id, email: cleanEmail });
        setProfile(prof);
        return { success: true, requiresEmailConfirmation: false };
      }

      return { success: true, requiresEmailConfirmation: !data.session };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Qeydiyyat zamanı gözlənilməz xəta baş verdi.';
      return { success: false, error: message };
    }
  };

  // Real Sign In with Supabase Auth
  const signIn = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<{ success: boolean; error?: string; role?: UserRole }> => {
    setError(null);

    if (!isConfigured) {
      return { success: false, error: 'Supabase konfiqurasiya edilməyib. Zəhmət olmasa parametrləri daxil edin.' };
    }

    const supabase = createClient();
    if (!supabase) return { success: false, error: 'Verilənlər bazası ilə əlaqə qurulmadı.' };

    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (signInError) {
        if (
          signInError.message.includes('Invalid login credentials') ||
          signInError.message.includes('invalid_credentials')
        ) {
          return { success: false, error: 'E-poçt və ya şifrə yanlışdır.' };
        }
        if (signInError.message.includes('Email not confirmed')) {
          return { success: false, error: 'E-poçt ünvanınız təsdiqlənməyib. Zəhmət olmasa poçt qutunuzu yoxlayın.' };
        }
        return { success: false, error: signInError.message };
      }

      if (data.user) {
        let prof = await fetchSupabaseProfile(data.user.id);
        
        // If profile doesn't exist yet, create it from auth metadata
        if (!prof) {
          const isSoleAdmin = cleanEmail === SOLE_ADMIN_EMAIL.toLowerCase();
          const { data: newProfile } = await supabase
            .from('profiles')
            .insert({
              user_id: data.user.id,
              full_name: data.user.user_metadata?.full_name || (isSoleAdmin ? 'Platform Administrator' : 'Student User'),
              email: cleanEmail,
              university: data.user.user_metadata?.university || null,
              role: isSoleAdmin ? 'admin' : 'student',
            })
            .select()
            .maybeSingle();

          if (newProfile) prof = newProfile as Profile;
        }

        const effectiveRole: UserRole = isSoleAdminEmail(cleanEmail) ? 'admin' : 'student';

        setUser({ id: data.user.id, email: cleanEmail });
        setProfile(prof);
        return { success: true, role: effectiveRole };
      }

      return { success: false, error: 'İstifadəçi sessiyası alına bilmədi.' };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Giriş zamanı gözlənilməz xəta baş verdi.';
      return { success: false, error: message };
    }
  };

  // Sign Out
  const signOut = async () => {
    const supabase = createClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Sign out error:', err);
      }
    }

    setUser(null);
    setProfile(null);
    router.push('/login');
  };

  const requestPasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!isConfigured) return { success: false, error: 'Auth xidməti konfiqurasiya edilməyib.' };

    const supabase = createClient();
    if (!supabase) return { success: false, error: 'Auth xidməti ilə əlaqə qurulmadı.' };

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) return { success: false, error: resetError.message };
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Bərpa e-poçtu göndərilə bilmədi.';
      return { success: false, error: message };
    }
  };

  // Update Profile: students can ONLY update full_name, phone, university, avatar_url
  const updateProfile = async (
    input: ProfileUpdateInput
  ): Promise<{ success: boolean; error?: string; profile?: Profile }> => {
    if (!user || !profile) {
      return { success: false, error: 'Profilinizi yeniləmək üçün daxil olmalısınız.' };
    }

    if (!isConfigured) {
      return { success: false, error: 'Verilənlər bazası konfiqurasiya edilməyib.' };
    }

    const supabase = createClient();
    if (!supabase) return { success: false, error: 'Verilənlər bazası ilə əlaqə qurulmadı.' };

    try {
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: input.full_name?.trim() || profile.full_name,
          phone: input.phone !== undefined ? input.phone : profile.phone,
          university: input.university !== undefined ? input.university : profile.university,
          avatar_url: input.avatar_url !== undefined ? input.avatar_url : profile.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      const updated = data as Profile;
      setProfile(updated);
      return { success: true, profile: updated };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Profil yenilənərkən xəta baş verdi.';
      return { success: false, error: message };
    }
  };

  // Calculate effective role: ONLY babayev.omr.23@gmail.com with role === 'admin' is admin
  const effectiveRole: UserRole | null =
    user && profile?.role === 'admin' && user.email.toLowerCase() === SOLE_ADMIN_EMAIL.toLowerCase()
      ? 'admin'
      : user
      ? (profile?.role as UserRole) || 'student'
      : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: effectiveRole,
        isLoading,
        isConfigured,
        error,
        signUp,
        signIn,
        requestPasswordReset,
        signOut,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
