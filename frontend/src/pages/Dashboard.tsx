import { AppLayout } from '@/components/layout/AppLayout';
import { UpcomingReadiness } from '@/components/dashboard/UpcomingReadiness';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentEvents } from '@/components/dashboard/RecentEvents';
import { AcademicYearBanner } from '@/components/dashboard/AcademicYearBanner';

export function Dashboard() {
  return (
    <AppLayout
      title="Dashboard"
      subtitle="Overzicht van alle evenementen en activiteiten"
    >
      <div className="flex flex-col gap-8">
        <AcademicYearBanner />
        <UpcomingReadiness />
        <QuickActions />
        <RecentEvents />
      </div>
    </AppLayout>
  );
}