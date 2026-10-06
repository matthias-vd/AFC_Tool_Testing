import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toaster } from 'sonner';

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  /** Skip max-width / spacing wrapper (e.g. full-bleed iframe pages). */
  fullBleed?: boolean;
}

export function AppLayout({
  children,
  title,
  subtitle,
  actions,
  fullBleed = false,
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-50/60">
      <Sidebar />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '8px',
            border: '1px solid #e4e4e7',
            fontSize: '13px',
          },
        }}
      />
      <div className="pl-64">
        <Header title={title} subtitle={subtitle} actions={actions} />
        <main className={fullBleed ? undefined : 'px-8 py-8'}>
          {fullBleed ? (
            children
          ) : (
            <div className="mx-auto max-w-screen-2xl space-y-6">{children}</div>
          )}
        </main>
      </div>
    </div>
  );
}
