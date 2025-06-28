import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
);

// Helper for formatting duration
const formatReadingTime = (seconds) => {
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

const AdminBooksAnalyticsPage = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [booksPerPage] = useState(10); // Books to display per page
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [readingTimeStats, setReadingTimeStats] = useState({});
  const [dailyReadsData, setDailyReadsData] = useState({ labels: [], data: [] });
  const [durationDistData, setDurationDistData] = useState({ labels: [], data: [] });
  const [topReadersData, setTopReadersData] = useState({ labels: [], data: [] });
  const [uniqueReadersData, setUniqueReadersData] = useState({ labels: [], data: [] });
  const [statusStats, setStatusStats] = useState({ live: 0, onHold: 0 });
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please login as admin');
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/api/books`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setBooks(response.data);
        processBookStats(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching books:', err);
        setError('Failed to fetch books');
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  const processBookStats = (booksData) => {
    // Process monthly reads from readingProgress
    const monthlyData = Array(12).fill(0);
    const currentYear = new Date().getFullYear();
    
    booksData.forEach(book => {
      if (book.readingProgress && Array.isArray(book.readingProgress)) {
        book.readingProgress.forEach(progress => {
          const progressDate = new Date(progress.lastRead);
          if (progressDate.getFullYear() === currentYear) {
            const month = progressDate.getMonth();
            monthlyData[month]++;
          }
        });
      }
    });
    setMonthlyStats(monthlyData);

    // Total unique readers across all books
    const uniqueReaders = new Set();
    let totalReadingTime = 0;
    let totalReadingSessions = 0;

    booksData.forEach(book => {
      if (book.readingProgress && Array.isArray(book.readingProgress)) {
        book.readingProgress.forEach(progress => {
          if (progress.user) uniqueReaders.add(progress.user._id || progress.user);
          totalReadingTime += progress.totalReadingTime || 0;
          totalReadingSessions++;
        });
      }
    });

    const avgReadingTime = totalReadingSessions > 0 ? (totalReadingTime / 3600) / totalReadingSessions : 0; // in hours

    setReadingTimeStats({
      totalReads: uniqueReaders.size,
      totalReadingSessions,
      avgReadingTime,
    });

    // --- Advanced Analytics ---
    // 1. Daily Reads Trend (last 30 days)
    const dailyReadsMap = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailyReadsMap[key] = 0;
    }
    booksData.forEach(book => {
      if (book.readingProgress && Array.isArray(book.readingProgress)) {
        book.readingProgress.forEach(progress => {
          if (progress.lastRead) {
            const key = new Date(progress.lastRead).toISOString().slice(0, 10);
            if (dailyReadsMap[key] !== undefined) dailyReadsMap[key]++;
          }
        });
      }
    });
    setDailyReadsData({
      labels: Object.keys(dailyReadsMap),
      data: Object.values(dailyReadsMap),
    });

    // 2. Reading Duration Distribution
    const buckets = {
      '<5 min': 0,
      '5-30 min': 0,
      '30-60 min': 0,
      '>1 hr': 0,
    };
    booksData.forEach(book => {
      if (book.readingProgress && Array.isArray(book.readingProgress)) {
        book.readingProgress.forEach(progress => {
          const mins = (progress.totalReadingTime || 0) / 60;
          if (mins < 5) buckets['<5 min']++;
          else if (mins < 30) buckets['5-30 min']++;
          else if (mins < 60) buckets['30-60 min']++;
          else buckets['>1 hr']++;
        });
      }
    });
    setDurationDistData({
      labels: Object.keys(buckets),
      data: Object.values(buckets),
    });

    // 3. Top Readers (by total reading time)
    const userTimeMap = {};
    booksData.forEach(book => {
      if (book.readingProgress && Array.isArray(book.readingProgress)) {
        book.readingProgress.forEach(progress => {
          if (progress.user && progress.totalReadingTime) {
            const userId = progress.user.username || progress.user._id || progress.user;
            userTimeMap[userId] = (userTimeMap[userId] || 0) + progress.totalReadingTime;
          }
        });
      }
    });
    const sortedUsers = Object.entries(userTimeMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    setTopReadersData({
      labels: sortedUsers.map(([user]) => user),
      data: sortedUsers.map(([, time]) => Math.round(time / 60)), // in minutes
    });

    // 4. Books with Most Unique Readers
    const bookUniqueReaders = booksData.map(book => ({
      title: book.title,
      count: new Set((book.readingProgress || []).map(p => p.user && (p.user.username || p.user._id || p.user))).size
    }));
    const topBooks = bookUniqueReaders.sort((a, b) => b.count - a.count).slice(0, 5);
    setUniqueReadersData({
      labels: topBooks.map(b => b.title),
      data: topBooks.map(b => b.count),
    });

    // Add book status analytics
    const liveCount = booksData.filter(b => b.status === 'live').length;
    const onHoldCount = booksData.filter(b => b.status === 'on-hold').length;
    setStatusStats({ live: liveCount, onHold: onHoldCount });
  };

  const monthlyChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Monthly Reading Activity',
        data: monthlyStats,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.4
      }
    ]
  };

  const topBooksData = {
    labels: books
      .sort((a, b) => (b.readsCount || 0) - (a.readsCount || 0))
      .slice(0, 5)
      .map(book => book.title),
    datasets: [
      {
        label: 'Total Reads',
        data: books
          .sort((a, b) => (b.readsCount || 0) - (a.readsCount || 0))
          .slice(0, 5)
          .map(book => book.readsCount || 0),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#cbd5e1', // gray-300 for dark mode
        },
      },
      title: {
        display: true,
        color: '#f8fafc', // gray-100 for dark mode
        font: {
          size: 16
        }
      },
    },
    scales: {
      x: {
        ticks: { color: '#cbd5e1' },
        grid: { color: 'rgba(100, 100, 100, 0.2)' }
      },
      y: {
        ticks: { color: '#cbd5e1' },
        grid: { color: 'rgba(100, 100, 100, 0.2)' }
      }
    }
  };

  // Get current books for pagination
  const indexOfLastBook = currentPage * booksPerPage;
  const indexOfFirstBook = indexOfLastBook - booksPerPage;
  const currentBooks = books.slice(indexOfFirstBook, indexOfLastBook);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleDeleteClick = (book) => {
    setBookToDelete(book);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!bookToDelete) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login as admin to delete books');
        return;
      }

      await axios.delete(`${API_BASE_URL}/api/books/${bookToDelete._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setBooks(books.filter(book => book._id !== bookToDelete._id));
      toast.success('Book deleted successfully!');
      setDeleteModalOpen(false);
      setBookToDelete(null);
    } catch (err) {
      console.error('Error deleting book:', err);
      toast.error(err.response?.data?.message || 'Failed to delete book.');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setBookToDelete(null);
  };

  const handleToggleStatus = async (book) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('No token found');
      return;
    }
    const newStatus = book.status === 'live' ? 'on-hold' : 'live';
    try {
      await axios.patch(`${API_BASE_URL}/api/books/${book._id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBooks(books.map(b => b._id === book._id ? { ...b, status: newStatus } : b));
      toast.success(`Book set to ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update status');
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
          <button 
            onClick={() => Navigate('/admin/login')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6 pt-24">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Books Analytics & Management</h1>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">Total Books</h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{books.length}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">Total Reads</h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{readingTimeStats.totalReads || 0}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">Reading Sessions</h3>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {readingTimeStats.totalReadingSessions || 0}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">Avg Reading Time</h3>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {readingTimeStats.avgReadingTime ? readingTimeStats.avgReadingTime.toFixed(1) : 0} hrs
            </p>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h3 className="text-xl font-semibold mb-4">Monthly Reading Activity</h3>
            <Line data={monthlyChartData} options={chartOptions} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h3 className="text-xl font-semibold mb-4">Top 5 Most Read Books</h3>
            <Doughnut data={topBooksData} options={chartOptions} />
          </motion.div>
        </div>

        {/* Advanced Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Daily Reads Trend (Last 30 Days)</h3>
            <Line data={{
              labels: dailyReadsData.labels,
              datasets: [{
                label: 'Reads',
                data: dailyReadsData.data,
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                tension: 0.4
              }]
            }} options={chartOptions} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Reading Duration Distribution</h3>
            <Pie data={{
              labels: durationDistData.labels,
              datasets: [{
                label: 'Users',
                data: durationDistData.data,
                backgroundColor: [
                  'rgba(59, 130, 246, 0.8)',
                  'rgba(16, 185, 129, 0.8)',
                  'rgba(245, 158, 11, 0.8)',
                  'rgba(239, 68, 68, 0.8)'
                ]
              }]
            }} options={chartOptions} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Top Readers (by Total Reading Time)</h3>
            <Bar data={{
              labels: topReadersData.labels,
              datasets: [{
                label: 'Total Reading Time (min)',
                data: topReadersData.data,
                backgroundColor: 'rgba(139, 92, 246, 0.8)'
              }]
            }} options={chartOptions} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Books with Most Unique Readers</h3>
            <Bar data={{
              labels: uniqueReadersData.labels,
              datasets: [{
                label: 'Unique Readers',
                data: uniqueReadersData.data,
                backgroundColor: 'rgba(245, 158, 11, 0.8)'
              }]
            }} options={chartOptions} />
          </motion.div>
        </div>

        {/* Books Table Section */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-white">All Books</h2>
            <Link
              to="/admin/books/upload"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Book
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Author</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Today Reads</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Reads</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Duration</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>

              
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {books.slice((currentPage - 1) * booksPerPage, currentPage * booksPerPage).map((book) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const todayReads = book.readingProgress.filter(progress => progress.lastRead && new Date(progress.lastRead).toDateString() === today.toDateString()).length;
                  const totalReads = book.readingProgress.length;
                  const totalDuration = book.readingProgress.reduce((total, progress) => total + (progress.totalReadingTime || 0), 0);
                  const formattedDuration = formatReadingTime(totalDuration);
                  return (
                    <tr key={book._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{book.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{book.author}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{todayReads}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{totalReads}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formattedDuration}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/admin/books/edit/${book._id}`}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(book)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 mr-4"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex justify-center">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            {Array.from({ length: Math.ceil(books.length / booksPerPage) }).map((_, index) => (
              <button
                key={index}
                onClick={() => paginate(index + 1)}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                  currentPage === index + 1
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Delete Book
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete "{bookToDelete?.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default AdminBooksAnalyticsPage; 