import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch {}
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
  const res = await axios.post(`${API_URL}/auth/login`, { email, password });
  const data = res.data.data;
  localStorage.setItem('token', data.accessToken);
  localStorage.setItem('role', data.role);
  localStorage.setItem('userName', data.name);          // ← add this
  localStorage.setItem('user', JSON.stringify(data));
  setUser(data);
  return data;
};

  const register = async (name, email, password) => {
    const res = await axios.post(`${API_URL}/auth/register`, { name, email, password });
    const data = res.data.data;
    const token = data.accessToken;
    localStorage.setItem('token', token);
    localStorage.setItem('role', data.role);
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch {}
    localStorage.clear();
    setUser(null);
    window.location.href = '/login';
  };

  const updateUser = (data) => {
    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);