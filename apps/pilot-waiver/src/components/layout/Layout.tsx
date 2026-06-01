import { orgConfig } from '@easy-waiver/config';
interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-brand-500 text-white shadow-md">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="shrink-0">
            <img src="/apple-touch-icon.png" alt="CWAS" className="w-10 h-10 rounded-full" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">{orgConfig.orgName}</h1>
            <p className="text-sm text-white/80 leading-tight">Pilot / Volunteer Waiver</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-start justify-center py-8 px-4">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-card overflow-hidden">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} {orgConfig.orgName} – Sidney
      </footer>
    </div>
  );
}
