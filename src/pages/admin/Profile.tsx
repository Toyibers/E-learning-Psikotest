import React, { useState, useEffect, useRef } from 'react';
import { getCurrentUser, setCurrentUser, User } from '@/src/lib/store';
import { supabase } from '@/src/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { User as UserIcon, ShieldCheck, Camera, Trash2 } from 'lucide-react';

export default function Profile() {
  const [admin, setAdmin] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [profile_photo, setProfilePhoto] = useState<string | undefined>(undefined);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (user && user.role === 'admin') {
      setAdmin(user);
      setName(user.name);
      setUsername(user.username);
      setPassword(user.password || '');
      setProfilePhoto(user.profile_photo);
    }
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    if (!name || !username || !password) {
      setMessage('Semua field harus diisi');
      setIsLoading(false);
      return;
    }

    if (admin) {
      try {
        const { error } = await supabase
          .from('users')
          .update({ name, username, password, profile_photo })
          .eq('id', admin.id);

        if (error) throw error;

        const updatedAdmin = { ...admin, name, username, password, profile_photo };
        
        // Update current user in localStorage
        setCurrentUser(updatedAdmin);
        setAdmin(updatedAdmin);
        
        setMessage('Profil berhasil diperbarui!');
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        console.error('Failed to update profile:', error);
        setMessage('Gagal memperbarui profil.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) { // Limit to 1MB for base64 storage
        setMessage('Ukuran file maksimal 1MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setProfilePhoto(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!admin) return null;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Profil Admin</h1>
      </div>

      <Card className="bg-white border-0 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-600 to-blue-400"></div>
        <CardHeader className="relative pt-16 pb-4 text-center">
          <div className="relative mx-auto w-24 h-24 mb-4 group">
            {profile_photo ? (
              <img src={profile_photo} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md bg-white" />
            ) : (
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-md border-4 border-white">
                <ShieldCheck className="h-12 w-12 text-blue-600" />
              </div>
            )}
            
            <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 bg-white text-slate-800 rounded-full hover:bg-slate-100 transition-colors"
                title="Ganti Foto"
              >
                <Camera className="h-4 w-4" />
              </button>
              {profile_photo && (
                <button 
                  type="button"
                  onClick={handleRemovePhoto}
                  className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  title="Hapus Foto"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">{name}</CardTitle>
          <CardDescription className="text-slate-500">@{username}</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-8 pt-4">
          <form onSubmit={handleUpdate} className="space-y-6">
            {message && (
              <div className={`p-4 text-sm rounded-md ${
                message.includes('berhasil') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'
              }`}>
                {message}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-slate-400" /> Nama Lengkap
              </label>
              <Input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="Nama Admin"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-slate-400" /> Username
              </label>
              <Input 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                placeholder="Username Admin"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-slate-400" /> Password
              </label>
              <Input 
                type="password"
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="Password Admin"
                required
              />
              <p className="text-xs text-slate-500 mt-1">Gunakan password yang kuat dan unik.</p>
            </div>
            
            <div className="pt-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Memperbarui...' : 'Update Profil'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

