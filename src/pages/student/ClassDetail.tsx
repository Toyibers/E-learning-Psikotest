import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchClassById, fetchStudentAttempts, getCurrentUser, Class, Attempt } from '@/src/lib/store';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { BookOpen, FileText, Trophy, RotateCcw, ArrowLeft, Clock } from 'lucide-react';

export default function StudentClassDetail() {
  const { classId } = useParams();
  const [currentClass, setCurrentClass] = useState<Class | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const user = getCurrentUser();

  useEffect(() => {
    const loadData = async () => {
      if (!classId) return;
      try {
        const [classData, attemptsData] = await Promise.all([
          fetchClassById(classId),
          user ? fetchStudentAttempts(user.id) : Promise.resolve([])
        ]);
        setCurrentClass(classData);
        setAttempts(attemptsData);
      } catch (error) {
        console.error('Failed to fetch class detail:', error);
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [classId, user, navigate]);

  const getModuleStats = (moduleId: string) => {
    const moduleAttempts = attempts.filter(a => a.module_id === moduleId);
    if (moduleAttempts.length === 0) return { highestScore: '-', attemptCount: 0 };
    
    const highestScore = Math.max(...moduleAttempts.map(a => a.score));
    return { highestScore, attemptCount: moduleAttempts.length };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentClass) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-slate-500">
          <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Daftar Kelas
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{currentClass.name}</h1>
        <p className="text-slate-500">{currentClass.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(currentClass.modules || []).map((mod) => {
          const stats = getModuleStats(mod.id);
          const isLimitReached = mod.attempt_limit && mod.attempt_limit > 0 && stats.attemptCount >= mod.attempt_limit;

          return (
            <Card key={mod.id} className="flex flex-col hover:shadow-md transition-shadow duration-200 border-slate-200">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  {mod.attempt_limit && mod.attempt_limit > 0 && (
                    <div className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-purple-100 text-purple-700">
                      Limit: {stats.attemptCount}/{mod.attempt_limit}
                    </div>
                  )}
                </div>
                <CardTitle className="text-xl">{mod.title}</CardTitle>
                <CardDescription className="line-clamp-2 mt-2">{mod.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-slate-400" />
                    {mod.questions?.length || 0} Soal
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-slate-400" />
                    {mod.duration_minutes} Menit
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center text-[10px] font-semibold text-slate-400 uppercase">
                      <Trophy className="h-3 w-3 mr-1" /> Nilai Tertinggi
                    </div>
                    <div className="text-lg font-bold text-slate-700">{stats.highestScore}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center text-[10px] font-semibold text-slate-400 uppercase">
                      <RotateCcw className="h-3 w-3 mr-1" /> Sudah Ujian
                    </div>
                    <div className="text-lg font-bold text-slate-700">{stats.attemptCount}x</div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => navigate(`/module/${mod.id}`)}
                  disabled={(!mod.questions || mod.questions.length === 0) || isLimitReached}
                  variant={isLimitReached ? 'outline' : 'default'}
                >
                  {(!mod.questions || mod.questions.length === 0) 
                    ? 'Belum Ada Soal' 
                    : isLimitReached 
                      ? 'Batas Ujian Tercapai' 
                      : 'Mulai Ujian'}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
        {(!currentClass.modules || currentClass.modules.length === 0) && (
          <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
            Belum ada paket modul latihan dalam kelas ini.
          </div>
        )}
      </div>
    </div>
  );
}
