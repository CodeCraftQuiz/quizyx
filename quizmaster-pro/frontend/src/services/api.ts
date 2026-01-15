
import { User, Quiz, Advertisement, Result, UserRole, QuizDifficulty, QuestionType, AdLocation, AdTriggerType, UserSummary } from '../types';

export const ASSETS = {
    avatars: [
        '/components/profilowki/zdjecie1.jpg',
        '/components/profilowki/Avatar1.png',
        '/components/profilowki/Avatar2.png',
        '/components/profilowki/Avatar3.png',
        '/components/profilowki/Avatar4.png'
    ],
    ads: [
        '/components/reklamy/reklama1.jpg',
        '/components/reklamy/reklama2.jpg',
        '/components/reklamy/reklama3.jpg',
        '/components/reklamy/reklama4.png' 
    ]
};

const API_BASE = 'http://localhost:5000/api';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<User> => {
        const res = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Błąd logowania');
        }
        const data = await res.json();
        localStorage.setItem('token', data.token);
        return data.user;
    },
    register: async (data: any): Promise<User> => {
        const res = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Błąd rejestracji');
        }
        const d = await res.json();
        localStorage.setItem('token', d.token);
        return d.user;
    },
    getMe: async (): Promise<User> => {
        const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Nieautoryzowany');
        return res.json();
    },
    updateProfile: async (username: string, avatarUrl?: string): Promise<User> => {
        const res = await fetch(`${API_BASE}/user/profile`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ username, avatarUrl })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Błąd aktualizacji');
        }
        const d = await res.json();
        return d.user;
    },
    logout: () => localStorage.removeItem('token')
  },
  quizzes: {
    getAll: async (): Promise<Quiz[]> => {
        const res = await fetch(`${API_BASE}/quizzes`, { headers: getHeaders() });
        if (!res.ok) return [];
        return res.json();
    },
    getById: async (id: string): Promise<Quiz> => {
        const res = await fetch(`${API_BASE}/quizzes/${id}`, { headers: getHeaders() });
        if (!res.ok) throw new Error("Nie znaleziono quizu");
        return res.json();
    },
    create: async (quiz: Partial<Quiz>) => {
        const res = await fetch(`${API_BASE}/quizzes`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(quiz)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || "Błąd zapisu quizu");
        }
        return res.json();
    },
    update: async (id: string, quiz: Partial<Quiz>) => {
        const res = await fetch(`${API_BASE}/quizzes/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(quiz)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || "Błąd aktualizacji quizu");
        }
        return res.json();
    },
    import: async (quizzes: any[]) => {
        const res = await fetch(`${API_BASE}/quizzes/import`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(quizzes)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || "Błąd importu quizów");
        }
        return res.json();
    },
    delete: async (id: string) => {
        await fetch(`${API_BASE}/quizzes/${id}`, { method: 'DELETE', headers: getHeaders() });
    },
    getInfinityQuestions: async () => {
        const res = await fetch(`${API_BASE}/quizzes`, { headers: getHeaders() });
        const all: Quiz[] = await res.json();
        const questions = all.flatMap(q => q.questions).sort(() => 0.5 - Math.random());
        return { 
            _id: 'inf', title: 'Infinity Mode', type: 'infinity', 
            questions: questions.slice(0, 50), difficulty: QuizDifficulty.HARD 
        } as Quiz;
    }
  },
  social: {
    getFriends: async () => {
        const res = await fetch(`${API_BASE}/friends`, { headers: getHeaders() });
        if (!res.ok) return { friends: [], requests: [] };
        return res.json();
    },
    searchUsers: async (q: string) => {
        const res = await fetch(`${API_BASE}/users/search?q=${q}`, { headers: getHeaders() });
        if (!res.ok) return [];
        return res.json();
    },
    sendRequest: async (targetUserId: string) => {
        await fetch(`${API_BASE}/friends/request`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ targetUserId })
        });
    },
    acceptRequest: async (requesterId: string) => {
        await fetch(`${API_BASE}/friends/accept`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ requesterId })
        });
    }
  },
  ads: {
    getAll: async () => {
        const res = await fetch(`${API_BASE}/ads`, { headers: getHeaders() });
        if (!res.ok) return [];
        return res.json();
    },
    getActive: async () => {
        const res = await fetch(`${API_BASE}/ads/active`, { headers: getHeaders() });
        if (!res.ok) return [];
        return res.json();
    },
    create: async (ad: any) => {
        const res = await fetch(`${API_BASE}/ads`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(ad) });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || "Błąd zapisu reklamy");
        }
        return res.json();
    },
    update: async (id: string, ad: any) => {
        const res = await fetch(`${API_BASE}/ads/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(ad) });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || "Błąd aktualizacji reklamy");
        }
        return res.json();
    },
    delete: async (id: string) => {
        await fetch(`${API_BASE}/ads/${id}`, { method: 'DELETE', headers: getHeaders() });
    }
  },
  results: {
    submit: async (result: Result) => {
        await fetch(`${API_BASE}/results`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(result)
        });
    },
    getLeaderboard: async () => {
        const res = await fetch(`${API_BASE}/leaderboard`, { headers: getHeaders() });
        if (!res.ok) return [];
        return res.json();
    }
  }
};
