import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const QuizList = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const [mode, setMode] = useState(searchParams.get('mode') || '');
    const [difficulty, setDifficulty] = useState(searchParams.get('difficulty') || '');
    const { user } = useContext(AuthContext);

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { Authorization: `Bearer ${token}` } };
                let url = '/api/quizzes';
                const params = new URLSearchParams();
                if (mode) params.append('mode', mode);
                if (difficulty) params.append('difficulty', difficulty);
                if (params.toString()) url += `?${params.toString()}`;

                const { data } = await axios.get(url, config);
                setQuizzes(data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchQuizzes();
    }, [mode, difficulty]);

    const handleFilterChange = (e, type) => {
        const value = e.target.value;
        if (type === 'mode') {
            setMode(value);
            setSearchParams({ mode: value, difficulty });
        } else {
            setDifficulty(value);
            setSearchParams({ mode, difficulty: value });
        }
    };

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6 drop-shadow-md">Dostępne Quizy</h2>
            
            <div className="flex gap-4 mb-6 glass-panel p-6">
                <div className="flex-1">
                    <label className="block text-sm font-bold mb-2">Tryb</label>
                    <select value={mode} onChange={(e) => handleFilterChange(e, 'mode')} className="glass-input text-black">
                        <option value="">Wszystkie</option>
                        <option value="STANDARD">Standard</option>
                        <option value="RANKED">Rankingowy</option>
                        <option value="EXAM">Egzamin</option>
                        <option value="MILLIONAIRE">Milionerzy</option>
                        <option value="INFINITY">Nieskończony</option>
                    </select>
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-bold mb-2">Trudność</label>
                    <select value={difficulty} onChange={(e) => handleFilterChange(e, 'difficulty')} className="glass-input text-black">
                        <option value="">Wszystkie</option>
                        <option value="EASY">Łatwy</option>
                        <option value="MEDIUM">Średni</option>
                        <option value="HARD">Trudny</option>
                    </select>
                </div>
            </div>

            {mode === 'INFINITY' && (
                 <div className="mb-6 p-6 glass-panel bg-gradient-to-r from-purple-600/50 to-indigo-600/50 border-purple-400/30">
                    <h3 className="text-2xl font-bold mb-2">Tryb Nieskończony</h3>
                    <p className="mb-4 opacity-90">Losowe pytania z całej bazy. Graj dopóki nie popełnisz 3 błędów!</p>
                    <Link to="/quiz/infinity/play" className="glass-btn inline-block w-auto bg-white text-purple-600 hover:text-purple-700">
                        Rozpocznij Nieskończoność
                    </Link>
                 </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quizzes.map((quiz) => (
                    <div key={quiz._id} className="glass-card flex flex-col justify-between h-full">
                        <div>
                            <h3 className="text-xl font-bold mb-2">{quiz.title}</h3>
                            <p className="text-gray-200 text-sm mb-4 line-clamp-2">{quiz.description}</p>
                        </div>
                        <div>
                            <div className="flex justify-between items-center text-xs font-bold mb-4 uppercase tracking-wide">
                                <span className={`px-2 py-1 rounded-md border ${quiz.difficulty === 'EASY' ? 'border-green-400 text-green-300' : quiz.difficulty === 'MEDIUM' ? 'border-yellow-400 text-yellow-300' : 'border-red-400 text-red-300'}`}>
                                    {quiz.difficulty}
                                </span>
                                <span className="bg-white/10 px-2 py-1 rounded-md">{quiz.mode}</span>
                            </div>
                            <Link to={`/quiz/${quiz._id}/play`} className="glass-btn block text-center text-sm py-2">
                                Rozpocznij
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default QuizList;
