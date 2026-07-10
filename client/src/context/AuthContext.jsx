import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext();
const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const WELCOME_KEY = 'showWelcomeMessage';
let authSessionValidated = false;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const validationControllerRef = useRef(null);

  const cacheUser = (updatedUser) => {
    if (!updatedUser) {
      localStorage.removeItem(USER_KEY);
      setUser(null);
      return;
    }
    setUser(updatedUser);
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
  };

  const setWelcomeFlag = (isNewUser) => {
    if (isNewUser) {
      localStorage.setItem(WELCOME_KEY, 'true');
    } else {
      localStorage.removeItem(WELCOME_KEY);
    }
  };

  useEffect(() => {
    if (authSessionValidated) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    validationControllerRef.current = controller;
    const token = localStorage.getItem(TOKEN_KEY);
    const cachedUser = localStorage.getItem(USER_KEY);

    if (!token) {
      setLoading(false);
      authSessionValidated = true;
      return;
    }

    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
      } catch {
        localStorage.removeItem(USER_KEY);
      }
    }

    const validateSession = async () => {
      try {
        const res = await api.get('/api/auth/me', { signal: controller.signal });
        if (res.data?.success) {
          cacheUser(res.data.data.user);
        } else {
          localStorage.removeItem(TOKEN_KEY);
          cacheUser(null);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        const status = error?.response?.status;
        if (status === 429) {
          return;
        }
        localStorage.removeItem(TOKEN_KEY);
        cacheUser(null);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          authSessionValidated = true;
        }
      }
    };

    validateSession();

    return () => {
      controller.abort();
    };
  }, []);

  const login = async (email, password) => {
    let result = { success: false, message: 'Unable to login. Please try again.' };

    try {
      const normalizedEmail = (email || '').trim().toLowerCase();
      const res = await api.post('/api/auth/login', { email: normalizedEmail, password });
      result = res.data;

      if (result.success) {
        localStorage.setItem(TOKEN_KEY, result.data.token);
        cacheUser(result.data.user);
        setWelcomeFlag(result.data.isNewUser || false);
      }
    } catch (error) {
      result = {
        success: false,
        message: error.customMessage || error?.response?.data?.message || 'Invalid email or password'
      };
    }

    return result;
  };

  const register = async (payload) => {
    let result = { success: false, message: 'Unable to register. Please try again.' };
    try {
      const normalizedPayload = {
        ...payload,
        email: (payload?.email || '').trim().toLowerCase()
      };
      const res = await api.post('/api/auth/register', normalizedPayload);
      result = res.data;

      if (result.success) {
        localStorage.setItem(TOKEN_KEY, result.data.token);
        cacheUser(result.data.user);
        setWelcomeFlag(result.data.isNewUser || true);
      }
    } catch (error) {
      result = {
        success: false,
        message: error.customMessage || error?.response?.data?.message || 'Unable to register. Please try again.'
      };
    }

    return result;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(WELCOME_KEY);
    localStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminToken');
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, loading, login, register, logout, updateUser: cacheUser }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
