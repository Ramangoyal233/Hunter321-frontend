import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_PDF_TYPE = 'application/pdf';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const AdminBookUploadPage = () => {
  const navigate = useNavigate();
  const abortControllerRef = useRef(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: ''
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  // Cleanup function to cancel requests on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateImage = (file) => {
    return new Promise((resolve, reject) => {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        reject(new Error('Please upload a JPG or PNG image'));
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        reject(new Error('Image file size should be less than 5MB'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src); // Clean up object URL
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src); // Clean up object URL
        reject(new Error('Failed to load image'));
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const validatePDF = (file) => {
    if (file.type !== ALLOWED_PDF_TYPE) {
      throw new Error('Please upload a PDF file');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('PDF file size should be less than 5MB');
    }
    return true;
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      if (e.target.name === 'pdf') {
        validatePDF(file);
        setPdfFile(file);
      } else if (e.target.name === 'coverImage') {
        await validateImage(file);
        setCoverImage(file);
        // Create preview URL
        const reader = new FileReader();
        reader.onloadend = () => {
          setCoverPreview(reader.result);
        };
        reader.onerror = () => {
          toast.error('Failed to read image file');
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      toast.error(error.message || 'Invalid file');
      e.target.value = ''; // Reset the input
    }
  };

  const removeFile = (type) => {
    if (type === 'pdf') {
      setPdfFile(null);
    } else if (type === 'coverImage') {
      setCoverImage(null);
      setCoverPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (submitting) return;
    
    setSubmitting(true);
    setError(null);
    setUploadProgress(0);
  
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login as admin to upload books');
      setSubmitting(false);
      return;
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
  
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('author', formData.author);
      data.append('description', formData.description);
      
      if (pdfFile) {
        data.append('pdf', pdfFile);
      }
      if (coverImage) {
        data.append('coverImage', coverImage);
      }
  
      const response = await axios.post(`${API_BASE_URL}/api/books`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        signal: abortControllerRef.current.signal, // Add abort signal
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
         
        },
        timeout: 300000 // 5 minutes timeout
      });

      
  
      if (response.data && (response.data.book || response.data.message)) {
        toast.success('Book uploaded successfully!');
        navigate('/admin/books', { replace: true });
      } else {
        throw new Error('Invalid response from server');
      }
  
    } catch (err) {
      console.error('Error uploading book:', err);
      
      // Handle different types of errors
      if (err.name === 'AbortError') {
      
        return; // Don't show error for cancelled requests
      }
      
      let errorMessage = 'Failed to upload book';
      
      if (err.code === 'ECONNABORTED') {
        errorMessage = 'Upload timeout. Please try again with a smaller file.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  // Prevent page refresh during form submission
  const handleFormSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleSubmit(e);
  };

  // Handle beforeunload event to warn user about ongoing upload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (submitting) {
        e.preventDefault();
        e.returnValue = 'Upload in progress. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [submitting]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-8 pt-24">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">Upload New Book</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {submitting && uploadProgress > 0 && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Uploading... {uploadProgress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              disabled={submitting}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="author" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Author
            </label>
            <input
              type="text"
              id="author"
              name="author"
              value={formData.author}
              onChange={handleChange}
              required
              disabled={submitting}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="4"
              disabled={submitting}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            ></textarea>
          </div>

          <div>
            <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cover Image (JPG/PNG only)
              <span className="text-xs text-gray-500 dark:text-gray-400 block mt-1">
                Max size: 5MB
              </span>
            </label>
            <div className="mt-1 flex items-center space-x-4">
              <input
                type="file"
                id="coverImage"
                name="coverImage"
                accept={ALLOWED_IMAGE_TYPES.join(',')}
                onChange={handleFileChange}
                required={!coverImage}
                disabled={submitting}
                className="w-full text-gray-900 dark:text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
              {coverImage && (
                <button
                  type="button"
                  onClick={() => removeFile('coverImage')}
                  disabled={submitting}
                  className="px-3 py-2 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                >
                  Remove
                </button>
              )}
            </div>
            {coverPreview && (
              <div className="mt-2">
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  className="h-32 w-auto object-contain rounded-lg border border-gray-300 dark:border-gray-700"
                />
              </div>
            )}
          </div>

          <div>
            <label htmlFor="pdf" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Book PDF
              <span className="text-xs text-gray-500 dark:text-gray-400 block mt-1">
                Max size: 5MB
              </span>
            </label>
            <div className="mt-1 flex items-center space-x-4">
              <input
                type="file"
                id="pdf"
                name="pdf"
                accept={ALLOWED_PDF_TYPE}
                onChange={handleFileChange}
                required={!pdfFile}
                disabled={submitting}
                className="w-full text-gray-900 dark:text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
              {pdfFile && (
                <button
                  type="button"
                  onClick={() => removeFile('pdf')}
                  disabled={submitting}
                  className="px-3 py-2 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                >
                  Remove
                </button>
              )}
            </div>
            {pdfFile && (
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Selected file: {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)}MB)
              </div>
            )}
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? `Uploading... ${uploadProgress}%` : 'Upload Book'}
            </button>
            
            {submitting && (
              <button
                type="button"
                onClick={() => {
                  if (abortControllerRef.current) {
                    abortControllerRef.current.abort();
                  }
                  setSubmitting(false);
                  setUploadProgress(0);
                }}
                className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg shadow-md hover:bg-red-700 transition-colors duration-300"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminBookUploadPage;