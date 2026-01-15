import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { UserSummary } from '../types';

interface SocialProps {
    onChallenge: (friendName: string) => void;
}

export const Social: React.FC<SocialProps> = ({ onChallenge }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserSummary[]>([]);
    const [friends, setFriends] = useState<UserSummary[]>([]);
    const [requests, setRequests] = useState<UserSummary[]>([]);

    useEffect(() => {
        loadFriends();
    }, []);

    const loadFriends = async () => {
        const data = await api.social.getFriends();
        setFriends(data.friends);
        setRequests(data.requests);
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        const res = await api.social.searchUsers(searchQuery);
        setSearchResults(res);
    };

    const sendRequest = async (id: string) => {
        await api.social.sendRequest(id);
        alert('Zaproszenie wysłane!');
    };

    const acceptRequest = async (id: string) => {
        await api.social.acceptRequest(id);
        loadFriends();
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* LEFT: Search & Requests */}
            <div className="space-y-8">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-bold mb-4">Znajdź znajomych</h2>
                    <div className="flex gap-2 mb-4">
                        <input 
                            type="text" 
                            className="flex-1 border p-2 rounded" 
                            placeholder="Nazwa użytkownika..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button onClick={handleSearch} className="bg-primary text-white px-4 rounded">Szukaj</button>
                    </div>
                    <ul className="space-y-2">
                        {searchResults.map(u => (
                            <li key={u._id} className="flex justify-between items-center border-b pb-2">
                                <div className="flex items-center space-x-2">
                                    <img src={u.avatarUrl} alt={u.username} className="w-8 h-8 rounded-full bg-gray-200 object-cover" />
                                    <span>{u.username} <span className="text-xs text-orange-500">🔥 {u.winstreak}</span></span>
                                </div>
                                <button onClick={() => sendRequest(u._id)} className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded">
                                    Dodaj
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {requests.length > 0 && (
                    <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-400">
                        <h2 className="text-xl font-bold mb-4">Zaproszenia do znajomych</h2>
                        <ul className="space-y-2">
                            {requests.map(u => (
                                <li key={u._id} className="flex justify-between items-center">
                                    <div className="flex items-center space-x-2">
                                        <img src={u.avatarUrl} alt={u.username} className="w-8 h-8 rounded-full bg-gray-200 object-cover" />
                                        <span className="font-medium">{u.username}</span>
                                    </div>
                                    <button onClick={() => acceptRequest(u._id)} className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">
                                        Akceptuj
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* RIGHT: Friends List */}
            <div className="bg-white p-6 rounded-lg shadow h-fit">
                <h2 className="text-xl font-bold mb-6">Moi Znajomi ({friends.length})</h2>
                {friends.length === 0 ? (
                    <p className="text-gray-500">Nie masz jeszcze żadnych znajomych.</p>
                ) : (
                    <ul className="space-y-4">
                        {friends.map(f => (
                            <li key={f._id} className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-blue-50 transition">
                                <div className="flex items-center space-x-3">
                                    <img src={f.avatarUrl} alt={f.username} className="w-10 h-10 rounded-full bg-blue-200 object-cover border border-blue-300" />
                                    <div>
                                        <p className="font-bold text-gray-800">{f.username}</p>
                                        <p className="text-xs text-orange-500 font-bold">Seria: {f.winstreak} 🔥</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => onChallenge(f.username)}
                                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded shadow text-sm font-bold flex items-center"
                                >
                                    ⚔️ 1v1
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};