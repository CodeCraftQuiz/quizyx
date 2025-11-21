import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

const AdminPanel = () => {
    const [quizzes, setQuizzes] = useState([]);
    const { id } = useParams(); 
    const navigate = useNavigate();
    const location = useLocation();

    // Determine view mode
    const isEditMode = Boolean(id) && id !== 'new';
    const isCreateMode = location.pathname === '/admin/quiz/new';
    const isListMode = !isEditMode && !isCreateMode;
    
    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [mode, setMode] = useState('STANDARD');
    const [difficulty, setDifficulty] = useState('MEDIUM');
    const [questions, setQuestions] = useState([]);
    const [jsonInput, setJsonInput] = useState('');

    const fetchQuizzes = async () => {
        const token = localStorage.getItem('token');
        const { data } = await axios.get('/api/quizzes', { headers: { Authorization: `Bearer ${token}` } });
        setQuizzes(data);
    };

    useEffect(() => {
        if (isEditMode) {
            const fetchQuizToEdit = async () => {
                const token = localStorage.getItem('token');
                try {
                    const { data } = await axios.get(`/api/quizzes/${id}`, { headers: { Authorization: `Bearer ${token}` } });
                    setTitle(data.title);
                    setDescription(data.description);
                    setMode(data.mode);
                    setDifficulty(data.difficulty);
                    setQuestions(data.questions);
                } catch (error) {
                    console.error(error);
                    alert('Nie udało się pobrać quizu do edycji');
                    navigate('/admin');
                }
            };
            fetchQuizToEdit();
        } else if (isCreateMode) {
            // Reset form for new quiz
            setTitle(''); 
            setDescription(''); 
            setQuestions([]); 
            setMode('STANDARD'); 
            setDifficulty('MEDIUM');
        } else {
            // List mode
            fetchQuizzes();
        }
    }, [id, isEditMode, isCreateMode, navigate]);

    const handleAddQuestion = () => {
        setQuestions([...questions, { text: '', answers: [], points: 1 }]);
    };

    const handleQuestionChange = (index, field, value) => {
        const newQuestions = [...questions];
        newQuestions[index][field] = value;
        setQuestions(newQuestions);
    };

    const handleAddAnswer = (qIndex) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].answers.push({ text: '', isCorrect: false });
        setQuestions(newQuestions);
    };

    const handleAnswerChange = (qIndex, aIndex, field, value) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].answers[aIndex][field] = value;
        setQuestions(newQuestions);
    };

    const handleRemoveAnswer = (qIndex, aIndex) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].answers.splice(aIndex, 1);
        setQuestions(newQuestions);
    };

    const handleRemoveQuestion = (index) => {
        const newQuestions = [...questions];
        newQuestions.splice(index, 1);
        setQuestions(newQuestions);
    };

    const handleJsonImport = () => {
        try {
            const parsed = JSON.parse(jsonInput);
            if (!Array.isArray(parsed)) throw new Error('JSON musi być tablicą');
            
            const validQuestions = parsed.filter(q => q.text && Array.isArray(q.answers));
            if (validQuestions.length === 0) throw new Error('Brak poprawnych pytań w JSON');

            setQuestions([...questions, ...validQuestions]);
            setJsonInput('');
            alert(`Dodano ${validQuestions.length} pytań z JSON`);
        } catch (error) {
            alert('Błąd importu JSON: ' + error.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const payload = { title, description, mode, difficulty, questions };
        
        try {
            if (isEditMode) {
                await axios.patch(`/api/quizzes/${id}`, payload, config);
                alert('Quiz zaktualizowany!');
            } else {
                await axios.post('/api/quizzes', payload, config);
                alert('Quiz dodany!');
            }
            navigate('/admin');
        } catch (error) {
            alert('Błąd: ' + error.response?.data?.message || error.message);
        }
    };

    const handleDelete = async (quizId) => {
        if(!window.confirm('Na pewno usunąć?')) return;
        const token = localStorage.getItem('token');
        await axios.delete(`/api/quizzes/${quizId}`, { headers: { Authorization: `Bearer ${token}` } });
        fetchQuizzes();
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold drop-shadow-md">Panel Administratora</h2>
                {isListMode ? (
                    <button onClick={() => navigate('/admin/quiz/new')} className="glass-btn w-auto">
                        + Dodaj Quiz
                    </button>
                ) : (
                    <button onClick={() => navigate('/admin')} className="glass-btn w-auto bg-gray-500">
                        Wróć do listy
                    </button>
                )}
            </div>

            {isListMode ? (
                <div className="glass-panel overflow-hidden">
                    <table className="min-w-full text-white">
                        <thead className="bg-white/10">
                            <tr>
                                <th className="py-3 px-4 text-left">Tytuł</th>
                                <th className="py-3 px-4 text-left">Tryb</th>
                                <th className="py-3 px-4 text-left">Trudność</th>
                                <th className="py-3 px-4 text-left">Akcje</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quizzes.map(q => (
                                <tr key={q._id} className="border-t border-white/10 hover:bg-white/5 transition">
                                    <td className="py-3 px-4">{q.title}</td>
                                    <td className="py-3 px-4">{q.mode}</td>
                                    <td className="py-3 px-4">{q.difficulty}</td>
                                    <td className="py-3 px-4 flex gap-2">
                                        <button onClick={() => navigate(`/admin/quiz/${q._id}/edit`)} className="bg-blue-500/80 hover:bg-blue-600 text-white px-3 py-1 rounded shadow transition">
                                            Edytuj
                                        </button>
                                        <button onClick={() => handleDelete(q._id)} className="bg-red-500/80 hover:bg-red-600 text-white px-3 py-1 rounded shadow transition">
                                            Usuń
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="glass-panel p-8 max-w-4xl mx-auto">
                    <h3 className="text-2xl font-bold mb-6">{isEditMode ? 'Edytuj Quiz' : 'Nowy Quiz'}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block font-bold mb-2">Tytuł</label>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="glass-input" required />
                        </div>
                        <div>
                            <label className="block font-bold mb-2">Opis</label>
                            <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="glass-input" />
                        </div>
                        <div>
                            <label className="block font-bold mb-2">Tryb</label>
                            <select value={mode} onChange={e => setMode(e.target.value)} className="glass-input text-black">
                                <option value="STANDARD">Standard</option>
                                <option value="RANKED">Rankingowy</option>
                                <option value="EXAM">Egzamin</option>
                                <option value="MILLIONAIRE">Milionerzy</option>
                                <option value="INFINITY">Nieskończony</option>
                            </select>
                        </div>
                        <div>
                            <label className="block font-bold mb-2">Trudność</label>
                            <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="glass-input text-black">
                                <option value="EASY">Łatwy</option>
                                <option value="MEDIUM">Średni</option>
                                <option value="HARD">Trudny</option>
                            </select>
                        </div>
                    </div>

                    {/* JSON Import Section */}
                    <div className="mb-8 p-4 bg-white/5 rounded-xl border border-white/10">
                        <h4 className="font-bold mb-2">Import pytań z JSON</h4>
                        <textarea 
                            className="glass-input h-32 font-mono text-sm mb-2"
                            placeholder='[{"text": "Pytanie...", "answers": [{"text": "Odp1", "isCorrect": true}]}]'
                            value={jsonInput}
                            onChange={e => setJsonInput(e.target.value)}
                        />
                        <button type="button" onClick={handleJsonImport} className="glass-btn py-2 text-sm w-auto">
                            Dodaj pytania z JSON
                        </button>
                    </div>

                    <h3 className="text-xl font-bold mb-4 border-b border-white/20 pb-2">Pytania ({questions.length})</h3>
                    {questions.map((q, qIndex) => (
                        <div key={qIndex} className="mb-6 p-6 glass-card bg-white/5">
                            <div className="flex justify-between mb-4">
                                <label className="font-bold text-lg">Pytanie {qIndex + 1}</label>
                                <button type="button" onClick={() => handleRemoveQuestion(qIndex)} className="text-red-400 hover:text-red-300 text-sm font-bold">Usuń pytanie</button>
                            </div>
                            <input 
                                type="text" 
                                placeholder="Treść pytania" 
                                value={q.text} 
                                onChange={e => handleQuestionChange(qIndex, 'text', e.target.value)} 
                                className="glass-input mb-4" 
                                required 
                            />
                            
                            <div className="pl-4 border-l-2 border-white/20">
                                <label className="block text-sm font-bold mb-2 opacity-80">Odpowiedzi:</label>
                                {q.answers.map((a, aIndex) => (
                                    <div key={aIndex} className="flex items-center gap-3 mb-3">
                                        <input 
                                            type="text" 
                                            placeholder="Odpowiedź" 
                                            value={a.text} 
                                            onChange={e => handleAnswerChange(qIndex, aIndex, 'text', e.target.value)} 
                                            className="glass-input py-2" 
                                            required 
                                        />
                                        <label className="flex items-center gap-2 cursor-pointer min-w-[100px]">
                                            <input 
                                                type="checkbox" 
                                                checked={a.isCorrect} 
                                                onChange={e => handleAnswerChange(qIndex, aIndex, 'isCorrect', e.target.checked)} 
                                                className="w-5 h-5 accent-green-500"
                                            />
                                            <span>Poprawna</span>
                                        </label>
                                        <button type="button" onClick={() => handleRemoveAnswer(qIndex, aIndex)} className="text-red-400 hover:text-red-300 font-bold px-2">X</button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => handleAddAnswer(qIndex)} className="text-blue-300 hover:text-blue-200 text-sm font-bold mt-2">+ Dodaj odpowiedź</button>
                            </div>
                        </div>
                    ))}

                    <div className="flex gap-4 mt-8">
                        <button type="button" onClick={handleAddQuestion} className="glass-btn bg-none bg-white/10 hover:bg-white/20">
                            + Dodaj puste pytanie
                        </button>

                        <button type="submit" className="glass-btn">
                            {isEditMode && id !== 'new' ? 'Zapisz Zmiany' : 'Utwórz Quiz'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default AdminPanel;
