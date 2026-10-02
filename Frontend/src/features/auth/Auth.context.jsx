import { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import apiClient from '../../services/apiClient';
import { connectSocket, disconnectSocket } from '../../services/socket';

// ─── Normalise user object from backend ────────────────────────────────────────
// Backend returns fullName; many UI components reference .name — keep both in sync.
// Role is ALWAYS stored lowercase ('doctor' | 'patient') matching the User model.
const normaliseUser = (raw) => {
  if (!raw) return null;
  const name = raw.fullName || raw.name || '';
  const role = (raw.role || '').toLowerCase(); // always lowercase
  return { ...raw, name, fullName: name, role };
};

// ─── State & Reducer ────────────────────────────────────────────────────────────
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
        user: normaliseUser(action.payload.user),
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: normaliseUser({ ...state.user, ...action.payload }),
      };
    case 'CLEAR_AUTH':
      return { ...initialState, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

// ─── Context ────────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // ── Restore session on mount ──────────────────────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('cc_token');
      const cachedUser = localStorage.getItem('cc_user');

      if (token && cachedUser) {
        try {
          const user = JSON.parse(cachedUser);
          // Immediately load cached user so UI is responsive
          dispatch({ type: 'SET_AUTH', payload: { user, token } });
          connectSocket(token);

          // Verify token is still valid + fetch fresh user data from backend
          const response = await apiClient.get('/auth/me');
          const freshUser = response.data?.data || response.data?.user || response.data;
          const normalised = normaliseUser(freshUser);
          dispatch({ type: 'UPDATE_USER', payload: normalised });
          localStorage.setItem('cc_user', JSON.stringify(normalised));
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

  // ── Login ─────────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { token, user } = response.data.data;

      const normalised = normaliseUser(user);
      localStorage.setItem('cc_token', token);
      localStorage.setItem('cc_user', JSON.stringify(normalised));

      dispatch({ type: 'SET_AUTH', payload: { user: normalised, token } });
      connectSocket(token);

      return { success: true, user: normalised };
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        err.message ||
        'Login failed';
      return { success: false, message };
    }
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('cc_token');
    localStorage.removeItem('cc_user');
    dispatch({ type: 'CLEAR_AUTH' });
    disconnectSocket();
  }, []);

  // ── Logout All Devices ────────────────────────────────────────────────────────
  const logoutAll = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout-all');
    } catch (err) {
      console.error('Logout all error:', err);
    }
    localStorage.removeItem('cc_token');
    localStorage.removeItem('cc_user');
    dispatch({ type: 'CLEAR_AUTH' });
    disconnectSocket();
  }, []);

  // ── Register ──────────────────────────────────────────────────────────────────
  const register = useCallback(async (formData) => {
    try {
      const response = await apiClient.post('/auth/register', formData);
      const resData = response.data;
      if (resData?.data?.token && resData?.data?.user) {
        const { token, user } = resData.data;
        const normalised = normaliseUser(user);
        localStorage.setItem('cc_token', token);
        localStorage.setItem('cc_user', JSON.stringify(normalised));
        dispatch({ type: 'SET_AUTH', payload: { user: normalised, token } });
        connectSocket(token);
      }
      return { success: true, data: resData.data };
    } catch (err) {
      const message =
        err.response?.data?.errors?.[0]?.message ||
        err.response?.data?.message ||
        err.message ||
        'Registration failed. Please try again.';
      return { success: false, message };
    }
  }, []);

  // ── Update User ───────────────────────────────────────────────────────────────
  const updateUser = useCallback((updatedFields) => {
    dispatch({ type: 'UPDATE_USER', payload: updatedFields });
    const cached = localStorage.getItem('cc_user');
    if (cached) {
      const user = JSON.parse(cached);
      const merged = normaliseUser({ ...user, ...updatedFields });
      localStorage.setItem('cc_user', JSON.stringify(merged));
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
