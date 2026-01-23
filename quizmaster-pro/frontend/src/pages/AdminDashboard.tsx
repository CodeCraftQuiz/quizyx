import React, { useState, useEffect } from 'react';
import { Quiz, Advertisement, AdLocation, AdTriggerType, QuizDifficulty, QuestionType, Question } from '../types';
import { api } from '../services/api';


const ASSETS = {
  ads: [
    '/assets/ads/banner_1.jpg',
    '/assets/ads/banner_2.jpg',
    '/assets/ads/banner_3.jpg',
    '/assets/ads/banner_4.jpg',

  ],
};

export const AdminDashboard: React.FC = () => {
  const [tab, setTab] = useState<'quizzes' | 'ads'>('quizzes');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [ads, setAds] = useState<Advertisement[]>([]);
  

  const [isQuizEditorOpen, setIsQuizEditorOpen] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [quizForm, setQuizForm] = useState<Partial<Quiz>>({
    title: '', description: '', difficulty: QuizDifficulty.MEDIUM, type: 'standard', timeLimit: 30, questions: []
  });


  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [adForm, setAdForm] = useState<Partial<Advertisement>>({
      title: '', content: '', location: AdLocation.POPUP, triggerType: AdTriggerType.ON_LOGIN, priority: 1, active: true
  });
  const [adInputType, setAdInputType] = useState<'url' | 'gallery'>('gallery');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
        const q = await api.quizzes.getAll();
        const a = await api.ads.getAll();
        setQuizzes(q || []);
        setAds(a || []);
    } catch (err) {
        console.error("Błąd ładowania danych:", err);
    }
  };

  // --- IMPORT / EXPORT ---
  const handleExport = () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(quizzes));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "quizzes_export.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = async (event) => {
          try {
              const importedQuizzes = JSON.parse(event.target?.result as string);
              if (Array.isArray(importedQuizzes)) {
                  await api.quizzes.import(importedQuizzes);
                  loadData();
                  alert("Import zakończony sukcesem!");
              } else {
                  alert("Nieprawidłowy format JSON. Oczekiwano tablicy quizów.");
              }
          } catch (err) {
              alert("Błąd parsowania pliku JSON");
          }
      };
      reader.readAsText(file);
  };

  // --- QUIZ HANDLERS ---
  const handleOpenQuizEditor = (quiz?: Quiz) => {
    if (quiz) {
      setEditingQuizId(quiz._id);
      setQuizForm(JSON.parse(JSON.stringify(quiz)));
    } else {
      setEditingQuizId(null);
      setQuizForm({ 
        title: '', 
        description: '', 
        difficulty: QuizDifficulty.MEDIUM, 
        type: 'standard', 
        timeLimit: 30, 
        questions: [] 
      });
    }
    setIsQuizEditorOpen(true);
  };

  const handleSaveQuiz = async () => {
    if (!quizForm.title) return alert("Tytuł jest wymagany");
    if (!quizForm.questions || quizForm.questions.length === 0) return alert("Proszę dodać przynajmniej jedno pytanie.");

    for (let i = 0; i < quizForm.questions.length; i++) {
        const q = quizForm.questions[i];
        if (!q.content) return alert(`Pytanie ${i+1} nie może być puste.`);
        if (q.answers.length < 2) return alert(`Pytanie ${i+1} musi mieć co najmniej 2 odpowiedzi.`);
        if (q.correctAnswers.length === 0) return alert(`Pytanie ${i+1} musi mieć zaznaczoną przynajmniej jedną poprawną odpowiedź.`);
    }

    setIsSaving(true);
    try {
        if (editingQuizId) {
            await api.quizzes.update(editingQuizId, quizForm);
        } else {
            await api.quizzes.create(quizForm as Quiz);
        }
        setIsQuizEditorOpen(false);
        loadData();
        alert("Quiz zapisany pomyślnie!");
    } catch (err: any) {
        alert("Błąd zapisu: " + (err.message || "Nieznany błąd serwera"));
    } finally {
        setIsSaving(false);
    }
  };

  // --- QUESTION EDITOR HANDLERS ---
  const addQuestion = () => {
      const newQuestion: Question = {
          content: '',
          answers: ['', ''],
          correctAnswers: [0],
          type: QuestionType.SINGLE
      };
      setQuizForm(prev => ({ ...prev, questions: [...(prev.questions || []), newQuestion] }));
  };

  const removeQuestion = (index: number) => {
      const newQuestions = [...(quizForm.questions || [])];
      newQuestions.splice(index, 1);
      setQuizForm(prev => ({ ...prev, questions: newQuestions }));
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
      const newQuestions = [...(quizForm.questions || [])];
      newQuestions[index] = { ...newQuestions[index], [field]: value };
      
      if (field === 'type' && value === QuestionType.SINGLE && newQuestions[index].correctAnswers.length > 1) {
          newQuestions[index].correctAnswers = [newQuestions[index].correctAnswers[0]];
      }
      setQuizForm(prev => ({ ...prev, questions: newQuestions }));
  };

  const updateAnswerText = (qIndex: number, aIndex: number, text: string) => {
      const newQuestions = [...(quizForm.questions || [])];
      newQuestions[qIndex].answers[aIndex] = text;
      setQuizForm(prev => ({ ...prev, questions: newQuestions }));
  };

  const addAnswerSlot = (qIndex: number) => {
      const newQuestions = [...(quizForm.questions || [])];
      newQuestions[qIndex].answers.push('');
      setQuizForm(prev => ({ ...prev, questions: newQuestions }));
  };

  const removeAnswerSlot = (qIndex: number, aIndex: number) => {
      const newQuestions = [...(quizForm.questions || [])];
      const q = newQuestions[qIndex];
      if (q.answers.length <= 2) return alert("Pytanie musi mieć co najmniej 2 odpowiedzi.");
      
      q.answers.splice(aIndex, 1);
      q.correctAnswers = q.correctAnswers
        .filter(idx => idx !== aIndex)
        .map(idx => idx > aIndex ? idx - 1 : idx);
      
      if (q.correctAnswers.length === 0) q.correctAnswers = [0];
      
      setQuizForm(prev => ({ ...prev, questions: newQuestions }));
  };

  const toggleCorrectAnswer = (qIndex: number, aIndex: number) => {
      const newQuestions = [...(quizForm.questions || [])];
      const question = newQuestions[qIndex];
      const isSelected = question.correctAnswers.includes(aIndex);

      if (question.type === QuestionType.SINGLE) {
          question.correctAnswers = [aIndex];
      } else {
          if (isSelected) {
              if (question.correctAnswers.length > 1) {
                  question.correctAnswers = question.correctAnswers.filter(i => i !== aIndex);
              }
          } else {
              question.correctAnswers.push(aIndex);
          }
      }
      setQuizForm(prev => ({ ...prev, questions: newQuestions }));
  };

  // --- AD HANDLERS ---
  const handleEditAd = (ad: Advertisement) => {
      setEditingAdId(ad._id);
      setAdForm({ ...ad });
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveAd = async () => {
    if (!adForm.title || !adForm.content) return alert("Tytuł i treść reklamy są wymagane.");
    try {
        if (editingAdId) {
            await api.ads.update(editingAdId, adForm);
        } else {
            await api.ads.create(adForm as Advertisement);
        }
        loadData();
        resetAdForm();
        alert("Reklama zapisana!");
    } catch (err) {
        alert("Błąd zapisu reklamy.");
    }
  };

  const resetAdForm = () => {
      setEditingAdId(null);
      setAdForm({ title: '', content: '', location: AdLocation.POPUP, triggerType: AdTriggerType.ON_LOGIN, priority: 1, active: true });
  };

  const handleDeleteAd = async (id: string) => {
      if(window.confirm('Usunąć tę reklamę?')) {
        await api.ads.delete(id);
        loadData();
      }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-white tracking-tighter italic uppercase">Centrum Dowodzenia</h1>
      
      <div className="flex border-b border-white/10 mb-8">
        <button className={`px-8 py-3 font-black text-xs uppercase tracking-widest transition-all ${tab === 'quizzes' ? 'border-b-4 border-primary text-primary' : 'text-white/40 hover:text-white'}`} onClick={() => setTab('quizzes')}>Baza Quizów</button>
        <button className={`px-8 py-3 font-black text-xs uppercase tracking-widest transition-all ${tab === 'ads' ? 'border-b-4 border-primary text-primary' : 'text-white/40 hover:text-white'}`} onClick={() => setTab('ads')}>System Reklam</button>
      </div>

      {tab === 'quizzes' && (
          <div>
            {!isQuizEditorOpen ? (
                <div className="animate-pop-in">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                        <h2 className="text-xl font-black text-white italic uppercase">Zarządzanie Wyzwaniami</h2>
                        <div className="flex flex-wrap gap-3">
                             <label className="bg-white/5 border border-white/10 text-white/60 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-white/10 transition-all">
                                Import JSON <input type="file" className="hidden" accept=".json" onChange={handleImport} />
                             </label>
                             <button onClick={handleExport} className="bg-white/5 border border-white/10 text-white/60 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Eksport</button>
                             <button onClick={() => handleOpenQuizEditor()} className="bg-primary text-white px-8 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-fuchsia hover:bg-primaryHover transition-all">Nowe Wyzwanie</button>
                        </div>
                    </div>
                    <div className="bg-surface rounded-quizyx shadow-quizyx border border-white/5 overflow-hidden">
                        <table className="min-w-full divide-y divide-white/5">
                            <thead className="bg-dark/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-white/40 uppercase tracking-widest italic">Tytuł</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-white/40 uppercase tracking-widest italic">Tryb</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-white/40 uppercase tracking-widest italic">Poziom</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-white/40 uppercase tracking-widest italic">Pytania</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-white/40 uppercase tracking-widest italic">Akcje</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {quizzes.map(q => (
                                    <tr key={q._id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-5 font-black text-white italic">{q.title}</td>
                                        <td className="px-6 py-5"><span className="text-[10px] font-black uppercase text-primary tracking-widest">{q.type}</span></td>
                                        <td className="px-6 py-5"><span className="text-[10px] font-black uppercase text-white/40 tracking-widest">{q.difficulty}</span></td>
                                        <td className="px-6 py-5 font-mono text-xs text-white/60">{q.questions.length}</td>
                                        <td className="px-6 py-5 text-right">
                                            <button onClick={() => handleOpenQuizEditor(q)} className="text-primary hover:text-white text-[10px] font-black uppercase tracking-widest mr-6 transition-colors">Edytuj</button>
                                            <button className="text-red-500 hover:text-red-400 text-[10px] font-black uppercase tracking-widest transition-colors" onClick={() => { if(window.confirm('Usunąć trwale to wyzwanie?')) api.quizzes.delete(q._id).then(loadData) }}>Usuń</button>
                                        </td>
                                    </tr>
                                ))}
                                {quizzes.length === 0 && (
                                    <tr><td colSpan={5} className="p-20 text-center text-white/10 font-black uppercase tracking-widest italic">Baza wyzwań jest pusta</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-surface p-10 rounded-quizyx-lg shadow-quizyx border border-white/5 max-w-5xl mx-auto animate-pop-in">
                    <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
                        <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">{editingQuizId ? 'Modyfikacja Parametrów' : 'Inicjalizacja Nowego Wyzwania'}</h2>
                        <button onClick={() => setIsQuizEditorOpen(false)} className="text-white/20 hover:text-red-500 font-black uppercase text-[10px] tracking-widest transition-colors">Przerwij</button>
                    </div>
                    
                    {/* General Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 p-8 bg-dark/40 rounded-quizyx border border-white/5 shadow-inner">
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-3 italic">Tytuł Wyzwania</label>
                            <input type="text" className="w-full bg-dark/50 border border-white/10 rounded-quizyx p-4 text-white font-black outline-none focus:border-primary transition-all" 
                                value={quizForm.title} onChange={e => setQuizForm({...quizForm, title: e.target.value})} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-3 italic">Instrukcje / Opis</label>
                            <textarea className="w-full bg-dark/50 border border-white/10 rounded-quizyx p-4 text-white font-black outline-none focus:border-primary transition-all h-24" 
                                value={quizForm.description || ''} onChange={e => setQuizForm({...quizForm, description: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-3 italic">Poziom Zagrożenia</label>
                            <select className="w-full bg-dark/50 border border-white/10 rounded-quizyx p-4 text-white font-black outline-none focus:border-primary transition-all"
                                value={quizForm.difficulty} onChange={e => setQuizForm({...quizForm, difficulty: e.target.value as QuizDifficulty})}>
                                {Object.values(QuizDifficulty).map(d => <option key={d} value={d} className="bg-dark text-white uppercase">{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-3 italic">Protokół Gry (Tryb)</label>
                            <select className="w-full bg-dark/50 border border-white/10 rounded-quizyx p-4 text-white font-black outline-none focus:border-primary transition-all"
                                value={quizForm.type} onChange={e => setQuizForm({...quizForm, type: e.target.value as any})}>
                                {['standard', 'exam', 'infinity', 'duel', 'millionaire', 'money_drop'].map(t => <option key={t} value={t} className="bg-dark text-white uppercase">{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-3 italic">Limit Systemowy (sekundy)</label>
                            <input type="number" className="w-full bg-dark/50 border border-white/10 rounded-quizyx p-4 text-white font-black outline-none focus:border-primary transition-all" 
                                value={quizForm.timeLimit || 0} onChange={e => setQuizForm({...quizForm, timeLimit: parseInt(e.target.value)})} />
                        </div>
                    </div>

                    {/* Question Editor */}
                    <div className="mb-10">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black text-white italic uppercase">Baza Pytań ({quizForm.questions?.length})</h3>
                        </div>
                        {quizForm.questions?.map((q, qIdx) => (
                            <div key={qIdx} className="border border-white/5 rounded-quizyx p-8 mb-6 relative bg-dark/20 group hover:border-primary/20 transition-all">
                                <button onClick={() => removeQuestion(qIdx)} className="absolute top-6 right-6 text-red-500/40 hover:text-red-500 transition-colors">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                                <div className="mb-6 pr-12">
                                    <label className="block text-[10px] font-black text-white/20 uppercase tracking-widest mb-3 italic">Treść Pytania {qIdx + 1}</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-white/5 border border-white/5 rounded-xl p-4 text-white font-black italic outline-none focus:border-primary transition-all text-lg"
                                        placeholder="np. Kto zaprojektował system Matrix?"
                                        value={q.content} 
                                        onChange={(e) => updateQuestion(qIdx, 'content', e.target.value)} 
                                    />
                                </div>
                                <div className="mb-8">
                                    <label className="block text-[10px] font-black text-white/20 uppercase tracking-widest mb-3 italic">Typ Selekcji</label>
                                    <div className="flex gap-4">
                                        <button onClick={() => updateQuestion(qIdx, 'type', QuestionType.SINGLE)}
                                                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${q.type === QuestionType.SINGLE ? 'bg-primary text-white shadow-fuchsia' : 'bg-white/5 text-white/30'}`}>
                                            Pojedynczy
                                        </button>
                                        <button onClick={() => updateQuestion(qIdx, 'type', QuestionType.MULTI)}
                                                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${q.type === QuestionType.MULTI ? 'bg-primary text-white shadow-fuchsia' : 'bg-white/5 text-white/30'}`}>
                                            Wielokrotny
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-white/20 uppercase tracking-widest mb-2 italic">Opcje Odpowiedzi (Zaznacz kluczowe)</label>
                                    {q.answers.map((ans, aIdx) => (
                                        <div key={aIdx} className="flex items-center gap-4 group/ans">
                                            <button 
                                                onClick={() => toggleCorrectAnswer(qIdx, aIdx)}
                                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${q.correctAnswers.includes(aIdx) ? 'bg-primary text-white shadow-fuchsia' : 'bg-white/5 text-white/10 hover:text-white/30'}`}
                                            >
                                                {q.correctAnswers.includes(aIdx) ? <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> : aIdx + 1}
                                            </button>
                                            <input 
                                                type="text" 
                                                className="flex-1 bg-white/5 border border-white/5 rounded-xl p-4 text-white font-black text-sm outline-none focus:border-primary transition-all"
                                                value={ans}
                                                onChange={(e) => updateAnswerText(qIdx, aIdx, e.target.value)}
                                                placeholder={`Wpisz treść opcji ${aIdx + 1}...`}
                                            />
                                            <button onClick={() => removeAnswerSlot(qIdx, aIdx)} className="text-white/10 hover:text-red-500 transition-colors p-2 opacity-0 group-hover/ans:opacity-100">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    ))}
                                    <button onClick={() => addAnswerSlot(qIdx)} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline mt-4">+ Dodaj opcję do wyboru</button>
                                </div>
                            </div>
                        ))}
                        <button onClick={addQuestion} className="w-full py-6 border-2 border-dashed border-white/5 rounded-quizyx text-white/20 font-black uppercase tracking-[0.4em] italic hover:border-primary hover:text-primary transition-all bg-white/2 hover:bg-primary/5">
                            + Dodaj Nowy Wpis do Bazy +
                        </button>
                    </div>

                    <div className="pt-8 flex flex-col md:flex-row gap-4 border-t border-white/5">
                        <button onClick={handleSaveQuiz} disabled={isSaving}
                                className={`flex-1 py-6 bg-primary text-white font-black rounded-quizyx shadow-fuchsia uppercase italic tracking-widest text-lg active:scale-95 transition-all ${isSaving ? 'opacity-50 animate-pulse' : 'hover:bg-primaryHover'}`}>
                            {isSaving ? 'Synchronizacja Danych...' : (editingQuizId ? 'Zaktualizuj Protokół' : 'Wytwórz Wyzwanie')}
                        </button>
                        <button onClick={() => setIsQuizEditorOpen(false)} className="px-12 py-6 bg-white/5 text-white/40 font-black rounded-quizyx uppercase text-xs tracking-widest italic hover:bg-white/10 transition-colors">
                            Anuluj
                        </button>
                    </div>
                </div>
            )}
          </div>
      )}

      {tab === 'ads' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-pop-in">
              <div className="lg:col-span-1 bg-surface p-8 rounded-quizyx shadow-quizyx border border-white/5 h-fit sticky top-28">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="font-black text-white italic uppercase tracking-widest">{editingAdId ? 'Modyfikacja Transmisji' : 'Nowa Kampania'}</h3>
                    {editingAdId && <button onClick={resetAdForm} className="text-[10px] text-white/20 font-black uppercase hover:text-red-500 transition-colors">Przerwij</button>}
                  </div>
                  <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-black text-white/20 uppercase mb-2 block italic">Identyfikator</label>
                        <input type="text" placeholder="Tytuł" className="w-full bg-dark/50 border border-white/10 rounded-xl p-4 text-white font-black outline-none focus:border-primary transition-all"
                            value={adForm.title} onChange={e => setAdForm({...adForm, title: e.target.value})} />
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-white/20 uppercase mb-2 block italic">Matryca Obrazu</label>
                        <div className="flex gap-2 text-[8px] font-black uppercase mb-3">
                            <button className={`flex-1 py-2 rounded-full border transition-all ${adInputType === 'gallery' ? 'bg-primary border-primary text-white' : 'border-white/10 text-white/30'}`}
                                onClick={() => setAdInputType('gallery')}>Folder</button>
                            <button className={`flex-1 py-2 rounded-full border transition-all ${adInputType === 'url' ? 'bg-primary border-primary text-white' : 'border-white/10 text-white/30'}`}
                                onClick={() => setAdInputType('url')}>Link</button>
                        </div>

                        {adInputType === 'url' ? (
                            <input type="text" placeholder="https://..." className="w-full bg-dark/50 border border-white/10 rounded-xl p-4 text-white text-xs outline-none focus:border-primary transition-all"
                                value={adForm.content} onChange={e => setAdForm({...adForm, content: e.target.value})} />
                        ) : (
                            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-white/5 p-2 rounded-xl bg-dark/20">
                                {ASSETS.ads.map((url, idx) => (
                                    <img key={idx} src={url} alt={`Ad option ${idx + 1}`} 
                                         className={`w-full h-16 object-cover cursor-pointer border-4 rounded-lg transition-all ${adForm.content === url ? 'border-primary scale-95 shadow-fuchsia' : 'border-transparent opacity-40 hover:opacity-100'}`}
                                         onClick={() => setAdForm({...adForm, content: url})} />
                                ))}
                            </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-white/20 uppercase mb-2 block italic">Pozycja</label>
                            <select className="w-full bg-dark/50 border border-white/10 rounded-xl p-4 text-white font-black text-xs outline-none focus:border-primary transition-all"
                                value={adForm.location} onChange={e => setAdForm({...adForm, location: e.target.value as AdLocation})}>
                                {Object.values(AdLocation).map(l => <option key={l} value={l} className="bg-dark text-white">{l}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-white/20 uppercase mb-2 block italic">Wyzwalacz</label>
                            <select className="w-full bg-dark/50 border border-white/10 rounded-xl p-4 text-white font-black text-xs outline-none focus:border-primary transition-all"
                                value={adForm.triggerType} onChange={e => setAdForm({...adForm, triggerType: e.target.value as AdTriggerType})}>
                                {Object.values(AdTriggerType).map(t => <option key={t} value={t} className="bg-dark text-white">{t}</option>)}
                            </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-white/20 uppercase mb-2 block italic">Priorytet Pasma</label>
                        <input type="number" className="w-full bg-dark/50 border border-white/10 rounded-xl p-4 text-white font-black outline-none focus:border-primary transition-all"
                            value={adForm.priority} onChange={e => setAdForm({...adForm, priority: parseInt(e.target.value)})} />
                      </div>

                      <div className="flex items-center gap-4 bg-dark/40 p-4 rounded-xl border border-white/5">
                        <input type="checkbox" id="ad_active" checked={adForm.active} onChange={e => setAdForm({...adForm, active: e.target.checked})} className="w-5 h-5 accent-primary" />
                        <label htmlFor="ad_active" className="text-[10px] font-black text-white/60 uppercase tracking-widest cursor-pointer italic">Strumień aktywny</label>
                      </div>

                      <button onClick={handleSaveAd} className="w-full bg-primary text-white py-6 rounded-quizyx font-black uppercase italic tracking-[0.2em] shadow-fuchsia hover:bg-primaryHover transition-all active:scale-95 text-xs">
                          {editingAdId ? 'Aktualizuj Transmisję' : 'Zatwierdź Kampanię'}
                      </button>
                  </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                  <h3 className="text-xl font-black text-white italic uppercase tracking-widest">Aktywne Kanały Reklamowe</h3>
                  {ads.map(ad => (
                      <div key={ad._id} className={`bg-surface p-6 rounded-quizyx shadow-quizyx flex justify-between items-center border-l-8 transition-all hover:translate-x-2 ${ad.active ? 'border-primary shadow-fuchsia' : 'border-white/10 opacity-40 grayscale'} ${editingAdId === ad._id ? 'scale-[1.02] border-primaryHover' : ''}`}>
                          <div className="flex items-center gap-6">
                              <img src={ad.content} className="w-16 h-16 rounded-xl object-cover shadow-lg border border-white/10" alt="ad" />
                              <div>
                                  <h4 className="font-black text-white text-lg italic tracking-tight uppercase leading-none">{ad.title}</h4>
                                  <p className="text-[9px] text-white/30 font-black uppercase tracking-widest mt-2">{ad.location} • {ad.triggerType} • Prio: {ad.priority}</p>
                              </div>
                          </div>
                          <div className="flex gap-6">
                            <button onClick={() => handleEditAd(ad)} className="text-primary hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors italic">Koryguj</button>
                            <button onClick={() => handleDeleteAd(ad._id)} className="text-red-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors italic">Kasuj</button>
                          </div>
                      </div>
                  ))}
                  {ads.length === 0 && (
                      <div className="p-32 text-center text-white/10 font-black uppercase tracking-widest italic">System reklam nieaktywny</div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};