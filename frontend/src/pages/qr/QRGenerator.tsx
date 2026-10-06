import { AppLayout } from '@/components/layout/AppLayout';

export default function QRGenerator() {
  return (
    <AppLayout
      title="QR Generator"
      subtitle="Genereer QR-codes voor AFC Gent"
    >
      <div className="-mx-8 -my-8 h-[calc(100vh-4rem)] overflow-hidden bg-white">
        <iframe
          src="https://qr.afcgent.be"
          title="AFC Gent QR Generator"
          className="h-full w-full border-0"
          allow="clipboard-write"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </AppLayout>
  );
}
