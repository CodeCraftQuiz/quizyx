import React, { useState, useEffect } from 'react';
import { Quiz, Advertisement, AdLocation, AdTriggerType, QuizDifficulty, QuestionType, Question } from '../types';
import { api, ASSETS } from '../services/api';

export const AdminDashboard: React.FC = () => {
  const [tab, setTab] = useState<'quizzes' | 'ads'>('quizzes');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [ads, setAds] = useState<Advertisement[]>([]);
  
  // Quiz Edit/Create State
  const [isQuizEditorOpen, setIsQuizEditorOpen] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [quizForm, setQuizForm] = useState<Partial<Quiz>>({
    title: '', description: '', difficulty: QuizDifficulty.MEDIUM, type: 'standard', timeLimit: 0, questions: []
  });

  // Ad Form State
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [adForm, setAdForm] = useState<Partial<Advertisement>>({
      title: '', content: '', location: AdLocation.POPUP, triggerType: AdTriggerType.ON_LOGIN, priority: 1, active: true
  });
  const [adInputType, setAdInputType] = useState<'url' | 'gallery'>('gallery');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const q = await api.quizzes.getAll();
    const a = await api.ads.getAll();
    setQuizzes(q);
    setAds(a);
  };

  // --- IMPORT / EXPORT ---
  const handleExport = () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(quizzes, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "quizzes_export.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const handleDownloadTemplate = () => {
      const template = [
          {
            title: "Przykładowy Quiz (Szablon)",
            description: "To jest przykładowy format pliku do importu.",
            difficulty: "medium",
            type: "standard",
            timeLimit: 60,
            questions: [
              {
                content: "Jakie jest stolica Polski?",
                answers: ["Kraków", "Warszawa", "Gdańsk", "Poznań"],
                correctAnswers: [1],
                type: "single"
              },
              {
                content: "Które liczby są parzyste? (Wielokrotny wybór)",
                answers: ["1", "2", "3", "4"],
                correctAnswers: [1, 3],
                type: "multi"
              }
            ]
          }
      ];
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(template, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "quiz_template.json");
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
      // Reset input value so same file can be selected again if needed
      e.target.value = ''; 
  };

  // --- QUIZ HANDLERS ---
  const handleOpenQuizEditor = (quiz?: Quiz) => {
    if (quiz) {
      setEditingQuizId(quiz._id);
      setQuizForm(JSON.parse(JSON.stringify(quiz)));
    } else {
      setEditingQuizId(null);
      setQuizForm({ title: '', description: '', difficulty: QuizDifficulty.MEDIUM, type: 'standard', timeLimit: 60, questions: [] });
    }
    setIsQuizEditorOpen(true);
  };

  const handleSaveQuiz = async () => {
    if (!quizForm.title) return alert("Tytuł jest wymagany");
    if (!quizForm.questions || quizForm.questions.length === 0) return alert("Proszę dodać przynajmniej jedno pytanie.");

    // Validate questions
    for (let i = 0; i < quizForm.questions.length; i++) {
        const q = quizForm.questions[i];
        if (!q.content) return alert(`Pytanie ${i+1} nie może być puste.`);
        if (q.answers.length < 2) return alert(`Pytanie ${i+1} musi mieć co najmniej 2 odpowiedzi.`);
        if (q.correctAnswers.length === 0) return alert(`Pytanie ${i+1} musi mieć zaznaczoną poprawną odpowiedź.`);
    }

    if (editingQuizId) {
      await api.quizzes.update(editingQuizId, quizForm);
    } else {
      await api.quizzes.create(quizForm as Quiz);
    }
    setIsQuizEditorOpen(false);
    loadData();
  };

  // --- QUESTION EDITOR HANDLERS ---
  const addQuestion = () => {
      const newQuestion: Question = {
          content: '',
          answers: ['', ''],
          correctAnswers: [],
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
      newQuestions[qIndex].answers.splice(aIndex, 1);
      newQuestions[qIndex].correctAnswers = newQuestions[qIndex].correctAnswers
        .filter(idx => idx !== aIndex)
        .map(idx => idx > aIndex ? idx - 1 : idx);
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
              question.correctAnswers = question.correctAnswers.filter(i => i !== aIndex);
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
    if (adForm.title && adForm.content) {
        if (editingAdId) {
            await api.ads.update(editingAdId, adForm);
        } else {
            await api.ads.create(adForm as Advertisement);
        }
        loadData();
        resetAdForm();
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
      <h1 className="text-3xl font-bold mb-8">Panel Administratora</h1>
      
      <div className="flex border-b mb-6">
        <button className={`px-4 py-2 ${tab === 'quizzes' ? 'border-b-2 border-primary font-bold' : ''}`} onClick={() => setTab('quizzes')}>Quizy</button>
        <button className={`px-4 py-2 ${tab === 'ads' ? 'border-b-2 border-primary font-bold' : ''}`} onClick={() => setTab('ads')}>System Reklam</button>
      </div>

      {tab === 'quizzes' && (
          <div>
            {!isQuizEditorOpen ? (
                <>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <h2 className="text-xl font-bold">Zarządzaj Quizami</h2>
                        <div className="flex flex-wrap items-center gap-2">
                             <button onClick={handleDownloadTemplate} className="text-sm text-blue-600 underline px-2 hover:text-blue-800 font-medium">
                                 Pobierz Wzór JSON
                             </button>
                             <label className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 rounded cursor-pointer hover:bg-gray-200 transition flex items-center shadow-sm">
                                <span className="mr-2">📂</span> Import JSON 
                                <input type="file" className="hidden" accept=".json" onChange={handleImport} />
                             </label>
                             <button onClick={handleExport} className="bg-blue-100 text-blue-700 px-4 py-2 rounded hover:bg-blue-200 transition shadow-sm font-medium">
                                 Eksportuj
                             </button>
                             <button onClick={() => handleOpenQuizEditor()} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition shadow-md font-bold">
                                + Nowy Quiz
                             </button>
                        </div>
                    </div>
                    <div className="bg-white shadow rounded overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tytuł</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Typ</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trudność</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pytania</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Akcje</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {quizzes.map(q => (
                                    <tr key={q._id}>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium">{q.title}</td>
                                        <td className="px-6 py-4 whitespace-nowrap uppercase">{q.type}</td>
                                        <td className="px-6 py-4 whitespace-nowrap uppercase">{q.difficulty}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{q.questions.length}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button onClick={() => handleOpenQuizEditor(q)} className="text-blue-600 hover:text-blue-900 mr-4 font-bold">Edytuj</button>
                                            <button className="text-red-600 hover:text-red-900" onClick={() => { if(window.confirm('Usunąć?')) api.quizzes.delete(q._id).then(loadData) }}>Usuń</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {quizzes.length === 0 && <div className="p-8 text-center text-gray-500">Brak quizów. Dodaj nowy lub zaimportuj.</div>}
                    </div>
                </>
            ) : (
                <div className="bg-white p-6 rounded shadow max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">{editingQuizId ? 'Edytuj Quiz' : 'Stwórz Nowy Quiz'}</h2>
                        <button onClick={() => setIsQuizEditorOpen(false)} className="text-gray-500 hover:text-gray-700">Anuluj</button>
                    </div>
                    
                    {/* General Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded border">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Tytuł</label>
                            <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md p-2" 
                                value={quizForm.title} onChange={e => setQuizForm({...quizForm, title: e.target.value})} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Opis</label>
                            <textarea className="mt-1 block w-full border border-gray-300 rounded-md p-2" 
                                value={quizForm.description || ''} onChange={e => setQuizForm({...quizForm, description: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Poziom Trudności</label>
                            <select className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                value={quizForm.difficulty} onChange={e => setQuizForm({...quizForm, difficulty: e.target.value as QuizDifficulty})}>
                                {Object.values(QuizDifficulty).map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Typ (Tryb)</label>
                            <select className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                value={quizForm.type} onChange={e => setQuizForm({...quizForm, type: e.target.value as any})}>
                                {['standard', 'exam', 'infinity', 'duel', 'millionaire'].map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Limit Czasu (sekundy)</label>
                            <input type="number" className="mt-1 block w-full border border-gray-300 rounded-md p-2" 
                                value={quizForm.timeLimit || 0} onChange={e => setQuizForm({...quizForm, timeLimit: parseInt(e.target.value)})} />
                        </div>
                    </div>

                    {/* Question Editor */}
                    <div className="mb-6">
                        <h3 className="text-xl font-bold mb-4">Pytania</h3>
                        {quizForm.questions?.map((q, qIdx) => (
                            <div key={qIdx} className="border border-gray-200 rounded-lg p-4 mb-4 relative bg-gray-50">
                                <button onClick={() => removeQuestion(qIdx)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm">
                                    Usuń Pytanie
                                </button>
                                <div className="mb-4 pr-10">
                                    <label className="block text-sm font-medium text-gray-700">Treść pytania</label>
                                    <input 
                                        type="text" 
                                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                        placeholder="np. Ile to jest 2 + 2?"
                                        value={q.content} 
                                        onChange={(e) => updateQuestion(qIdx, 'content', e.target.value)} 
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Typ</label>
                                    <select 
                                        className="mt-1 block w-40 border border-gray-300 rounded-md p-1 text-sm"
                                        value={q.type} 
                                        onChange={(e) => updateQuestion(qIdx, 'type', e.target.value)}
                                    >
                                        <option value={QuestionType.SINGLE}>Jednokrotny wybór</option>
                                        <option value={QuestionType.MULTI}>Wielokrotny wybór</option>
                                    </select>
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Odpowiedzi (Zaznacz poprawną)</label>
                                    {q.answers.map((ans, aIdx) => (
                                        <div key={aIdx} className="flex items-center space-x-2">
                                            <input 
                                                type="checkbox" 
                                                className="h-5 w-5 text-blue-600"
                                                checked={q.correctAnswers.includes(aIdx)}
                                                onChange={() => toggleCorrectAnswer(qIdx, aIdx)}
                                            />
                                            <input 
                                                type="text" 
                                                className="flex-1 border border-gray-300 rounded-md p-2 text-sm"
                                                value={ans}
                                                onChange={(e) => updateAnswerText(qIdx, aIdx, e.target.value)}
                                                placeholder={`Odpowiedź ${aIdx + 1}`}
                                            />
                                            <button onClick={() => removeAnswerSlot(qIdx, aIdx)} className="text-red-400 hover:text-red-600 px-2">X</button>
                                        </div>
                                    ))}
                                    <button onClick={() => addAnswerSlot(qIdx)} className="text-sm text-blue-600 font-medium hover:underline">+ Dodaj opcję odpowiedzi</button>
                                </div>
                            </div>
                        ))}
                        <button onClick={addQuestion} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary hover:text-primary transition">
                            + Dodaj Nowe Pytanie
                        </button>
                    </div>

                    <div className="pt-4 flex justify-end space-x-3 border-t">
                        <button onClick={() => setIsQuizEditorOpen(false)} className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">Anuluj</button>
                        <button onClick={handleSaveQuiz} className="px-4 py-2 bg-primary text-white rounded hover:bg-blue-700 font-bold">
                            {editingQuizId ? 'Zaktualizuj Quiz' : 'Utwórz Quiz'}
                        </button>
                    </div>
                </div>
            )}
          </div>
      )}

      {tab === 'ads' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 bg-white p-6 rounded shadow h-fit sticky top-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">{editingAdId ? 'Edytuj Reklamę' : 'Dodaj Nową Reklamę'}</h3>
                    {editingAdId && <button onClick={resetAdForm} className="text-sm text-gray-500 underline">Anuluj Edycję</button>}
                  </div>
                  <div className="space-y-4">
                      <input 
                        type="text" placeholder="Tytuł" className="w-full border p-2 rounded"
                        value={adForm.title} onChange={e => setAdForm({...adForm, title: e.target.value})}
                      />

                      {/* Content Selection Toggle */}
                      <div className="flex space-x-2 text-sm">
                          <button 
                            className={`flex-1 py-1 rounded ${adInputType === 'gallery' ? 'bg-blue-100 text-blue-700 font-bold' : 'bg-gray-100'}`}
                            onClick={() => setAdInputType('gallery')}
                          >
                              Folder Zdjęć
                          </button>
                          <button 
                            className={`flex-1 py-1 rounded ${adInputType === 'url' ? 'bg-blue-100 text-blue-700 font-bold' : 'bg-gray-100'}`}
                            onClick={() => setAdInputType('url')}
                          >
                              Wpisz URL
                          </button>
                      </div>

                      {adInputType === 'url' ? (
                          <input 
                            type="text" placeholder="Treść lub URL Obrazka" className="w-full border p-2 rounded"
                            value={adForm.content} onChange={e => setAdForm({...adForm, content: e.target.value})}
                          />
                      ) : (
                          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border p-2 rounded">
                              {ASSETS.ads.map((url, idx) => (
                                  <img 
                                    key={idx} 
                                    src={url} 
                                    alt="Ad Option" 
                                    className={`w-full h-16 object-cover cursor-pointer border-2 rounded ${adForm.content === url ? 'border-primary' : 'border-transparent'}`}
                                    onClick={() => setAdForm({...adForm, content: url})}
                                  />
                              ))}
                          </div>
                      )}
                      {adInputType === 'gallery' && adForm.content && (
                          <p className="text-xs text-gray-500 break-all">Wybrano: {adForm.content}</p>
                      )}

                      <select 
                        className="w-full border p-2 rounded"
                        value={adForm.location} onChange={e => setAdForm({...adForm, location: e.target.value as AdLocation})}
                      >
                          {Object.values(AdLocation).map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                      <select 
                        className="w-full border p-2 rounded"
                        value={adForm.triggerType} onChange={e => setAdForm({...adForm, triggerType: e.target.value as AdTriggerType})}
                      >
                          {Object.values(AdTriggerType).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <input 
                        type="number" placeholder="Priorytet (Wyższy = ważniejszy)" className="w-full border p-2 rounded"
                        value={adForm.priority} onChange={e => setAdForm({...adForm, priority: parseInt(e.target.value)})}
                      />
                      <label className="flex items-center space-x-2">
                          <input type="checkbox" checked={adForm.active} onChange={e => setAdForm({...adForm, active: e.target.checked})} />
                          <span>Aktywna</span>
                      </label>
                      <button onClick={handleSaveAd} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                          {editingAdId ? 'Zaktualizuj Reklamę' : 'Utwórz Reklamę'}
                      </button>
                  </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                  <h3 className="font-bold text-lg">Aktywne Kampanie</h3>
                  {ads.map(ad => (
                      <div key={ad._id} className={`bg-white p-4 rounded shadow flex justify-between items-center border-l-4 ${editingAdId === ad._id ? 'border-yellow-500 bg-yellow-50' : 'border-blue-500'}`}>
                          <div>
                              <h4 className="font-bold">{ad.title}</h4>
                              <p className="text-sm text-gray-600">{ad.location} • {ad.triggerType} • Priorytet: {ad.priority}</p>
                              <div className="mt-1">
                                  <span className={`px-2 py-0.5 text-xs rounded ${ad.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                      {ad.active ? 'Aktywna' : 'Nieaktywna'}
                                  </span>
                              </div>
                          </div>
                          <div className="flex space-x-2">
                            <button onClick={() => handleEditAd(ad)} className="text-blue-600 hover:bg-blue-50 p-2 rounded font-bold">Edytuj</button>
                            <button onClick={() => handleDeleteAd(ad._id)} className="text-red-500 hover:bg-red-50 p-2 rounded">Usuń</button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};