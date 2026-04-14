import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchClasses, Class } from '@/src/lib/store';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Brain, FolderOpen, ChevronRight } from 'lucide-react';

export default function Home() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const classesData = await fetchClasses();
        setClasses(classesData);
      } catch (error) {
        console.error('Failed to fetch classes:', error);
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Pilih Kelas Psikotest</h1>
        <p className="text-slate-500">Silakan pilih kategori kemampuan yang ingin Anda latih hari ini.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {classes.map((cls) => (
          <Card key={cls.id} className="group flex flex-col hover:shadow-lg transition-all duration-300 border-slate-200 overflow-hidden">
            <div className="h-2 bg-blue-600 w-full"></div>
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Brain className="h-7 w-7 text-blue-600" />
                </div>
                <div className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  {cls.modules?.length || 0} Paket Modul
                </div>
              </div>
              <CardTitle className="text-2xl text-slate-800">{cls.name}</CardTitle>
              <CardDescription className="text-slate-500 mt-2 text-base leading-relaxed">
                {cls.description}
              </CardDescription>
            </CardHeader>
            <CardFooter className="pt-2">
              <Button 
                className="w-full group/btn h-12 text-base font-semibold" 
                onClick={() => navigate(`/class/${cls.id}`)}
              >
                Masuk Kelas
                <ChevronRight className="ml-2 h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </CardFooter>
          </Card>
        ))}
        {classes.length === 0 && (
          <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <FolderOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Belum ada kelas yang tersedia saat ini.</p>
          </div>
        )}
      </div>
    </div>
  );
}

