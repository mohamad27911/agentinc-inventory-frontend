'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Tags,
  BarChart3,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { Profile } from '@/types';

interface SidebarProps {
  profile: Profile | null;
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/categories', label: 'Categories', icon: Tags },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/audit-log', label: 'Audit Log', icon: FileText },
];

const adminItems = [
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const allItems = [
    ...navItems,
    ...(profile?.role === 'admin' ? adminItems : []),
  ];

  return (
    <>
      {/* Mobile overlay */}
      <aside
        className={cn(
          'sticky top-0 z-10 flex h-screen flex-col border-r border-border bg-background-secondary transition-all duration-300 overflow-y-auto shrink-0',
          collapsed ? 'w-[72px]' : 'w-[280px]'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          {!collapsed && (
            <h1 className="text-xl font-bold tracking-wider text-gold" style={{ fontFamily: 'Georgia, serif' }}>
              INVENTORY
            </h1>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'rounded-md p-1.5 text-foreground-muted hover:text-white hover:bg-background-tertiary transition-colors cursor-pointer',
              collapsed && 'mx-auto'
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {allItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'text-gold bg-gold/10 border-l-2 border-gold'
                    : 'text-foreground-muted hover:text-white hover:bg-background-tertiary border-l-2 border-transparent'
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={cn('h-5 w-5 shrink-0', isActive && 'text-gold')} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        {profile && (
          <div className={cn(
            'border-t border-border p-4',
            collapsed && 'flex justify-center'
          )}>
            {collapsed ? (
              <div className="h-8 w-8 rounded-full bg-gold/20 flex items-center justify-center text-xs font-bold text-gold">
                {profile.full_name?.[0]?.toUpperCase() || 'U'}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gold/20 flex items-center justify-center text-sm font-bold text-gold shrink-0">
                  {profile.full_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {profile.full_name || 'User'}
                  </p>
                  <Badge variant={profile.role} className="mt-0.5 text-[10px]">
                    {profile.role}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
