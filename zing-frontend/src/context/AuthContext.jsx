import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('zing_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api
        .get('/users/me')
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('zing_token');
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: jwt } = res.data;
    localStorage.setItem('zing_token', jwt);
    setToken(jwt);
    const userRes = await api.get('/users/me', {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    setUser(userRes.data);
    return userRes.data;
  };

  const signup = async (name, email, password, phone, role = 'USER') => {
    const res = await api.post('/auth/signup', { name, email, password, phone, role });
    const { token: jwt } = res.data;
    localStorage.setItem('zing_token', jwt);
    setToken(jwt);
    const userRes = await api.get('/users/me', {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    setUser(userRes.data);
    return userRes.data;
  };

  const logout = () => {
    localStorage.removeItem('zing_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
