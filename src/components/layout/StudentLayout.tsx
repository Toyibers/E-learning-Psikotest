import { Outlet, useNavigate } from 'react-router-dom';
import { getCurrentUser, setCurrentUser } from '@/src/lib/store';
import { useEffect } from 'react';
import { LogOut, BookOpen } from 'lucide-react';

export default function StudentLayout() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user.role === 'admin') {
      navigate('/admin');
    }
  }, [user, navigate]);

  if (!user || user.role === 'admin') return null;

  const handleLogout = () => {
    setCurrentUser(null);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <BookOpen className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold text-slate-800">E-Learning</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-600">Halo, {user.name}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
