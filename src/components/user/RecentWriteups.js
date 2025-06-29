import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';

const RecentWriteups = () => {
  const [writeups, setWriteups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sectionTitle, setSectionTitle] = useState("Recent Writeups");
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;


  useEffect(() => {
    const fetchWriteups = async () => {
      try {
        setLoading(true);
        setError(null);
        let fetchedWriteups = [];

        // Try fetching recent writeups first
        try {
          const recentResponse = await axios.get(`${API_BASE_URL}/api/writeups/recent`);
          if (recentResponse.data && recentResponse.data.length > 0) {
            fetchedWriteups = recentResponse.data;
            setSectionTitle("Recent Writeups");
          } else {
          
            // Fallback to newest writeups if no recent ones
            const allResponse = await axios.get(`${API_BASE_URL}/api/writeups`);
            // Assuming /api/writeups returns all sorted by newest first, take the top 10
            fetchedWriteups = allResponse.data.slice(0, 10); // Take up to 10 newest writeups
            setSectionTitle("Newest Writeups");
          }
        } catch (recentError) {
          console.warn('Error fetching recent writeups, falling back to all writeups:', recentError);
          // If recent endpoint fails, directly fetch all
          const allResponse = await axios.get(`${API_BASE_URL}/api/writeups`);
          fetchedWriteups = allResponse.data.slice(0, 10); // Take up to 10 newest writeups
          setSectionTitle("Newest Writeups");
        }

        setWriteups(fetchedWriteups);
      } catch (err) {
        console.error('Error fetching writeups:', err);
        setError('Failed to load writeups. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchWriteups();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-zinc-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-8">
        {error}
      </div>
    );
  }

  if (writeups.length === 0) {
    return (
      <div className="text-gray-400 text-center py-8">
        No writeups available at the moment. Check back later!
      </div>
    );
  }

  return (
    <section className="py-10">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white">{sectionTitle}</h2>
        <Link 
          to="/writeups" 
          className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2"
        >
          View All
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {writeups.map((writeup, index) => (
          <motion.div
            key={writeup._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 w-full h-full flex flex-col"
          >
            <div className="p-4 sm:p-5 flex flex-col h-full">
              <div className="flex items-center justify-between mb-3">
                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                  writeup.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                  writeup.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {writeup.difficulty}
                </span>
                <div className="flex items-center gap-1">
                  <span className="flex items-center gap-0.5 text-blue-400 font-medium bg-blue-500/10 px-2 py-1 rounded-full text-xs">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="hidden sm:inline">{writeup.reads || 0} reads</span>
                    <span className="sm:hidden">{writeup.reads || 0}</span>
                  </span>
                  {writeup.bounty?.amount > 0 && (
                    <span className="text-blue-400 font-medium flex items-center gap-0.5 bg-blue-500/10 px-2 py-1 rounded-full text-xs">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="hidden sm:inline">${writeup.bounty.amount}</span>
                      <span className="sm:hidden">${writeup.bounty.amount}</span>
                    </span>
                  )}
                </div>
              </div>

              <h3 className="text-base sm:text-lg font-semibold text-white mb-2 line-clamp-2 hover:text-blue-400 transition-colors flex-grow">
                {writeup.title}
              </h3>

              <p className="text-zinc-400 text-xs sm:text-sm mb-3 line-clamp-2">
                {writeup.description}
              </p>

              <div className="flex flex-wrap gap-1 mb-3">
                <span className="px-2 py-0.5 bg-zinc-800 rounded-full text-xs text-zinc-300">
                  {writeup.platform}
                </span>
                <span className="px-2 py-0.5 bg-zinc-800 rounded-full text-xs text-zinc-300">
                  {writeup.category.name}
                </span>
                {writeup.subcategory && (
                  <span className="px-2 py-0.5 bg-zinc-800 rounded-full text-xs text-zinc-300">
                    {writeup.subcategory.name}
                  </span>
                )}
              </div>

              <div className="mt-auto flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-zinc-400">
                    {new Date(writeup.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <Link
                  to={`/writeups/${writeup._id}`}
                  className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-0.5 text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">Read More</span>
                  <span className="sm:hidden">Read</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default RecentWriteups; 