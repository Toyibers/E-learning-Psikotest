import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchModuleById, Module, Question } from '@/src/lib/store';
import { supabase } from '@/src/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { ArrowLeft, Plus, Edit, Trash2, Upload, FileText, X, CheckCircle } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { ConfirmModal } from '@/src/components/ui/ConfirmModal';

export default function AdminModuleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [module, setModule] = useState<Module | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state for question
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correct_answer, setCorrectAnswer] = useState<number>(0);
  
  // Modal state
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  // Import state
  const [isImporting, setIsImporting] = useState(false);
  const [importText, setImportText] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);
  const [isBulkSaving, setIsBulkSaving] = useState(false);

  const loadModule = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await fetchModuleById(id);
      setModule(data);
    } catch (error) {
      console.error('Failed to fetch module:', error);
      navigate('/admin/modules');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadModule();
  }, [id, navigate]);

  if (isLoading && !module) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!module) return null;

  const handleSaveQuestion = async () => {
    const plainText = text.replace(/<[^>]+>/g, '').trim();
    if (!plainText && !text.includes('<img')) {
      setValidationMessage('Mohon lengkapi pertanyaan.');
      return;
    }
    if (options.some(opt => opt.trim() === '')) {
      setValidationMessage('Mohon lengkapi semua opsi jawaban.');
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('questions')
          .update({ text, options, correct_answer })
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('questions')
          .insert([{ module_id: module.id, text, options, correct_answer }]);
        if (error) throw error;
      }
      resetForm();
      loadModule();
    } catch (error) {
      console.error('Failed to save question:', error);
    }
  };

  const confirmDeleteQuestion = async () => {
    if (questionToDelete) {
      try {
        const { error } = await supabase
          .from('questions')
          .delete()
          .eq('id', questionToDelete);
        if (error) throw error;
        setQuestionToDelete(null);
        loadModule();
      } catch (error) {
        console.error('Failed to delete question:', error);
      }
    }
  };

  const startEdit = (q: Question) => {
    setEditingId(q.id);
    setText(q.text);
    setOptions([...q.options]);
    setCorrectAnswer(q.correct_answer);
    setIsAdding(true);
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setText('');
    setOptions(['', '', '', '']);
    setCorrectAnswer(0);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportText(content);
      parseQuestions(content);
    };
    reader.readAsText(file);
  };

  const parseQuestions = (content: string) => {
    const blocks = content.split(/\n\s*\n/);
    const results: any[] = [];

    blocks.forEach(block => {
      if (!block.trim()) return;

      const lines = block.split('\n').map(l => l.trim()).filter(l => l);
      let questionText = '';
      let opts: string[] = ['', '', '', ''];
      let correctAnswer = -1;

      lines.forEach(line => {
        const lowerLine = line.toLowerCase();
        if (lowerLine.startsWith('soal:')) {
          questionText = line.substring(5).trim();
        } else if (lowerLine.startsWith('a.')) {
          opts[0] = line.substring(2).trim();
        } else if (lowerLine.startsWith('b.')) {
          opts[1] = line.substring(2).trim();
        } else if (lowerLine.startsWith('c.')) {
          opts[2] = line.substring(2).trim();
        } else if (lowerLine.startsWith('d.')) {
          opts[3] = line.substring(2).trim();
        } else if (lowerLine.startsWith('jawaban:')) {
          const ans = line.substring(8).trim().toUpperCase();
          if (ans === 'A') correctAnswer = 0;
          else if (ans === 'B') correctAnswer = 1;
          else if (ans === 'C') correctAnswer = 2;
          else if (ans === 'D') correctAnswer = 3;
        }
      });

      if (questionText && opts.every(o => o) && correctAnswer !== -1) {
        results.push({
          module_id: module?.id,
          text: questionText,
          options: opts,
          correct_answer: correctAnswer
        });
      }
    });

    setParsedQuestions(results);
  };

  const handleBulkSave = async () => {
    if (parsedQuestions.length === 0) return;
    setIsBulkSaving(true);
    try {
      const { error } = await supabase
        .from('questions')
        .insert(parsedQuestions);
      
      if (error) throw error;
      
      setIsImporting(false);
      setParsedQuestions([]);
      setImportText('');
      loadModule();
    } catch (error) {
      console.error('Bulk save failed:', error);
      alert('Gagal mengimpor soal. Pastikan format benar.');
    } finally {
      setIsBulkSaving(false);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['image'],
      ['clean']
    ],
  };

  return (
    <div className="space-y-6">
      <ConfirmModal 
        isOpen={!!questionToDelete}
        onClose={() => setQuestionToDelete(null)}
        onConfirm={confirmDeleteQuestion}
        title="Hapus Soal"
        description="Apakah Anda yakin ingin menghapus soal ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
      />
      
      <ConfirmModal 
        isOpen={!!validationMessage}
        onClose={() => setValidationMessage(null)}
        onConfirm={() => setValidationMessage(null)}
        title="Validasi"
        description={validationMessage || ''}
        confirmText="Mengerti"
        cancelText="Tutup"
        variant="default"
      />

      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/modules')} className="text-slate-500">
          <ArrowLeft className="h-4 w-4 mr-2" /> Kembali
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{module.title}</h1>
          <p className="text-sm text-slate-500">{(module.questions?.length || 0)} Soal tersedia</p>
        </div>
      </div>

      {!isAdding && (
        <div className="flex gap-3 mb-6">
          <Button onClick={() => setIsAdding(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Tambah Soal
          </Button>
          <Button onClick={() => setIsImporting(true)} variant="outline" className="gap-2 border-green-600 text-green-600 hover:bg-green-50">
            <Upload className="h-4 w-4" /> Import Soal
          </Button>
        </div>
      )}

      {isImporting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <Card className="w-full max-w-2xl bg-white shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                Import Soal dari .txt
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsImporting(false)}>
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase">Format File .txt:</p>
                <pre className="text-[10px] text-slate-600 font-mono bg-white p-2 rounded border">
{`Soal: 1 + 1 = ?
A. 2
B. 3
C. 4
D. 5
Jawaban: A

Soal: Ibukota Indonesia?
A. Bandung
B. Jakarta
C. Surabaya
D. Medan
Jawaban: B`}
                </pre>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Pilih File .txt</label>
                <Input 
                  type="file" 
                  accept=".txt" 
                  onChange={handleFileUpload}
                  className="cursor-pointer"
                />
              </div>

              {parsedQuestions.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">Preview ({parsedQuestions.length} Soal Terdeteksi)</p>
                    <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                      <CheckCircle className="h-3 w-3" /> Siap diimpor
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto border rounded-md p-3 space-y-4 bg-slate-50">
                    {parsedQuestions.map((q, i) => (
                      <div key={i} className="text-xs border-b pb-2 last:border-0">
                        <p className="font-bold text-slate-800">{i + 1}. {q.text}</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1 text-slate-500">
                          {q.options.map((opt: string, idx: number) => (
                            <p key={idx} className={q.correct_answer === idx ? 'text-green-600 font-bold' : ''}>
                              {String.fromCharCode(65 + idx)}. {opt}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsImporting(false)}>Batal</Button>
                <Button 
                  onClick={handleBulkSave} 
                  disabled={parsedQuestions.length === 0 || isBulkSaving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isBulkSaving ? 'Menyimpan...' : `Import ${parsedQuestions.length} Soal`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {isAdding && (
        <Card className="bg-white border-0 shadow-sm border-l-4 border-l-blue-500 mb-8">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Soal' : 'Tambah Soal Baru'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Pertanyaan</label>
              <div className="bg-white rounded-md">
                <ReactQuill 
                  theme="snow" 
                  value={text} 
                  onChange={setText} 
                  modules={quillModules}
                  className="h-48 mb-12"
                />
              </div>
            </div>
            
            <div className="space-y-3 pt-2">
              <label className="text-sm font-medium text-slate-700">Opsi Jawaban & Kunci</label>
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    name="correct_answer" 
                    checked={correct_answer === idx}
                    onChange={() => setCorrectAnswer(idx)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span className="font-medium text-slate-500 w-6 text-center">{String.fromCharCode(65 + idx)}</span>
                  <Input 
                    value={opt} 
                    onChange={e => handleOptionChange(idx, e.target.value)} 
                    placeholder={`Opsi ${String.fromCharCode(65 + idx)} (Bisa masukkan URL gambar)`}
                    className="flex-1"
                  />
                </div>
              ))}
              <p className="text-xs text-slate-500 mt-2">Pilih radio button untuk menentukan jawaban yang benar.</p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSaveQuestion}>Simpan Soal</Button>
              <Button variant="outline" onClick={resetForm}>Batal</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {(module.questions || []).map((q, index) => (
          <Card key={q.id} className="bg-white border-0 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <span className="text-slate-400 font-medium mt-1">{index + 1}.</span>
                <div 
                  className="prose prose-sm max-w-none text-slate-800"
                  dangerouslySetInnerHTML={{ __html: q.text }} 
                />
              </div>
              <div className="flex gap-1 ml-4 shrink-0">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700" onClick={() => startEdit(q)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setQuestionToDelete(q.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 pl-8">
                {q.options.map((opt, idx) => {
                  const isImageUrl = opt.match(/^https?:\/\/.*\.(jpeg|jpg|gif|png)$/) != null;
                  return (
                    <div 
                      key={idx} 
                      className={`p-3 rounded-lg border text-sm flex items-center gap-3 ${
                        q.correct_answer === idx 
                          ? 'border-green-200 bg-green-50 text-green-800 font-medium' 
                          : 'border-slate-100 bg-slate-50/50 text-slate-600'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        q.correct_answer === idx ? 'bg-green-200 text-green-800' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <div className="overflow-hidden">
                        {isImageUrl ? (
                          <img src={opt} alt={`Option ${idx}`} className="max-h-32 rounded object-contain" />
                        ) : (
                          <span>{opt}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
        {(!module.questions || module.questions.length === 0) && !isAdding && (
          <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
            Belum ada soal dalam modul ini.
          </div>
        )}
      </div>
    </div>
  );
}

