
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { User, AdTriggerType, AdLocation, Advertisement, Quiz, QuizDifficulty, QuizType, Result } from './types';
import { api } from './services/api';
import { AdminDashboard } from './pages/AdminDashboard';
import { QuizRoom } from './pages/QuizRoom';
import { AdPopup, AdBanner } from './components/AdComponents';
import { Profile } from './pages/Profile';
import { Leaderboard } from './pages/Leaderboard';
import { Social } from './pages/Social';

// --- BACKGROUND MUSIC HANDLER ---
const BackgroundMusic: React.FC<{ volume: number, videoId: string }> = ({ volume, videoId }) => {
  const playerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const createPlayer = () => {
      if (!(window as any).YT || !(window as any).YT.Player) return;
      
      playerRef.current = new (window as any).YT.Player('youtube-bg-player', {
        height: '0',
        width: '0',
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          loop: 1,
          playlist: videoId,
          controls: 0,
          showinfo: 0,
          autohide: 1,
          modestbranding: 1,
          origin: window.location.origin,
          enablejsapi: 1
        },
        events: {
          onReady: (event: any) => {
            event.target.setVolume(volume);
            event.target.playVideo();
            setIsReady(true);
          },
          onStateChange: (event: any) => {
            if (event.data === (window as any).YT.PlayerState.ENDED) {
              event.target.playVideo();
            }
          }
        },
      });
    };

    if (!(window as any).YT || !(window as any).YT.Player) {
      (window as any).onYouTubeIframeAPIReady = createPlayer;
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
    } else {
      createPlayer();
    }

    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, []);

  // Sync volume changes
  useEffect(() => {
    if (isReady && playerRef.current && typeof playerRef.current.setVolume === 'function') {
      playerRef.current.setVolume(volume);
    }
  }, [volume, isReady]);

  // Handle videoId changes (Switch music when entering/leaving ad page)
  useEffect(() => {
    if (isReady && playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
      playerRef.current.loadVideoById({
        videoId: videoId,
        startSeconds: 0
      });
    }
  }, [videoId, isReady]);

  return <div id="youtube-bg-player" className="fixed -z-50 opacity-0 pointer-events-none w-0 h-0 overflow-hidden"></div>;
};

// --- FUNCTIONAL SCAM CASINO PAGE ---
const CasinoScam: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [reels, setReels] = useState(['🎲', '🎲', '🎲']);
  const [isRolling, setIsRolling] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const symbols = ['🎲', '🐉', '💰', '💎', '⚔️', '🔥', '👑', '🧙‍♂️'];

  const roll = () => {
    if (isRolling) return;
    setIsRolling(true);
    setShowWin(false);

    let iterations = 0;
    const interval = setInterval(() => {
      setReels([
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)]
      ]);
      iterations++;
      if (iterations > 20) {
        clearInterval(interval);
        setReels(['⁶', '🤷', '⁷']);
        setIsRolling(false);
        setShowWin(true);
      }
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-[10000] scam-casino-bg flex flex-col items-center justify-center p-4 md:p-6 text-center animate-pop-in overflow-y-auto">
      <button
        onClick={onBack}
        className="fixed top-4 left-4 z-[10001] bg-black/60 hover:bg-black text-white/50 hover:text-white font-black text-[10px] uppercase tracking-widest transition-all px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm"
      >
        ← POWRÓT DO PRZEGLĄDARKI
      </button>

      {/* STAŁY kontener — nie zmienia wysokości */}
      <div className="max-w-lg w-full bg-black/90 backdrop-blur-md border-[8px] md:border-[12px] border-secondary p-4 md:p-8 rounded-quizyx-lg md:rounded-epal-lg shadow-gold-glow relative overflow-hidden my-auto min-h-[600px] flex flex-col justify-between">
        <div className="absolute top-4 left-4 text-xl md:text-2xl animate-bounce">🎰</div>
        <div className="absolute top-4 right-4 text-xl md:text-2xl animate-bounce">🎰</div>

        <div>
          <h1 className="text-3xl md:text-5xl font-black text-secondary uppercase italic tracking-tighter mb-1 md:mb-2 animate-flash-gold">
            ONE MORE SPIN
          </h1>
          <h2 className="text-lg md:text-2xl font-black text-white uppercase italic tracking-[0.2em] mb-4 md:mb-6">
            LEGENDARY SLOTS
          </h2>
        </div>

        <div className="flex justify-center gap-2 md:gap-4 mb-4 md:mb-8">
          {reels.map((symbol, i) => (
            <div
              key={i}
              className={`w-16 h-24 sm:w-20 sm:h-32 md:w-28 md:h-40 bg-dark border-2 md:border-4 border-secondary rounded-quizyx flex items-center justify-center text-2xl sm:text-4xl md:text-6xl shadow-inner relative overflow-hidden ${
                isRolling ? 'animate-pulse' : ''
              }`}
            >
              <div className={isRolling ? 'animate-bounce' : ''}>{symbol}</div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
            </div>
          ))}
        </div>

        {/* Zarezerwowane miejsce na JACKPOT – zawsze zajęte */}
        <div
          className={`mb-4 md:mb-8 transition-opacity duration-300 ${
            showWin ? 'opacity-100 animate-bounce' : 'opacity-0 invisible'
          }`}
        >
          <h3 className="text-xl md:text-3xl font-black text-white text-glow shadow-gold-glow bg-primary px-3 md:px-6 py-1 md:py-2 rotate-3 inline-block">
            JACKPOT!!!
          </h3>
          <p className="text-secondary font-black text-sm md:text-lg mt-2">
            1,000,000 GOLD COINS WON!
          </p>
        </div>

        <div className="space-y-2 md:space-y-4">
          <button
            onClick={roll}
            disabled={isRolling}
            className={`w-full py-2 md:py-4 bg-gradient-to-r from-secondary via-yellow-400 to-secondary text-dark font-black text-xl md:text-2xl rounded-quizyx shadow-gold-glow transition-all uppercase italic tracking-widest border-2 md:border-4 border-white ${
              isRolling ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
            }`}
          >
            {isRolling ? 'ROLLING...' : 'ZAKRĘĆ TERAZ!'}
          </button>

          <div className="p-2 md:p-3 bg-primary/20 border border-primary/40 rounded-lg">
            <p className="text-white font-black uppercase text-[8px] md:text-xs italic tracking-widest">
              Enter your identity scroll (Credit Card) to claim your hoard!
            </p>
            <input
              type="text"
              placeholder="IDENTITY SCROLL NUMBER"
              className="mt-2 w-full bg-black/40 border border-secondary/40 p-2 md:p-3 rounded text-center text-secondary font-black placeholder:text-white/10 outline-none focus:border-secondary text-xs md:text-sm"
            />
          </div>

          <p className="text-white/30 text-[6px] md:text-[8px] font-black uppercase italic tracking-widest animate-pulse mt-2">
            * By rolling you agree to sacrifice your soul to the Ancient Dragon. Non-refundable.
          </p>
        </div>
      </div>
    </div>
  );
};

// --- FRONTPANEL (HOME) ---
const Home: React.FC<{ startQuiz: (q: Quiz) => void, banners: Advertisement[], onNavigate: (path: string) => void }> = ({ startQuiz, banners, onNavigate }) => {
  const [popularQuizzes, setPopularQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.quizzes.getAll()
      .then(res => setPopularQuizzes(res.slice(0, 4)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-16 animate-pop-in">
      <div className="relative mb-32 pt-16">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-primary/20 blur-[150px] rounded-full pointer-events-none"></div>
        <div className="text-center md:text-left relative z-10">
          <h1 className="text-6xl md:text-[10rem] font-black text-white tracking-tighter leading-none mb-8 italic">
            <span className="text-glow">DOŁĄCZ</span> DO <br/>
            <span className="text-secondary underline decoration-primary decoration-8 underline-offset-4 italic">ARENY</span>
          </h1>
          <p className="max-w-2xl text-white/50 font-black uppercase text-xl md:text-2xl tracking-widest leading-relaxed italic mb-12">
            Wyrzeźbij swój umysł w ogniu walki. Quizyx to jedyne miejsce, gdzie Twoja wiedza staje się Twoją bronią.
          </p>
          <div className="flex flex-wrap gap-6 justify-center md:justify-start">
            <button onClick={() => onNavigate('/quizzes')} className="bg-primary text-white px-10 md:px-16 py-6 md:py-8 rounded-quizyx-lg font-black text-xl md:text-2xl shadow-fuchsia hover:bg-white hover:text-primary transition-all uppercase italic tracking-widest border-2 border-primary">
              Wstąp na Arenę
            </button>
            <button onClick={async () => {
                const q = await api.quizzes.getInfinityQuestions();
                startQuiz(q);
            }} className="bg-dark/50 text-secondary border-2 border-secondary px-10 md:px-16 py-6 md:py-8 rounded-quizyx-lg font-black text-xl md:text-2xl hover:bg-secondary hover:text-dark transition-all uppercase italic tracking-widest shadow-yellow-glow">
              Infinity Mode ♾️
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-32">
        <div className="bg-surface/40 backdrop-blur-md p-10 border-l-4 border-primary rounded-r-quizyx">
          <p className="text-5xl font-black text-white italic tracking-tighter">1.2M+</p>
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mt-2 italic">Aktywnych Wojowników</p>
        </div>
        <div className="bg-surface/40 backdrop-blur-md p-10 border-l-4 border-secondary rounded-r-quizyx">
          <p className="text-5xl font-black text-white italic tracking-tighter">50K</p>
          <p className="text-[10px] font-black text-secondary uppercase tracking-[0.4em] mt-2 italic">Misji w Bazie</p>
        </div>
        <div className="bg-surface/40 backdrop-blur-md p-10 border-l-4 border-white rounded-r-quizyx">
          <p className="text-5xl font-black text-white italic tracking-tighter">$1M+</p>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mt-2 italic">Wypłaconych Nagród</p>
        </div>
      </div>

      <div className="mb-20">
        <div className="flex justify-between items-end mb-12 border-b border-white/10 pb-6">
          <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Popularne <span className="text-primary text-glow">Transmisje</span></h2>
          <button onClick={() => onNavigate('/quizzes')} className="text-secondary font-black uppercase text-[10px] tracking-widest hover:underline italic">Zobacz wszystkie misje →</button>
        </div>
        
        {loading ? (
          <div className="h-48 flex items-center justify-center text-primary font-black animate-pulse uppercase italic text-lg">Inicjalizacja popularności...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {popularQuizzes.map(quiz => (
              <div key={quiz._id} onClick={() => startQuiz(quiz)} className="group bg-card/40 backdrop-blur-sm rounded-quizyx shadow-quizyx border border-white/5 overflow-hidden cursor-pointer transition-all hover:border-primary transform hover:-translate-y-2">
                <div className="h-52 bg-dark relative overflow-hidden">
                    <img src={`https://picsum.photos/seed/${quiz._id}/500/400`} className="w-full h-full object-cover opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" alt="quiz" />
                    <div className="absolute top-5 left-5 bg-primary text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">{quiz.type.replace('_', ' ')}</div>
                </div>
                <div className="p-8">
                    <h3 className="text-2xl font-black text-white mb-4 group-hover:text-primary transition-colors leading-tight tracking-tight">{quiz.title}</h3>
                    <p className="text-white/30 text-[10px] uppercase font-black tracking-widest italic group-hover:text-white transition-colors">Zagraj teraz i zdobądź sławę</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {banners.length > 0 && <div className="mt-12">{banners.map(b => <AdBanner key={b._id} ad={b} onNavigateToScam={() => onNavigate('/casino')} />)}</div>}
    </div>
  );
};

// --- FULL QUIZ PANEL PAGE ---
const QuizzesPage: React.FC<{ startQuiz: (q: Quiz) => void }> = ({ startQuiz }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modeFilter, setModeFilter] = useState<QuizType | 'all'>('all');
  const [diffFilter, setDiffFilter] = useState<QuizDifficulty | 'all'>('all');
  
  useEffect(() => {
    api.quizzes.getAll()
      .then(setQuizzes)
      .finally(() => setLoading(false));
  }, []);

  const filteredQuizzes = quizzes.filter(q => {
      const matchesSearch = q.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMode = modeFilter === 'all' || q.type === modeFilter;
      const matchesDiff = diffFilter === 'all' || q.difficulty === diffFilter;
      return matchesSearch && matchesMode && matchesDiff;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-16 animate-pop-in">
      <div className="mb-16">
        <h1 className="text-6xl font-black text-white italic uppercase tracking-tighter mb-4">Centrum <span className="text-primary text-glow">Operacyjne</span></h1>
        <p className="text-white/30 font-black uppercase text-[10px] tracking-[0.5em] italic">Wybierz misję i udowodnij swoją wartość</p>
      </div>

      <div className="bg-surface/80 backdrop-blur-md p-8 rounded-quizyx-lg border border-primary/20 shadow-quizyx mb-12 border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block italic">Identyfikacja Misji</label>
                  <input 
                      type="text" 
                      placeholder="WPISZ KRYPTONIM..." 
                      className="w-full bg-dark/40 border border-primary/20 p-5 rounded-quizyx text-white font-black outline-none focus:border-primary transition-all placeholder:text-white/10"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                  />
              </div>
              <div>
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block italic">Protokół Gry</label>
                  <select 
                      className="w-full bg-dark/40 border border-primary/20 p-5 rounded-quizyx text-white font-black outline-none focus:border-primary transition-all uppercase text-xs"
                      value={modeFilter}
                      onChange={e => setModeFilter(e.target.value as any)}
                  >
                      <option value="all">Wszystkie</option>
                      <option value="standard">Standard</option>
                      <option value="millionaire">Milionerzy</option>
                      <option value="money_drop">Money Drop</option>
                      <option value="duel">Duel 1v1</option>
                      <option value="infinity">Infinity</option>
                  </select>
              </div>
              <div>
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block italic">Poziom Zagrożenia</label>
                  <select 
                      className="w-full bg-dark/40 border border-primary/20 p-5 rounded-quizyx text-white font-black outline-none focus:border-primary transition-all uppercase text-xs"
                      value={diffFilter}
                      onChange={e => setDiffFilter(e.target.value as any)}
                  >
                      <option value="all">Wszystkie</option>
                      <option value="easy">Łatwy</option>
                      <option value="medium">Średni</option>
                      <option value="hard">Trudny</option>
                  </select>
              </div>
          </div>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center text-primary font-black animate-pulse uppercase italic text-2xl">Pobieranie danych misji...</div>
      ) : filteredQuizzes.length > 0 ? (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {filteredQuizzes.map(quiz => (
            <div key={quiz._id} onClick={() => startQuiz(quiz)} className="group bg-card/60 backdrop-blur-sm rounded-quizyx shadow-quizyx border border-white/10 overflow-hidden cursor-pointer transition-all hover:border-primary transform hover:-translate-y-2">
              <div className="h-52 bg-dark relative overflow-hidden">
                  <img src={`https://picsum.photos/seed/${quiz._id}/500/400`} className="w-full h-full object-cover opacity-30 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" alt="quiz" />
                  <div className="absolute top-5 left-5 bg-primary text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">{quiz.type.replace('_', ' ')}</div>
                  <div className="absolute top-5 right-5 bg-secondary text-dark text-[8px] font-black px-3 py-1 rounded-full uppercase border border-dark/10 shadow-yellow-glow">{quiz.difficulty}</div>
              </div>
              <div className="p-8">
                  <h3 className="text-2xl font-black text-white mb-4 group-hover:text-primary transition-all leading-tight tracking-tight">{quiz.title}</h3>
                  <div className="flex items-center justify-between text-[10px] font-black uppercase text-white/50 tracking-widest">
                      <span>{quiz.questions.length} wyzwań</span>
                      <span className="text-primary italic group-hover:text-glow-yellow group-hover:text-secondary group-hover:translate-x-2 transition-all">Start →</span>
                  </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-32 bg-surface/50 rounded-quizyx-lg border border-dashed border-primary/20">
            <p className="text-white/20 font-black text-2xl uppercase italic tracking-widest">Brak danych misji spełniających kryteria</p>
        </div>
      )}
    </div>
  );
};

// --- AUTH COMPONENT ---
const AuthPage = ({ onLogin, initialReg = false }: { onLogin: (u: User) => void, initialReg?: boolean }) => {
    const [form, setForm] = useState({ email: '', password: '', username: '' });
    const [isReg, setIsReg] = useState(initialReg);
    const [authLoading, setAuthLoading] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthLoading(true);
        try {
            const u = isReg 
                ? await api.auth.register(form) 
                : await api.auth.login(form.email, form.password);
            onLogin(u);
        } catch(e: any) {
            alert(e.message || "Błąd autoryzacji.");
        } finally {
            setAuthLoading(false);
        }
    };

    return (
        <div className="min-h-[90vh] flex items-center justify-center p-6">
            <form onSubmit={submit} className="bg-surface/90 backdrop-blur-xl p-10 md:p-16 rounded-quizyx-lg border border-primary/60 w-full max-w-md shadow-fuchsia animate-pop-in">
                <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center text-4xl font-black text-white shadow-fuchsia mb-10 mx-auto rotate-12">Q</div>
                <h2 className="text-3xl font-black text-white mb-8 text-center tracking-tighter uppercase italic text-glow">
                    {isReg ? 'Rejestracja' : 'Brama Logowania'}
                </h2>
                <div className="space-y-4 mb-10">
                    {isReg && (
                        <input required className="w-full bg-dark/60 p-5 rounded-quizyx border border-white/5 text-white font-black outline-none focus:border-primary" placeholder="NICK" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
                    )}
                    <input required type="email" className="w-full bg-dark/60 p-5 rounded-quizyx border border-white/5 text-white font-black outline-none focus:border-primary" placeholder="EMAIL" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                    <input required type="password" className="w-full bg-dark/60 p-5 rounded-quizyx border border-white/5 text-white font-black outline-none focus:border-primary" placeholder="HASŁO" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                </div>
                <button disabled={authLoading} className="w-full bg-primary py-5 rounded-quizyx font-black text-white shadow-fuchsia uppercase tracking-widest text-sm italic active:scale-95 transition-all hover:bg-secondary hover:text-dark">
                    {authLoading ? 'ŁĄCZENIE...' : (isReg ? 'INICJALIZUJ' : 'ZALOGUJ')}
                </button>
                <button type="button" onClick={() => setIsReg(!isReg)} className="w-full mt-8 text-[9px] font-black uppercase text-white/40 hover:text-secondary transition-colors tracking-widest italic">
                    {isReg ? 'Powrót do logowania' : 'Nie masz konta? Załóż profil'}
                </button>
            </form>
        </div>
    );
};

// --- MAIN APP ---
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [route, setRoute] = useState<string>('/');
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [volume, setVolume] = useState(() => Number(localStorage.getItem('app_volume') || '50'));
  
  const [activePopupAd, setActivePopupAd] = useState<Advertisement | null>(null);
  const [homeBanners, setHomeBanners] = useState<Advertisement[]>([]);

  // Music state: switch between default and ad-related music
  const currentVideoId = route === '/casino' ? 'lPsQUY8Cgqg' : '56K5mhMf0ww';

  const triggerAd = useCallback(async (type: AdTriggerType) => {
    try {
        const ads = await api.ads.getActive();
        if (Array.isArray(ads)) {
          const matches = ads.filter((a: Advertisement) => a.active && a.triggerType === type).sort((a: Advertisement, b: Advertisement) => b.priority - a.priority);
          const specialAd = matches.find((a: Advertisement) => a.location === AdLocation.POPUP || a.location === AdLocation.FULLSCREEN);
          if (specialAd) {
              setActivePopupAd(specialAd);
          }
        }
    } catch(e) {}
  }, []);

  useEffect(() => {
    const init = async () => {
        const token = localStorage.getItem('token');
        if (!token) { setLoading(false); return; }
        try { const u = await api.auth.getMe(); setUser(u); } catch (e) { localStorage.removeItem('token'); setUser(null); }
        finally { setLoading(false); }
    };
    init();
  }, []);

  useEffect(() => {
    localStorage.setItem('app_volume', volume.toString());
  }, [volume]);

  useEffect(() => {
      if (route === '/') {
          api.ads.getActive().then(ads => setHomeBanners(ads.filter((a: Advertisement) => a.location === AdLocation.HOME_TOP && a.active)));
      } else if (route === '/profile' && user) {
          triggerAd(AdTriggerType.ON_PROFILE_VIEW);
      } else if (route === '/social' && user) {
          triggerAd(AdTriggerType.ON_SOCIAL_VIEW);
      }
  }, [route, triggerAd, user]);

  const startQuiz = useCallback((q: Quiz) => {
      if (!user) { setRoute('/login'); return; }
      triggerAd(AdTriggerType.ON_QUIZ_START);
      setActiveQuiz(q);
      setRoute('/quiz');
  }, [triggerAd, user]);

  const handleChallengeAccepted = useCallback(async (quizId: string) => {
      try { const all = await api.quizzes.getAll(); const q = all.find(x => x._id === quizId || x.type === 'duel'); if (q) startQuiz(q); } catch (err) { alert("Błąd transferu."); }
  }, [startQuiz]);

  const handleLogin = (u: User) => { setUser(u); setRoute('/'); triggerAd(AdTriggerType.ON_LOGIN); };
  const handleLogout = () => { api.auth.logout(); setUser(null); setRoute('/'); };

  const renderContent = () => {
    if (loading) return <div className="h-screen flex items-center justify-center text-primary font-black animate-pulse text-4xl italic tracking-tighter uppercase">Inicjalizacja...</div>;
    
    if (route === '/casino') return <CasinoScam onBack={() => setRoute('/')} />;

    const appContent = (() => {
        if (route === '/login') return <AuthPage onLogin={handleLogin} />;
        if (route === '/profile' && user) return <Profile user={user} onUpdate={setUser} volume={volume} setVolume={setVolume} />;
        if (route === '/leaderboard') return <Leaderboard />;
        if (route === '/social' && user) return <Social onChallenge={handleChallengeAccepted} />;
        if (route === '/admin' && user?.role === 'admin') return <AdminDashboard />;
        if (route === '/quizzes') return <QuizzesPage startQuiz={startQuiz} />;
        if (route === '/quiz' && activeQuiz && user) return <QuizRoom quiz={activeQuiz} userId={user._id} onFinish={() => setRoute('/')} triggerAd={triggerAd} />;
        return <Home startQuiz={startQuiz} banners={homeBanners} onNavigate={setRoute} />;
    })();

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar user={user} onLogout={handleLogout} onNavigate={setRoute} volume={volume} />
            <main className="flex-1 pb-20">{appContent}</main>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-transparent text-white selection:bg-primary/30">
      <BackgroundMusic volume={volume} videoId={currentVideoId} />
      {renderContent()}
      
      {activePopupAd && (
          <AdPopup 
            ad={activePopupAd} 
            onClose={() => setActivePopupAd(null)} 
            onNavigateToScam={() => {
                setActivePopupAd(null);
                setRoute('/casino');
            }} 
          />
      )}
    </div>
  );
}