
import React from 'react';
import { User, UserRole } from '../types';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onNavigate: (path: string) => void;
  volume: number;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onNavigate, volume }) => {
  const isAdmin = user?.role === UserRole.ADMIN;

  return (
    <nav className="bg-surface/80 backdrop-blur-xl sticky top-0 z-50 border-b border-primary/30 shadow-2xl">
      <div className="max-w-7xl mx-auto px-8 h-20 flex justify-between items-center">
        <div className="flex items-center gap-12">
            <div className="text-3xl font-black text-white tracking-tighter cursor-pointer group" onClick={() => onNavigate('/')}>
                <span className="text-secondary underline decoration-primary group-hover:decoration-secondary transition-all">Q</span>UIZYX
            </div>
            <div className="hidden md:flex gap-8 text-[10px] font-black uppercase tracking-widest text-white/40">
                <button onClick={() => onNavigate('/quizzes')} className="hover:text-primary transition-colors">Quizy</button>
                <button onClick={() => onNavigate('/leaderboard')} className="hover:text-primary transition-colors">Ranking</button>
                {user && (
                  <button onClick={() => onNavigate('/social')} className="hover:text-primary transition-colors text-glow-yellow">Społeczność</button>
                )}
                {isAdmin && (
                    <button onClick={() => onNavigate('/admin')} className="text-secondary hover:text-white transition-colors border border-secondary/20 px-4 py-1 rounded-full bg-secondary/5 shadow-yellow-glow">Admin Panel</button>
                )}
            </div>
        </div>
        <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-2 mr-4 text-white/40 font-black text-[9px] uppercase tracking-tighter">
              <span className={volume > 0 ? 'text-primary' : ''}>{volume > 0 ? '🔊' : '🔇'}</span>
              <span>Audio: {volume}%</span>
            </div>
            {user ? (
                <div className="flex items-center gap-4 bg-dark/80 p-1 pr-6 rounded-full border border-primary/20 shadow-quizyx">
                    <img src={user.avatarUrl} className="w-10 h-10 rounded-full cursor-pointer hover:scale-110 transition-transform object-cover border-2 border-primary/40 shadow-fuchsia" onClick={() => onNavigate('/profile')} />
                    <div className="hidden sm:block">
                        <p className="text-xs font-black text-white leading-none tracking-tight">{user.username}</p>
                        <p className="text-[9px] font-bold text-secondary uppercase mt-1">🔥 {user.winstreak} streak</p>
                    </div>
                    <button onClick={onLogout} className="ml-4 text-white/20 hover:text-primary transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
                    </button>
                </div>
            ) : (
                <div className="flex gap-4">
                  <button onClick={() => onNavigate('/login')} className="text-[10px] font-black uppercase text-white/40 hover:text-white transition-colors tracking-widest italic">Rekrutacja</button>
                  <button onClick={() => onNavigate('/login')} className="bg-primary text-white px-8 py-3 rounded-full font-black text-xs uppercase shadow-fuchsia hover:bg-secondary hover:text-dark transition-all border border-white/10">Połącz</button>
                </div>
            )}
        </div>
      </div>
    </nav>
  );
};
