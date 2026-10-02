import { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import apiClient from '../../services/apiClient';
import { connectSocket, disconnectSocket } from '../../services/socket';

// ─── State & Reducer ───────────────────────────────────────────────────────────
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_AUTH':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    case 'CLEAR_AUTH':
      return { ...initialState, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

// ─── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('cc_token');
      const cachedUser = localStorage.getItem('cc_user');

      if (token && cachedUser) {
        try {
          const user = JSON.parse(cachedUser);
          dispatch({ type: 'SET_AUTH', payload: { user, token } });
          // Connect socket
          connectSocket(token);
          // Verify token is still valid
          const response = await apiClient.get('/auth/me');
          const freshUser = response.data.data;
          dispatch({ type: 'UPDATE_USER', payload: freshUser });
          localStorage.setItem('cc_user', JSON.stringify(freshUser));
        } catch {
          // Token invalid — clear session
          localStorage.removeItem('cc_token');
          localStorage.removeItem('cc_user');
          dispatch({ type: 'CLEAR_AUTH' });
          disconnectSocket();
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    restoreSession();
  }, []);

  // ─── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    const { token, user } = response.data.data;

    localStorage.setItem('cc_token', token);
    localStorage.setItem('cc_user', JSON.stringify(user));

    dispatch({ type: 'SET_AUTH', payload: { user, token } });
    connectSocket(token);

    return user;
  }, []);

  // ─── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('cc_token');
    localStorage.removeItem('cc_user');
    dispatch({ type: 'CLEAR_AUTH' });
    disconnectSocket();
  }, []);

  // ─── Logout All Devices ────────────────────────────────────────────────────
  const logoutAll = useCallback(async () => {
    await apiClient.post('/auth/logout-all');
    localStorage.removeItem('cc_token');
    localStorage.removeItem('cc_user');
    dispatch({ type: 'CLEAR_AUTH' });
    disconnectSocket();
  }, []);

  // ─── Register ──────────────────────────────────────────────────────────────
  const register = useCallback(async (formData) => {
    const response = await apiClient.post('/auth/register', formData);
    return response.data;
  }, []);

  // ─── Update User ───────────────────────────────────────────────────────────
  const updateUser = useCallback((updatedFields) => {
    dispatch({ type: 'UPDATE_USER', payload: updatedFields });
    const cached = localStorage.getItem('cc_user');
    if (cached) {
      const user = JSON.parse(cached);
      localStorage.setItem('cc_user', JSON.stringify({ ...user, ...updatedFields }));
    }
  }, []);

  const value = {
    ...state,
    login,
    logout,
    logoutAll,
    register,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export default AuthContext;
