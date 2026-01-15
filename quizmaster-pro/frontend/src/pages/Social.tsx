
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { api } from '../services/api';
import { UserSummary } from '../types';

const socket = io('http://localhost:5000');

interface SocialProps {
    onChallenge: (quizId: string) => void;
}

export const Social: React.FC<SocialProps> = ({ onChallenge }) => {
    const [q, setQ] = useState('');
    const [results, setResults] = useState<UserSummary[]>([]);
    const [friends, setFriends] = useState<UserSummary[]>([]);
    const [requests, setRequests] = useState<UserSummary[]>([]);
    const [incomingChallenge, setIncomingChallenge] = useState<any>(null);

    useEffect(() => { 
        load();
        api.auth.getMe().then(me => {
            socket.emit('register_user', me._id);
        });
        
        socket.on('incoming_challenge', (data) => {
            setIncomingChallenge(data);
        });

        socket.on('match_found', ({ quizId }) => {
            onChallenge(quizId);
        });

        return () => {
            socket.off('incoming_challenge');
            socket.off('match_found');
        };
    }, [onChallenge]);

    const load = async () => {
        try {
            const d = await api.social.getFriends();
            setFriends(d.friends || []);
            setRequests(d.requests || []);
        } catch(e) {}
    };

    const handleSearch = async () => {
        if (!q.trim()) return;
        setResults(await api.social.searchUsers(q));
    };

    const sendChallenge = async (friendId: string) => {
        const me = await api.auth.getMe();
        const allQuizzes = await api.quizzes.getAll();
        const duelQuiz = allQuizzes.find(q => q.type === 'duel');
        
        if (!duelQuiz) {
            alert("Brak dostępnych quizów typu 'duel' w bazie!");
            return;
        }

        socket.emit('challenge_friend', {
            friendId,
            quizId: duelQuiz._id,
            challengerName: me.username,
            challengerAvatar: me.avatarUrl
        });
        alert("Wysłano wyzwanie!");
    };

    const acceptChallenge = () => {
        socket.emit('accept_challenge', {
            challengerUserId: incomingChallenge.challengerUserId,
            quizId: incomingChallenge.quizId
        });
        setIncomingChallenge(null);
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-10">
                {incomingChallenge && (
                    <div className="bg-primary p-8 rounded-quizyx-lg text-white shadow-fuchsia animate-bounce flex justify-between items-center border border-white/20">
                        <div>
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter">Wyzwanie od {incomingChallenge.challengerName}!</h3>
                            <p className="text-[10px] font-black uppercase opacity-50 mt-1">Szybka partia 1v1? Zegar tyka!</p>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={acceptChallenge} className="bg-white text-primary px-8 py-3 rounded-full font-black uppercase text-xs shadow-xl active:scale-95 transition-all">Graj ⚔️</button>
                            <button onClick={() => setIncomingChallenge(null)} className="bg-black/20 px-8 py-3 rounded-full font-black uppercase text-xs hover:bg-black/40">Odrzuć</button>
                        </div>
                    </div>
                )}

                <div className="bg-surface rounded-quizyx-lg shadow-quizyx p-10 border border-white/5">
                    <h2 className="text-3xl font-black text-white mb-8 italic text-glow">Szukaj <span className="text-primary">Braci boju</span></h2>
                    <div className="flex gap-4">
                        <input type="text" placeholder="Nick wojownika..." value={q} onChange={e => setQ(e.target.value)}
                            className="flex-1 bg-dark/50 border-2 border-transparent focus:border-primary rounded-quizyx px-8 py-5 outline-none text-white font-black transition-all" />
                        <button onClick={handleSearch} className="bg-primary text-white font-black px-12 rounded-quizyx shadow-fuchsia uppercase italic tracking-widest text-xs">Namierz</button>
                    </div>
                    <div className="mt-10 space-y-4">
                        {results.map(u => (
                            <div key={u._id} className="flex items-center justify-between p-6 bg-dark/50 rounded-quizyx border border-white/5 hover:border-primary/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <img src={u.avatarUrl} className="w-12 h-12 rounded-xl object-cover" />
                                    <p className="font-black text-white">{u.username}</p>
                                </div>
                                <button onClick={() => api.social.sendRequest(u._id).then(load)} className="text-primary font-black uppercase text-xs italic hover:underline">Dodaj do Plutonu</button>
                            </div>
                        ))}
                    </div>
                </div>

                {requests.length > 0 && (
                    <div className="bg-surface rounded-quizyx-lg shadow-quizyx p-10 border border-white/5 animate-pop-in">
                        <h2 className="text-xl font-black text-white mb-6 uppercase italic">Prośby o znajomość</h2>
                        <div className="space-y-4">
                            {requests.map(r => (
                                <div key={r._id} className="flex items-center justify-between bg-dark/30 p-4 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-4">
                                        <img src={r.avatarUrl} className="w-10 h-10 rounded-lg object-cover" />
                                        <p className="text-white font-black text-sm">{r.username}</p>
                                    </div>
                                    <button onClick={() => api.social.acceptRequest(r._id).then(load)} className="bg-primary px-6 py-2 rounded-full text-white text-[10px] font-black uppercase shadow-fuchsia active:scale-95">Akceptuj</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-surface rounded-quizyx-lg shadow-quizyx border border-white/5 p-10 h-fit sticky top-28">
                <h2 className="text-xl font-black text-white mb-10 italic uppercase tracking-widest">Twoi Znajomi ({friends.length})</h2>
                <div className="space-y-6">
                    {friends.map(f => (
                        <div key={f._id} className="flex items-center justify-between group p-3 rounded-xl hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-4">
                                <img src={f.avatarUrl} className="w-14 h-14 rounded-2xl border border-white/10 group-hover:scale-110 transition-transform object-cover shadow-lg" />
                                <div>
                                    <p className="font-black text-white text-sm">{f.username}</p>
                                    <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-1">🔥 {f.winstreak} streak</p>
                                </div>
                            </div>
                            <button onClick={() => sendChallenge(f._id)} className="w-12 h-12 bg-primary text-white rounded-2xl shadow-fuchsia flex items-center justify-center text-xl hover:scale-110 transition-transform active:scale-90">⚔️</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
