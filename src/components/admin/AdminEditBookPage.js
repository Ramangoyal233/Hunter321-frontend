import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Helper function to get full URL for images
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  // Otherwise, prepend the API base URL
  return `${API_BASE_URL}${imagePath}`;
};

const AdminEditBookPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: ''
  });
  const [bookData, setBookData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [currentPdfUrl, setCurrentPdfUrl] = useState(null);
  const [currentCoverImage, setCurrentCoverImage] = useState(null);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/books/${id}`);
        const fetchedBookData = response.data;
        setBookData(fetchedBookData);
        setFormData({
          title: fetchedBookData.title || '',
          author: fetchedBookData.author || '',
          description: fetchedBookData.description || ''
        });
        if (fetchedBookData.pdfUrl) {
          setCurrentPdfUrl(fetchedBookData.pdfUrl);
        }
        if (fetchedBookData.coverImageUrl) {
          setCurrentCoverImage(fetchedBookData.coverImageUrl);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching book for edit:', err);
        setError('Book not found or error fetching data.');
        setLoading(false);
      }
    };

    fetchBook();
  }, [id]);

  useEffect(() => {
    // Check if admin token exists and is valid
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login as admin to access this page');
      navigate('/admin/login');
      return;
    }

    // Verify admin status
    const verifyAdmin = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/auth/admin/verify`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.data.isAdmin) {
          setError('Admin access required');
          navigate('/admin/login');
        }
      } catch (err) {
        setError('Please login as admin');
        navigate('/admin/login');
      }
    };

    verifyAdmin();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.name === 'pdf') {
      setPdfFile(e.target.files[0]);
    } else if (e.target.name === 'coverImage') {
      setCoverImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login as admin to upload books');
      setLoading(false);
      return;
    }

    try {
      const data = new FormData();
      const fieldsToUpdate = ['title', 'author', 'description'];
      fieldsToUpdate.forEach(field => {
        if (formData[field] !== undefined) {
          data.append(field, formData[field]);
        }
      });
      
      if (pdfFile) {
        data.append('pdf', pdfFile);
      }
      if (coverImage) {
        data.append('coverImage', coverImage);
      }

      const response = await axios.put(`${API_BASE_URL}/api/books/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });
      
      if (response.data && response.data.book) {
        setMessage('Book updated successfully!');
        toast.success('Book updated successfully!');
        setTimeout(() => {
          navigate('/admin/books');
        }, 1500);
      } else {
        setError(response.data.message || 'Failed to update book.');
        toast.error(response.data.message || 'Failed to update book.');
      }
    } catch (err) {
      console.error('Error updating book:', err);
      toast.error(err.response?.data?.message || 'Failed to update book. Please try again.');
      setError(err.response?.data?.message || 'Failed to update book.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-24 bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-24 bg-gray-100 dark:bg-gray-900">
        <div className="text-red-500 text-center">
          <p className="text-xl font-semibold">{error}</p>
          <p className="mt-2">Please check the book ID and try again.</p>
          <button 
            onClick={() => navigate('/admin/books')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Books
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-8 pt-24">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">Edit Book</h1>

        {message && <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-4">{message}</div>}
        {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="author" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Author</label>
            <input
              type="text"
              id="author"
              name="author"
              value={formData.author}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="4"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          {bookData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pages</label>
                <p className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100">{bookData.pages || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Today Reads</label>
                <p className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100">{bookData.todayReads}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Reads</label>
                <p className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100">{bookData.totalReads}</p>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cover Image</label>
            <input
              type="file"
              id="coverImage"
              name="coverImage"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-gray-900 dark:text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {currentCoverImage && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">Current cover image:</p>
                <img src={getImageUrl(currentCoverImage)} alt="Current cover" className="mt-1 h-32 object-cover rounded" />
              </div>
            )}
          </div>

          <div>
            <label htmlFor="pdf" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Book PDF</label>
            <input
              type="file"
              id="pdf"
              name="pdf"
              accept=".pdf"
              onChange={handleFileChange}
              className="w-full text-gray-900 dark:text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {currentPdfUrl && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Current PDF file: {currentPdfUrl.split('/').pop()}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Updating...' : 'Update Book'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminEditBookPage; 