import { User, Quiz, Advertisement, Result, UserSummary } from '../types';
import { io, Socket } from 'socket.io-client';

const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

// --- ASSETS ---
export const ASSETS = {
    avatars: [
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Midnight',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Bella',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Socks',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Lola'
    ],
    ads: [
        'https://placehold.co/600x400/2563eb/white?text=Super+Promo',
        'https://placehold.co/600x200/orange/white?text=Mega+Wyprzedaż',
        'https://placehold.co/400x400/red/white?text=Kup+Teraz',
        'https://placehold.co/300x600/green/white?text=Eko+Energia',
        'https://placehold.co/800x600/black/white?text=Tech+World'
    ]
};

// Helper for JWT headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
    } : { 
        'Content-Type': 'application/json' 
    };
};

// Helper for fetch wrapper
const request = async (endpoint: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
        ...getAuthHeaders(),
        ...(options.headers as any || {})
    };

    const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    } as RequestInit);

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error: ${res.status}`);
    }
    
    const text = await res.text();
    return text ? JSON.parse(text) : {};
};

// SOCKET INSTANCE
let socket: Socket | null = null;

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<User> => {
        const data = await request('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        localStorage.setItem('token', data.token);
        return data.user;
    },
    register: async (data: any): Promise<User> => {
        const res = await request('/register', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        localStorage.setItem('token', res.token);
        return res.user;
    },
    updateProfile: async (username: string, avatarUrl?: string): Promise<User> => {
        const res = await request('/user/profile', {
            method: 'PUT',
            body: JSON.stringify({ username, avatarUrl })
        });
        return res.user;
    },
    getMe: async (): Promise<User> => {
        return await request('/auth/me');
    },
    logout: () => {
        localStorage.removeItem('token');
        if (socket) socket.disconnect();
    }
  },
  social: {
      searchUsers: async (query: string): Promise<UserSummary[]> => {
          return await request(`/users/search?q=${encodeURIComponent(query)}`);
      },
      getFriends: async (): Promise<{friends: UserSummary[], requests: UserSummary[]}> => {
          return await request('/friends');
      },
      sendRequest: async (targetUserId: string): Promise<void> => {
          await request('/friends/request', {
              method: 'POST',
              body: JSON.stringify({ targetUserId })
          });
      },
      acceptRequest: async (requesterId: string): Promise<void> => {
          await request('/friends/accept', {
              method: 'POST',
              body: JSON.stringify({ requesterId })
          });
      }
  },
  quizzes: {
    getAll: async (): Promise<Quiz[]> => request('/quizzes'),
    getById: async (id: string): Promise<Quiz | undefined> => {
        const quizzes = await request('/quizzes');
        return quizzes.find((q: Quiz) => q._id === id);
    },
    getInfinityQuestions: async (count: number = 50): Promise<Quiz> => {
        const quizzes: Quiz[] = await request('/quizzes');
        const allQuestions = quizzes.flatMap(q => q.questions);
        const shuffled = allQuestions.sort(() => 0.5 - Math.random()).slice(0, count);
        return {
            _id: 'infinity_session',
            title: 'Tryb Nieskończoności',
            type: 'infinity',
            difficulty: 'hard' as any,
            questions: shuffled
        };
    },
    create: async (quiz: Quiz): Promise<void> => request('/quizzes', { method: 'POST', body: JSON.stringify(quiz) }),
    import: async (quizzes: Quiz[]): Promise<void> => request('/quizzes/import', { method: 'POST', body: JSON.stringify(quizzes) }),
    update: async (id: string, quizData: Partial<Quiz>): Promise<void> => request(`/quizzes/${id}`, { method: 'PUT', body: JSON.stringify(quizData) }),
    delete: async (id: string): Promise<void> => request(`/quizzes/${id}`, { method: 'DELETE' })
  },
  ads: {
    getAll: async (): Promise<Advertisement[]> => request('/ads'),
    getActive: async (): Promise<Advertisement[]> => request('/ads/active'),
    create: async (ad: Advertisement): Promise<void> => request('/ads', { method: 'POST', body: JSON.stringify(ad) }),
    update: async (id: string, adData: Partial<Advertisement>): Promise<void> => request(`/ads/${id}`, { method: 'PUT', body: JSON.stringify(adData) }),
    delete: async (id: string): Promise<void> => request(`/ads/${id}`, { method: 'DELETE' })
  },
  results: {
    submit: async (result: Result): Promise<void> => {
        await request('/results', { method: 'POST', body: JSON.stringify(result) });
    },
    getLeaderboard: async (): Promise<Result[]> => request('/leaderboard')
  },
  // New Real-time Socket API
  socket: {
      connect: () => {
          if (!socket) {
              socket = io(SOCKET_URL);
          }
          return socket;
      },
      joinDuel: (userId: string, username: string, avatarUrl: string, quizId: string) => {
          if (!socket) socket = io(SOCKET_URL);
          socket.emit('join_duel', { userId, username, avatarUrl, quizId });
      },
      sendProgress: (roomId: string, score: number, progress: number) => {
          if (socket) socket.emit('send_progress', { roomId, score, progress });
      },
      onMatchFound: (callback: (data: any) => void) => {
          if (socket) socket.on('match_found', callback);
      },
      onOpponentUpdate: (callback: (data: any) => void) => {
          if (socket) socket.on('opponent_update', callback);
      },
      disconnect: () => {
          if (socket) {
              socket.disconnect();
              socket = null;
          }
      }
  }
};