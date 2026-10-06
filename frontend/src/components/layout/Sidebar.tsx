import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  BarChart3,
  GraduationCap,
  Zap,
  Trash2,
  Ticket,
  QrCode,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Evenementen',
    href: '/evenementen',
    icon: CalendarDays,
  },
  {
    label: 'Analyse',
    href: '/analyse',
    icon: BarChart3,
  },
  {
    label: 'Academiejaren',
    href: '/academiejaren',
    icon: GraduationCap,
  },
  {
    label: 'QR Generator',
    href: '/qrgenerator',
    icon: QrCode,
  },
  {
    label: 'Ticketing',
    href: '/ticketing',
    icon: Ticket,
  },
  {
    label: 'Prullenbak',
    href: '/prullenbak',
    icon: Trash2,
  },
];

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-[#041c3a]">
      {/* Subtle top accent line */}
      <div className="h-0.5 w-full bg-[#ed6425]" />

      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-white/8">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#ed6425] shadow-lg shadow-[#ed6425]/25">
          <Zap className="h-4.5 w-4.5 text-white" fill="white" />
        </div>
        <div className="flex flex-col">
          <span className="text-[13px] font-bold tracking-tight text-white leading-none">
            AFC
          </span>
          <span className="text-[10px] text-white/40 tracking-widest uppercase leading-tight mt-0.5">
            EventBeheer
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-5">
        <p className="px-3 mb-2 text-[10px] font-semibold tracking-[0.12em] uppercase text-white/30">
          Navigatie
        </p>

        {navItems.map((item) => {
          const Icon = item.icon;

          if (item.disabled) {
            return (
              <div
                key={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/25 cursor-not-allowed select-none"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                <Badge
                  variant="outline"
                  className="border-white/10 text-white/25 text-[9px] px-1.5 py-0 h-4 tracking-wide uppercase"
                >
                  Binnenkort
                </Badge>
              </div>
            );
          }

          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150',
                  isActive
                    ? 'bg-[#ed6425] text-white font-semibold shadow-md shadow-[#ed6425]/30'
                    : 'text-white/55 hover:bg-white/6 hover:text-white'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0 transition-colors',
                      isActive ? 'text-white' : 'text-white/40 group-hover:text-white'
                    )}
                  />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/8">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-[#ed6425]" />
          <p className="text-[11px] text-white/30">v0.2.0 · intern platform</p>
        </div>
      </div>
    </aside>
  );
}