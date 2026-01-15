
import React, { useEffect, useState } from 'react';
import { api, ASSETS } from '../services/api';
import { Result, UserSummary, Quiz } from '../types';

export const Leaderboard: React.FC = () => {
    const [scores, setScores] = useState<Result[]>([]);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [selectedQuizId, setSelectedQuizId] = useState<string>('all');
    const [filter, setFilter] = useState<'global' | 'friends'>('global');
    const [friends, setFriends] = useState<UserSummary[]>([]);
    const [me, setMe] = useState<any>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const [sData, qData] = await Promise.all([
                    api.results.getLeaderboard(),
                    api.quizzes.getAll()
                ]);
                setScores(sData || []);
                setQuizzes(qData || []);
                
                const token = localStorage.getItem('token');
                if (token) {
                    const [fData, meData] = await Promise.all([
                        api.social.getFriends().catch(() => ({friends:[]})),
                        api.auth.getMe().catch(() => null)
                    ]);
                    setFriends(fData?.friends || []);
                    setMe(meData);
                }
            } catch (err) {
                console.error("Leaderboard load error", err);
            }
        };
        load();
    }, []);

    const friendIds = new Set(friends.map(f => f._id));
    if (me) friendIds.add(me._id);

    const filtered = scores.filter(s => {
        const matchesType = filter === 'global' ? true : friendIds.has(typeof s.userId === 'string' ? s.userId : (s.userId as any)?._id);
        const matchesQuiz = selectedQuizId === 'all' || (typeof s.quizId === 'string' ? s.quizId === selectedQuizId : (s.quizId as any)?._id === selectedQuizId);
        return matchesType && matchesQuiz;
    });

    const AvatarImage = ({ user, fallbackName }: { user: any, fallbackName: string }) => {
        const [imgError, setImgError] = useState(false);
        const avatarUrl = user?.avatarUrl || ASSETS.avatars[0];
        if (imgError || !avatarUrl) {
            return (
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/50 font-black text-primary text-xl shadow-fuchsia uppercase italic">
                    {fallbackName.charAt(0)}
                </div>
            );
        }
        return (
            <div className="w-12 h-12 rounded-2xl bg-dark flex items-center justify-center border border-white/5 font-black text-primary text-xl overflow-hidden shadow-lg">
                <img src={avatarUrl} className="w-full h-full object-cover" alt="avatar" onError={() => setImgError(true)} />
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto py-16 px-4">
            <div className="text-center mb-16">
                <h1 className="text-5xl font-black text-white mb-6 tracking-tighter uppercase italic text-glow">
                    Ranking <span className="text-primary">Mistrzów</span>
                </h1>
                
                <div className="flex flex-col md:flex-row items-center justify-center gap-6 mt-12">
                    <div className="inline-flex p-1.5 bg-surface rounded-full shadow-quizyx border border-white/5">
                        <button onClick={() => setFilter('global')}
                                className={`px-10 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all ${filter === 'global' ? 'bg-primary text-white shadow-fuchsia' : 'text-white/40 hover:text-primary'}`}>
                            🌎 Globalny
                        </button>
                        <button onClick={() => setFilter('friends')} disabled={!me}
                                className={`px-10 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all ${!me ? 'opacity-20 cursor-not-allowed' : (filter === 'friends' ? 'bg-primary text-white shadow-fuchsia' : 'text-white/40 hover:text-primary')}`}>
                            👥 Znajomi
                        </button>
                    </div>

                    <div className="w-full md:w-64">
                        <select 
                            className="w-full bg-surface border border-white/10 p-4 rounded-full text-white font-black outline-none focus:border-primary transition-all text-xs uppercase italic tracking-widest"
                            value={selectedQuizId}
                            onChange={e => setSelectedQuizId(e.target.value)}
                        >
                            <option value="all">Wszystkie Quizy</option>
                            {quizzes.map(q => (
                                <option key={q._id} value={q._id}>{q.title}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-surface rounded-quizyx-lg shadow-quizyx border border-white/10 overflow-hidden animate-pop-in">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-dark/50 text-[10px] font-black text-white/20 uppercase tracking-widest italic">
                            <tr>
                                <th className="px-10 py-6">Poz.</th>
                                <th className="px-8 py-6">Uczestnik</th>
                                <th className="px-8 py-6 text-center">Seria</th>
                                <th className="px-10 py-6 text-right">Wynik</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filtered.map((s, i) => {
                                const userObj = typeof s.userId === 'object' ? (s.userId as any) : null;
                                const quizObj = typeof s.quizId === 'object' ? (s.quizId as any) : null;
                                const userName = userObj?.username || s.username || "Anonim";
                                const userStreak = userObj?.winstreak || s.userWinstreak || 0;
                                const quizTitle = quizObj?.title || s.quizTitle || "Misja";
                                const isMe = me?._id === (userObj?._id || s.userId);

                                return (
                                    <tr key={s._id || i} className={`hover:bg-primary/10 transition-colors ${isMe ? 'bg-primary/20' : ''}`}>
                                        <td className="px-10 py-8">
                                            {i < 3 ? <span className="text-3xl drop-shadow-lg">{['🥇','🥈','🥉'][i]}</span> : <span className="font-black text-white/20 text-lg">#{i+1}</span>}
                                        </td>
                                        <td className="px-8 py-8">
                                            <div className="flex items-center gap-4">
                                                <AvatarImage user={userObj || s} fallbackName={userName} />
                                                <div>
                                                    <p className="font-black text-white text-lg tracking-tight italic leading-none">{userName}</p>
                                                    <p className="text-[10px] text-primary/60 font-black uppercase tracking-widest mt-1.5">{quizTitle}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8 text-center">
                                            <span className="text-secondary font-black text-lg text-glow-yellow">🔥 {userStreak}</span>
                                        </td>
                                        <td className="px-10 py-8 text-right font-black text-primary text-2xl tracking-tighter italic text-glow">
                                            {s.quizType === 'millionaire' || s.quizType === 'money_drop' ? `$${s.score.toLocaleString()}` : s.score.toLocaleString()}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {filtered.length === 0 && (
                    <div className="p-32 text-center text-white/5 font-black uppercase tracking-widest italic">Pusta matryca danych</div>
                )}
            </div>
        </div>
    );
};
