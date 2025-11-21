import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const Profile = () => {
    const { user, logout } = useContext(AuthContext);
    const [stats, setStats] = useState(null);
    const [history, setHistory] = useState([]);

    // Delete Account State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteForm, setDeleteForm] = useState({
        email: '',
        username: '',
        password: '',
        confirmPassword: ''
    });
    const [deleteMsg, setDeleteMsg] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            const statsRes = await axios.get('/api/users/me/stats', config);
            setStats(statsRes.data);

            const historyRes = await axios.get('/api/users/me/history', config);
            setHistory(historyRes.data);
        };
        fetchData();
    }, []);

    const handleDeleteChange = (e) => {
        setDeleteForm({ ...deleteForm, [e.target.name]: e.target.value });
    };

    const handleDeleteSubmit = async (e) => {
        e.preventDefault();
        setDeleteMsg('');

        if (deleteForm.password !== deleteForm.confirmPassword) {
            setDeleteMsg('Hasła nie są identyczne.');
            return;
        }

        if (!window.confirm('Czy na pewno chcesz usunąć swoje konto? Tej operacji nie można cofnąć.')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            // DELETE request with body data
            await axios.delete('/api/users/me', {
                headers: { Authorization: `Bearer ${token}` },
                data: {
                    email: deleteForm.email,
                    username: deleteForm.username,
                    password: deleteForm.password
                }
            });
            
            alert('Konto zostało usunięte.');
            logout();
        } catch (error) {
            setDeleteMsg(error.response?.data?.message || 'Wystąpił błąd podczas usuwania konta.');
        }
    };

    if (!stats) return <div>Ładowanie...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            {/* Delete Account Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="glass-panel p-8 max-w-md w-full mx-4 relative border border-red-500/30">
                        <button 
                            onClick={() => setShowDeleteModal(false)}
                            className="absolute top-4 right-4 text-white/50 hover:text-white"
                        >
                            ✕
                        </button>
                        <h2 className="text-2xl font-bold mb-6 text-red-400">Usuwanie Konta</h2>
                        <p className="mb-6 text-white/80 text-sm">
                            Aby usunąć konto, potwierdź swoją tożsamość wpisując email, nazwę użytkownika i hasło.
                        </p>
                        
                        <form onSubmit={handleDeleteSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1 text-white">Email</label>
                                <input 
                                    type="email" 
                                    name="email"
                                    value={deleteForm.email} 
                                    onChange={handleDeleteChange} 
                                    className="glass-input w-full" 
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1 text-white">Nazwa użytkownika</label>
                                <input 
                                    type="text" 
                                    name="username"
                                    value={deleteForm.username} 
                                    onChange={handleDeleteChange} 
                                    className="glass-input w-full" 
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1 text-white">Hasło</label>
                                <input 
                                    type="password" 
                                    name="password"
                                    value={deleteForm.password} 
                                    onChange={handleDeleteChange} 
                                    className="glass-input w-full" 
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1 text-white">Powtórz hasło</label>
                                <input 
                                    type="password" 
                                    name="confirmPassword"
                                    value={deleteForm.confirmPassword} 
                                    onChange={handleDeleteChange} 
                                    className="glass-input w-full" 
                                    required
                                />
                            </div>

                            {deleteMsg && (
                                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-sm">
                                    {deleteMsg}
                                </div>
                            )}

                            <div className="flex gap-3 mt-6">
                                <button 
                                    type="button" 
                                    onClick={() => setShowDeleteModal(false)}
                                    className="glass-btn bg-gray-600 hover:bg-gray-700"
                                >
                                    Anuluj
                                </button>
                                <button 
                                    type="submit" 
                                    className="glass-btn-danger"
                                >
                                    Potwierdź usunięcie
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div>
                <div className="glass-panel p-6 mb-6">
                    <h2 className="text-2xl font-bold mb-4 text-white">Twój Profil</h2>
                    <div className="space-y-2 text-white/80 mb-6">
                        <p><strong className="text-white">Email:</strong> {user.email}</p>
                        <p><strong className="text-white">Nazwa:</strong> {user.username}</p>
                        <p><strong className="text-white">Rola:</strong> {user.role}</p>
                    </div>

                    <div className="border-t border-white/10 pt-6">
                        <h3 className="text-lg font-bold text-red-400 mb-2">Strefa Niebezpieczna</h3>
                        <button 
                            onClick={() => setShowDeleteModal(true)}
                            className="glass-btn-danger w-auto text-sm py-2 px-4"
                        >
                            Usuń konto
                        </button>
                    </div>
                </div>

                <div className="glass-panel p-6">
                    <h2 className="text-2xl font-bold mb-6 text-white">Statystyki</h2>
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="glass-card p-4">
                            <div className="text-4xl font-bold text-blue-300 mb-1">{stats.totalQuizzesPlayed}</div>
                            <div className="text-sm text-white/70">Rozegrane Quizy</div>
                        </div>
                        <div className="glass-card p-4">
                            <div className="text-4xl font-bold text-green-300 mb-1">{stats.totalCorrectAnswers}</div>
                            <div className="text-sm text-white/70">Poprawne Odpowiedzi</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-panel p-6">
                <h2 className="text-2xl font-bold mb-4 text-white">Historia Gier</h2>
                <div className="overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                    <table className="min-w-full text-sm text-white">
                        <thead className="border-b border-white/10">
                            <tr>
                                <th className="py-3 px-2 text-left text-white/60">Data</th>
                                <th className="py-3 px-2 text-left text-white/60">Quiz</th>
                                <th className="py-3 px-2 text-left text-white/60">Wynik</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map(h => (
                                <tr key={h._id} className="border-b border-white/5 hover:bg-white/5 transition">
                                    <td className="py-3 px-2">{new Date(h.createdAt).toLocaleDateString()}</td>
                                    <td className="py-3 px-2 font-medium">{h.quizId ? h.quizId.title : 'Usunięty Quiz'}</td>
                                    <td className="py-3 px-2 font-bold text-yellow-300">{h.score} pkt</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Profile;
