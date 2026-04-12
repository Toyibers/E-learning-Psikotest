import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchModuleById, fetchStudentAttempts, getCurrentUser, saveAttempt, Module, Attempt, Question, AttemptDetail } from '@/src/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { ArrowLeft, CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react';
import { ConfirmModal } from '@/src/components/ui/ConfirmModal';

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export default function ModuleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [module, setModule] = useState<Module | null>(null);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [attemptDetails, setAttemptDetails] = useState<AttemptDetail[]>([]);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLimitReached, setIsLimitReached] = useState(false);

  useEffect(() => {
    const loadModule = async () => {
      if (!id) return;
      const user = getCurrentUser();
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const [found, userAttempts] = await Promise.all([
          fetchModuleById(id),
          fetchStudentAttempts(user.id)
        ]);

        if (found) {
          // Check attempt limit
          const moduleAttempts = userAttempts.filter(a => a.module_id === id);
          if (found.attempt_limit && found.attempt_limit > 0 && moduleAttempts.length >= found.attempt_limit) {
            setIsLimitReached(true);
            setModule(found);
          } else {
            setModule(found);
            const questions = found.questions || [];
            setShuffledQuestions(shuffleArray(questions));
            setTimeLeft((found.duration_minutes || 30) * 60);
          }
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Failed to fetch module:', error);
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };
    loadModule();
  }, [id, navigate]);

  useEffect(() => {
    if (timeLeft === null || isFinished) return;

    if (timeLeft <= 0) {
      finishQuiz();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isFinished]);

  const handleAnswer = (optionIndex: number) => {
    setAnswers({ ...answers, [currentQuestionIndex]: optionIndex });
  };

  const handleNext = () => {
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setShowFinishConfirm(true);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleBack = () => {
    if (isFinished) {
      navigate('/');
    } else {
      setShowBackConfirm(true);
    }
  };

  const confirmBack = async () => {
    await finishQuiz();
    navigate('/');
  };

  const finishQuiz = async () => {
    let correct = 0;
    const details: Omit<AttemptDetail, 'id'>[] = [];

    shuffledQuestions.forEach((q, index) => {
      const userAnswer = answers[index] !== undefined ? answers[index] : null;
      const isCorrect = userAnswer === q.correct_answer;
      if (isCorrect) correct++;
      
      details.push({
        question_id: q.id,
        is_correct: isCorrect,
        user_answer: userAnswer,
        correct_answer: q.correct_answer
      });
    });
    
    const finalScore = Math.round((correct / shuffledQuestions.length) * 100);
    setScore(finalScore);
    setAttemptDetails(details as AttemptDetail[]);
    setIsFinished(true);
    setShowFinishConfirm(false);

    const user = getCurrentUser();
    if (user && module) {
      try {
        await saveAttempt({
          user_id: user.id,
          module_id: module.id,
          score: finalScore,
        }, details);
      } catch (error) {
        console.error('Failed to save attempt:', error);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isLimitReached) {
    return (
      <div className="max-w-2xl mx-auto mt-12 text-center space-y-6">
        <div className="flex justify-center">
          <AlertCircle className="h-20 w-20 text-yellow-500" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Batas Ujian Tercapai</h1>
        <p className="text-lg text-slate-600">
          Maaf, Anda telah mencapai batas maksimal pengerjaan untuk modul 
          <span className="font-semibold block text-slate-900 mt-1">"{module?.title}"</span>
        </p>
        <div className="pt-4">
          <Button size="lg" onClick={() => navigate('/')}>Kembali ke Beranda</Button>
        </div>
      </div>
    );
  }

  if (!module || shuffledQuestions.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-slate-700">Modul tidak ditemukan atau belum memiliki soal.</h2>
        <Button className="mt-4" onClick={() => navigate('/')}>Kembali ke Beranda</Button>
      </div>
    );
  }

  const currentQuestion = shuffledQuestions[currentQuestionIndex];

  if (isFinished) {
    const correctCount = attemptDetails.filter(d => d.is_correct).length;
    const incorrectCount = attemptDetails.length - correctCount;

    return (
      <div className="max-w-4xl mx-auto mt-8 space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-20 w-20 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Ujian Selesai</h1>
          <p className="text-lg text-slate-600">Modul: <span className="font-semibold">{module.title}</span></p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white shadow-sm border-0 text-center">
            <CardContent className="p-6">
              <div className="text-5xl font-bold text-blue-600 mb-2">{score}</div>
              <div className="text-slate-500 font-medium uppercase tracking-wider text-sm">Nilai Akhir</div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm border-0 text-center">
            <CardContent className="p-6">
              <div className="text-5xl font-bold text-green-500 mb-2">{correctCount}</div>
              <div className="text-slate-500 font-medium uppercase tracking-wider text-sm">Jawaban Benar</div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm border-0 text-center">
            <CardContent className="p-6">
              <div className="text-5xl font-bold text-red-500 mb-2">{incorrectCount}</div>
              <div className="text-slate-500 font-medium uppercase tracking-wider text-sm">Jawaban Salah/Kosong</div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 mt-12">
          <h2 className="text-2xl font-bold text-slate-800 border-b pb-2">Detail Jawaban</h2>
          {shuffledQuestions.map((q, idx) => {
            const detail = attemptDetails[idx];
            return (
              <Card key={q.id} className={`border-l-4 ${detail.is_correct ? 'border-l-green-500' : 'border-l-red-500'}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-3">
                    {detail.is_correct ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-semibold text-slate-700 mr-2">Soal {idx + 1}.</span>
                      <div className="prose prose-sm max-w-none inline-block" dangerouslySetInnerHTML={{ __html: q.text }} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pl-14 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Jawaban Anda</div>
                      {detail.user_answer !== null ? (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-700">{String.fromCharCode(65 + detail.user_answer)}.</span>
                          {q.options[detail.user_answer].match(/^https?:\/\/.*\.(jpeg|jpg|gif|png)$/) ? (
                            <img src={q.options[detail.user_answer]} alt="User Answer" className="max-h-20 rounded" />
                          ) : (
                            <span>{q.options[detail.user_answer]}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Tidak dijawab</span>
                      )}
                    </div>
                    {!detail.is_correct && (
                      <div className="p-3 rounded-md bg-green-50 border border-green-200">
                        <div className="text-xs font-semibold text-green-700 uppercase mb-1">Kunci Jawaban</div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-green-800">{String.fromCharCode(65 + detail.correct_answer)}.</span>
                          {q.options[detail.correct_answer].match(/^https?:\/\/.*\.(jpeg|jpg|gif|png)$/) ? (
                            <img src={q.options[detail.correct_answer]} alt="Correct Answer" className="max-h-20 rounded" />
                          ) : (
                            <span className="text-green-800">{q.options[detail.correct_answer]}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <div className="pt-8 pb-12 text-center">
          <Button size="lg" onClick={() => navigate('/')}>Kembali ke Beranda</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <ConfirmModal 
        isOpen={showFinishConfirm}
        onClose={() => setShowFinishConfirm(false)}
        onConfirm={finishQuiz}
        title="Akhiri Ujian"
        description="Apakah Anda yakin ingin mengakhiri ujian sekarang? Semua jawaban yang sudah diisi akan disimpan."
        confirmText="Akhiri Ujian"
        variant="default"
      />

      <ConfirmModal 
        isOpen={showBackConfirm}
        onClose={() => setShowBackConfirm(false)}
        onConfirm={confirmBack}
        title="Kembali ke Beranda"
        description="Apakah Anda yakin untuk kembali ke beranda? Nilai ujian Anda saat ini akan otomatis tersimpan."
        confirmText="Ya, Kembali"
        cancelText="Tidak, Lanjutkan"
        variant="default"
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack} className="text-slate-500 hover:bg-slate-100">
            <ArrowLeft className="h-4 w-4 mr-2" /> Kembali
          </Button>
          <h1 className="text-xl font-bold text-slate-900 truncate max-w-[200px] sm:max-w-md">{module.title}</h1>
        </div>
        
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono font-bold text-lg shadow-sm border ${
          timeLeft !== null && timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-white text-slate-700 border-slate-200'
        }`}>
          <Clock className="h-5 w-5" />
          {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Question Area */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="shadow-md border-slate-200 rounded-2xl overflow-hidden border-t-4 border-t-blue-600">
            <CardHeader className="bg-white p-8 pb-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">
                    Pertanyaan {currentQuestionIndex + 1}
                  </span>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                  <div 
                    className="prose prose-slate max-w-none text-slate-800 text-lg leading-relaxed font-medium"
                    dangerouslySetInnerHTML={{ __html: currentQuestion.text }} 
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {currentQuestion.options.map((opt, idx) => {
                  const isImageUrl = opt.match(/^https?:\/\/.*\.(jpeg|jpg|gif|png)$/) != null;
                  const isSelected = answers[currentQuestionIndex] === idx;
                  
                  return (
                    <div
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      className={`group p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-center gap-4 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm'
                          : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50 text-slate-700 hover:shadow-sm'
                      }`}
                    >
                      <div className={`w-10 h-10 shrink-0 rounded-xl border-2 flex items-center justify-center text-base font-bold transition-colors ${
                        isSelected 
                          ? 'border-blue-600 text-white bg-blue-600' 
                          : 'border-slate-200 text-slate-400 bg-white group-hover:border-blue-300 group-hover:text-blue-500'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        {isImageUrl ? (
                          <img src={opt} alt={`Option ${idx}`} className="max-h-48 rounded-lg object-contain shadow-sm" />
                        ) : (
                          <span className="font-semibold text-base">{opt}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center">
            <Button 
              variant="outline" 
              onClick={handlePrev} 
              disabled={currentQuestionIndex === 0}
            >
              Sebelumnya
            </Button>
            <Button 
              onClick={handleNext}
              className="px-8"
            >
              {currentQuestionIndex === shuffledQuestions.length - 1 ? 'Selesai Ujian' : 'Selanjutnya'}
            </Button>
          </div>
        </div>

        {/* Question Navigation Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24 shadow-sm border-slate-200">
            <CardHeader className="pb-4 border-b border-slate-100">
              <CardTitle className="text-base">Navigasi Soal</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-5 gap-2">
                {shuffledQuestions.map((_, idx) => {
                  const isAnswered = answers[idx] !== undefined;
                  const isCurrent = currentQuestionIndex === idx;
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`h-10 w-full rounded-md text-sm font-medium transition-colors flex items-center justify-center border ${
                        isCurrent 
                          ? 'border-blue-600 bg-blue-600 text-white shadow-md' 
                          : isAnswered 
                            ? 'border-green-500 bg-green-50 text-green-700' 
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
              
              <div className="mt-6 space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-600 border border-blue-600"></div>
                  <span>Sedang dikerjakan</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-50 border border-green-500"></div>
                  <span>Sudah dijawab</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-white border border-slate-200"></div>
                  <span>Belum dijawab</span>
                </div>
              </div>
              
              <div className="mt-8 pt-4 border-t border-slate-100">
                <Button 
                  variant="danger" 
                  className="w-full"
                  onClick={() => setShowFinishConfirm(true)}
                >
                  Akhiri Ujian
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

