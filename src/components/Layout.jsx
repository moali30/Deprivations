import { Outlet, Link } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10 print:hidden">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            نظام الحرمان
          </Link>
          <nav className="flex gap-6">
            <Link to="/" className="text-slate-600 hover:text-indigo-600 font-bold transition-colors">بوابة المرشد</Link>
            <Link to="/control" className="text-slate-600 hover:text-indigo-600 font-bold transition-colors">الكنترول</Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-slate-500 text-sm print:hidden">
        نظام تحليل الغياب واستخراج تقارير الحرمان &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
