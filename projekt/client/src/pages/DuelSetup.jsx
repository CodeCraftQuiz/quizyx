import { useState, useEffect } from 'react';
import axios from 'axios';

const DuelSetup = () => {
    const [step, setStep] = useState(1); // 1: Setup, 2: Play, 3: Result
    const [p1Name, setP1Name] = useState('');
    const [p2Name, setP2Name] = useState('');
    const [quizzes, setQuizzes] = useState([]);
    const [selectedQuizId, setSelectedQuizId] = useState('');
    const [quiz, setQuiz] = useState(null);
    
    // Game State
    const [currentPlayer, setCurrentPlayer] = useState(1); // 1 or 2
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [p1Score, setP1Score] = useState(0);
    const [p2Score, setP2Score] = useState(0);

    useEffect(() => {
        const fetchQuizzes = async () => {
            const { data } = await axios.get('/api/quizzes');
            setQuizzes(data);
            if (data.length > 0) setSelectedQuizId(data[0]._id);
        };
        fetchQuizzes();
    }, []);

    const startDuel = async () => {
        if (!p1Name || !p2Name) return alert('Podaj imiona graczy');
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`/api/quizzes/${selectedQuizId}`, { headers: { Authorization: `Bearer ${token}` } });
        setQuiz(data);
        setStep(2);
    };

    const handleAnswer = (isCorrect) => {
        if (isCorrect) {
            if (currentPlayer === 1) setP1Score(s => s + 1);
            else setP2Score(s => s + 1);
        }

        // Logic: Player 1 answers Q1, then Player 2 answers Q1. Then Q2.
        if (currentPlayer === 1) {
            setCurrentPlayer(2);
        } else {
            setCurrentPlayer(1);
            if (currentQIndex + 1 < quiz.questions.length) {
                setCurrentQIndex(prev => prev + 1);
            } else {
                setStep(3);
            }
        }
    };

    if (step === 1) {
        return (
            <div className="max-w-md mx-auto glass-panel p-8">
                <h2 className="text-3xl font-bold mb-8 text-center text-white">Pojedynek Offline</h2>
                <div className="mb-6">
                    <label className="block font-bold text-white mb-2">Gracz 1</label>
                    <input type="text" value={p1Name} onChange={e => setP1Name(e.target.value)} className="glass-input" placeholder="Imię gracza 1" />
                </div>
                <div className="mb-6">
                    <label className="block font-bold text-white mb-2">Gracz 2</label>
                    <input type="text" value={p2Name} onChange={e => setP2Name(e.target.value)} className="glass-input" placeholder="Imię gracza 2" />
                </div>
                <div className="mb-8">
                    <label className="block font-bold text-white mb-2">Wybierz Quiz</label>
                    <select value={selectedQuizId} onChange={e => setSelectedQuizId(e.target.value)} className="glass-input">
                        {quizzes.map(q => <option key={q._id} value={q._id} className="text-black">{q.title}</option>)}
                    </select>
                </div>
                <button onClick={startDuel} className="glass-btn-danger text-lg">WALCZ!</button>
            </div>
        );
    }

    if (step === 2 && quiz) {
        const question = quiz.questions[currentQIndex];
        return (
            <div className="max-w-2xl mx-auto glass-panel p-8 text-center">
                <div className="flex justify-between mb-8 text-xl font-bold">
                    <div className={`px-4 py-2 rounded-lg transition ${currentPlayer === 1 ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50' : 'text-white/50'}`}>{p1Name}: {p1Score}</div>
                    <div className={`px-4 py-2 rounded-lg transition ${currentPlayer === 2 ? 'bg-red-500/20 text-red-300 border border-red-500/50' : 'text-white/50'}`}>{p2Name}: {p2Score}</div>
                </div>
                
                <h3 className="text-lg mb-4 text-white/70">Pytanie {currentQIndex + 1} dla: <span className="font-bold text-white text-2xl block mt-1">{currentPlayer === 1 ? p1Name : p2Name}</span></h3>
                <h2 className="text-3xl font-bold mb-8 text-white">{question.text}</h2>

                <div className="grid grid-cols-1 gap-4">
                    {question.answers.map((ans, i) => (
                        <button 
                            key={i} 
                            onClick={() => handleAnswer(ans.isCorrect)}
                            className="glass-btn text-left hover:bg-white/20"
                        >
                            {ans.text}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    if (step === 3) {
        const winner = p1Score > p2Score ? p1Name : p2Score > p1Score ? p2Name : 'REMIS';
        return (
            <div className="max-w-md mx-auto bg-white p-8 rounded shadow text-center">
                <h2 className="text-3xl font-bold mb-4">Koniec Pojedynku!</h2>
                <div className="text-6xl mb-6">🥊</div>
                <p className="text-xl mb-2">Wygrywa: <span className="font-bold text-red-600">{winner}</span></p>
                <div className="flex justify-around mt-6 text-lg">
                    <div>{p1Name}: {p1Score}</div>
                    <div>{p2Name}: {p2Score}</div>
                </div>
                <button onClick={() => setStep(1)} className="mt-8 bg-gray-800 text-white px-6 py-2 rounded">Zagraj ponownie</button>
            </div>
        );
    }

    return <div>Ładowanie...</div>;
};

export default DuelSetup;
