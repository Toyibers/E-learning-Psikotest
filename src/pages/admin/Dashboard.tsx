import { useState, useEffect } from 'react';
import { fetchModules, fetchUsers, fetchAttempts, Module, User, Attempt } from '@/src/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/Card';
import { BookOpen, Users, Activity, Trophy } from 'lucide-react';

export default function Dashboard() {
  const [modules, setModules] = useState<Module[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [modulesData, usersData, attemptsData] = await Promise.all([
          fetchModules(),
          fetchUsers(),
          fetchAttempts()
        ]);
        setModules(modulesData);
        setStudents(usersData.filter(u => u.role === 'student'));
        setAttempts(attemptsData);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Calculate top 5 students
  const studentScores = students.map(student => {
    const studentAttempts = attempts.filter(a => a.user_id === student.id);
    const avgScore = studentAttempts.length > 0 
      ? studentAttempts.reduce((sum, a) => sum + a.score, 0) / studentAttempts.length 
      : 0;
    return { ...student, avgScore };
  });

  const topStudents = studentScores
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Admin</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Modul</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{modules.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Siswa</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{students.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Attempt Soal</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{attempts.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top 5 Siswa Nilai Tertinggi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 font-medium">Peringkat</th>
                  <th className="px-6 py-3 font-medium">Nama Siswa</th>
                  <th className="px-6 py-3 font-medium">Username</th>
                  <th className="px-6 py-3 font-medium text-right">Rata-rata Nilai</th>
                </tr>
              </thead>
              <tbody>
                {topStudents.length > 0 ? (
                  topStudents.map((student, index) => (
                    <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">#{index + 1}</td>
                      <td className="px-6 py-4">{student.name}</td>
                      <td className="px-6 py-4 text-slate-500">@{student.username}</td>
                      <td className="px-6 py-4 text-right font-semibold text-blue-600">
                        {Math.round(student.avgScore)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      Belum ada data nilai siswa.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

