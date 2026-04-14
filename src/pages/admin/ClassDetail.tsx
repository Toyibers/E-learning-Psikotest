import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchClassById, Class, Module } from '@/src/lib/store';
import { supabase } from '@/src/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Plus, Edit, Trash2, Eye, Clock, ArrowLeft } from 'lucide-react';
import { ConfirmModal } from '@/src/components/ui/ConfirmModal';

export default function ClassDetail() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [currentClass, setCurrentClass] = useState<Class | null>(null);
  const [modules, setModulesState] = useState<Module[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration_minutes, setDurationMinutes] = useState<number>(30);
  const [attempt_limit, setAttemptLimit] = useState<number>(0);
  
  // Modal state
  const [moduleToDelete, setModuleToDelete] = useState<string | null>(null);

  const loadData = async () => {
    if (!classId) return;
    setIsLoading(true);
    try {
      const data = await fetchClassById(classId);
      setCurrentClass(data);
      setModulesState(data.modules || []);
    } catch (error) {
      console.error('Failed to fetch class detail:', error);
      navigate('/admin/classes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [classId]);

  const handleSave = async () => {
    if (!title || !description || duration_minutes <= 0 || !classId) return;

    try {
      if (editingId) {
        const { error } = await supabase
          .from('modules')
          .update({ title, description, duration_minutes, attempt_limit })
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('modules')
          .insert([{ class_id: classId, title, description, duration_minutes, attempt_limit }]);
        if (error) throw error;
      }
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to save module:', error);
    }
  };

  const confirmDelete = async () => {
    if (moduleToDelete) {
      try {
        const { error } = await supabase
          .from('modules')
          .delete()
          .eq('id', moduleToDelete);
        if (error) throw error;
        setModuleToDelete(null);
        loadData();
      } catch (error) {
        console.error('Failed to delete module:', error);
      }
    }
  };

  const startEdit = (mod: Module) => {
    setEditingId(mod.id);
    setTitle(mod.title);
    setDescription(mod.description);
    setDurationMinutes(mod.duration_minutes || 30);
    setAttemptLimit(mod.attempt_limit || 0);
    setIsAdding(true);
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setTitle('');
    setDescription('');
    setDurationMinutes(30);
    setAttemptLimit(0);
  };

  if (isLoading && !currentClass) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentClass) return null;

  return (
    <div className="space-y-6">
      <ConfirmModal 
        isOpen={!!moduleToDelete}
        onClose={() => setModuleToDelete(null)}
        onConfirm={confirmDelete}
        title="Hapus Paket Modul"
        description="Apakah Anda yakin ingin menghapus paket modul ini? Semua soal di dalamnya juga akan terhapus."
        confirmText="Hapus"
      />

      <div className="flex items-center gap-4 mb-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/classes')} className="text-slate-500">
          <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Kelas
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{currentClass.name}</h1>
          <p className="text-slate-500 mt-1">Kelola paket modul latihan untuk kelas ini</p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Tambah Paket Modul
          </Button>
        )}
      </div>

      {isAdding && (
        <Card className="bg-white border-0 shadow-sm border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Paket Modul' : 'Tambah Paket Modul Baru'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Judul Paket</label>
              <Input 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="Contoh: Paket 1 : Soal 30 Psikotes Sinonim"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Deskripsi</label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                value={description} 
                onChange={e => setDescription(e.target.value)}
                placeholder="Deskripsi singkat paket modul..."
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Durasi Pengerjaan (Menit)</label>
                <Input 
                  type="number"
                  min="1"
                  value={duration_minutes} 
                  onChange={e => setDurationMinutes(parseInt(e.target.value) || 0)} 
                  placeholder="Contoh: 30"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Batasan Mengulang (0 = Tanpa Batas)</label>
                <Input 
                  type="number"
                  min="0"
                  value={attempt_limit} 
                  onChange={e => setAttemptLimit(parseInt(e.target.value) || 0)} 
                  placeholder="Contoh: 3"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave}>Simpan</Button>
              <Button variant="outline" onClick={resetForm}>Batal</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {modules.map(mod => (
          <Card key={mod.id} className="bg-white border-0 shadow-sm flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg leading-tight">{mod.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-slate-500 line-clamp-2 mb-4">{mod.description}</p>
              <div className="flex flex-wrap gap-2">
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {mod.questions?.length || 0} Soal
                </div>
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                  <Clock className="w-3 h-3 mr-1" />
                  {mod.duration_minutes || 30} Menit
                </div>
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Limit: {mod.attempt_limit || '∞'}
                </div>
              </div>
            </CardContent>
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center rounded-b-xl">
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => navigate(`/admin/modules/${mod.id}`)}>
                <Eye className="h-4 w-4 mr-1.5" /> Kelola Soal
              </Button>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700" onClick={() => startEdit(mod)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setModuleToDelete(mod.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {modules.length === 0 && !isAdding && (
          <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
            Belum ada paket modul dalam kelas ini.
          </div>
        )}
      </div>
    </div>
  );
}
