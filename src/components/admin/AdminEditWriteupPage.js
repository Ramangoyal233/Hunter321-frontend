import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import WriteupForm from './WriteupForm';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const AdminEditWriteupPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [writeup, setWriteup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWriteup = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Please log in to access this page');
          navigate('/admin/login');
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/api/admin/writeups/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setWriteup(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching writeup for edit:', err);
        setError('Writeup not found or error fetching data.');
        setLoading(false);
      }
    };

    fetchWriteup();
  }, [id, navigate]);

  const handleSubmit = async (updatedWriteup) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to update writeup');
        navigate('/admin/login');
        return;
      }

      const response = await axios.put(
        `${API_BASE_URL}/api/admin/writeups/${id}`,
        updatedWriteup,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      toast.success('Writeup updated successfully');
      navigate('/admin/writeups');
    } catch (error) {
      console.error('Error updating writeup:', error);
      const errorMessage = error.response?.data?.message || 
                         error.response?.data?.error || 
                         'Error updating writeup';
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-400">Loading writeup...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-500 bg-red-900/20 px-6 py-4 rounded-lg border border-red-700/50">
          <p className="text-xl font-semibold">{error}</p>
          <p className="mt-2">Please check the writeup ID and try again.</p>
          <button 
            onClick={() => navigate('/admin/writeups')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Writeups
          </button>
        </div>
      </div>
    );
  }

  return <WriteupForm writeup={writeup} onSubmit={handleSubmit} />;
};

export default AdminEditWriteupPage; 