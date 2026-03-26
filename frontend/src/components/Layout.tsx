import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore.ts';
import { FileText, LayoutDashboard, Settings, LogOut, Send } from 'lucide-react';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const navLink = (path: string, label: string, icon: React.ReactNode) => (
    <Link
      to={path}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive(path)
          ? 'bg-rs-red text-white'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {icon}
      {label}
    </Link>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo-rs-france.png" alt="Rolling Stone France" className="h-8" />
              <span className="font-semibold text-rs-black hidden sm:block">Hebdo Delivery</span>
            </Link>

            {/* Nav */}
            <nav className="flex items-center gap-1">
              {navLink('/', 'Dashboard', <LayoutDashboard size={18} />)}
              {navLink('/livrer', 'Livrer', <Send size={18} />)}
              {user?.role === 'admin' && navLink('/admin', 'Admin', <Settings size={18} />)}
            </nav>

            {/* User */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-rs-red transition-colors rounded-lg hover:bg-gray-100"
                title="Deconnexion"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-gray-400">
          <FileText size={14} className="inline mr-1" />
          Rolling Stone France — Plateforme de livraison Hebdo
        </div>
      </footer>
    </div>
  );
}
