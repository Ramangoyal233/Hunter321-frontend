import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useDebounce } from '../hooks/useDebounce';

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/writeups/search?query=${encodeURIComponent(debouncedSearchQuery)}`);
        setSearchResults(response.data);
      } catch (error) {
        console.error('Error searching writeups:', error);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedSearchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/writeups?search=${encodeURIComponent(searchQuery)}`);
      setShowResults(false);
    }
  };

  const handleResultClick = (writeupId) => {
    navigate(`/writeups/${writeupId}`);
    setShowResults(false);
    setSearchQuery('');
  };

  return (
    <div className="relative">
      <form onSubmit={handleSearch} className="flex items-center">
        <div className="relative w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            placeholder="Search writeups..."
            className="w-full bg-black/50 text-white border border-gray-700 rounded-full py-1.5 px-3 pl-8 text-sm focus:outline-none focus:border-blue-500 transition-all duration-300"
          />
          <button
            type="submit"
            className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </div>
      </form>

      {/* Search Results Dropdown */}
      {showResults && (searchQuery.trim() || isLoading) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-400">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-zinc-400 mx-auto"></div>
              <p className="mt-2">Searching...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="py-2">
              {searchResults.map((writeup) => (
                <button
                  key={writeup._id}
                  onClick={() => handleResultClick(writeup._id)}
                  className="w-full px-4 py-2 text-left hover:bg-zinc-800 transition-colors duration-200"
                >
                  <div className="text-white font-medium">{writeup.title}</div>
                  <div className="text-sm text-gray-400 truncate">{writeup.content.substring(0, 100)}...</div>
                </button>
              ))}
            </div>
          ) : searchQuery.trim() ? (
            <div className="p-4 text-center text-gray-400">
              No writeups found
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SearchBar; 