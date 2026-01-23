import React, { useState, useMemo } from 'react';
import { User, QuizType } from '../types';
import { api } from '../services/api';

const ASSETS = {
  avatars: [
    '/assets/profile/avatar1.jpg',
    '/assets/profile/avatar2.jpg',
    '/assets/profile/avatar3.jpg',
    '/assets/profile/avatar4.jpg',
    '/assets/profile/avatar5.jpg',
    '/assets/profile/avatar6.jpg',
    '/assets/profile/avatar7.jpg',
    '/assets/profile/avatar8.jpg',
    '/assets/profile/avatar9.jpg',
    '/assets/profile/avatar10.jpg',
  ],
};

interface ProfileProps {
  user: User;
  onUpdate: (user: User) => void;
  volume: number;
  setVolume: (v: number) => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onUpdate, volume, setVolume }) => {
  const [newUsername, setNewUsername] = useState(user.username);
  const [newAvatar, setNewAvatar] = useState(user.avatarUrl);
  const [avatarSource, setAvatarSource] = useState<'gallery' | 'url'>('gallery'); // ⬅️ nowy stan
  const [customAvatarUrl, setCustomAvatarUrl] = useState(user.avatarUrl);
  const [isEditing, setIsEditing] = useState(false);

  const [historyModeFilter, setHistoryModeFilter] = useState<QuizType | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Synchronizacja: jeśli zmieniamy źródło, ustawiamy newAvatar odpowiednio
  const handleUpdate = async () => {
    let finalAvatarUrl = newAvatar;

    if (avatarSource === 'url') {
      if (!customAvatarUrl.trim()) {
        alert('Proszę podać link do awatara.');
        return;
      }
      finalAvatarUrl = customAvatarUrl;
    } else {
      // gallery — newAvatar już jest ustawiony przez kliknięcie
      if (!newAvatar) {
        alert('Proszę wybrać awatar z galerii.');
        return;
      }
    }

    try {
      const updated = await api.auth.updateProfile(newUsername, finalAvatarUrl);
      onUpdate(updated);
      setIsEditing(false);
    } catch (e: any) {
      alert(e.message || 'Nie udało się zaktualizować profilu.');
    }
  };

  const filteredHistory = useMemo(() => {
    if (!user.history) return [];
    return [...user.history].reverse().filter(res => {
      const matchesMode = historyModeFilter === 'all' || res.quizType === historyModeFilter;
      return matchesMode;
    });
  }, [user.history, historyModeFilter]);

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const currentItems = filteredHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="max-w-5xl mx-auto py-16 px-4">
      {/* ... (header bez zmian) ... */}
      <div className="relative bg-surface rounded-quizyx-lg shadow-quizyx overflow-hidden border border-white/5 mb-16 animate-pop-in">
        <div className="h-64 bg-primary relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primaryHover to-dark opacity-80"></div>
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-surface to-transparent"></div>
        </div>
        <div className="px-12 pb-12 -mt-32 flex flex-col md:flex-row items-center md:items-end gap-12 relative z-10">
          <div className="relative group">
            <img 
              src={user.avatarUrl} 
              className="w-56 h-56 rounded-quizyx-lg border-[10px] border-surface shadow-2xl bg-dark object-cover transition-all group-hover:scale-105 border-primary/20" 
              alt="avatar" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = ASSETS.avatars[0] || '/assets/profile/avatar1.jpg';
              }}
            />
            <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-secondary border-8 border-surface rounded-full shadow-yellow-glow animate-pulse"></div>
          </div>
          <div className="flex-1 text-center md:text-left mb-6">
            <h1 className="text-7xl font-black text-white tracking-tighter italic uppercase text-glow">{user.username}</h1>
            <p className="text-secondary font-black uppercase text-[10px] tracking-[0.6em] mt-3 italic">Ranga: Mistrz Areny</p>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={() => setIsEditing(!isEditing)} className="px-14 py-6 bg-primary text-white font-black rounded-full shadow-fuchsia uppercase italic tracking-widest text-sm active:scale-95 transition-all hover:bg-secondary hover:text-dark">
              {isEditing ? 'Zamknij Panel' : 'Konfiguracja'}
            </button>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="bg-surface rounded-quizyx shadow-quizyx p-16 mb-16 border border-primary/20 animate-pop-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div>
              <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-6 italic">Tożsamość Cyfrowa (Nick)</label>
              <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)}
                     className="w-full px-8 py-6 bg-dark/50 border-2 border-transparent focus:border-primary rounded-quizyx outline-none transition-all font-black text-white text-2xl italic" />
              
              <div className="mt-12 bg-dark/20 p-8 rounded-quizyx border border-white/5">
                <label className="block text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4 italic">Ustawienia Dźwięku (BGM)</label>
                <div className="flex items-center gap-6">
                  <span className="text-2xl">{volume === 0 ? '🔇' : '🔊'}</span>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={volume} 
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="flex-1 accent-primary h-2 rounded-lg cursor-pointer"
                  />
                  <span className="text-white font-black font-mono w-10 text-right">{volume}%</span>
                </div>
                <p className="text-[8px] font-black text-white/20 uppercase mt-4 tracking-widest">Atmosfera: Night City Ambient</p>
              </div>
            </div>
            <div>
              {/* Przełącznik źródła awatara */}
              <div className="flex gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setAvatarSource('gallery')}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-full transition-all ${
                    avatarSource === 'gallery'
                      ? 'bg-primary text-white'
                      : 'bg-dark/50 text-white/50 hover:text-white'
                  }`}
                >
                  Z galerii
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarSource('url')}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-full transition-all ${
                    avatarSource === 'url'
                      ? 'bg-primary text-white'
                      : 'bg-dark/50 text-white/50 hover:text-white'
                  }`}
                >
                  Własny URL
                </button>
              </div>

              {avatarSource === 'gallery' ? (
                <>
                  <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-4 italic">
                    Wybierz awatar
                  </label>
                  <div className="grid grid-cols-5 gap-4">
                    {ASSETS.avatars.map((url, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => setNewAvatar(url)} 
                        className={`relative rounded-xl overflow-hidden border-4 cursor-pointer transition-all ${
                          newAvatar === url 
                            ? 'border-secondary scale-110 shadow-yellow-glow' 
                            : 'border-transparent opacity-50 hover:opacity-100'
                        }`}
                      >
                        <img 
                          src={url} 
                          className="w-full h-16 object-cover" 
                          alt={`Avatar ${idx + 1}`} 
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-4 italic">
                    Link do awatara (https://...)
                  </label>
                  <input
                    type="text"
                    value={customAvatarUrl}
                    onChange={(e) => setCustomAvatarUrl(e.target.value)}
                    placeholder="https://twoj-obraz.jpg"
                    className="w-full px-4 py-3 bg-dark/50 border-2 border-transparent focus:border-primary rounded-quizyx outline-none transition-all text-white text-sm"
                  />
                  {/* Opcjonalny podgląd */}
                  {customAvatarUrl && (
                    <div className="mt-4">
                      <p className="text-[10px] text-white/50 uppercase tracking-widest italic">Podgląd:</p>
                      <img
                        src={customAvatarUrl}
                        alt="Podgląd awatara"
                        className="mt-2 w-16 h-16 object-cover rounded-xl border border-white/20"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.opacity = '0.3';
                        }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <button 
            onClick={handleUpdate} 
            className="mt-16 bg-primary text-white font-black px-16 py-8 rounded-quizyx shadow-fuchsia active:scale-95 transition-all uppercase italic tracking-tighter text-2xl hover:bg-secondary hover:text-dark"
          >
            Zapisz Nowy Protokół
          </button>
        </div>
      )}

      {/* ... (statystyki i historia bez zmian) ... */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1">
          <div className="bg-surface p-12 rounded-quizyx-lg shadow-quizyx border border-white/5 text-center">
            <h2 className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em] mb-12 italic">Statystyki Bojowe</h2>
            <div className="space-y-16">
              <div><p className="text-7xl font-black text-secondary italic tracking-tighter shadow-yellow-glow inline-block">🔥 {user.winstreak}</p><p className="text-[10px] font-black text-white/20 uppercase mt-4 tracking-widest italic">Aktualny Streak</p></div>
              <div className="w-full h-px bg-white/5"></div>
              <div><p className="text-7xl font-black text-primary italic tracking-tighter text-glow">{user.history?.length || 0}</p><p className="text-[10px] font-black text-white/20 uppercase mt-4 tracking-widest italic">Zakończone Areny</p></div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="bg-surface rounded-quizyx-lg shadow-quizyx border border-white/5 overflow-hidden">
            <div className="p-10 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 bg-dark/20">
              <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Historia Logów</h2>
              <div className="flex gap-4">
                <select 
                  className="bg-dark/50 border border-white/10 rounded-full px-6 py-2 text-[9px] font-black text-white uppercase outline-none focus:border-secondary transition-all"
                  value={historyModeFilter}
                  onChange={e => { setHistoryModeFilter(e.target.value as any); setCurrentPage(1); }}
                >
                  <option value="all">Wszystkie Tryby</option>
                  <option value="standard">Standard</option>
                  <option value="millionaire">Milionerzy</option>
                  <option value="money_drop">Money Drop</option>
                  <option value="duel">Duel</option>
                  <option value="infinity">Infinity</option>
                </select>
              </div>
            </div>
            <table className="w-full text-left">
              <thead className="bg-dark/50 text-[10px] font-black text-white/20 uppercase tracking-widest italic">
                <tr className="border-b border-white/5">
                  <th className="px-10 py-6">Data</th>
                  <th className="px-10 py-6">Arena</th>
                  <th className="px-10 py-6 text-right">Zdobycz</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {currentItems.map((res, i) => {
                  const actualTitle = res.quizTitle || (typeof res.quizId === 'object' ? (res.quizId as any)?.title : 'Misja');
                  return (
                    <tr key={i} className="hover:bg-primary/5 transition-colors group">
                      <td className="px-10 py-8 text-xs text-white/30 font-bold">{new Date(res.date).toLocaleDateString()}</td>
                      <td className="px-10 py-8">
                        <p className="font-black text-white text-xl italic tracking-tight group-hover:text-secondary transition-colors">{actualTitle}</p>
                        <p className="text-[8px] text-primary/60 font-black uppercase mt-1">TYP: {res.quizType}</p>
                      </td>
                      <td className="px-10 py-8 text-right font-black text-primary text-3xl italic tracking-tighter group-hover:text-glow">
                        {res.quizType === 'money_drop' || res.quizType === 'millionaire' ? `$${res.score.toLocaleString()}` : `${res.score} PKT`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {totalPages > 1 && (
              <div className="p-8 bg-dark/40 flex justify-between items-center border-t border-white/5">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(c => c - 1)}
                  className="text-primary disabled:text-white/10 font-black uppercase text-xs italic tracking-widest flex items-center gap-2 hover:scale-110 transition-transform"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                  Poprzednie Logi
                </button>
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em] italic">Strona {currentPage} z {totalPages}</span>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(c => c + 1)}
                  className="text-primary disabled:text-white/10 font-black uppercase text-xs italic tracking-widest flex items-center gap-2 hover:scale-110 transition-transform"
                >
                  Dalsze Logi
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            )}

            {filteredHistory.length === 0 && <div className="p-32 text-center text-white/5 font-black uppercase tracking-widest italic text-2xl">Baza danych pusta dla wybranych filtrów</div>}
          </div>
        </div>
      </div>
    </div>
  );
};