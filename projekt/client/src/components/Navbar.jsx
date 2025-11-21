import { Link } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);

    return (
        <nav className="bg-white/10 backdrop-blur-md border-b border-white/10 p-4 text-white shadow-lg sticky top-0 z-50">
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/" className="text-2xl font-bold drop-shadow-md flex items-center gap-2">
                    <span>🎓</span> QuizApp
                </Link>
                <div className="space-x-6 flex items-center">
                    {user ? (
                        <>
                            <span className="font-semibold hidden md:inline opacity-80">Witaj, {user.username}</span>
                            <Link to="/quizzes" className="hover:text-yellow-300 transition">Quizy</Link>
                            <Link to="/leaderboard" className="hover:text-yellow-300 transition">Ranking</Link>
                            <Link to="/duel" className="hover:text-yellow-300 transition">Pojedynek</Link>
                            <Link to="/profile" className="hover:text-yellow-300 transition">Profil</Link>
                            {user.role === 'ADMIN' && (
                                <Link to="/admin" className="hover:text-yellow-300 font-bold text-yellow-400 border border-yellow-400/50 px-2 py-1 rounded">Admin</Link>
                            )}
                            <button onClick={logout} className="bg-red-500/80 hover:bg-red-600 px-4 py-1.5 rounded-lg shadow transition text-sm font-bold">Wyloguj</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="hover:text-yellow-300 transition">Logowanie</Link>
                            <Link to="/register" className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition">Rejestracja</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
