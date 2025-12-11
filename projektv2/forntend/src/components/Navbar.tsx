import React from 'react';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onNavigate }) => {
  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center cursor-pointer group" onClick={() => onNavigate('/')}>
              <span className="font-extrabold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 group-hover:from-blue-500 group-hover:to-cyan-500 transition-all">
                  Quizyx
              </span>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-4 items-center">
              <button onClick={() => onNavigate('/')} className="text-slate-600 hover:text-primary hover:bg-blue-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors">Quizy</button>
              <button onClick={() => onNavigate('/leaderboard')} className="text-slate-600 hover:text-primary hover:bg-blue-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors">Ranking</button>
              <button onClick={() => onNavigate('/social')} className="text-slate-600 hover:text-primary hover:bg-blue-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors">Społeczność</button>
              {user?.role === 'admin' && (
                <button onClick={() => onNavigate('/admin')} className="text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-lg text-sm font-bold transition-colors">Admin Panel</button>
              )}
            </div>
          </div>
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="hidden md:flex flex-col items-end mr-2">
                    {user.winstreak > 0 && (
                         <span className="text-xs text-orange-500 font-bold bg-orange-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                             🔥 {user.winstreak}
                         </span>
                    )}
                </div>
                <button onClick={() => onNavigate('/profile')} className="flex items-center space-x-2 text-slate-700 font-bold hover:text-primary transition group">
                    <img src={user.avatarUrl} alt="avatar" className="h-9 w-9 rounded-full border-2 border-slate-200 group-hover:border-primary object-cover transition-colors" />
                    <span>{user.username}</span>
                </button>
                <button
                  onClick={onLogout}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Wyloguj
                </button>
              </div>
            ) : (
              <button
                onClick={() => onNavigate('/login')}
                className="bg-primary hover:bg-primaryHover text-white px-5 py-2 rounded-lg text-sm font-bold shadow-md shadow-blue-200 transition-all"
              >
                Zaloguj
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};