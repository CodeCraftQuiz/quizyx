import { useState, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(username, email, password);
            navigate('/');
        } catch (err) {
            setError('Błąd rejestracji. Może email/nazwa zajęte?');
        }
    };

    return (
        <div className="max-w-md mx-auto glass-panel p-8 mt-10">
            <h2 className="text-3xl font-bold mb-6 text-center drop-shadow-md">Zarejestruj się</h2>
            {error && <p className="text-red-300 bg-red-900/50 p-2 rounded mb-4 text-center border border-red-500/50">{error}</p>}
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-200 mb-2 font-semibold">Nazwa użytkownika</label>
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="glass-input" required />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-200 mb-2 font-semibold">Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="glass-input" required />
                </div>
                <div className="mb-6">
                    <label className="block text-gray-200 mb-2 font-semibold">Hasło</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="glass-input" required />
                </div>
                <button type="submit" className="glass-btn bg-gradient-to-r from-green-500 to-emerald-600">Zarejestruj</button>
            </form>
        </div>
    );
};

export default Register;
