import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import PDFReader from './PDFReader';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaTimes, FaArrowLeft, FaArrowRight, FaSearchPlus, FaSearchMinus, FaExpand, FaCompress } from 'react-icons/fa';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Helper for formatting duration
export const formatReadingTime = (seconds) => {
  if (!seconds || seconds === 0) return '0s';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  let result = '';
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0 || hours > 0) result += `${minutes}m `;
  result += `${secs}s`;
  return result.trim();
};

// Helper function to get full URL for images
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  console.log(imagePath);
  console.log(`${API_BASE_URL}${imagePath}`);
  // Otherwise, prepend the API base URL
  return `${API_BASE_URL}${imagePath}`;
};

const BookCard = ({ book, onSelect, onProgressUpdate }) => {
  const [readingProgress, setReadingProgress] = useState(null);
  const [bookStats, setBookStats] = useState(null);
  const token = localStorage.getItem('token');
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    const fetchReadingProgress = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/books/${book._id}/progress`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data && response.data.progress) {
          setReadingProgress(response.data.progress);
        }
      } catch (error) {
        console.error('Error fetching reading progress:', error);
      }
    }; // Added missing closing brace and semicolon
  
    // Fetch book stats
    const fetchBookStats = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/books/${book._id}/stats`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setBookStats(response.data);
      } catch (error) {
        console.error('Error fetching book stats:', error);
      }
    };
  
    if (token) {
      fetchReadingProgress();
      fetchBookStats();
    }
  }, [book._id, token, onProgressUpdate]);

  const getProgressColor = () => {
    if (!readingProgress) return 'bg-blue-600 hover:bg-blue-700';
    if (readingProgress.currentPage >= book.pages) return 'bg-green-600 hover:bg-green-700';
    return 'bg-blue-600 hover:bg-blue-700';
  };

  const getProgressText = () => {
    if (!readingProgress) return 'Read Book';
    if (readingProgress.currentPage >= book.pages) return 'Read Again';
    return 'Continue Reading';
  };

  const handleReadClick = (e) => {
    e.stopPropagation();
    onSelect(book, readingProgress);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02, boxShadow: '0 10px 20px rgba(0,0,0,0.3)' }}
      className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg overflow-hidden cursor-pointer flex flex-col transform transition-all duration-300 h-full hover:border-zinc-700"
      onClick={() => onSelect(book, readingProgress)}
    >
      <div className="relative w-full h-40 sm:h-48 bg-zinc-800 flex items-center justify-center border-b border-zinc-800">
        {book.coverImageUrl ? (
          <img
            src={getImageUrl(book.coverImageUrl)}
            alt={book.title}
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <div className="text-center p-4 text-zinc-500">
            <svg className="w-8 h-8 sm:w-12 sm:h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-2 text-xs sm:text-sm">No cover available</p>
          </div>
        )}
      </div>
      <div className="p-3 sm:p-5 flex flex-col flex-grow">
        <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2 truncate">{book.title}</h3>
        <p className="text-zinc-400 text-xs sm:text-sm mb-1 sm:mb-2">by {book.author}</p>
        <p className="text-xs sm:text-sm text-blue-400 font-medium mb-2 sm:mb-3">{book.genre}</p>
        
        {readingProgress ? (
          <div className="mt-auto pt-2 sm:pt-3 border-t border-zinc-800">
            <div className="text-xs sm:text-sm text-zinc-400 mb-1 flex justify-between items-center">
              <span className="font-semibold">Last read:</span> 
              <span className="text-zinc-300">Page {readingProgress.currentPage}</span>
            </div>
            <div className="text-xs sm:text-sm text-zinc-400 mb-1 flex justify-between items-center">
              <span className="font-semibold">Time spent:</span> 
              <span className="text-zinc-300">{formatReadingTime(readingProgress.totalReadingTime)}</span>
            </div>
            <div className="text-xs sm:text-sm text-zinc-400 mb-2 sm:mb-3 flex justify-between items-center">
              <span className="font-semibold">Pages read:</span> 
              <span className="text-zinc-300">{readingProgress.totalPagesRead}</span>
            </div>
            {book.pages && (
              <div className="w-full bg-zinc-800 rounded-full h-1.5 sm:h-2 mt-2">
                <div
                  className="bg-blue-500 h-full rounded-full"
                  style={{ width: `${(readingProgress.currentPage / book.pages) * 100}%` }}
                ></div>
              </div>
            )}
            {/* Book Stats */}
            {bookStats && (
              <div className="mt-2 text-xs text-zinc-400 space-y-1">
                <div className="flex justify-between">
                  <span>Total Reads:</span>
                  <span className="text-zinc-200 font-semibold">{bookStats.totalReads || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Today's Reads:</span>
                  <span className="text-zinc-200 font-semibold">{bookStats.todayReads || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Reading Time:</span>
                  <span className="text-zinc-200 font-semibold">{formatReadingTime(bookStats.totalDuration || 0)}</span>
                </div>
              </div>
            )}
            <button
              className={`mt-3 sm:mt-4 w-full py-2 px-3 sm:px-4 rounded-xl text-white font-semibold shadow-md transition-all duration-200 text-xs sm:text-sm ${getProgressColor()}`}
              onClick={handleReadClick}
            >
              {getProgressText()}
            </button>
          </div>
        ) : (
          <button
            className={`mt-auto w-full py-2 px-3 sm:px-4 rounded-xl text-white font-semibold shadow-md transition-all duration-200 text-xs sm:text-sm ${getProgressColor()}`}
            onClick={handleReadClick}
          >
            {getProgressText()}
          </button>
        )}
      </div>
    </motion.div>
  );
};

const BooksPage = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [genres, setGenres] = useState([]);
  const [showPDFReader, setShowPDFReader] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showContinueReading, setShowContinueReading] = useState(false);
  const [lastReadPage, setLastReadPage] = useState(1);
  const [readingProgressMap, setReadingProgressMap] = useState({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/signin');
      return;
    }

    const fetchBooks = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/books`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBooks(response.data);
        
        // Extract unique genres
        const uniqueGenres = [...new Set(response.data.map(book => book.genre))];
        setGenres(uniqueGenres);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching books:', error);
        if (error.response?.status === 401) {
          navigate('/signin');
        } else {
          setError('Error fetching books. Please try again.');
        }
        setLoading(false);
      }
    };

    fetchBooks();
  }, [navigate]);

  // Handle keyboard events for fullscreen toggle
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showPDFReader) return;

      if (e.key.toLowerCase() === 'f') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showPDFReader]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    if (selectedBook) {
      updateReadingProgress(selectedBook._id, page);
    }
  };

  const handleTotalPages = (pages) => {
    setTotalPages(pages);
  };

  const handleReadBook = (book) => {
    setSelectedBook(book);
    setShowPDFReader(true);
    setCurrentPage(1); // Reset to first page when opening a new book
  };

  const handleClosePDFReader = () => {
    setShowPDFReader(false);
    setSelectedBook(null);
    setCurrentPage(1);
    // Trigger refresh of reading progress
    setRefreshTrigger(prev => prev + 1);
  };

  const handleProgressUpdate = () => {
    // Trigger refresh of reading progress when PDF reader updates progress
    setRefreshTrigger(prev => prev + 1);
  };

  const handleBookSelect = (book, readingProgress) => {
    setSelectedBook(book);
    setShowPDFReader(false);
    setShowContinueReading(false); // Reset continue reading modal
    
    if (readingProgress && readingProgress.currentPage > 1) {
      // If there's existing progress, show continue reading modal
      setLastReadPage(readingProgress.currentPage);
      setShowContinueReading(true);
    } else {
      // If no progress or on first page, go directly to PDF reader
      setShowPDFReader(true);
      setCurrentPage(1);
    }
  };

  const handleCloseDetails = () => {
    setSelectedBook(null);
    // Trigger refresh of reading progress
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCloseContinueReading = () => {
    setShowContinueReading(false);
    setSelectedBook(null);
    // Trigger refresh of reading progress
    setRefreshTrigger(prev => prev + 1);
  };

  const handleContinueReading = () => {
    setShowContinueReading(false);
    setShowPDFReader(true);
    setCurrentPage(lastReadPage);
  };

  const handleStartFromBeginning = () => {
    setShowContinueReading(false);
    setShowPDFReader(true);
    setCurrentPage(1);
  };

  const updateReadingProgress = async (bookId, currentPage) => {
    try {
      const token = localStorage.getItem('token');
      
    } catch (error) {
      console.error('Error updating reading progress:', error);
    }
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenres.length === 0 || selectedGenres.includes(book.genre);
    return matchesSearch && matchesGenre;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zinc-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="bg-red-500 text-white p-4 rounded-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-11">
      {/* Header Section */}
      <div className="bg-zinc-900 border-b border-zinc-800">
        <div className="container mx-auto px-4 py-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-white mb-4"
          >
            Books
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-zinc-400 text-lg"
          >
            Explore and read from our collection of security books
          </motion.p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Search and Filter Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 rounded-xl p-6 mb-8 shadow-lg border border-zinc-800"
        >
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search books by title or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-10 rounded-xl bg-zinc-800 text-white border border-zinc-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-300 p-1"
                >
                  <FaTimes />
                </button>
              )}
            </div>
            {/* Clear filters button for mobile */}
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedGenres([]);
                }}
                className="px-6 py-3 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Clear Filters
              </button>
            )}
          </div>
        </motion.div>

        {/* Results Count */}
        {filteredBooks.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <p className="text-sm text-zinc-400">
              Showing {filteredBooks.length} of {books.length} books
              {(searchTerm || selectedGenres.length > 0) && (
                <span className="ml-2">
                  (filtered)
                </span>
              )}
            </p>
          </div>
        )}

        {/* Books Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
          {filteredBooks.map(book => (
            <BookCard
              key={`${book._id}-${refreshTrigger}`}
              book={book}
              onSelect={handleBookSelect}
              onProgressUpdate={readingProgressMap[book._id]}
            />
          ))}
        </div>
        
        {/* No Results */}
        {filteredBooks.length === 0 && (
          <div className="text-center py-12 sm:py-16">
            <div className="max-w-md mx-auto">
              <div className="text-zinc-500 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                No books found
              </h3>
              <p className="text-zinc-400 mb-4">
                {searchTerm || selectedGenres.length > 0 
                  ? "Try adjusting your search or filters"
                  : "No books are available at the moment"
                }
              </p>
              {(searchTerm || selectedGenres.length > 0) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedGenres([]);
                  }}
                  className="px-6 py-3 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-all flex items-center gap-2 mx-auto"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        )}

        {showPDFReader && selectedBook && (
          <div className="fixed inset-0 z-50 flex flex-col">
            {/* PDF Reader Controls */}
            <div className="bg-gray-800 text-white p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between shadow-md space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
                <button
                  onClick={handleClosePDFReader}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors duration-200"
                  title="Close PDF Reader (Esc)"
                >
                  <FaTimes className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <h2 className="text-base sm:text-lg font-semibold truncate flex-1 sm:flex-none">
                  {selectedBook.title}
                </h2>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto justify-center sm:justify-end">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage <= 1}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors duration-200 disabled:opacity-50"
                    title="Previous Page (← or H)"
                  >
                    <FaArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <span className="text-xs sm:text-sm min-w-[60px] sm:min-w-[80px] text-center">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage >= totalPages}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors duration-200 disabled:opacity-50"
                    title="Next Page (→ or L)"
                  >
                    <FaArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
                <button
                  onClick={toggleFullscreen}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors duration-200"
                  title="Toggle Fullscreen (F)"
                >
                  {isFullscreen ? (
                    <FaCompress className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <FaExpand className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>
            </div>
            
            {/* PDF Reader Component */}
            <div className="flex-1">
              <PDFReader
                bookId={selectedBook._id}
                onClose={handleClosePDFReader}
                currentPage={currentPage}
                onPageChange={handlePageChange}
                onTotalPages={handleTotalPages}
                onProgressUpdate={handleProgressUpdate}
              />
            </div>

            {/* Keyboard Shortcuts Help */}
            <div className="bg-gray-800 text-white p-2 text-xs sm:text-sm text-center">
              <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
                <span>← or H: Previous</span>
                <span>→ or L: Next</span>
                <span>↑/↓: Scroll</span>
                <span>F: Fullscreen</span>
                <span>Esc: Close</span>
              </div>
            </div>
          </div>
        )}

        {selectedBook && !showPDFReader && !showContinueReading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50"
            onClick={handleCloseDetails}
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleCloseDetails}
                className="absolute top-2 right-2 sm:top-3 sm:right-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl sm:text-2xl p-1"
              >
                <FaTimes />
              </button>
              <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-6 mb-4">
                <img
                  src={getImageUrl(selectedBook.coverImageUrl)}
                  alt={selectedBook.title}
                  className="w-32 h-44 sm:w-40 sm:h-56 object-cover rounded-md shadow-md flex-shrink-0 mx-auto lg:mx-0"
                />
                <div className="flex-grow text-center lg:text-left">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-2">{selectedBook.title}</h2>
                  <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 mb-1">By <span className="font-semibold">{selectedBook.author}</span></p>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">{selectedBook.description}</p>

                  {/* Reading Details Section */}
                  {selectedBook.readingProgress && selectedBook.readingProgress.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">Your Reading Progress</h3>
                      {selectedBook.readingProgress.map((progress, index) => (
                        <div key={index} className="space-y-1 mb-4 last:mb-0">
                          <div className="text-sm text-gray-600 dark:text-gray-300 flex justify-between">
                            <span className="font-semibold">Last read:</span>
                            <span>Page {progress.currentPage}</span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300 flex justify-between">
                            <span className="font-semibold">Time spent:</span>
                            <span>{formatReadingTime(progress.totalReadingTime)}</span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300 flex justify-between">
                            <span className="font-semibold">Pages read:</span>
                            <span>{progress.totalPagesRead}</span>
                          </div>
                          {selectedBook.pages && (
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                              <div
                                className="bg-blue-500 h-full rounded-full"
                                style={{ width: `${(progress.currentPage / selectedBook.pages) * 100}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-center lg:justify-end mt-6">
                <button
                  onClick={() => handleReadBook(selectedBook)}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold shadow-md hover:bg-blue-700 transition-colors duration-200"
                >
                  Read Book
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Continue Reading Popup */}
        {showContinueReading && selectedBook && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-[60]"
            onClick={handleCloseContinueReading}
          >
            <div 
              className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 max-w-md w-full shadow-xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleCloseContinueReading}
                className="absolute top-2 right-2 sm:top-3 sm:right-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl sm:text-2xl p-1"
              >
                <FaTimes />
              </button>
              <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 pr-8">Continue Reading?</h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4 sm:mb-6">
                You were on page {lastReadPage}. Would you like to continue from where you left off?
              </p>
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={handleStartFromBeginning}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 text-sm sm:text-base"
                >
                  Start from Beginning
                </button>
                <button
                  onClick={handleContinueReading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm sm:text-base"
                >
                  Continue Reading
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BooksPage;