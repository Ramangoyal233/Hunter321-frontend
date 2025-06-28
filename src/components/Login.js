import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Get return URL from query parameters
  const searchParams = new URLSearchParams(location.search);
  const returnTo = searchParams.get('returnTo') || '/';

  // Check user status when component mounts and periodically
  useEffect(() => {
    const checkUserStatus = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await axios.get(`${API_BASE_URL}/api/auth/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.data.isActive) {
          // User is blocked, show warning and redirect to login
          setError({
            type: 'blocked',
            message: 'Your account has been temporarily blocked by an administrator. Please contact support for assistance.'
          });
          // Clear user data and token
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          login(null);
        }
      } catch (error) {
        if (error.response?.status === 403) {
          setError({
            type: 'blocked',
            message: 'Your account has been temporarily blocked by an administrator. Please contact support for assistance.'
          });
          // Clear user data and token
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          login(null);
        }
      }
    };

    // Check status immediately
    checkUserStatus();

    // Set up periodic check every 30 seconds
    const intervalId = setInterval(checkUserStatus, 30000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [login]);

  // Check URL parameters for blocked status
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('blocked') === 'true') {
      setError({
        type: 'blocked',
        message: 'Your account has been temporarily blocked by an administrator. Please contact support for assistance.'
      });
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, formData);
      
      if (response.data.token) {
        // Store auth data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Update auth context
        await login(response.data.user);
        
        // Show success message
        toast.success('Successfully signed in!');
        
        // Force a page reload to ensure all components get the new auth state
        window.location.href = returnTo;
      } else {
        throw new Error('No token received');
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.response?.status === 403) {
        setError({
          type: 'blocked',
          message: 'Your account has been temporarily blocked by an administrator. Please contact support for assistance.'
        });
        toast.error('Your account has been blocked. Please contact support.');
      } else {
        const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
        setError({
          type: 'error',
          message: errorMessage
        });
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-800"
                placeholder="Email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-800"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          {error && (
            <div className={`text-sm ${error.type === 'blocked' ? 'text-red-600' : 'text-red-500'}`}>
              {error.message}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login; 