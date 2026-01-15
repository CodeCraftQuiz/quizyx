import React, { useState, useEffect, useRef } from 'react';
import { Quiz, QuestionType, AdTriggerType, Result, Question } from '../types';
import { api } from '../services/api';

interface QuizRoomProps {
  quiz: Quiz;
  userId: string;
  onFinish: (result: Result) => void;
  triggerAd: (type: AdTriggerType) => void;
}

const MILLIONAIRE_PRIZES = [
    500, 1000, 2000, 5000, 10000, 20000, 40000, 75000, 150000, 250000, 500000, 1000000
];

export const QuizRoom: React.FC<QuizRoomProps> = ({ quiz, userId, onFinish, triggerAd }) => {
  // 1v1 State
  const [waitingForOpponent, setWaitingForOpponent] = useState(quiz.type === 'duel');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [opponentName, setOpponentName] = useState('Przeciwnik');
  const [opponentAvatar, setOpponentAvatar] = useState('https://api.dicebear.com/7.x/avataaars/svg?seed=Opponent');
  
  // Quiz State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimit || 0);
  
  // Infinity / Millionaire State
  const [lives, setLives] = useState(3);
  const [streak, setStreak] = useState(0);
  const [millionaireSafeAmount, setMillionaireSafeAmount] = useState(0);
  
  // Lifelines
  const [lifelines, setLifelines] = useState({ fifty: true, phone: true, audience: true });
  const [hiddenAnswers, setHiddenAnswers] = useState<number[]>([]); // Indices to hide for 50/50
  
  // Duel / Exam 2-player state
  const [opponentScore, setOpponentScore] = useState(0);
  const [opponentProgress, setOpponentProgress] = useState(0);
  const [startTime] = useState(Date.now());

  // Infinity Mode: Ensure we have infinite questions
  const [dynamicQuestions, setDynamicQuestions] = useState<Question[]>(quiz.questions);
  
  // UseRef for current user data to pass to socket without dependency cycle
  const userRef = useRef<any>(null);

  // --- FETCH USER INFO FOR SOCKET ---
  useEffect(() => {
    api.auth.getMe().then(u => userRef.current = u);
  }, []);

  // --- SOCKET.IO CONNECTION FOR DUEL ---
  useEffect(() => {
      if (quiz.type === 'duel') {
          const socket = api.socket.connect();
          
          // Wait briefly for user data to load
          setTimeout(() => {
             const user = userRef.current;
             if(user) {
                 api.socket.joinDuel(user._id, user.username, user.avatarUrl, quiz._id);
             }
          }, 500);

          api.socket.onMatchFound((data) => {
              setRoomId(data.roomId);
              setOpponentName(data.opponentName);
              setOpponentAvatar(data.opponentAvatar);
              setWaitingForOpponent(false);
          });

          api.socket.onOpponentUpdate((data) => {
              setOpponentScore(data.score);
              setOpponentProgress(data.progress);
          });

          return () => {
              api.socket.disconnect();
          };
      }
  }, [quiz.type, quiz._id]);

  // --- INFINITY MODE FETCHING ---
  useEffect(() => {
      if (quiz.type === 'infinity' && currentIndex >= dynamicQuestions.length - 2) {
          // Fetch more questions when nearing end
          api.quizzes.getInfinityQuestions(10).then(q => {
              setDynamicQuestions(prev => [...prev, ...q.questions]);
          });
      }
  }, [quiz.type, currentIndex, dynamicQuestions.length]);

  const currentQuestion = dynamicQuestions[currentIndex];
  const isLastQuestion = currentIndex === dynamicQuestions.length - 1;
  
  // --- TIMER ---
  useEffect(() => {
    if (waitingForOpponent) return;
    if (quiz.timeLimit && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (quiz.timeLimit && timeLeft === 0) {
      finishQuiz();
    }
  }, [timeLeft, quiz.timeLimit, waitingForOpponent]);

  // --- HANDLERS ---
  const handleAnswerSelect = (index: number) => {
    if (currentQuestion.type === QuestionType.SINGLE) {
      setSelectedAnswers([index]);
    } else {
      setSelectedAnswers(prev => 
        prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
      );
    }
  };

  const useLifeline = (type: 'fifty' | 'phone' | 'audience') => {
      if (!lifelines[type]) return;
      
      setLifelines(prev => ({ ...prev, [type]: false }));
      
      if (type === 'fifty') {
          const correct = currentQuestion.correctAnswers[0];
          const wrongIndices = currentQuestion.answers.map((_, i) => i).filter(i => i !== correct);
          const toHide = wrongIndices.sort(() => 0.5 - Math.random()).slice(0, 2);
          setHiddenAnswers(toHide);
      } else if (type === 'phone') {
          alert(`Przyjaciel mówi: Wydaje mi się, że to odpowiedź #${currentQuestion.correctAnswers[0] + 1}`);
      } else if (type === 'audience') {
          const correct = currentQuestion.correctAnswers[0];
          alert(`Głosowanie publiczności: ${70}% głosowało na Opcję ${correct + 1}`);
      }
  };

  const submitAnswer = () => {
    setHiddenAnswers([]); // Reset lifelines visuals
    
    // --- FIX: ROBUST ANSWER VALIDATION ---
    // Ensure all values are Numbers to prevent "1" != 1 errors
    const correctSet = new Set(currentQuestion.correctAnswers.map(Number));
    const selectedSet = new Set(selectedAnswers.map(Number));
    
    // Check if sets are identical
    const isCorrect = correctSet.size === selectedSet.size && 
                      [...selectedSet].every(x => correctSet.has(x));

    let points = 10;
    
    if (quiz.type === 'millionaire') {
        if (!isCorrect) {
            finishQuiz(millionaireSafeAmount);
            return;
        }
        points = MILLIONAIRE_PRIZES[currentIndex] || 1000000;
        // Checkpoints
        if (currentIndex === 4) setMillionaireSafeAmount(1000);
        if (currentIndex === 9) setMillionaireSafeAmount(32000);
    } else if (quiz.type === 'infinity') {
        if (isCorrect) {
            setStreak(s => {
                const newStreak = s + 1;
                if (newStreak % 5 === 0) setLives(l => Math.min(l + 1, 5));
                return newStreak;
            });
        } else {
            setLives(l => l - 1);
            setStreak(0);
            if (lives - 1 <= 0) {
                finishQuiz(score);
                return;
            }
        }
    }

    const newScore = quiz.type === 'millionaire' ? points : score + (isCorrect ? points : 0);
    setScore(newScore);

    // --- SOCKET UPDATE ---
    if (quiz.type === 'duel' && roomId) {
        api.socket.sendProgress(roomId, newScore, currentIndex + 1);
    }

    if (quiz.type !== 'infinity' && isLastQuestion) {
      finishQuiz(quiz.type === 'millionaire' ? points : newScore);
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswers([]);
      if ((currentIndex + 1) % 3 === 0) { /* Ad trigger logic if needed */ }
    }
  };

  const finishQuiz = (finalScore?: number) => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const result: Result = {
        quizId: quiz._id,
        quizType: quiz.type, // Ensure type is passed
        userId: userId,
        score: finalScore ?? score,
        maxScore: quiz.type === 'millionaire' ? 1000000 : dynamicQuestions.length * 10,
        date: new Date().toISOString(),
        timeSpent
    };
    api.results.submit(result);
    triggerAd(AdTriggerType.ON_QUIZ_END);
    onFinish(result);
  };

  if (waitingForOpponent) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-700">
              <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-primary mb-6"></div>
              <h2 className="text-3xl font-bold">Szukanie gracza online...</h2>
              <p className="text-slate-500 mt-2">Poczekaj, aż ktoś dołączy do tego samego quizu.</p>
          </div>
      );
  }

  if (!currentQuestion) return <div>Ładowanie...</div>;

  return (
    <div className="max-w-4xl mx-auto mt-8 px-4 pb-12">
      {/* HUD */}
      <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 mb-8 flex flex-col md:flex-row justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">{quiz.title}</h2>
           <span className={`text-xs uppercase font-bold px-3 py-1 rounded-full mt-2 inline-block ${quiz.type === 'exam' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>
               Tryb: {quiz.type === 'exam' ? 'Egzamin 🎓' : quiz.type}
           </span>
        </div>
        <div className="flex items-center space-x-8 mt-4 md:mt-0">
            {quiz.timeLimit ? (
                <div className={`text-3xl font-mono font-bold flex items-center ${quiz.type === 'exam' ? 'text-rose-600 animate-pulse' : 'text-slate-700'}`}>
                    ⏱ {timeLeft}s
                </div>
            ) : null}
            <div className="text-2xl font-bold text-primary bg-blue-50 px-4 py-2 rounded-lg">
                {quiz.type === 'millionaire' ? `$${score}` : `Punkty: ${score}`}
            </div>
        </div>
      </div>

      {/* Duel Visuals */}
      {quiz.type === 'duel' && (
          <div className="bg-slate-800 text-white rounded-2xl p-6 mb-8 relative shadow-xl overflow-hidden">
             {/* Background glow */}
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-full bg-blue-500/10 blur-3xl"></div>
             
             <div className="flex justify-between items-end relative z-10">
                 <div className="text-center w-1/3">
                     <p className="font-bold text-lg mb-2 text-blue-300">TY</p>
                     <div className="bg-slate-700 w-full h-4 rounded-full overflow-hidden mb-3 border border-slate-600">
                        <div className="bg-blue-500 h-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{width: `${(currentIndex/dynamicQuestions.length)*100}%`}}></div>
                     </div>
                     <p className="text-2xl font-mono font-bold">{score}</p>
                 </div>
                 <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 italic px-4">VS</div>
                 <div className="text-center w-1/3 flex flex-col items-center">
                     <div className="flex items-center space-x-2 mb-2">
                        <p className="font-bold text-lg text-rose-300">{opponentName}</p>
                        <img src={opponentAvatar} alt="Opponent" className="w-8 h-8 rounded-full border border-rose-400 bg-white"/>
                     </div>
                     <div className="bg-slate-700 w-full h-4 rounded-full overflow-hidden mb-3 border border-slate-600">
                        <div className="bg-rose-500 h-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(244,63,94,0.5)]" style={{width: `${(opponentProgress/dynamicQuestions.length)*100}%`}}></div>
                     </div>
                     <p className="text-2xl font-mono font-bold">{opponentScore}</p>
                 </div>
             </div>
          </div>
      )}

      {/* Infinity Hearts */}
      {quiz.type === 'infinity' && (
        <div className="flex justify-center gap-2 mb-6">
            {Array.from({length: 5}).map((_, i) => (
                <span key={i} className={`text-3xl transition-all duration-300 transform ${i < lives ? 'text-rose-500 scale-100' : 'text-slate-200 scale-90 grayscale'}`}>❤️</span>
            ))}
        </div>
      )}

      {/* Millionaire Lifelines */}
      {quiz.type === 'millionaire' && (
          <div className="flex justify-center gap-4 mb-8">
              <button disabled={!lifelines.fifty} onClick={() => useLifeline('fifty')} className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-full px-6 py-2 text-sm font-bold shadow transition-colors">50:50</button>
              <button disabled={!lifelines.phone} onClick={() => useLifeline('phone')} className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-full px-6 py-2 text-sm font-bold shadow transition-colors">📞 Telefon</button>
              <button disabled={!lifelines.audience} onClick={() => useLifeline('audience')} className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-full px-6 py-2 text-sm font-bold shadow transition-colors">👥 Publiczność</button>
          </div>
      )}

      {/* Question Card */}
      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-lg border border-slate-200">
        <div className="mb-8">
            <span className="text-sm font-bold text-blue-500 uppercase tracking-widest">Pytanie {currentIndex + 1}</span>
            <h3 className="text-3xl font-bold mt-3 text-slate-800 leading-tight">{currentQuestion.content}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQuestion.answers.map((ans, idx) => {
                if (hiddenAnswers.includes(idx)) return <div key={idx} className="p-4 border border-dashed border-slate-200 rounded-xl opacity-50 bg-slate-50"></div>;
                const isSelected = selectedAnswers.includes(idx);
                return (
                    <button
                        key={idx}
                        onClick={() => handleAnswerSelect(idx)}
                        className={`group relative text-left p-5 rounded-xl border-2 transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${
                        isSelected
                            ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-md ring-2 ring-blue-200'
                            : 'border-slate-200 hover:border-blue-300 bg-white text-slate-700'
                        }`}
                    >
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full mr-3 text-sm font-bold transition-colors ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
                            {String.fromCharCode(65+idx)}
                        </span>
                        <span className="font-medium text-lg">{ans}</span>
                    </button>
                );
            })}
        </div>

        <div className="mt-10">
            <button
            onClick={submitAnswer}
            disabled={selectedAnswers.length === 0}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white text-lg font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform active:scale-95"
            >
            Zatwierdź Odpowiedź
            </button>
        </div>
      </div>
    </div>
  );
}