import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
// Configure socket.io client
const socket = io(`${API_BASE_URL}`, {
  transports: ['websocket', 'polling'],
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  forceNew: true,
  path: '/socket.io'
});

export const AuthProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isUser, setIsUser] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [connectionTimeout, setConnectionTimeout] = useState(null);
  const [isInitialLogin, setIsInitialLogin] = useState(false);
  const navigate = useNavigate();

  // Socket connection management
  const connectSocket = useCallback(() => {
    if (socket.connected || reconnectAttempts >= 3 || isInitialLogin) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    if (!socket.connected) {
      try {
        socket.auth = { token };
        socket.connect();
      } catch (error) {
        console.error('Socket connection error:', error);
        // Don't logout on socket connection failure
        setSocketConnected(false);
      }
    }
  }, [reconnectAttempts, isInitialLogin]);

  const disconnectSocket = useCallback(() => {
    if (socket.connected) {
      socket.disconnect();
    }
  }, []);

  // Token verification
  const verifyToken = async () => {
    if (isVerifying || isInitialLogin) return;
    
    setIsVerifying(true);
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      logout();
      setIsVerifying(false);
      return;
    }

    let user;
    try {
      user = JSON.parse(userStr);
    
      if (user.role === 'admin') {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/auth/admin/verify`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 5000 // 5 second timeout
          });

          if (response.data.isAdmin && response.data.admin) {
            setIsAdmin(true);
            setUserData(response.data.admin);
            if (!socket.connected) {
              connectSocket();
            }
          } else {
          
            logout();
            navigate('/admin/login');
          }
        } catch (error) {
          if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
           
            // Use cached data if server is not reachable
            setIsAdmin(true);
            setUserData(user);
            if (!socket.connected) {
              connectSocket();
            }
          } else {
            console.error('Token verification failed:', error);
            logout();
            navigate('/admin/login');
          }
        }
      } else {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/auth/verify`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 5000 // 5 second timeout
          });

          if (response.data.valid) {
            setIsUser(true);
            setUserData(response.data.user);
            if (!socket.connected) {
              connectSocket();
            }
          } else {
           
            logout();
            navigate('/signin');
          }
        } catch (error) {
          if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
           
            // Use cached data if server is not reachable
            setIsUser(true);
            setUserData(user);
            if (!socket.connected) {
              connectSocket();
            }
          } else {
            console.error('Token verification failed:', error);
            logout();
            navigate('/signin');
          }
        }
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      logout();
      navigate(user?.role === 'admin' ? '/admin/login' : '/signin');
    } finally {
      setLoading(false);
      setIsVerifying(false);
    }
  };

  // Socket event handlers
  const handleConnect = useCallback(() => {
   
    setSocketConnected(true);
    setReconnectAttempts(0);
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
      setConnectionTimeout(null);
    }
  }, [connectionTimeout]);

  const handleDisconnect = useCallback((reason) => {
    setSocketConnected(false);
    
    if (reason === 'io server disconnect' && !isInitialLogin) {
      setReconnectAttempts(prev => prev + 1);
      if (reconnectAttempts < 3) {
        const timeout = setTimeout(() => {
          if (!socket.connected) {
            connectSocket();
          }
        }, 2000);
        setConnectionTimeout(timeout);
      }
    }
  }, [connectSocket, reconnectAttempts, isInitialLogin]);

  const handleConnectError = useCallback((error) => {
    console.error('Socket connection error:', error);
    setSocketConnected(false);
    
    // Only handle authentication errors, ignore network errors
    if (error.message === 'Authentication error' && !isInitialLogin) {
      logout();
      navigate('/signin');
    }
  }, [navigate, isInitialLogin]);

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Add event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    // Initial connection
    if (!socket.connected && reconnectAttempts < 3 && !isInitialLogin) {
      try {
        connectSocket();
      } catch (error) {
        console.error('Initial socket connection failed:', error);
        // Don't logout on initial connection failure
      }
    }

    return () => {
      // Cleanup
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
      }
      
      if (socket.connected) {
        disconnectSocket();
      }
    };
  }, [connectSocket, disconnectSocket, handleConnect, handleDisconnect, handleConnectError, reconnectAttempts, connectionTimeout, isInitialLogin]);

  // Check auth status
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) {
        setLoading(false);
        return;
      }

      if (isVerifying || isInitialLogin) {
        return;
      }

      try {
        const user = JSON.parse(userStr);
        if (user.role === 'admin') {
          setIsAdmin(true);
          setUserData(user);
          setLoading(false);
        } else {
          setIsUser(true);
          setUserData(user);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setLoading(false);
      }
    };

    checkAuth();
  }, [isVerifying, isInitialLogin]);

  // Separate effect for token verification
  useEffect(() => {
    const verifyStoredToken = async () => {
      if (isVerifying || isInitialLogin || !userData) return;
      
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        if (userData.role === 'admin') {
          const response = await axios.get(`${API_BASE_URL}/api/auth/admin/verify`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 5000
          });

          if (!response.data.isAdmin || !response.data.admin) {
          
            logout();
            navigate('/admin/login');
          }
        } else {
          const response = await axios.get(`${API_BASE_URL}/api/auth/verify`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 5000
          });

          if (!response.data.valid) {
           
            logout();
            navigate('/signin');
          }
        }
      } catch (error) {
        if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
         
          console.error('Token verification failed:', error);
          logout();
          navigate(userData?.role === 'admin' ? '/admin/login' : '/signin');
        }
      }
    };

    verifyStoredToken();
  }, [userData, isVerifying, isInitialLogin, navigate]);

  const checkUserStatus = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.data.isActive) {
        // User is blocked, show warning and redirect to signin
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUserData(null);
        setIsAdmin(false);
        setIsUser(false);
        navigate('/signin?blocked=true');
      }
    } catch (error) {
      if (error.response?.status === 403) {
        // User is blocked
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUserData(null);
        setIsAdmin(false);
        setIsUser(false);
        navigate('/signin?blocked=true');
      } else if (error.response?.status === 401) {
        // Token is invalid or expired
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUserData(null);
        setIsAdmin(false);
        setIsUser(false);
        navigate('/signin');
      }
    }
  };

  // Listen for real-time status changes
  useEffect(() => {
    socket.on('userStatusChanged', (data) => {
      if (userData && data.userId === userData.id) {
        if (!data.isActive) {
          // User has been blocked, force logout
          logout();
          window.location.href = '/login?blocked=true';
        }
      }
    });

    return () => {
      socket.off('userStatusChanged');
    };
  }, [userData]);

  const login = (user) => {
    if (!user) return;
    
    setIsInitialLogin(true);
    
    if (user.role === 'admin') {
      setIsAdmin(true);
      setUserData(user);
      const token = localStorage.getItem('token');
      if (token && !socket.connected) {
        socket.auth = { token };
        socket.connect();
      }
    } else {
      setIsUser(true);
      setUserData(user);
    }
    
    setLoading(false);
    
    // Reset initial login flag after a short delay
    setTimeout(() => {
      setIsInitialLogin(false);
    }, 1000);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAdmin(false);
    setIsUser(false);
    setUserData(null);
    setLoading(false);
    socket.disconnect();
  };

  if (loading) {
    return null; // or a loading spinner
  }

  return (
    <AuthContext.Provider value={{ 
      isAdmin, 
      isUser, 
      userData, 
      login, 
      logout, 
      loading,
      token: localStorage.getItem('token') // Expose the token
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 