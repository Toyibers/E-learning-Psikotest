import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { getCurrentUser, setCurrentUser } from '@/src/lib/store';
import { useEffect, useState } from 'react';
import { LayoutDashboard, BookOpen, Users, User, LogOut, Menu, X } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user.role === 'student') {
      navigate('/');
    }
  }, [user, navigate]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  if (!user || user.role === 'student') return null;

  const handleLogout = () => {
    setCurrentUser(null);
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Modul', path: '/admin/modules', icon: BookOpen },
    { name: 'Siswa', path: '/admin/students', icon: Users },
    { name: 'Profil Admin', path: '/admin/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Mobile Navbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-blue-600" />
          <span className="text-xl font-bold text-slate-800">Admin Panel</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-md"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 left-0 z-30 w-64 transition-transform duration-300 ease-in-out lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <BookOpen className="h-6 w-6 text-blue-600 mr-2" />
          <span className="text-xl font-bold text-slate-800">Admin Panel</span>
        </div>
        
        {/* Admin Profile Snippet in Sidebar */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          {user.profile_photo ? (
            <img src={user.profile_photo} alt="Admin" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-semibold text-slate-800 truncate">{user.name}</span>
            <span className="text-xs text-slate-500 truncate">@{user.username}</span>
          </div>
        </div>

        <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive ? "text-blue-700" : "text-slate-400")} />
                {item.name}
              </Link>
            );
          })}
        </div>
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8 w-full overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
