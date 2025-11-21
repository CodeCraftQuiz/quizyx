import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const QuizPlay = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswerIndex, setSelectedAnswerIndex] = useState(null);
    const [answersHistory, setAnswersHistory] = useState([]); // { questionId, isCorrect, time }
    const [score, setScore] = useState(0);
    const [finished, setFinished] = useState(false);
    
    // Mode specific
    const [timeLeft, setTimeLeft] = useState(0); // For Exam (global) or Ranked (per question)
    const [rankedPoints, setRankedPoints] = useState(100); // Per question
    const [lifelines, setLifelines] = useState({ fiftyFifty: true, audience: true, swap: true });
    const [hiddenAnswers, setHiddenAnswers] = useState([]); // Indices to hide (50/50)
    const [audienceStats, setAudienceStats] = useState(null);

    const timerRef = useRef(null);

    // Shuffle function
    const shuffleArray = (array) => {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    };

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const token = localStorage.getItem('token');
                const url = id === 'infinity' ? '/api/quizzes/infinity' : `/api/quizzes/${id}`;
                const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
                
                // Shuffle questions here
                if (data.questions && data.questions.length > 0) {
                    data.questions = shuffleArray(data.questions);
                }

                setQuiz(data);
                
                if (data.mode === 'EXAM') {
                    setTimeLeft(data.questions.length * 60); // 1 min per question total
                }
                setLoading(false);
            } catch (error) {
                console.error(error);
                setLoading(false);
            }
        };
        fetchQuiz();
    }, [id]);

    // Timer Logic
    useEffect(() => {
        if (!quiz || finished) return;

        if (quiz.mode === 'EXAM') {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        finishQuiz();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (quiz.mode === 'RANKED') {
            setRankedPoints(100);
            timerRef.current = setInterval(() => {
                setRankedPoints((prev) => Math.max(0, prev - 1)); // Decrease 1 point per tick (approx)
            }, 100); // Fast tick
        }

        return () => clearInterval(timerRef.current);
    }, [quiz, currentQuestionIndex, finished]);

    const handleAnswerSelect = (index) => {
        if (finished) return;
        setSelectedAnswerIndex(index);
    };

    const useLifeline = (type) => {
        if (!lifelines[type]) return;
        
        const currentQ = quiz.questions[currentQuestionIndex];
        
        if (type === 'fiftyFifty') {
            const correctIndex = currentQ.answers.findIndex(a => a.isCorrect);
            const wrongIndices = currentQ.answers.map((_, i) => i).filter(i => i !== correctIndex);
            // Hide all wrong except one
            const toHide = wrongIndices.sort(() => 0.5 - Math.random()).slice(0, wrongIndices.length - 1);
            setHiddenAnswers(toHide);
        } else if (type === 'audience') {
            const stats = currentQ.answers.map(a => a.isCorrect ? Math.floor(Math.random() * 40 + 50) : Math.floor(Math.random() * 20));
            setAudienceStats(stats);
        } else if (type === 'swap') {
            // Just skip for simplicity in this project
            setCurrentQuestionIndex(prev => prev + 1);
            setRankedPoints(100);
            setHiddenAnswers([]);
            setAudienceStats(null);
            return; // Don't consume turn logic below
        }

        setLifelines({ ...lifelines, [type]: false });
    };

    const handleNext = () => {
        if (selectedAnswerIndex === null && quiz.mode !== 'EXAM') {
            alert('Wybierz odpowiedź!');
            return;
        }

        const currentQ = quiz.questions[currentQuestionIndex];
        const isCorrect = selectedAnswerIndex !== null && currentQ.answers[selectedAnswerIndex].isCorrect;
        
        // Calculate Score
        let points = 0;
        if (isCorrect) {
            if (quiz.mode === 'RANKED') points = rankedPoints;
            else points = currentQ.points || 1;
        }

        const newHistory = [...answersHistory, {
            questionId: currentQ._id,
            isCorrect,
            selectedAnswerIndex
        }];
        setAnswersHistory(newHistory);
        setScore(prev => prev + points);

        // Infinity Mode Check
        if (quiz.mode === 'INFINITY' && !isCorrect) {
            const errors = newHistory.filter(h => !h.isCorrect).length;
            if (errors >= 3) {
                finishQuiz(newHistory, score + points);
                return;
            }
        }

        if (currentQuestionIndex + 1 < quiz.questions.length) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedAnswerIndex(null);
            setHiddenAnswers([]);
            setAudienceStats(null);
        } else {
            finishQuiz(newHistory, score + points);
        }
    };

    const finishQuiz = async (finalHistory = answersHistory, finalScore = score) => {
        setFinished(true);
        clearInterval(timerRef.current);

        const correctCount = finalHistory.filter(h => h.isCorrect).length;
        const incorrectCount = finalHistory.length - correctCount;

        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/attempts', {
                quizId: quiz._id, // might be undefined for infinity, handled in backend?
                mode: quiz.mode,
                difficulty: quiz.difficulty,
                score: finalScore,
                correctCount,
                incorrectCount,
                timeTaken: 0, // TODO: calculate real time
                answers: finalHistory
            }, { headers: { Authorization: `Bearer ${token}` } });
        } catch (error) {
            console.error("Failed to save attempt", error);
        }
    };

    if (loading) return <div className="text-center mt-10">Ładowanie quizu...</div>;
    if (!quiz) return <div className="text-center mt-10">Nie znaleziono quizu.</div>;

    if (finished) {
        return (
            <div className="max-w-2xl mx-auto glass-panel p-8 text-center">
                <h2 className="text-3xl font-bold mb-4">Koniec Quizu!</h2>
                <p className="text-xl mb-2">Twój wynik: <span className="font-bold text-yellow-300">{score}</span> pkt</p>
                <p className="mb-6">Poprawne odpowiedzi: {answersHistory.filter(h => h.isCorrect).length} / {answersHistory.length}</p>
                <button onClick={() => navigate('/quizzes')} className="glass-btn">Wróć do listy</button>
            </div>
        );
    }

    const currentQ = quiz.questions[currentQuestionIndex];

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-4 glass-panel p-4">
                <div>
                    <h2 className="font-bold text-lg">{quiz.title}</h2>
                    <span className="text-sm text-gray-300">{quiz.mode} | {currentQuestionIndex + 1}/{quiz.questions.length}</span>
                </div>
                <div className="text-right">
                    {quiz.mode === 'EXAM' && <div className="text-red-400 font-bold text-xl">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</div>}
                    {quiz.mode === 'RANKED' && <div className="text-green-400 font-bold text-xl">Punkty: {Math.floor(rankedPoints)}</div>}
                    <div className="text-sm">Wynik: {score}</div>
                </div>
            </div>

            {quiz.mode === 'MILLIONAIRE' && (
                <div className="flex gap-2 mb-4 justify-center">
                    <button onClick={() => useLifeline('fiftyFifty')} disabled={!lifelines.fiftyFifty} className="glass-btn py-1 px-3 text-sm disabled:opacity-50">50/50</button>
                    <button onClick={() => useLifeline('audience')} disabled={!lifelines.audience} className="glass-btn py-1 px-3 text-sm disabled:opacity-50">Publiczność</button>
                    <button onClick={() => useLifeline('swap')} disabled={!lifelines.swap} className="glass-btn py-1 px-3 text-sm disabled:opacity-50">Zmiana pytania</button>
                </div>
            )}

            <div className="glass-panel p-8 mb-6">
                <h3 className="text-2xl font-bold mb-6 drop-shadow-md">{currentQ.text}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentQ.answers.map((ans, index) => {
                        if (hiddenAnswers.includes(index)) return <div key={index} className="invisible"></div>;
                        
                        return (
                            <button
                                key={index}
                                onClick={() => handleAnswerSelect(index)}
                                className={`p-4 rounded-xl border transition relative text-left shadow-md
                                    ${selectedAnswerIndex === index 
                                        ? 'border-yellow-400 bg-yellow-500/30 text-white' 
                                        : 'border-white/20 bg-white/10 hover:bg-white/20 text-white'}
                                `}
                            >
                                {ans.text}
                                {audienceStats && <span className="absolute right-2 top-2 text-xs bg-white/20 px-1 rounded">{audienceStats[index]}%</span>}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex justify-between">
                <button onClick={() => setSelectedAnswerIndex(null)} className="text-gray-300 hover:text-white transition">Resetuj wybór</button>
                <button onClick={handleNext} className="glass-btn w-auto px-10">
                    {currentQuestionIndex === quiz.questions.length - 1 ? 'Zakończ' : 'Dalej'}
                </button>
            </div>
        </div>
    );
};

export default QuizPlay;
