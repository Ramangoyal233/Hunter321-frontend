import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

const WriteupsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [writeups, setWriteups] = useState([]);
  const [filteredWriteups, setFilteredWriteups] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const [filters, setFilters] = useState({
    search: '',
    category: '',
    subcategory: '',
    platform: '',
    difficulty: '',
    minBounty: '',
    maxBounty: '',
    startDate: '',
    endDate: '',
    sortBy: 'newest',
    showFilters: false
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
   
        const [writeupsRes, categoriesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/writeups`),
          axios.get(`${API_BASE_URL}/api/categories/public`)
        ]);

      

        setWriteups(writeupsRes.data);
        setFilteredWriteups(writeupsRes.data);
        setCategories(categoriesRes.data.categories);
        setSubcategories(categoriesRes.data.categories.flatMap(cat => cat.subcategories || []));
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Error fetching data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...writeups];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(writeup =>
        (writeup.title?.toLowerCase() || '').includes(searchLower) ||
        (writeup.content?.toLowerCase() || '').includes(searchLower)
      );
    }

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(writeup =>
        writeup.category._id === filters.category
      );
    }

    // Apply subcategory filter
    if (filters.subcategory) {
      filtered = filtered.filter(writeup =>
        writeup.category.isSubcategory && writeup.category._id === filters.subcategory
      );
    }

    // Apply platform filter
    if (filters.platform) {
      filtered = filtered.filter(writeup =>
        writeup.platform === filters.platform
      );
    }

    // Apply difficulty filter
    if (filters.difficulty) {
      filtered = filtered.filter(writeup =>
        writeup.difficulty === filters.difficulty
      );
    }

    // Apply bounty range filter
    if (filters.minBounty) {
      filtered = filtered.filter(writeup =>
        writeup.bounty?.amount >= Number(filters.minBounty)
      );
    }
    if (filters.maxBounty) {
      filtered = filtered.filter(writeup =>
        writeup.bounty?.amount <= Number(filters.maxBounty)
      );
    }

    // Apply date range filter
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filtered = filtered.filter(writeup =>
        new Date(writeup.createdAt) >= startDate
      );
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999); // Set to end of day
      filtered = filtered.filter(writeup =>
        new Date(writeup.createdAt) <= endDate
      );
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'highestBounty':
        filtered.sort((a, b) => (b.bounty?.amount || 0) - (a.bounty?.amount || 0));
        break;
      case 'mostReads':
        filtered.sort((a, b) => b.reads - a.reads);
        break;
      case 'mostLikes':
        filtered.sort((a, b) => b.likes - a.likes);
        break;
      default:
        break;
    }

    setFilteredWriteups(filtered);
  }, [filters, writeups]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
      // Reset subcategory when category changes
      ...(name === 'category' && { subcategory: '' })
    }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      category: '',
      subcategory: '',
      platform: '',
      difficulty: '',
      minBounty: '',
      maxBounty: '',
      startDate: '',
      endDate: '',
      sortBy: 'newest',
      showFilters: false
    });
  };

  const handleReadWriteup = async (writeupId, platformUrl) => {
    try {
      // Only increment read count if user is logged in
      if (isAuthenticated && user) {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No authentication token found');
          window.open(platformUrl, '_blank', 'noopener,noreferrer');
          return;
        }

        const response = await axios.post(`${API_BASE_URL}/api/writeups/${writeupId}/read`, {}, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // Update the writeup's read count in the local state
        setWriteups(prevWriteups => 
          prevWriteups.map(writeup => 
            writeup._id === writeupId 
              ? { ...writeup, reads: response.data.reads }
              : writeup
          )
        );
      }
      
      // Open platform URL in new tab
      window.open(platformUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error incrementing read count:', error);
      // Still open the URL even if read count increment fails
      window.open(platformUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zinc-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black px-4 py-12">
        <div className="max-w-md w-full bg-zinc-900 rounded-2xl shadow-xl border border-zinc-800 p-8 flex flex-col items-center">
          <svg className="w-20 h-20 text-red-500 mb-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-white mb-2 text-center">Something went wrong</h2>
          <p className="text-zinc-400 mb-6 text-center">{error || 'We couldn\'t load the page. Please check your connection or try again later.'}</p>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-medium text-lg"
            >
              Retry
            </button>
            <button
              onClick={() => window.history.back()}
              className="w-full px-6 py-3 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 border border-zinc-700 transition-all font-medium text-lg"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const platforms = [...new Set(writeups.map(w => w.platform))];

  return (
    <div className="min-h-screen bg-black pt-11">
      {/* Header Section */}
      <div className="bg-zinc-900 border-b border-zinc-800">
        <div className="container mx-auto px-4 py-8 sm:py-10 md:py-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl font-bold text-white mb-2 sm:mb-4"
          >
            Writeups
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-zinc-400 text-base sm:text-lg"
          >
            Explore and learn from our collection of security writeups
          </motion.p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Search and Filter Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 rounded-xl p-3 sm:p-6 mb-6 sm:mb-8 shadow-lg border border-zinc-800"
        >
          <div className="flex flex-col md:flex-row gap-3 md:gap-4">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Search writeups..."
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-xl bg-zinc-800 text-white border border-zinc-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm sm:text-base"
                />
                <svg className="w-5 h-5 text-zinc-500 absolute right-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => setFilters(prev => ({ ...prev, showFilters: !prev.showFilters }))}
                className="px-4 py-2 sm:px-6 sm:py-3 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-all flex items-center gap-2 text-sm sm:text-base"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                {filters.showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
              <button
                onClick={resetFilters}
                className="px-4 py-2 sm:px-6 sm:py-3 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-all flex items-center gap-2 text-sm sm:text-base"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {filters.showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 sm:mt-6 overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 p-3 sm:p-6 bg-zinc-800/50 rounded-xl">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Category</label>
                    <select
                      name="category"
                      value={filters.category}
                      onChange={handleFilterChange}
                      className="w-full px-4 py-3 rounded-xl bg-zinc-800 text-white border border-zinc-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    >
                      <option value="">All Categories</option>
                      {categories.map(category => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Subcategory</label>
                    <select
                      name="subcategory"
                      value={filters.subcategory}
                      onChange={handleFilterChange}
                      className="w-full px-4 py-3 rounded-xl bg-zinc-800 text-white border border-zinc-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      disabled={!filters.category}
                    >
                      <option value="">All Subcategories</option>
                      {subcategories
                        .filter(sub => sub.parent._id === filters.category)
                        .map(subcategory => (
                          <option key={subcategory._id} value={subcategory._id}>
                            {subcategory.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Platform</label>
                    <select
                      name="platform"
                      value={filters.platform}
                      onChange={handleFilterChange}
                      className="w-full px-4 py-3 rounded-xl bg-zinc-800 text-white border border-zinc-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    >
                      <option value="">All Platforms</option>
                      {platforms.map(platform => (
                        <option key={platform} value={platform}>
                          {platform}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Difficulty</label>
                    <select
                      name="difficulty"
                      value={filters.difficulty}
                      onChange={handleFilterChange}
                      className="w-full px-4 py-3 rounded-xl bg-zinc-800 text-white border border-zinc-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    >
                      <option value="">All Difficulties</option>
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Sort By</label>
                    <select
                      name="sortBy"
                      value={filters.sortBy}
                      onChange={handleFilterChange}
                      className="w-full px-4 py-3 rounded-xl bg-zinc-800 text-white border border-zinc-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="highestBounty">Highest Bounty</option>
                      <option value="mostReads">Most Reads</option>
                      <option value="mostLikes">Most Likes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Min Bounty</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-400">$</span>
                      <input
                        type="number"
                        name="minBounty"
                        value={filters.minBounty}
                        onChange={handleFilterChange}
                        placeholder="Min amount"
                        className="w-full pl-8 pr-4 py-3 rounded-xl bg-zinc-800 text-white border border-zinc-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Max Bounty</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-400">$</span>
                      <input
                        type="number"
                        name="maxBounty"
                        value={filters.maxBounty}
                        onChange={handleFilterChange}
                        placeholder="Max amount"
                        className="w-full pl-8 pr-4 py-3 rounded-xl bg-zinc-800 text-white border border-zinc-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      value={filters.startDate}
                      onChange={handleFilterChange}
                      className="w-full px-4 py-3 rounded-xl bg-zinc-800 text-white border border-zinc-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      value={filters.endDate}
                      onChange={handleFilterChange}
                      className="w-full px-4 py-3 rounded-xl bg-zinc-800 text-white border border-zinc-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results Count */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 sm:mb-8"
        >
          <p className="text-zinc-400 text-xs sm:text-sm">
            Showing {filteredWriteups.length} of {writeups.length} writeups
          </p>
        </motion.div>

        {/* Writeups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center">
          {filteredWriteups.map((writeup, index) => {
            const writeupObj = writeup.toObject ? writeup.toObject() : writeup;
            const userReadEntry = writeupObj.readBy?.find(entry => entry.user === user?._id || entry.user?._id === user?._id);
            const hasRead = !!userReadEntry;
            const lastReadTime = userReadEntry ? new Date(userReadEntry.timestamp) : null;
            return (
              <motion.div
                key={writeup._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative rounded-3xl overflow-hidden border border-blue-700/30 shadow-2xl shadow-blue-900/20 hover:shadow-blue-500/30 hover:scale-[1.025] transition-all duration-300 w-full h-full flex flex-col backdrop-blur-xl max-w-full md:max-w-[95vw] lg:max-w-[370px] xl:max-w-[420px] mx-auto"
                style={{ minHeight: '370px' }}
              >
                <div className="relative z-10 flex flex-col h-full p-6">
                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-4 gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-600/30 to-emerald-600/30 text-green-300 shadow-sm shadow-green-500/10">
                      {writeupObj.difficulty}
                    </span>
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-600/30 to-blue-800/30 text-blue-200 shadow-sm shadow-blue-500/10">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      {writeupObj.reads || 0} reads
                    </span>
                    {writeupObj.bounty?.amount > 0 && (
                      <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-500/30 to-yellow-700/30 text-yellow-300 shadow-sm shadow-yellow-500/10">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="font-bold">${writeupObj.bounty.amount.toLocaleString()}</span>
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <div className="font-extrabold text-lg sm:text-xl break-words whitespace-normal text-white mb-1 drop-shadow-lg">
                    {writeupObj.title}
                  </div>

                  {/* Meta Row */}
                  <div className="flex items-center gap-4 text-xs text-zinc-400 mb-2">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      {writeupObj.reads} reads
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {new Date(writeupObj.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {writeupObj.tags && writeupObj.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="bg-gradient-to-r from-blue-700/60 to-blue-900/60 text-blue-100 px-2 py-0.5 rounded-full text-xs font-semibold shadow shadow-blue-900/10">#{tag}</span>
                    ))}
                    {writeupObj.tags && writeupObj.tags.length > 3 && (
                      <span className="text-xs text-zinc-400">+{writeupObj.tags.length - 3} more</span>
                    )}
                  </div>

                  {/* Category/Subcategory */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-0.5 bg-gradient-to-r from-zinc-700/60 to-zinc-900/60 rounded-full text-xs text-zinc-200 font-semibold shadow shadow-zinc-900/10">{writeupObj.category?.name || "No Category"}</span>
                    {writeupObj.subcategory?.name && (
                      <span className="px-2 py-0.5 bg-gradient-to-r from-purple-700/60 to-pink-900/60 rounded-full text-xs text-pink-100 font-semibold shadow shadow-pink-900/10">{writeupObj.subcategory.name}</span>
                    )}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleReadWriteup(writeupObj._id, writeupObj.platformUrl)}
                    className={`mt-auto w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-base transition-all duration-300 shadow-lg
                      ${hasRead
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                        : 'bg-gradient-to-r from-blue-500 to-blue-700 text-white hover:from-blue-600 hover:to-blue-800'}
                      hover:scale-105`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    {hasRead ? 'Read Again' : 'Read Writeup'}
                  </button>

                  {/* Last Read */}
                  {hasRead && lastReadTime && (
                    <div className="mt-3 text-xs text-green-300 text-center font-mono">
                      Last read: {lastReadTime.toLocaleString()}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* No Results */}
        {filteredWriteups.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="mb-4">
              <svg className="w-16 h-16 text-zinc-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-zinc-400 text-lg mb-4">No writeups found matching your filters</p>
            <button
              onClick={resetFilters}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-300 font-medium"
            >
              Reset Filters
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default WriteupsPage; 