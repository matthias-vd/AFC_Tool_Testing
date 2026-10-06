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
  ExternalLink,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const SHAREPOINT_URL = 'https://afcleuven.sharepoint.com/sites/AFCGent';

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
};

const navItems: NavItem[] = [
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

/** Official Microsoft SharePoint mark (Simple Icons). */
function SharePointIcon({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M24 13.5q0 1.242-.475 2.332-.474 1.09-1.289 1.904-.814.815-1.904 1.29-1.09.474-2.332.474-.762 0-1.523-.2-.106.997-.557 1.858-.451.862-1.154 1.494-.704.633-1.606.99-.902.358-1.91.358-1.09 0-2.045-.416-.955-.416-1.664-1.125-.709-.709-1.125-1.664Q6 19.84 6 18.75q0-.188.018-.375.017-.188.04-.375H.997q-.41 0-.703-.293T0 17.004V6.996q0-.41.293-.703T.996 6h3.54q.14-1.277.726-2.373.586-1.096 1.488-1.904Q7.652.914 8.807.457 9.96 0 11.25 0q1.395 0 2.625.533T16.02 1.98q.914.915 1.447 2.145T18 6.75q0 .188-.012.375-.011.188-.035.375 1.242 0 2.344.469 1.101.468 1.928 1.277.826.809 1.3 1.904Q24 12.246 24 13.5zm-12.75-12q-.973 0-1.857.34-.885.34-1.577.943-.691.604-1.154 1.43Q6.2 5.039 6.06 6h4.945q.41 0 .703.293t.293.703v4.945l.21-.035q.212-.75.61-1.424.399-.673.944-1.218.545-.545 1.213-.944.668-.398 1.43-.61.093-.503.093-.96 0-1.09-.416-2.045-.416-.955-1.125-1.664-.709-.709-1.664-1.125Q12.34 1.5 11.25 1.5zM6.117 15.902q.54 0 1.06-.111.522-.111.932-.37.41-.257.662-.679.252-.422.252-1.055 0-.632-.263-1.054-.264-.422-.662-.703-.399-.282-.856-.463l-.855-.34q-.399-.158-.662-.334-.264-.176-.264-.445 0-.2.14-.323.141-.123.335-.193.193-.07.404-.094.21-.023.351-.023.598 0 1.055.152.457.153.95.457V8.543q-.282-.082-.522-.14-.24-.06-.475-.1-.234-.041-.486-.059-.252-.017-.557-.017-.515 0-1.054.117-.54.117-.979.375-.44.258-.715.68-.275.421-.275 1.03 0 .598.263.997.264.398.663.68.398.28.855.474l.856.363q.398.17.662.358.263.187.263.457 0 .222-.123.351-.123.13-.31.2-.188.07-.393.087-.205.018-.369.018-.703 0-1.248-.234-.545-.235-1.107-.621v1.875q1.195.468 2.472.468zM11.25 22.5q.773 0 1.453-.293t1.19-.803q.51-.51.808-1.195.299-.686.299-1.459 0-.668-.223-1.277-.222-.61-.62-1.096-.4-.486-.95-.826-.55-.34-1.207-.48v1.933q0 .41-.293.703t-.703.293H7.57q-.07.375-.07.75 0 .773.293 1.459t.803 1.195q.51.51 1.195.803.686.293 1.459.293zM18 18q.926 0 1.746-.352.82-.351 1.436-.966.615-.616.966-1.43.352-.815.352-1.752 0-.926-.352-1.746-.351-.82-.966-1.436-.616-.615-1.436-.966Q18.926 9 18 9t-1.74.357q-.815.358-1.43.973t-.973 1.43q-.357.814-.357 1.74 0 .129.006.258t.017.258q.551.27 1.02.65t.838.855q.369.475.627 1.026.258.55.387 1.148Q17.18 18 18 18Z" />
    </svg>
  );
}

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
            Intern Platform
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

      {/* SharePoint + footer — pinned to bottom */}
      <div className="mt-auto px-3 pb-3 pt-2 border-t border-white/8">
        <a
          href={SHAREPOINT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group mb-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/55 transition-all duration-150 hover:bg-white/6 hover:text-white"
        >
          <SharePointIcon className="h-4 w-4 shrink-0 text-white/40 transition-colors group-hover:text-white" />
          <span className="flex-1">SharePoint</span>
          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-white/25 transition-colors group-hover:text-white/50" />
        </a>

        <div className="flex items-center gap-2 px-3">
          <div className="h-1.5 w-1.5 rounded-full bg-[#ed6425]" />
          <p className="text-[11px] text-white/30">v1.0.0 · Academics for Companies</p>
        </div>
      </div>
    </aside>
  );
}
