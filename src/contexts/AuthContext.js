import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        // First try admin verification
        try {
          const adminResponse = await axios.get(`${API_BASE_URL}/api/auth/admin/verify`, {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          
          if (adminResponse.data.isAdmin) {
           
            setUser(adminResponse.data.admin);
            setIsAuthenticated(true);
            setIsAdmin(true);
            setLoading(false);
            return;
          }
        } catch (adminErr) {
        
        }

        // If not admin, try user verification
        const userResponse = await axios.get(`${API_BASE_URL}/api/auth/verify`, {
          headers: { Authorization: `Bearer ${storedToken}` }
        });

        if (userResponse.data.user) {
          setUser(userResponse.data.user);
          setIsAuthenticated(true);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Token verification error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  const adminLogin = async (email, password) => {
    try {
     
      const response = await axios.post(`${API_BASE_URL}/api/auth/admin/login`, {
        email,
        password
      });

      if (response.data.token) {
        const { token: newToken, admin } = response.data;
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify({ ...admin, role: 'admin' }));
        setToken(newToken);
        setUser({ ...admin, role: 'admin' });
        setIsAuthenticated(true);
        setIsAdmin(true);
        setError(null);
        return response.data;
      } else {
        throw new Error('No token received');
      }
    } catch (error) {
      console.error('Admin login error:', error);
      setError(error.response?.data?.message || 'Failed to login as admin');
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password
      });

      if (response.data.token) {
        const { token: newToken, user: userData } = response.data;
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(newToken);
        setUser(userData);
        setIsAuthenticated(true);
        setIsAdmin(false);
        setError(null);
        return response.data;
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    token,
    isAuthenticated,
    isAdmin,
    login,
    adminLogin,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 