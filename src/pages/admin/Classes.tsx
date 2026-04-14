import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchClasses, Class } from '@/src/lib/store';
import { supabase } from '@/src/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Plus, Edit, Trash2, Eye, FolderOpen } from 'lucide-react';
import { ConfirmModal } from '@/src/components/ui/ConfirmModal';

export default function Classes() {
  const [classes, setClassesState] = useState<Class[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  // Modal state
  const [classToDelete, setClassToDelete] = useState<string | null>(null);

  const navigate = useNavigate();

  const loadClasses = async () => {
    setIsLoading(true);
    try {
      const data = await fetchClasses();
      setClassesState(data);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const handleSave = async () => {
    if (!name || !description) return;

    try {
      if (editingId) {
        const { error } = await supabase
          .from('classes')
          .update({ name, description })
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('classes')
          .insert([{ name, description }]);
        if (error) throw error;
      }
      resetForm();
      loadClasses();
    } catch (error) {
      console.error('Failed to save class:', error);
    }
  };

  const confirmDelete = async () => {
    if (classToDelete) {
      try {
        const { error } = await supabase
          .from('classes')
          .delete()
          .eq('id', classToDelete);
        if (error) throw error;
        setClassToDelete(null);
        loadClasses();
      } catch (error) {
        console.error('Failed to delete class:', error);
      }
    }
  };

  const startEdit = (cls: Class) => {
    setEditingId(cls.id);
    setName(cls.name);
    setDescription(cls.description);
    setIsAdding(true);
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setName('');
    setDescription('');
  };

  if (isLoading && classes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConfirmModal 
        isOpen={!!classToDelete}
        onClose={() => setClassToDelete(null)}
        onConfirm={confirmDelete}
        title="Hapus Kelas"
        description="Apakah Anda yakin ingin menghapus kelas ini? Semua paket modul di dalamnya juga akan terhapus."
        confirmText="Hapus"
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Kelola Kelas</h1>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Tambah Kelas
          </Button>
        )}
      </div>

      {isAdding && (
        <Card className="bg-white border-0 shadow-sm border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Kelas' : 'Tambah Kelas Baru'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Nama Kelas</label>
              <Input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="Contoh: Kelas Kemampuan Verbal"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Deskripsi</label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                value={description} 
                onChange={e => setDescription(e.target.value)}
                placeholder="Deskripsi singkat kelas..."
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave}>Simpan</Button>
              <Button variant="outline" onClick={resetForm}>Batal</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {classes.map(cls => (
          <Card key={cls.id} className="bg-white border-0 shadow-sm flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-1">
                <FolderOpen className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Kelas</span>
              </div>
              <CardTitle className="text-xl leading-tight">{cls.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-slate-500 line-clamp-3 mb-4">{cls.description}</p>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {(cls.modules?.length || 0)} Paket Modul
              </div>
            </CardContent>
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center rounded-b-xl">
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => navigate(`/admin/classes/${cls.id}`)}>
                <Eye className="h-4 w-4 mr-1.5" /> Kelola Paket
              </Button>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700" onClick={() => startEdit(cls)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setClassToDelete(cls.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {classes.length === 0 && !isAdding && (
          <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
            Belum ada kelas tersedia. Klik "Tambah Kelas" untuk memulai.
          </div>
        )}
      </div>
    </div>
  );
}
