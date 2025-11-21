import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import QuizList from './pages/QuizList';
import QuizPlay from './pages/QuizPlay';
import AdminPanel from './pages/AdminPanel';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import DuelSetup from './pages/DuelSetup';
import { useContext } from 'react';
import AuthContext from './context/AuthContext';

const PrivateRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);
    if (loading) return <div>Ładowanie...</div>;
    return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);
    if (loading) return <div>Ładowanie...</div>;
    return user && user.role === 'ADMIN' ? children : <Navigate to="/" />;
};

function App() {
    return (
        <Router>
            <div className="min-h-screen text-white">
                <Navbar />
                <div className="container mx-auto p-4">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        
                        <Route path="/quizzes" element={<PrivateRoute><QuizList /></PrivateRoute>} />
                        <Route path="/quiz/:id/play" element={<PrivateRoute><QuizPlay /></PrivateRoute>} />
                        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                        <Route path="/leaderboard" element={<PrivateRoute><Leaderboard /></PrivateRoute>} />
                        <Route path="/duel" element={<PrivateRoute><DuelSetup /></PrivateRoute>} />
                        
                        <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
                        <Route path="/admin/quiz/new" element={<AdminRoute><AdminPanel /></AdminRoute>} />
                        <Route path="/admin/quiz/:id/edit" element={<AdminRoute><AdminPanel /></AdminRoute>} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

export default App;
