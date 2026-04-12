import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/Card';
import { getCurrentUser, setCurrentUser, User } from '@/src/lib/store';
import { supabase } from '@/src/lib/supabase';

export default function LoginRegister() {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  // Login state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Register state
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regError, setRegError] = useState('');

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/');
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', loginUsername)
        .eq('password', loginPassword)
        .single();

      if (error || !data) {
        setLoginError('Username atau password salah');
      } else {
        const user = data as User;
        setCurrentUser(user);
        navigate(user.role === 'admin' ? '/admin' : '/');
      }
    } catch (err) {
      setLoginError('Terjadi kesalahan saat login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setIsLoading(true);

    if (!regName || !regUsername || !regPassword || !regConfirm) {
      setRegError('Semua field harus diisi');
      setIsLoading(false);
      return;
    }

    if (regPassword !== regConfirm) {
      setRegError('Password tidak cocok');
      setIsLoading(false);
      return;
    }

    try {
      // Check if username exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', regUsername)
        .maybeSingle();

      if (existingUser) {
        setRegError('Username sudah digunakan');
        setIsLoading(false);
        return;
      }

      const { data: newUser, error } = await supabase
        .from('users')
        .insert([{
          name: regName,
          username: regUsername,
          password: regPassword,
          role: 'student'
        }])
        .select()
        .single();

      if (error) throw error;

      setCurrentUser(newUser as User);
      navigate('/');
    } catch (err) {
      setRegError('Terjadi kesalahan saat pendaftaran');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 p-4 font-sans">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-3xl font-bold text-slate-800">E-Learning Psikotest</CardTitle>
          <CardDescription>Platform belajar interaktif</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex mb-6 bg-slate-100 p-1 rounded-lg">
            <button
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                isLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                !isLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setIsLogin(false)}
            >
              Register
            </button>
          </div>

          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md">{loginError}</div>}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Username</label>
                <Input
                  type="text"
                  placeholder="Masukkan username"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Password</label>
                <Input
                  type="password"
                  placeholder="Masukkan password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                {isLoading ? 'Memproses...' : 'Masuk'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              {regError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md">{regError}</div>}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Nama Lengkap</label>
                <Input
                  type="text"
                  placeholder="Masukkan nama lengkap"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Username</label>
                <Input
                  type="text"
                  placeholder="Pilih username"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Password</label>
                <Input
                  type="password"
                  placeholder="Buat password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Konfirmasi Password</label>
                <Input
                  type="password"
                  placeholder="Ulangi password"
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                {isLoading ? 'Memproses...' : 'Daftar & Masuk'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
