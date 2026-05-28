interface LayoutProps {
  children: React.ReactNode;
  orgName: string;
  subtitle?: string;
  logoSrc?: string;
}

export default function Layout({ children, orgName, subtitle, logoSrc }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-brand-500 text-white shadow-md">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          {logoSrc && (
            <div className="shrink-0">
              <img src={logoSrc} alt={orgName} className="w-10 h-10 rounded-full" />
            </div>
          )}
          <div>
            <h1 className="text-lg font-bold leading-tight">{orgName}</h1>
            {subtitle && (
              <p className="text-sm text-white/80 leading-tight">{subtitle}</p>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center py-8 px-4">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-medium overflow-hidden">
          {children}
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} {orgName}
      </footer>
    </div>
  );
}
