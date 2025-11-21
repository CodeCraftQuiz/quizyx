import { useState, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError('Błędne dane logowania');
        }
    };

    return (
        <div className="max-w-md mx-auto glass-panel p-8 mt-10">
            <h2 className="text-3xl font-bold mb-6 text-center drop-shadow-md">Zaloguj się</h2>
            {error && <p className="text-red-300 bg-red-900/50 p-2 rounded mb-4 text-center border border-red-500/50">{error}</p>}
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-200 mb-2 font-semibold">Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="glass-input" required />
                </div>
                <div className="mb-6">
                    <label className="block text-gray-200 mb-2 font-semibold">Hasło</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="glass-input" required />
                </div>
                <button type="submit" className="glass-btn">Zaloguj</button>
            </form>
        </div>
    );
};

export default Login;
