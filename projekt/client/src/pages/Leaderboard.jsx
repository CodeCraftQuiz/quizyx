import { useState, useEffect } from 'react';
import axios from 'axios';

const Leaderboard = () => {
    const [globalRank, setGlobalRank] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [selectedQuizId, setSelectedQuizId] = useState('');
    const [quizRank, setQuizRank] = useState([]);

    useEffect(() => {
        const fetchGlobal = async () => {
            const { data } = await axios.get('/api/leaderboard/global');
            setGlobalRank(data);
        };
        const fetchQuizzes = async () => {
            const { data } = await axios.get('/api/quizzes');
            setQuizzes(data);
            if (data.length > 0) setSelectedQuizId(data[0]._id);
        };
        fetchGlobal();
        fetchQuizzes();
    }, []);

    useEffect(() => {
        if (!selectedQuizId) return;
        const fetchQuizRank = async () => {
            const { data } = await axios.get(`/api/leaderboard/quiz/${selectedQuizId}`);
            setQuizRank(data);
        };
        fetchQuizRank();
    }, [selectedQuizId]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-panel p-6">
                <h2 className="text-2xl font-bold mb-4 text-white">🏆 Globalny Ranking</h2>
                <p className="text-sm text-white/70 mb-4">Top gracze wg poprawnych odpowiedzi</p>
            </div>

            <div className="glass-panel p-6">
                <h2 className="text-2xl font-bold mb-4 text-white">Ranking Quizu</h2>
                <select 
                    className="glass-input mb-6" 
                    value={selectedQuizId} 
                    onChange={e => setSelectedQuizId(e.target.value)}
                >
                    {quizzes.map(q => <option key={q._id} value={q._id} className="text-black">{q.title}</option>)}
                </select>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full text-white">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="p-3 text-left">#</th>
                                <th className="p-3 text-left">Gracz</th>
                                <th className="p-3 text-right">Wynik</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quizRank.map((attempt, i) => (
                                <tr key={attempt._id} className="border-b border-white/5 hover:bg-white/5 transition">
                                    <td className="p-3 font-bold text-blue-300">{i + 1}</td>
                                    <td className="p-3">{attempt.userId ? attempt.userId.username : 'Nieznany'}</td>
                                    <td className="p-3 text-right font-mono">{attempt.score}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
