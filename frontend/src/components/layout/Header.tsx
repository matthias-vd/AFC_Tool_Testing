import { useEffect, useState } from 'react';
import { LogOut, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const displayName =
    user?.user_metadata?.full_name ??
    user?.email?.split('@')[0] ??
    'Gebruiker';

  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-zinc-200/80 bg-white/95 backdrop-blur-sm px-8">
      <div className="flex min-w-0 items-center gap-4">
        <div className="h-8 w-0.5 shrink-0 rounded-full bg-[#ed6425]" />
        <div className="min-w-0">
          <h1 className="truncate text-[15px] font-bold leading-tight tracking-tight text-[#041c3a]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 truncate text-[11px] tracking-wide text-zinc-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {actions}

        <Separator orientation="vertical" className="h-6" />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-1.5 text-sm text-[#041c3a] outline-none transition-colors hover:border-zinc-200 hover:bg-zinc-50">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-[#041c3a] text-[11px] font-bold tracking-wide text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-[13px] font-semibold sm:block">{displayName}</span>
            <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52 border-zinc-200 shadow-lg shadow-zinc-900/8">
            <div className="px-2 py-1.5">
              <p className="text-xs font-semibold text-[#041c3a]">{displayName}</p>
              <p className="truncate text-[11px] text-zinc-400">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-[13px] text-red-600 focus:bg-red-50 focus:text-red-600"
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Uitloggen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}