import React, { useState, useEffect, useMemo } from 'react';
import { fetchUsers, fetchAttempts, User, Attempt } from '@/src/lib/store';
import { supabase } from '@/src/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { Users, Search, ChevronLeft, ChevronRight, Plus, Edit, Trash2, X } from 'lucide-react';
import { ConfirmModal } from '@/src/components/ui/ConfirmModal';

export default function Students() {
  const [students, setStudents] = useState<User[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 5;

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    created_at: new Date().toISOString().split('T')[0],
    total_attempts: '0',
    last_score: '0',
    avg_score: '0'
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersData, attemptsData] = await Promise.all([
        fetchUsers(),
        fetchAttempts()
      ]);
      setStudents(usersData.filter(u => u.role === 'student'));
      setAttempts(attemptsData);
    } catch (error) {
      console.error('Failed to load students data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getStudentStats = (studentId: string) => {
    const studentAttempts = attempts.filter(a => a.user_id === studentId);
    if (studentAttempts.length === 0) return { lastScore: '-', avgScore: '-', totalAttempts: 0 };
    
    const sortedAttempts = [...studentAttempts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const lastScore = sortedAttempts[0].score;
    const avgScore = Math.round(studentAttempts.reduce((sum, a) => sum + a.score, 0) / studentAttempts.length);
    
    return { lastScore, avgScore, totalAttempts: studentAttempts.length };
  };

  const filteredStudents = useMemo(() => {
    return students.filter(student => 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const openAddModal = () => {
    setEditingStudent(null);
    setFormData({
      name: '',
      username: '',
      password: '',
      created_at: new Date().toISOString().split('T')[0],
      total_attempts: '0',
      last_score: '0',
      avg_score: '0'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (student: User) => {
    const stats = getStudentStats(student.id);
    setEditingStudent(student);
    setFormData({
      name: student.name,
      username: student.username,
      password: student.password || '',
      created_at: new Date(student.created_at).toISOString().split('T')[0],
      total_attempts: stats.totalAttempts.toString(),
      last_score: stats.lastScore.toString(),
      avg_score: stats.avgScore.toString()
    });
    setIsModalOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        const { error } = await supabase
          .from('users')
          .update({
            name: formData.name,
            username: formData.username,
            password: formData.password,
            created_at: new Date(formData.created_at).toISOString()
          })
          .eq('id', editingStudent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('users')
          .insert([{
            name: formData.name,
            username: formData.username,
            password: formData.password,
            role: 'student',
            created_at: new Date(formData.created_at).toISOString()
          }]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving student:', error);
      alert('Gagal menyimpan data siswa');
    }
  };

  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return;
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', studentToDelete);
      if (error) throw error;
      setStudentToDelete(null);
      loadData();
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Gagal menghapus siswa');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConfirmModal 
        isOpen={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        onConfirm={confirmDeleteStudent}
        title="Hapus Siswa"
        description="Apakah Anda yakin ingin menghapus siswa ini? Semua data nilai siswa juga akan terhapus."
        confirmText="Hapus"
      />

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <Card className="w-full max-w-lg bg-white shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <CardTitle>{editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSaveStudent} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Nama Siswa</label>
                    <Input 
                      required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="Nama Lengkap"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Username</label>
                    <Input 
                      required
                      value={formData.username}
                      onChange={e => setFormData({...formData, username: e.target.value})}
                      placeholder="username"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Password</label>
                    <Input 
                      required
                      type="password"
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      placeholder="********"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Tanggal Daftar</label>
                    <Input 
                      type="date"
                      value={formData.created_at}
                      onChange={e => setFormData({...formData, created_at: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Total Attempt</label>
                    <Input 
                      type="number"
                      value={formData.total_attempts}
                      onChange={e => setFormData({...formData, total_attempts: e.target.value})}
                      disabled={!editingStudent}
                      className="bg-slate-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Nilai Terakhir</label>
                    <Input 
                      type="number"
                      value={formData.last_score}
                      onChange={e => setFormData({...formData, last_score: e.target.value})}
                      disabled={!editingStudent}
                      className="bg-slate-50"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Rata-Rata Nilai</label>
                    <Input 
                      type="number"
                      value={formData.avg_score}
                      onChange={e => setFormData({...formData, avg_score: e.target.value})}
                      disabled={!editingStudent}
                      className="bg-slate-50"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Simpan Data</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Daftar Siswa</h1>
      </div>

      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Users className="h-5 w-5 text-blue-600" />
            Total {filteredStudents.length} Siswa
          </CardTitle>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Cari nama atau username..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={openAddModal} className="w-full sm:w-auto gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4" /> Tambah Siswa
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 font-medium">Nama Siswa</th>
                  <th className="px-6 py-3 font-medium">Username</th>
                  <th className="px-6 py-3 font-medium">Tanggal Daftar</th>
                  <th className="px-6 py-3 font-medium text-center">Total Attempt</th>
                  <th className="px-6 py-3 font-medium text-right">Nilai Terakhir</th>
                  <th className="px-6 py-3 font-medium text-right">Rata-rata Nilai</th>
                  <th className="px-6 py-3 font-medium text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.length > 0 ? (
                  paginatedStudents.map((student) => {
                    const stats = getStudentStats(student.id);
                    return (
                      <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">
                          <div className="flex items-center gap-3">
                            {student.profile_photo ? (
                              <img src={student.profile_photo} alt={student.name} className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                {student.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            {student.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500">@{student.username}</td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(student.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 text-center text-slate-600">{stats.totalAttempts}</td>
                        <td className="px-6 py-4 text-right font-semibold text-slate-700">
                          {stats.lastScore}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-blue-600">
                          {stats.avgScore}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 bg-yellow-400 hover:bg-yellow-500 text-white"
                              onClick={() => openEditModal(student)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 bg-red-500 hover:bg-red-600 text-white"
                              onClick={() => setStudentToDelete(student.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                      {searchTerm ? 'Tidak ada siswa yang cocok dengan pencarian.' : 'Belum ada siswa yang mendaftar.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <span className="text-sm text-slate-500">
                Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredStudents.length)} dari {filteredStudents.length} siswa
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center px-3 text-sm font-medium text-slate-700">
                  {currentPage} / {totalPages}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


