import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Result, QuizType } from '../types';

export const Leaderboard: React.FC = () => {
    const [scores, setScores] = useState<Result[]>([]);
    const [filter, setFilter] = useState<'global' | 'friends'>('global');
    const [modeFilter, setModeFilter] = useState<QuizType | 'all'>('all');
    const [friendsIds, setFriendsIds] = useState<string[]>([]);

    useEffect(() => {
        // Load initial data
        Promise.all([
            api.results.getLeaderboard(),
            api.social.getFriends()
        ]).then(([results, socialData]) => {
            setScores(results);
            setFriendsIds(socialData.friends.map(f => f._id));
        });
    }, []);

    const filteredScores = scores.filter(s => {
        const matchesFriend = filter === 'global' ? true : friendsIds.includes(s.userId);
        const matchesMode = modeFilter === 'all' ? true : s.quizType === modeFilter;
        return matchesFriend && matchesMode;
    });

    const getModeLabel = (mode: string) => {
        switch(mode) {
            case 'standard': return 'Standardowy';
            case 'exam': return 'Egzamin';
            case 'infinity': return 'Nieskończoność';
            case 'duel': return 'Pojedynek 1v1';
            case 'millionaire': return 'Milionerzy';
            default: return 'Inny';
        }
    };

    const getRankStyle = (index: number) => {
        switch(index) {
            case 0: return 'bg-yellow-50 border-l-4 border-yellow-400';
            case 1: return 'bg-slate-100 border-l-4 border-slate-400';
            case 2: return 'bg-orange-50 border-l-4 border-orange-400';
            default: return 'hover:bg-slate-50';
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-12">
            <h1 className="text-4xl font-extrabold mb-8 text-center text-slate-800">Ranking Graczy</h1>
            
            {/* Friend Filter */}
            <div className="flex justify-center mb-6 space-x-4 bg-white p-2 rounded-full shadow-sm w-fit mx-auto border border-slate-200">
                <button 
                    onClick={() => setFilter('global')}
                    className={`px-8 py-2 rounded-full font-bold transition-all ${filter === 'global' ? 'bg-blue-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    🌎 Globalny
                </button>
                <button 
                    onClick={() => setFilter('friends')}
                    className={`px-8 py-2 rounded-full font-bold transition-all ${filter === 'friends' ? 'bg-blue-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    👥 Znajomi
                </button>
            </div>

            {/* Mode Filter */}
            <div className="flex justify-center flex-wrap gap-2 mb-10">
                {['all', 'standard', 'duel', 'millionaire', 'infinity', 'exam'].map((mode) => (
                    <button 
                        key={mode}
                        onClick={() => setModeFilter(mode as any)} 
                        className={`px-4 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                            modeFilter === mode 
                            ? 'bg-blue-100 text-blue-800 border-blue-200' 
                            : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                        }`}
                    >
                        {mode === 'all' ? 'Wszystkie' : getModeLabel(mode)}
                    </button>
                ))}
            </div>

            <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-100">
                <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-blue-900 text-white">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Miejsce</th>
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Gracz</th>
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Tryb</th>
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Seria (1v1)</th>
                            <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Wynik</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                        {filteredScores.map((score, idx) => (
                            <tr key={score._id} className={`transition-colors ${getRankStyle(idx)}`}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {idx === 0 && <span className="text-2xl">🥇</span>}
                                    {idx === 1 && <span className="text-2xl">🥈</span>}
                                    {idx === 2 && <span className="text-2xl">🥉</span>}
                                    {idx > 2 && <span className="font-bold text-slate-400 pl-2">#{idx + 1}</span>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900 flex items-center">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-3 font-bold text-sm shadow-sm
                                        ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-slate-200 text-slate-700' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-500'}`}>
                                        {score.username?.[0]}
                                    </div>
                                    <span className={idx < 3 ? 'text-lg' : ''}>{score.username}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-sm">
                                    <span className="px-2 py-1 bg-slate-100 rounded text-xs uppercase font-bold text-slate-600 border border-slate-200">
                                        {getModeLabel(score.quizType || 'standard')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-orange-500 font-bold">
                                    {score.userWinstreak ? (
                                        <span className="flex items-center gap-1">
                                            {score.userWinstreak} <span className="animate-pulse">🔥</span>
                                        </span>
                                    ) : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right font-black text-blue-700 text-lg">
                                    {score.score.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredScores.length === 0 && <div className="p-12 text-center text-slate-400 font-medium">Brak wyników w tej kategorii.</div>}
            </div>
        </div>
    );
};