'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { useLanguage, type Translations } from '@/lib/i18n/language-context';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Search,
  FileText,
  Briefcase,
  CheckSquare,
  UploadCloud,
  Award,
  Bell,
  User,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
  GraduationCap,
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  key: keyof Translations;
  href: string;
  icon: React.ElementType;
}

/* Labels are resolved through `t()` inside the component, so the menu follows
   the active interface language instead of staying fixed to Azerbaijani. */
const navItems: NavItem[] = [
  { key: 'sideDashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'sideInternships', href: '/dashboard/internships', icon: Search },
  { key: 'sideMyApplications', href: '/dashboard/applications', icon: FileText },
  { key: 'sideMyInternship', href: '/dashboard/internship', icon: Briefcase },
  { key: 'sideTasks', href: '/dashboard/tasks', icon: CheckSquare },
  { key: 'sideSubmissions', href: '/dashboard/submissions', icon: UploadCloud },
  { key: 'sideCertificate', href: '/dashboard/certificate', icon: Award },
  { key: 'sideNotifications', href: '/dashboard/notifications', icon: Bell },
  { key: 'sideProfile', href: '/dashboard/profile', icon: User },
  { key: 'sideSettings', href: '/dashboard/settings', icon: Settings },
];

export function StudentSidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const { t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-base leading-tight block">
              Intern<span className="text-blue-600">.az</span>
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              {t('sideStudentPortal')}
            </span>
          </div>
        </Link>
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1 text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* User Info Capsule */}
      <div className="p-3.5 mx-3 my-3 rounded-xl bg-slate-50 border border-slate-100">
        <div className="flex items-center gap-3">
          <Avatar
            src={profile?.avatar_url}
            fallback={profile?.full_name || 'ST'}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 truncate">
              {profile?.full_name || t('sideStudentFallback')}
            </p>
            <p className="text-[11px] text-slate-500 truncate">
              {profile?.university || t('sideStudentUniversityFallback')}
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <Badge variant="default" className="text-[9px] py-0 px-1.5">
                {t('sideStudentBadge')}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {t('sideStudentMenu')}
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group',
                isActive
                  ? 'bg-blue-50 text-blue-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isActive
                      ? 'text-blue-600'
                      : 'text-slate-400 group-hover:text-slate-600'
                  )}
                />
                <span>{t(item.key)}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-600" />}
            </Link>
          );
        })}
      </div>

      {/* Footer / Sign Out */}
      <div className="p-3 border-t border-slate-100">
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>{t('sideStudentSignOut')}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-20">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <GraduationCap className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-900 text-sm">Intern.az</span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop static sidebar — dvh so it matches the layout shell exactly. */}
      <aside className="hidden md:block w-64 shrink-0 h-[100dvh] sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-2xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 max-w-full h-full bg-white shadow-xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
