import React, { useState } from 'react';
import { User } from '../types';
import { api, ASSETS } from '../services/api';

interface ProfileProps {
    user: User;
    onUpdate: (user: User) => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onUpdate }) => {
    const [newUsername, setNewUsername] = useState(user.username || '');
    const [newAvatar, setNewAvatar] = useState(user.avatarUrl || '');
    const [avatarInputType, setAvatarInputType] = useState<'url' | 'gallery'>('gallery');
    const [msg, setMsg] = useState({ type: '', text: '' });

    const handleUpdate = async () => {
        try {
            const updatedUser = await api.auth.updateProfile(newUsername, newAvatar);
            onUpdate(updatedUser);
            setMsg({ type: 'success', text: 'Profil zaktualizowany!' });
        } catch (e: any) {
            setMsg({ type: 'error', text: e.message || 'Błąd aktualizacji' });
        }
    };

    const nextChangeDate = user.lastUsernameChange 
        ? new Date(new Date(user.lastUsernameChange).getTime() + 7 * 24 * 60 * 60 * 1000)
        : null;
    const canChangeName = !nextChangeDate || new Date() > nextChangeDate;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Mój Profil</h1>
            
            <div className="bg-white p-6 rounded-lg shadow-md space-y-6 mb-8">
                
                {/* Avatar Section */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Awatar</label>
                    <div className="flex items-start space-x-4">
                        <img src={newAvatar || user.avatarUrl} alt="Avatar Preview" className="h-20 w-20 rounded-full border-2 border-primary object-cover" />
                        <div className="flex-1">
                            <div className="flex space-x-2 text-sm mb-2">
                                <button 
                                    className={`px-3 py-1 rounded ${avatarInputType === 'gallery' ? 'bg-blue-100 text-blue-700 font-bold' : 'bg-gray-100'}`}
                                    onClick={() => setAvatarInputType('gallery')}
                                >
                                    Galeria
                                </button>
                                <button 
                                    className={`px-3 py-1 rounded ${avatarInputType === 'url' ? 'bg-blue-100 text-blue-700 font-bold' : 'bg-gray-100'}`}
                                    onClick={() => setAvatarInputType('url')}
                                >
                                    Własny URL
                                </button>
                            </div>
                            
                            {avatarInputType === 'url' ? (
                                <input 
                                    type="text" 
                                    className="w-full border p-2 rounded" 
                                    placeholder="https://..."
                                    value={newAvatar || ''}
                                    onChange={(e) => setNewAvatar(e.target.value)}
                                />
                            ) : (
                                <div className="grid grid-cols-5 gap-2">
                                    {ASSETS.avatars.map((url, idx) => (
                                        <img 
                                            key={idx} 
                                            src={url} 
                                            className={`h-12 w-12 rounded-full cursor-pointer border-2 ${newAvatar === url ? 'border-primary' : 'border-transparent hover:border-gray-300'}`}
                                            onClick={() => setNewAvatar(url)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Email (Tylko do odczytu)</label>
                    <input type="text" disabled value={user.email || ''} className="mt-1 block w-full bg-gray-100 border border-gray-300 rounded-md p-2 text-gray-500"/>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Nazwa użytkownika</label>
                    <input 
                        type="text" 
                        value={newUsername || ''} 
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-primary focus:border-primary"
                    />
                    {!canChangeName && (
                        <p className="text-xs text-red-500 mt-2">
                            Zmiana nazwy możliwa po: {nextChangeDate?.toLocaleDateString()}
                        </p>
                    )}
                </div>

                <div className="pt-4">
                    <button 
                        onClick={handleUpdate}
                        disabled={(!canChangeName && newUsername !== user.username)}
                        className="w-full md:w-auto px-6 py-2 bg-primary text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-bold"
                    >
                        Zapisz Zmiany
                    </button>
                </div>

                {msg.text && (
                    <div className={`p-3 rounded ${msg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {msg.text}
                    </div>
                )}
            </div>

            <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                    Historia Gier
                    <span className="ml-2 text-sm font-normal text-gray-500 bg-gray-200 px-2 py-1 rounded-full">{user.history?.length || 0} gier</span>
                </h2>
                <div className="bg-white shadow overflow-hidden rounded-lg border border-gray-200">
                    {user.history && user.history.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quiz</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wynik</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Czas</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {[...user.history].reverse().map((result, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(result.date).toLocaleDateString()} <span className="text-xs text-gray-400">{new Date(result.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">
                                                {result.quizTitle || 'Nieznany Quiz'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                <span className={`font-bold ${result.score === result.maxScore ? 'text-green-600' : ''}`}>
                                                    {result.score}
                                                </span> 
                                                <span className="text-gray-400"> / {result.maxScore}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                {result.timeSpent}s
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-8 text-center flex flex-col items-center justify-center text-gray-500">
                            <p>Brak historii gier.</p>
                            <p className="text-sm mt-1">Zagraj w quiz, aby zobaczyć wyniki!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};