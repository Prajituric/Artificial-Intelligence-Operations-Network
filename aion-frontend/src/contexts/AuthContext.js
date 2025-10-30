import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if a token exists in localStorage
    const token = localStorage.getItem('token');
    
    // Set authorization header for all requests
    axios.defaults.headers.common['Authorization'] = token ? `Bearer ${token}` : '';
    
    // Get user information
      fetchUserInfo();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await axios.get('http://localhost:8000/users/me');
      setUser(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user info:', error);
      logout();
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      setError('');
      const response = await axios.post('http://localhost:8000/token', 
        new URLSearchParams({
          'username': username,
          'password': password
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      
      // Setează header-ul de autorizare pentru toate request-urile
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      // Obține informații despre utilizator
      await fetchUserInfo();
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.detail || 'An error occurred during login');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    error,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}