import { Link } from 'react-router-dom';

/**
 * Exact afcgent-tickettool SiteHeader layout.
 * Organisatie → AFC EventBeheer (/ticketing → login indien nodig).
 */
export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="ticket-public flex min-h-full flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="inline-flex items-center" aria-label="AFC Gent home">
          <img
            src="/afc-gent-logo.svg"
            alt="AFC Gent"
            className="h-10 w-auto sm:h-12"
          />
        </Link>
        <Link to="/ticketing" className="text-sm text-muted hover:text-ink">
          Organisatie
        </Link>
      </header>
      {children}
    </div>
  );
}
