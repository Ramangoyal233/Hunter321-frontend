import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const WriteupForm = ({ writeup, onSubmit }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    author: '',
    category: '',
    subcategory: '',
    difficulty: 'easy',
    platform: '',
    platformUrl: '',
    bounty: '',
    tags: []
  });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isSubcategoryLoading, setIsSubcategoryLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (writeup && categories.length > 0) {
      setFormData({
        title: writeup.title || '',
        description: writeup.description || '',
        author: writeup.author || '',
        category: writeup.category?._id || '',
        subcategory: writeup.subcategory?._id || '',
        difficulty: writeup.difficulty || 'easy',
        platform: writeup.platform || '',
        platformUrl: writeup.platformUrl || '',
        bounty: writeup.bounty || '',
        tags: writeup.tags || []
      });
    }
  }, [writeup, categories]);

  useEffect(() => {
    if (formData.category) {
      const category = categories.find(cat => cat._id === formData.category);
      setSelectedCategory(category);
    } else {
      setSelectedCategory(null);
    }
  }, [formData.category, categories]);

  useEffect(() => {
    if (formData.category) {
      fetchSubcategories(formData.category);
    } else {
      setSubcategories([]);
    }
  }, [formData.category]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to access categories');
        navigate('/login');
        return;
      }
      const categoriesRes = await axios.get(`${API_BASE_URL}/api/admin/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    
      setCategories(categoriesRes.data.categories || []);
    
      setLoading(false);
    } catch (error) {
      setError(error.message || 'Error fetching categories');
      setLoading(false);
    }
  };

  const fetchSubcategories = async (categoryId) => {
    if (!categoryId) {
      setSubcategories([]);
      return;
    }
    try {
      setIsSubcategoryLoading(true);
      const subcategoriesRes = await axios.get(
       `${API_BASE_URL}/api/categories/${categoryId}/subcategories`
      );
      setSubcategories(subcategoriesRes.data.subcategories || []);
   
    } catch (error) {
 
      setError(error.message || 'Error fetching subcategories');
      setSubcategories([]);
    } finally {
      setIsSubcategoryLoading(false);
    }
  };

  const fetchCategoriesAndSubcategories = async () => {
    try {
      setLoading(true);
      const [categoriesRes, subcategoriesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/categories`),
        axios.get(`${API_BASE_URL}/api/categories/subcategories`)
      ]);

      setCategories(categoriesRes.data.categories || []);
      setSubcategories(subcategoriesRes.data.subcategories || []);
      setLoading(false);
    } catch (error) {
      setError(error.message || 'Error fetching categories and subcategories');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()]
        }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to submit a writeup');
        navigate('/login');
        return;
      }

    
      // Validate required fields
      if (!formData.category || !formData.subcategory || !formData.author) {
        toast.error('Please fill in all required fields including author');
        setSubmitting(false);
        return;
      }

      // Find the selected category and subcategory objects
      const selectedCategory = categories.find(cat => cat._id === formData.category);
      const selectedSubcategory = subcategories.find(sub => sub._id === formData.subcategory);

      if (!selectedCategory || !selectedSubcategory) {
        toast.error('Invalid category or subcategory selection');
        setSubmitting(false);
        return;
      }

      // Prepare the data for submission matching the backend route's expected structure
      const submitData = {
        title: formData.title,
        description: formData.description,
        content: formData.description, // Using description as content for now
        author: formData.author.trim(), // Include author field
        categoryId: selectedCategory._id,
        subcategoryId: selectedSubcategory._id,
        difficulty: 'Easy',
        platform: formData.platform || '',
        platformUrl: formData.platformUrl || '',
        bounty: formData.bounty || '',
        tags: formData.tags || []
      };

    
      const response = await axios.post(
        `${API_BASE_URL}/api/writeups`,
        submitData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Server response:', response.data);

      toast.success('Writeup submitted successfully');
      navigate(-1);
    } catch (error) {
      console.error('Submit error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        formData: formData,
        categories: categories,
        subcategories: subcategories,
        error: error.response?.data?.error,
        stack: error.stack
      });
      
      // More specific error message
      const errorMessage = error.response?.data?.message || 
                         error.response?.data?.error || 
                         'Error submitting writeup';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Modify the category selection handler
  const handleCategorySelect = (categoryId) => {
  
    setFormData(prev => ({
      ...prev,
      category: categoryId,
      subcategory: '' // Reset subcategory when category changes
    }));
  };

  // Modify the subcategory selection handler
  const handleSubcategorySelect = (subcategoryId) => {

    setFormData(prev => ({
      ...prev,
      subcategory: subcategoryId
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center space-y-4"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-400">Loading form...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 bg-red-900/20 px-6 py-4 rounded-lg border border-red-700/50"
        >
          {error}
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-700 via-gray-900 to-black pt-12 sm:pt-16 md:pt-24 pb-12 sm:pb-16 md:pb-24 px-3 sm:px-4 md:px-6 lg:px-8 overflow-hidden"
    >
      <div className="relative w-full max-w-4xl mx-auto space-y-6 sm:space-y-8 bg-gray-800/30 backdrop-blur-sm p-4 sm:p-6 md:p-8 rounded-xl shadow-2xl border border-gray-700/50 before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-r before:from-blue-500/10 before:via-purple-500/10 before:to-pink-500/10 before:rounded-xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center relative px-2 sm:px-4"
        >
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-3xl rounded-full transform -translate-y-1/2"></div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
            {writeup ? 'Edit Writeup' : 'Create New Writeup'}
          </h2>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base md:text-lg text-gray-400">
            Share your bug bounty experience with the community
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {/* Title & Description */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
          >
            <div className="group">
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 group-hover:text-blue-400 transition-colors">
                Title
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg blur"></div>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="relative block w-full rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:border-blue-500 focus:ring-blue-500 focus:outline-none px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base transition-all duration-200 hover:bg-gray-600/50 backdrop-blur-sm"
                />
              </div>
            </div>
            <div className="group">
              <label htmlFor="author" className="block text-sm font-medium text-gray-300 group-hover:text-blue-400 transition-colors">
                Author
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg blur"></div>
                <input
                  type="text"
                  id="author"
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  required
                  className="relative block w-full rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:border-blue-500 focus:ring-blue-500 focus:outline-none px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base transition-all duration-200 hover:bg-gray-600/50 backdrop-blur-sm"
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="group"
          >
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 group-hover:text-blue-400 transition-colors">
              Description
            </label>
            <div className="relative mt-1">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-lg blur"></div>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={3}
                className="relative block w-full rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:border-blue-500 focus:ring-blue-500 focus:outline-none px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base transition-all duration-200 hover:bg-gray-600/50 backdrop-blur-sm"
              />
            </div>
          </motion.div>

          {/* Category & Subcategory Selection */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4 sm:space-y-6"
          >
            <div>
              <label className="block text-sm font-medium text-gray-300 group-hover:text-blue-400 transition-colors mb-3 sm:mb-4">
                Select Category
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {categories.map(category => (
                  <motion.div
                    key={category._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCategorySelect(category._id)}
                    className={`relative cursor-pointer rounded-xl p-3 sm:p-4 transition-all duration-200 ${
                      formData.category === category._id
                        ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-blue-500/50 shadow-lg shadow-blue-500/20'
                        : 'bg-gray-800/50 border border-gray-700/50 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10'
                    }`}
                  >
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${
                        formData.category === category._id
                          ? 'bg-gradient-to-br from-blue-500/30 to-purple-500/30'
                          : 'bg-gray-700/50'
                      }`}>
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-sm font-medium ${
                          formData.category === category._id
                            ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400'
                            : 'text-white'
                        }`}>
                          {category.name}
                        </h3>
                        <p className="mt-1 text-xs sm:text-sm text-gray-400 line-clamp-2">
                          {category.description}
                        </p>
                      </div>
                    </div>
                    {formData.category === category._id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute top-2 right-2"
                      >
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                          <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {formData.category && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 sm:mt-6"
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <label className="block text-sm font-medium text-gray-300 group-hover:text-blue-400 transition-colors">
                    Select Subcategory
                  </label>
                  {isSubcategoryLoading && (
                    <div className="flex items-center space-x-2">
                      <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-xs sm:text-sm text-gray-400">Loading...</span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {subcategories.map(subcategory => (
                    <motion.div
                      key={subcategory._id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSubcategorySelect(subcategory._id)}
                      className={`relative cursor-pointer rounded-xl p-3 sm:p-4 transition-all duration-200 ${
                        formData.subcategory === subcategory._id
                          ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50 shadow-lg shadow-purple-500/20'
                          : 'bg-gray-800/50 border border-gray-700/50 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10'
                      }`}
                    >
                      <div className="flex items-start space-x-2 sm:space-x-3">
                        <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${
                          formData.subcategory === subcategory._id
                            ? 'bg-gradient-to-br from-purple-500/30 to-pink-500/30'
                            : 'bg-gray-700/50'
                        }`}>
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-sm font-medium ${
                            formData.subcategory === subcategory._id
                              ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400'
                              : 'text-white'
                          }`}>
                            {subcategory.name}
                          </h3>
                          <p className="mt-1 text-xs sm:text-sm text-gray-400 line-clamp-2">
                            {subcategory.description}
                          </p>
                        </div>
                      </div>
                      {formData.subcategory === subcategory._id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute top-2 right-2"
                        >
                          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Difficulty & Platform */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="group">
              <label htmlFor="difficulty" className="block text-sm font-medium text-gray-300 group-hover:text-blue-400 transition-colors">
                Difficulty
              </label>
              <select
                id="difficulty"
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-blue-500 focus:outline-none px-4 py-2 transition-all duration-200 hover:bg-gray-600"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="group">
              <label htmlFor="platform" className="block text-sm font-medium text-gray-300 group-hover:text-blue-400 transition-colors">
                Platform
              </label>
              <input
                type="text"
                id="platform"
                name="platform"
                value={formData.platform}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-blue-500 focus:outline-none px-4 py-2 transition-all duration-200 hover:bg-gray-600"
              />
            </div>
          </motion.div>

          {/* Platform URL & Bounty */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="group">
              <label htmlFor="platformUrl" className="block text-sm font-medium text-gray-300 group-hover:text-blue-400 transition-colors">
                Platform URL
              </label>
              <input
                type="url"
                id="platformUrl"
                name="platformUrl"
                value={formData.platformUrl}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-blue-500 focus:outline-none px-4 py-2 transition-all duration-200 hover:bg-gray-600"
              />
            </div>
            <div className="group">
              <label htmlFor="bounty" className="block text-sm font-medium text-gray-300 group-hover:text-blue-400 transition-colors">
                Bounty
              </label>
              <input
                type="text"
                id="bounty"
                name="bounty"
                value={formData.bounty}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-blue-500 focus:outline-none px-4 py-2 transition-all duration-200 hover:bg-gray-600"
              />
            </div>
          </motion.div>

          {/* Tags */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="group"
          >
            <label htmlFor="tags" className="block text-sm font-medium text-gray-300 group-hover:text-blue-400 transition-colors">
              Tags
            </label>
            <div className="mt-1 relative group">
              <div className="relative">
                <input
                  type="text"
                  value={tagInput}
                  onChange={handleTagInputChange}
                  onKeyDown={handleTagInputKeyDown}
                  placeholder="Type and press Enter to add tags"
                  className="block w-full rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:border-blue-500 focus:ring-blue-500 focus:outline-none px-4 py-2 pr-8 placeholder-gray-400 transition-all duration-200 hover:bg-gray-600"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <motion.div
                layout
                className="mt-3 flex flex-wrap gap-2"
              >
                {formData.tags.map(tag => (
                  <motion.span
                    key={tag}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-900/30 text-blue-200 border border-blue-700/30 backdrop-blur-sm hover:bg-blue-800/40 transition-colors duration-200"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full text-blue-300 hover:text-blue-100 hover:bg-blue-700/50 focus:outline-none transition-all duration-200 transform hover:scale-110"
                    >
                      ×
                    </button>
                  </motion.span>
                ))}
              </motion.div>
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex justify-end pt-4"
          >
            <button
              type="submit"
              disabled={submitting}
              className={`relative inline-flex justify-center py-2.5 sm:py-3 px-6 sm:px-8 border border-transparent shadow-lg text-sm sm:text-base font-medium rounded-lg text-white transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                submitting ? 'animate-pulse' : ''
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur opacity-75"></div>
              <div className="relative flex items-center space-x-2">
                {submitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <span>{writeup ? 'Update Writeup' : 'Submit Writeup'}</span>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </div>
            </button>
          </motion.div>
        </form>
      </div>
    </motion.div>
  );
};

export default WriteupForm;