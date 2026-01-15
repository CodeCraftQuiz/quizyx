
import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Quiz, QuestionType, AdTriggerType, Result } from '../types';
import { api } from '../services/api';

const socket = io('http://localhost:5000');

interface QuizRoomProps {
  quiz: Quiz;
  userId: string;
  onFinish: (result: Result) => void;
  triggerAd: (type: AdTriggerType) => void;
}

const MILLIONAIRE_PRIZES = [500, 1000, 2000, 5000, 10000, 20000, 40000, 75000, 125000, 250000, 500000, 1000000];

export const QuizRoom: React.FC<QuizRoomProps> = ({ quiz, userId, onFinish, triggerAd }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [score, setScore] = useState(quiz.type === 'money_drop' ? 1000000 : 0);
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimit || (quiz.type === 'money_drop' ? 60 : 30));
  const [showResult, setShowResult] = useState(false);
  const [localFinished, setLocalFinished] = useState(false);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  
  const [isRevealing, setIsRevealing] = useState(false);
  const [bets, setBets] = useState<{ [key: number]: number }>({});
  const [safeAmount, setSafeAmount] = useState(0);
  const [lives, setLives] = useState(3);
  const [streak, setStreak] = useState(0);

  // Millionaire Lifelines
  const [lifelines, setLifelines] = useState({ fifty: true, phone: true, audience: true });
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);

  // 1v1 State
  const [isMatchmaking, setIsMatchmaking] = useState(quiz.type === 'duel');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [opponent, setOpponent] = useState<{userId: string, name: string, avatar: string, score: number, progress: number, finished: boolean} | null>(null);

  const startTime = useRef(Date.now());

  useEffect(() => {
    if (quiz.type === 'duel') {
        api.auth.getMe().then(me => {
            socket.emit('register_user', userId);
            socket.emit('join_duel', { userId, username: me.username, avatarUrl: me.avatarUrl, quizId: quiz._id });
        });

        socket.on('match_found', ({ roomId: rId, players }) => {
            setRoomId(rId);
            const opp = players?.find((p: any) => p.userId !== userId);
            if (opp) setOpponent({ userId: opp.userId, name: opp.username, avatar: opp.avatarUrl, score: 0, progress: 0, finished: false });
            setIsMatchmaking(false);
        });

        socket.on('opponent_update', ({ score: oppScore, progress: oppProgress }) => {
            setOpponent(prev => prev ? { ...prev, score: oppScore, progress: oppProgress } : null);
        });

        socket.on('opponent_finished', ({ score: oppScore }) => {
            setOpponent(prev => prev ? { ...prev, score: oppScore, finished: true } : null);
        });

        return () => {
            socket.off('match_found');
            socket.off('opponent_update');
            socket.off('opponent_finished');
        };
    }
  }, [quiz.type, userId, quiz._id]);

  useEffect(() => {
    if (!showResult && !isRevealing && !isMatchmaking && !localFinished) {
      const timer = setInterval(() => {
        setTimeLeft(t => {
            if (t <= 0) {
                if (quiz.type === 'money_drop') { handleFinish(0); return 0; }
                nextStep(); 
                return quiz.timeLimit || 30;
            }
            return t - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [showResult, isRevealing, isMatchmaking, currentIndex, localFinished]);

  const handleLifeline = (type: 'fifty' | 'phone' | 'audience') => {
      if (!lifelines[type]) return;
      setLifelines(l => ({ ...l, [type]: false }));
      const q = quiz.questions[currentIndex];
      if (type === 'fifty') {
          const correct = q.correctAnswers[0];
          const wrong = q.answers.map((_, i) => i).filter(i => i !== correct);
          setHiddenOptions(wrong.sort(() => 0.5 - Math.random()).slice(0, 2));
      } else if (type === 'phone') {
          alert(`Przyjaciel mówi: Stawiałbym na ${String.fromCharCode(65 + q.correctAnswers[0])}`);
      } else if (type === 'audience') {
          alert(`Publiczność: ${String.fromCharCode(65 + q.correctAnswers[0])} - 74%`);
      }
  };

  const handlePlaceBet = (idx: number, amount: number) => {
    if (quiz.type !== 'money_drop') return;
    const currentBets = { ...bets };
    const currentAmount = currentBets[idx] || 0;
    
    if (amount > 0) {
        const totalPlaced = Object.values(currentBets).reduce((a, b) => a + b, 0);
        if (score - totalPlaced < amount) return;

        const occupiedCount = Object.keys(currentBets).filter(k => currentBets[Number(k)] > 0).length;
        const totalAnswers = quiz.questions[currentIndex].answers.length;
        if (currentAmount === 0 && occupiedCount >= totalAnswers - 1) {
            alert("Zasada gry: jedna zapadnia musi zostać pusta!");
            return;
        }
    }
    setBets({ ...currentBets, [idx]: Math.max(0, currentAmount + amount) });
  };

  const handleFinish = async (finalScore: number) => {
    const isDuel = quiz.type === 'duel';
    if (isDuel && roomId) socket.emit('finish_duel', { roomId, score: finalScore });

    const res: Result = {
      quizId: quiz._id,
      quizType: quiz.type,
      userId: userId,
      score: finalScore,
      maxScore: quiz.type === 'money_drop' || quiz.type === 'millionaire' ? 1000000 : quiz.questions.length * 10,
      date: new Date().toISOString(),
      timeSpent: Math.floor((Date.now() - startTime.current) / 1000),
      quizTitle: quiz.title,
    };

    await api.results.submit(res);
    triggerAd(AdTriggerType.ON_QUIZ_END);

    setLocalFinished(true);

    if (isDuel && (!opponent || !opponent.finished)) {
        setWaitingForOpponent(true);
    } else {
        setShowResult(true);
    }
  };

  useEffect(() => {
      if (localFinished && (quiz.type !== 'duel' || opponent?.finished)) {
          setWaitingForOpponent(false);
          setShowResult(true);
      }
  }, [localFinished, opponent?.finished, quiz.type]);

  const nextStep = async () => {
    const q = quiz.questions[currentIndex];
    const isCorrect = JSON.stringify(q.correctAnswers.sort()) === JSON.stringify(selectedAnswers.sort());
    setHiddenOptions([]);

    if (quiz.type === 'money_drop') {
      const totalPlaced = Object.values(bets).reduce((a, b) => a + b, 0);
      if (totalPlaced < score) { alert("Musisz rozłożyć całą kwotę!"); return; }
      setIsRevealing(true);
      await new Promise(r => setTimeout(r, 2000));
      const surviving = bets[q.correctAnswers[0]] || 0;
      setScore(surviving);
      setIsRevealing(false);
      if (surviving === 0 || currentIndex === quiz.questions.length - 1) handleFinish(surviving);
      else { setCurrentIndex(c => c + 1); setBets({}); setTimeLeft(60); }
    } else if (quiz.type === 'millionaire') {
      if (isCorrect) {
        const prize = MILLIONAIRE_PRIZES[currentIndex];
        setScore(prize);
        if (currentIndex === 1) setSafeAmount(1000);
        if (currentIndex === 6) setSafeAmount(40000);
        if (currentIndex === quiz.questions.length - 1) handleFinish(prize);
        else { setCurrentIndex(c => c + 1); setSelectedAnswers([]); setTimeLeft(30); }
      } else handleFinish(safeAmount);
    } else if (quiz.type === 'infinity') {
      if (isCorrect) {
          const newStreak = streak + 1;
          setStreak(newStreak);
          setScore(s => s + 10);
          if (newStreak % 5 === 0) setLives(l => Math.min(l + 1, 5));
          setCurrentIndex(c => c + 1); setSelectedAnswers([]); setTimeLeft(20);
      } else {
          const newLives = lives - 1;
          setLives(newLives);
          setStreak(0);
          if (newLives <= 0) handleFinish(score);
          else { setCurrentIndex(c => c + 1); setSelectedAnswers([]); setTimeLeft(20); }
      }
    } else {
      const nextScore = score + (isCorrect ? 10 : 0);
      setScore(nextScore);
      if (roomId) socket.emit('send_progress', { roomId, score: nextScore, progress: currentIndex + 1 });
      if (currentIndex === quiz.questions.length - 1) handleFinish(nextScore);
      else { setCurrentIndex(c => c + 1); setSelectedAnswers([]); setTimeLeft(quiz.timeLimit || 30); }
    }
  };

  if (isMatchmaking) {
    return <div className="h-[80vh] flex flex-col items-center justify-center text-center"><div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mb-8 shadow-fuchsia"></div><h2 className="text-3xl font-black text-white italic uppercase tracking-widest text-glow">Namierzanie Celu...</h2></div>;
  }

  if (waitingForOpponent) {
    return (
        <div className="h-[80vh] flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 border-4 border-secondary border-t-transparent rounded-full animate-spin mb-8 shadow-yellow-glow"></div>
            <h2 className="text-3xl font-black text-white italic uppercase tracking-widest">Oczekiwanie na wynik rywala...</h2>
            <p className="text-secondary/60 font-black uppercase text-[10px] mt-4 tracking-widest italic animate-pulse">{opponent?.name} kończy walkę.</p>
        </div>
    );
  }

  if (showResult) {
    const won = quiz.type === 'duel' ? score >= (opponent?.score || 0) : true;
    return (
      <div className="fixed inset-0 z-[500] flex items-center justify-center bg-dark/95 backdrop-blur-xl">
        <div className="bg-surface p-12 rounded-quizyx-lg border border-primary/40 shadow-fuchsia text-center max-w-sm w-full animate-pop-in">
          <div className="text-6xl mb-6 shadow-yellow-glow rounded-full p-4 inline-block">{won ? '🥇' : '💀'}</div>
          <h2 className="text-3xl font-black text-white mb-6 uppercase italic text-glow">{won ? 'Dominacja!' : 'Wyeliminowany'}</h2>
          {quiz.type === 'duel' && (
              <p className="text-white/40 mb-4 font-black text-[10px] uppercase">Ty: <span className="text-secondary">{score}</span> vs Rywal: {opponent?.score || 0}</p>
          )}
          <div className="bg-dark/50 p-6 rounded-quizyx mb-8 font-black text-secondary text-3xl italic shadow-inner border border-white/5">{quiz.type === 'millionaire' || quiz.type === 'money_drop' ? `$${score.toLocaleString()}` : `${score} PKT`}</div>
          <button onClick={() => window.location.reload()} className="w-full py-5 bg-primary text-white font-black rounded-quizyx shadow-fuchsia uppercase italic tracking-widest active:scale-95 transition-all hover:bg-secondary hover:text-dark">Powrót do Bazy</button>
        </div>
      </div>
    );
  }

  const q = quiz.questions[currentIndex];
  if (!q) return <div className="p-20 text-center font-black animate-pulse text-primary italic">Ładowanie Matrycy...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-[90vh] flex flex-col justify-center">
      {quiz.type === 'millionaire' && (
          <div className="flex justify-center gap-4 mb-8">
              <button disabled={!lifelines.fifty} onClick={() => handleLifeline('fifty')} className={`px-6 py-2 rounded-full font-black text-[10px] uppercase border transition-all ${lifelines.fifty ? 'bg-primary/20 border-primary text-white shadow-fuchsia' : 'bg-white/5 border-white/10 text-white/20'}`}>50/50</button>
              <button disabled={!lifelines.phone} onClick={() => handleLifeline('phone')} className={`px-6 py-2 rounded-full font-black text-[10px] uppercase border transition-all ${lifelines.phone ? 'bg-primary/20 border-primary text-white shadow-fuchsia' : 'bg-white/5 border-white/10 text-white/20'}`}>Wsparcie</button>
              <button disabled={!lifelines.audience} onClick={() => handleLifeline('audience')} className={`px-6 py-2 rounded-full font-black text-[10px] uppercase border transition-all ${lifelines.audience ? 'bg-primary/20 border-primary text-white shadow-fuchsia' : 'bg-white/5 border-white/10 text-white/20'}`}>Sonda</button>
          </div>
      )}

      <div className="bg-surface p-10 rounded-quizyx-lg border border-primary/20 shadow-quizyx relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary animate-pulse"></div>
        <div className="flex justify-between items-center mb-10">
            <div>
                <p className="text-secondary font-black uppercase text-[10px] italic tracking-widest text-glow-yellow">{quiz.type.replace('_', ' ')}</p>
                <h3 className="text-white font-black text-2xl italic tracking-tighter">PROTOKÓŁ {currentIndex + 1}</h3>
            </div>
            
            {quiz.type === 'infinity' && (
                <div className="flex flex-col items-center">
                    <div className="flex gap-1.5 mb-1">
                        {[...Array(5)].map((_, i) => (
                            <span key={i} className={`text-xl transition-all duration-300 ${i < lives ? 'text-primary drop-shadow-[0_0_8px_rgba(255,0,0,0.8)]' : 'text-white/10'}`}>
                                {i < lives ? '⚡' : '💀'}
                            </span>
                        ))}
                    </div>
                    <div className="text-[8px] font-black uppercase tracking-widest text-secondary italic">
                        Moc: <span className="text-primary">{streak}</span> / 5 do energii
                    </div>
                </div>
            )}

            <div className="text-right">
                <p className="text-white/20 text-[8px] font-black uppercase tracking-widest">Status: Aktiv</p>
                <p className={`text-xl font-black font-mono ${timeLeft < 10 ? 'text-primary animate-pulse' : 'text-secondary'}`}>{timeLeft}s</p>
            </div>
        </div>

        <h2 className="text-4xl font-black text-white text-center mb-12 italic tracking-tight leading-tight text-glow">{q.content}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {q.answers.map((ans, idx) => {
                const isSelected = selectedAnswers.includes(idx);
                const isHidden = hiddenOptions.includes(idx);
                const bet = bets[idx] || 0;
                if (isHidden) return <div key={idx} className="p-6 rounded-quizyx border-2 border-dashed border-white/5 bg-dark/10 opacity-20"></div>;
                return (
                    <div key={idx} className="relative">
                        <button onClick={() => {
                            if (quiz.type === 'money_drop') return;
                            if (q.type === 'single') setSelectedAnswers([idx]);
                            else setSelectedAnswers(isSelected ? selectedAnswers.filter(a => a !== idx) : [...selectedAnswers, idx]);
                        }}
                        className={`w-full p-6 rounded-quizyx border-2 transition-all text-left font-black italic text-lg flex items-center gap-4 ${isSelected || bet > 0 ? 'border-secondary bg-secondary/10 text-white shadow-yellow-glow scale-105' : 'border-white/5 bg-dark/30 text-white/40 hover:border-primary/40'}`}>
                            <span className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-lg text-xs italic">{String.fromCharCode(65+idx)}</span>
                            <span className="flex-1 leading-none">{ans}</span>
                        </button>
                        {quiz.type === 'money_drop' && !isRevealing && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-dark/80 px-2 py-1 rounded-lg border border-secondary/20">
                                <button onClick={() => handlePlaceBet(idx, -25000)} className="w-8 h-8 bg-white/5 hover:bg-primary text-white rounded flex items-center justify-center font-black transition-colors">-</button>
                                <div className="min-w-[60px] text-center"><span className="text-[10px] text-secondary font-black uppercase block leading-none">Alokacja</span><span className="text-sm text-white font-black">${(bet/1000).toFixed(0)}k</span></div>
                                <button onClick={() => handlePlaceBet(idx, 25000)} className="w-8 h-8 bg-secondary hover:bg-yellow-400 text-dark rounded flex items-center justify-center font-black transition-colors shadow-yellow-glow">+</button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>

        <div className="mt-12 flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1 w-full bg-dark/50 p-6 rounded-quizyx border border-white/5 text-center shadow-inner">
                <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1 italic">{quiz.type === 'money_drop' ? 'W Systemie' : 'Twoja Wygrana'}</p>
                <p className="text-3xl font-black text-secondary italic text-glow-yellow">
                    {quiz.type === 'millionaire' || quiz.type === 'money_drop' ? `$${(quiz.type === 'money_drop' ? (score - Object.values(bets).reduce((a, b) => a + b, 0)) : score).toLocaleString()}` : `${score} PKT`}
                </p>
            </div>
            <button onClick={nextStep} className="flex-[2] w-full py-6 bg-primary text-white font-black rounded-quizyx shadow-fuchsia uppercase italic tracking-widest hover:bg-secondary hover:text-dark transition-all active:scale-95 text-lg">
                {isRevealing ? 'Dekodowanie Zapadni...' : 'Zatwierdź Protokół'}
            </button>
        </div>
      </div>
    </div>
  );
};
