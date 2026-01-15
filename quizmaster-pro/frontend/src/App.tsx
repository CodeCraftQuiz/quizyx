import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { User, AdTriggerType, AdLocation, Advertisement, Quiz, Result, QuestionType, QuizDifficulty } from './types';
import { api } from './services/api';
import { AdminDashboard } from './pages/AdminDashboard';
import { QuizRoom } from './pages/QuizRoom';
import { AdPopup, AdBanner } from './components/AdComponents';
import { Profile } from './pages/Profile';
import { Leaderboard } from './pages/Leaderboard';
import { Social } from './pages/Social';

// Pages
const Home: React.FC<{ startQuiz: (q: Quiz) => void }> = ({ startQuiz }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  
  useEffect(() => {
    api.quizzes.getAll().then(setQuizzes).catch(err => console.error("Failed to load quizzes", err));
  }, []);

  // Handler for Infinity Mode Button
  const startInfinity = async () => {
      const q = await api.quizzes.getInfinityQuestions();
      startQuiz(q);
  };

  const getDifficultyColor = (diff: QuizDifficulty) => {
      switch(diff) {
          case QuizDifficulty.EASY: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
          case QuizDifficulty.MEDIUM: return 'bg-amber-100 text-amber-800 border-amber-200';
          case QuizDifficulty.HARD: return 'bg-rose-100 text-rose-800 border-rose-200';
          default: return 'bg-slate-100 text-slate-800';
      }
  };

  const getTypeIcon = (type: string) => {
      switch(type) {
          case 'exam': return '🎓';
          case 'duel': return '⚔️';
          case 'millionaire': return '💰';
          case 'infinity': return '♾️';
          default: return '📝';
      }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-16 relative">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-blue-200/50 blur-[80px] -z-10 rounded-full"></div>
        <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
          Witaj w <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Quizyx</span>
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-600">
          Wybierz tryb gry, rywalizuj ze znajomymi i zdobywaj nowe osiągnięcia w świecie wiedzy.
        </p>
        <button onClick={startInfinity} className="mt-8 group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-slate-900 font-pj rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 hover:bg-slate-800 hover:shadow-lg hover:-translate-y-1">
            <span className="mr-2 text-2xl">♾️</span> Start Tryb Nieskończoności
            <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 opacity-20 group-hover:opacity-40 blur-lg transition-opacity duration-200" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {quizzes.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 py-10">Brak dostępnych quizów. Uruchom serwer backendu!</div>
        ) : quizzes.map(quiz => (
          <div key={quiz._id} 
               className="group bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-1"
               onClick={() => startQuiz(quiz)}>
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full border ${getDifficultyColor(quiz.difficulty)}`}>
                        {quiz.difficulty === 'easy' ? 'Łatwy' : quiz.difficulty === 'medium' ? 'Średni' : 'Trudny'}
                    </span>
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-lg">
                        {getTypeIcon(quiz.type)}
                    </div>
                </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-primary transition-colors">{quiz.title}</h3>
              <p className="text-sm text-slate-500 line-clamp-2">{quiz.description || 'Sprawdź swoją wiedzę w tym quizie.'}</p>
              
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">{quiz.questions.length} pytań</span>
                  <span className="text-sm font-bold text-primary flex items-center">
                      Zagraj <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                  </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AuthPage: React.FC<{ onLogin: (u: User) => void }> = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        let user;
        if (isRegister) {
            user = await api.auth.register({ username, email, password });
        } else {
            user = await api.auth.login(email, password);
        }
        onLogin(user);
    } catch (err: any) {
        setError(err.message || 'Wystąpił błąd logowania');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-slate-900">
            {isRegister ? 'Utwórz konto' : 'Zaloguj się'}
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500">
             Wskazówka: Zarejestruj się jako <b>admin</b>, aby uzyskać dostęp do panelu administratora.
          </p>
        </div>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded text-sm text-center">{error}</div>}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            {isRegister && (
                <div>
                <input
                    name="username"
                    type="text"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                    placeholder="Nazwa użytkownika"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                />
                </div>
            )}
            <div>
              <input
                name="email"
                type="email"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 ${!isRegister ? 'rounded-t-md' : ''} focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm`}
                placeholder="Adres Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Hasło"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-primary hover:bg-primaryHover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-lg shadow-blue-200 transition-all disabled:bg-gray-400">
            {loading ? 'Przetwarzanie...' : (isRegister ? 'Zarejestruj się' : 'Zaloguj się')}
          </button>
        </form>

        <div className="text-center mt-4">
            <button onClick={() => { setIsRegister(!isRegister); setError(''); }} className="text-sm text-primary hover:underline">
                {isRegister ? 'Masz już konto? Zaloguj się' : 'Nie masz konta? Zarejestruj się'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [route, setRoute] = useState<string>('/');
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Restore Session
  useEffect(() => {
      const restoreSession = async () => {
          const token = localStorage.getItem('token');
          if (token) {
              try {
                  const userData = await api.auth.getMe();
                  setUser(userData);
                  // Trigger ads only if restoration successful
                  fetchAndTriggerAds(AdTriggerType.ON_LOGIN);
              } catch (e) {
                  console.error("Session expired or invalid");
                  localStorage.removeItem('token');
              }
          }
          setLoadingSession(false);
      };
      restoreSession();
  }, []);
  
  // Ad State
  const [activeAd, setActiveAd] = useState<Advertisement | null>(null);
  const [homeBanner, setHomeBanner] = useState<Advertisement | null>(null);

  const fetchAndTriggerAds = useCallback(async (trigger: AdTriggerType) => {
      try {
          const allAds = await api.ads.getActive();
          // Filter by trigger
          const matches = allAds.filter(a => a.triggerType === trigger).sort((a, b) => b.priority - a.priority);
          
          if (matches.length > 0) {
              const topAd = matches[0];
              if (topAd.location === AdLocation.POPUP || topAd.location === AdLocation.FULLSCREEN) {
                  setActiveAd(topAd);
              }
          }
      } catch (e) { console.error("Ads error", e); }
  }, []);

  // Handle Route Based Ad Triggers
  useEffect(() => {
      if (route === '/profile') {
          fetchAndTriggerAds(AdTriggerType.ON_PROFILE_VIEW);
      } else if (route === '/social') {
          fetchAndTriggerAds(AdTriggerType.ON_SOCIAL_VIEW);
      }
  }, [route, fetchAndTriggerAds]);

  // Fetch Home Banner
  useEffect(() => {
    const loadBanners = async () => {
        try {
            const allAds = await api.ads.getActive();
            const banner = allAds.find(a => a.location === AdLocation.HOME_TOP);
            if (banner) setHomeBanner(banner);
        } catch(e) {}
    };
    loadBanners();
  }, [route]);

  const handleLogin = (u: User) => {
    setUser(u);
    setRoute('/');
    fetchAndTriggerAds(AdTriggerType.ON_LOGIN);
  };

  const handleLogout = () => {
      api.auth.logout();
      setUser(null);
      setRoute('/login');
  };

  const startQuiz = (q: Quiz) => {
      fetchAndTriggerAds(AdTriggerType.ON_QUIZ_START);
      setActiveQuiz(q);
      setRoute('/quiz');
  };

  // Logic to handle 1v1 challenge from Social Page
  const handleFriendChallenge = (friendName: string) => {
      // Create a temporary duel quiz
      const duelQuiz: Quiz = {
          _id: `duel_vs_${friendName}`,
          title: `Pojedynek vs ${friendName}`,
          type: 'duel',
          difficulty: QuizDifficulty.MEDIUM,
          timeLimit: 60,
          questions: [
              { content: 'Pytanie Pojedynkowe 1: Szybka matma: 12 * 12?', answers: ['124','144','148'], correctAnswers: [1], type: QuestionType.SINGLE },
              { content: 'Pytanie Pojedynkowe 2: Stolica Japonii?', answers: ['Kyoto','Osaka','Tokyo'], correctAnswers: [2], type: QuestionType.SINGLE },
              { content: 'Pytanie Pojedynkowe 3: Co oznacza skrót HTML?', answers: ['HyperText Markup Language', 'HighText Machine Language'], correctAnswers: [0], type: QuestionType.SINGLE }
          ]
      };
      startQuiz(duelQuiz);
  };

  const handleQuizFinish = (res: Result) => {
      // Optimistic local update (backend submit happens in QuizRoom via API)
      if (user) {
          let newWinstreak = user.winstreak || 0;
          
          if (activeQuiz?.type === 'duel') {
             if (res.score >= (res.maxScore * 0.5)) {
                 newWinstreak++;
             } else {
                 newWinstreak = 0;
             }
          }

          const newResult = {
              ...res, 
              quizTitle: activeQuiz?.title || (activeQuiz?.type === 'infinity' ? 'Tryb Nieskończoności' : 'Nieznany Quiz'),
              _id: Date.now().toString()
          };
          
          setUser({
              ...user, 
              winstreak: newWinstreak,
              history: [...user.history, newResult]
          });
      }

      setActiveQuiz(null);
      setRoute('/');
  };

  const renderContent = () => {
    if (loadingSession) return <div className="min-h-screen flex items-center justify-center text-primary">Ładowanie sesji...</div>;

    if (route === '/login') return <AuthPage onLogin={handleLogin} />;
    
    // Protected Routes
    if (route === '/admin') {
         if (user?.role === 'admin') return <AdminDashboard />;
         return <div className="p-8 text-center text-rose-500 font-bold">Brak uprawnień administratora.</div>;
    }
    
    if (route === '/profile' && user) return <Profile user={user} onUpdate={setUser} />;
    if (route === '/leaderboard') return <Leaderboard />;
    if (route === '/social' && user) return <Social onChallenge={handleFriendChallenge} />;

    if (route === '/quiz' && activeQuiz && user) {
        return <QuizRoom quiz={activeQuiz} userId={user._id} onFinish={handleQuizFinish} triggerAd={fetchAndTriggerAds} />;
    } else if (route === '/quiz' && !user) {
        setRoute('/login');
        return null;
    }

    return (
        <>
            {homeBanner && <div className="max-w-7xl mx-auto px-4"><AdBanner ad={homeBanner} /></div>}
            <Home startQuiz={startQuiz} />
        </>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Navbar user={user} onLogout={handleLogout} onNavigate={setRoute} />
      <main>
        {renderContent()}
      </main>
      
      {activeAd && (
          <AdPopup ad={activeAd} onClose={() => setActiveAd(null)} />
      )}
    </div>
  );
}