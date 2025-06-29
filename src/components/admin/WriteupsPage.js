import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Area
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import DeleteConfirmationModal from './DeleteConfirmationModal';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const WriteupsPage = () => {
  const { isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [writeups, setWriteups] = useState([]);
  const [filteredWriteups, setFilteredWriteups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWriteup, setSelectedWriteup] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, writeupId: null, writeupTitle: '' });
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [writeupsPerPage] = useState(10);

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    subcategory: '',
    difficulty: '',
    timeRange: 'all', // all, today, week, month, year
    status: 'all', // all, published, draft
    sortBy: 'newest' // newest, oldest, mostReads, leastReads, title
  });

  const [stats, setStats] = useState({
    totalWriteups: 0,
    todayAdded: 0,
    thisMonthAdded: 0,
    totalReads: 0,
    todayReads: 0,
    byDifficulty: {},
    byPlatform: {},
    byCategory: {},
    dailyStats: [],
    monthlyStats: [],
    topCategories: [],
    topSubcategories: [],
    readTrends: [],
    platformStats: {},
    difficultyStats: {},
    categoryGrowth: [],
    monthlyReads: [],
    topReadWriteups: [],
    recentActivity: [],
    readAnalytics: {
      totalUniqueReaders: 0,
      averageReadsPerWriteup: 0,
      mostReadWriteups: [],
      readDistributionByDifficulty: {},
      readDistributionByPlatform: {},
      readDistributionByCategory: {},
      dailyReadTrends: [],
      monthlyReadTrends: [],
      readRetention: {
        oneTimeReaders: 0,
        repeatReaders: 0,
        averageReadsPerUser: 0
      },
      readTiming: {
        morning: 0,    // 6-12
        afternoon: 0,  // 12-18
        evening: 0,    // 18-24
        night: 0       // 0-6
      },
      readEngagement: {
        quickReads: 0,     // < 1 min
        mediumReads: 0,    // 1-5 min
        longReads: 0       // > 5 min
      }
    }
  });
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin/login');
      return;
    }
    fetchWriteups();
    fetchCategoriesAndSubcategories();
  }, [isAdmin, navigate]);

  // Apply filters when they change
  useEffect(() => {
    applyFiltersAndPagination();
  }, [filters, writeups]);

  const fetchWriteups = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        logout();
        navigate('/admin/login');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/admin/writeups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWriteups(response.data);
      setFilteredWriteups(response.data); // Initialize filtered writeups with all writeups
      calculateStats(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        logout();
        navigate('/admin/login');
      } else {
        setError(error.response?.data?.message || 'Error fetching writeups');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoriesAndSubcategories = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        logout();
        navigate('/admin/login');
        return;
      }

      const [catRes, subcatRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/admin/categories`, { 
          headers: { Authorization: `Bearer ${token}` } 
        }),
        axios.get(`${API_BASE_URL}/api/admin/subcategories`, { 
          headers: { Authorization: `Bearer ${token}` } 
        })
      ]);
      setCategories(catRes.data.categories);
      setSubcategories(subcatRes.data.subcategories);
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        navigate('/admin/login');
      } else {
        console.error('Error fetching categories and subcategories:', err);
      }
    }
  };

  const calculateStats = (data) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const stats = {
      totalWriteups: data.length,
      todayAdded: data.filter(w => new Date(w.createdAt) >= today).length,
      thisMonthAdded: data.filter(w => new Date(w.createdAt) >= thisMonth).length,
      totalReads: data.reduce((acc, w) => acc + (w.reads || 0), 0),
      todayReads: data.reduce((acc, w) => acc + (w.todayReads || 0), 0),
      byDifficulty: {},
      byPlatform: {},
      byCategory: {},
      dailyStats: [],
      monthlyStats: [],
      topCategories: [],
      topSubcategories: [],
      readTrends: [],
      platformStats: {},
      difficultyStats: {},
      categoryGrowth: [],
      monthlyReads: [],
      topReadWriteups: [],
      recentActivity: [],
      readAnalytics: {
        totalUniqueReaders: 0,
        averageReadsPerWriteup: 0,
        mostReadWriteups: [],
        readDistributionByDifficulty: {},
        readDistributionByPlatform: {},
        readDistributionByCategory: {},
        dailyReadTrends: [],
        monthlyReadTrends: [],
        readRetention: {
          oneTimeReaders: 0,
          repeatReaders: 0,
          averageReadsPerUser: 0
        },
        readTiming: {
          morning: 0,    // 6-12
          afternoon: 0,  // 12-18
          evening: 0,    // 18-24
          night: 0       // 0-6
        },
        readEngagement: {
          quickReads: 0,     // < 1 min
          mediumReads: 0,    // 1-5 min
          longReads: 0       // > 5 min
        }
      }
    };

    // Calculate basic distributions and read analytics
    data.forEach(writeup => {
      // Track unique readers
      if (writeup.readBy) {
        stats.readAnalytics.totalUniqueReaders += writeup.readBy.length;
        
        // Calculate read timing distribution
        writeup.readBy.forEach(read => {
          const readHour = new Date(read.timestamp).getHours();
          if (readHour >= 6 && readHour < 12) stats.readAnalytics.readTiming.morning++;
          else if (readHour >= 12 && readHour < 18) stats.readAnalytics.readTiming.afternoon++;
          else if (readHour >= 18 && readHour < 24) stats.readAnalytics.readTiming.evening++;
          else stats.readAnalytics.readTiming.night++;
        });

        // Calculate read engagement
        writeup.readBy.forEach(read => {
          const readDuration = read.duration || 0; // in seconds
          if (readDuration < 60) stats.readAnalytics.readEngagement.quickReads++;
          else if (readDuration < 300) stats.readAnalytics.readEngagement.mediumReads++;
          else stats.readAnalytics.readEngagement.longReads++;
        });
      }

      // Difficulty stats with read metrics
      stats.byDifficulty[writeup.difficulty] = (stats.byDifficulty[writeup.difficulty] || 0) + 1;
      stats.difficultyStats[writeup.difficulty] = {
        count: (stats.difficultyStats[writeup.difficulty]?.count || 0) + 1,
        reads: (stats.difficultyStats[writeup.difficulty]?.reads || 0) + (writeup.reads || 0),
        todayReads: (stats.difficultyStats[writeup.difficulty]?.todayReads || 0) + (writeup.todayReads || 0),
        uniqueReaders: writeup.readBy?.length || 0
      };

      // Platform stats with read metrics
      stats.byPlatform[writeup.platform] = (stats.byPlatform[writeup.platform] || 0) + 1;
      stats.platformStats[writeup.platform] = {
        count: (stats.platformStats[writeup.platform]?.count || 0) + 1,
        reads: (stats.platformStats[writeup.platform]?.reads || 0) + (writeup.reads || 0),
        todayReads: (stats.platformStats[writeup.platform]?.todayReads || 0) + (writeup.todayReads || 0),
        uniqueReaders: writeup.readBy?.length || 0
      };

      // Category stats with read metrics
      if (writeup.category) {
        stats.byCategory[writeup.category.name] = (stats.byCategory[writeup.category.name] || 0) + 1;
        if (writeup.subcategory) {
          stats.topSubcategories.push({
            name: writeup.subcategory.name,
            category: writeup.category.name,
            count: 1,
            reads: writeup.reads || 0,
            uniqueReaders: writeup.readBy?.length || 0
          });
        }
      }

      // Most read writeups with detailed metrics
      stats.readAnalytics.mostReadWriteups.push({
        title: writeup.title,
        reads: writeup.reads || 0,
        uniqueReaders: writeup.readBy?.length || 0,
        platform: writeup.platform,
        difficulty: writeup.difficulty,
        category: writeup.category?.name,
        averageReadTime: writeup.readBy ? 
          writeup.readBy.reduce((acc, read) => acc + (read.duration || 0), 0) / writeup.readBy.length : 0
      });

      // Read distribution calculations
      stats.readAnalytics.readDistributionByDifficulty[writeup.difficulty] = 
        (stats.readAnalytics.readDistributionByDifficulty[writeup.difficulty] || 0) + (writeup.reads || 0);

      stats.readAnalytics.readDistributionByPlatform[writeup.platform] = 
        (stats.readAnalytics.readDistributionByPlatform[writeup.platform] || 0) + (writeup.reads || 0);

      if (writeup.category) {
        stats.readAnalytics.readDistributionByCategory[writeup.category.name] = 
          (stats.readAnalytics.readDistributionByCategory[writeup.category.name] || 0) + (writeup.reads || 0);
      }

      // Recent activity with read metrics
      if (new Date(writeup.updatedAt) >= thirtyDaysAgo) {
        stats.recentActivity.push({
          title: writeup.title,
          type: 'update',
          date: writeup.updatedAt,
          reads: writeup.reads || 0,
          uniqueReaders: writeup.readBy?.length || 0
        });
      }
    });

    // Calculate read retention metrics
    const readerMap = new Map();
    data.forEach(writeup => {
      if (writeup.readBy) {
        writeup.readBy.forEach(read => {
          const readerId = read.userId;
          readerMap.set(readerId, (readerMap.get(readerId) || 0) + 1);
        });
      }
    });

    stats.readAnalytics.readRetention.oneTimeReaders = 
      Array.from(readerMap.values()).filter(count => count === 1).length;
    stats.readAnalytics.readRetention.repeatReaders = 
      Array.from(readerMap.values()).filter(count => count > 1).length;
    stats.readAnalytics.readRetention.averageReadsPerUser = 
      stats.readAnalytics.totalUniqueReaders > 0 
        ? stats.totalReads / stats.readAnalytics.totalUniqueReaders 
        : 0;

    // Calculate average reads per writeup
    stats.readAnalytics.averageReadsPerWriteup = stats.totalWriteups > 0 
      ? Math.round(stats.totalReads / stats.totalWriteups) 
      : 0;

    // Sort and limit most read writeups
    stats.readAnalytics.mostReadWriteups.sort((a, b) => b.reads - a.reads);
    stats.readAnalytics.mostReadWriteups = stats.readAnalytics.mostReadWriteups.slice(0, 10);

    // Calculate daily read trends
    const dailyReadData = {};
    data.forEach(writeup => {
      if (writeup.readBy) {
        writeup.readBy.forEach(read => {
          const readDate = new Date(read.timestamp).toISOString().split('T')[0];
          dailyReadData[readDate] = (dailyReadData[readDate] || 0) + 1;
        });
      }
    });

    stats.readAnalytics.dailyReadTrends = Object.entries(dailyReadData)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate monthly read trends
    const monthlyReadData = {};
    data.forEach(writeup => {
      if (writeup.readBy) {
        writeup.readBy.forEach(read => {
          const readMonth = new Date(read.timestamp).toISOString().slice(0, 7);
          monthlyReadData[readMonth] = (monthlyReadData[readMonth] || 0) + 1;
        });
      }
    });

    stats.readAnalytics.monthlyReadTrends = Object.entries(monthlyReadData)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Sort and limit other lists
    stats.topCategories = Object.entries(stats.byCategory)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    stats.topSubcategories = stats.topSubcategories
      .reduce((acc, curr) => {
        const existing = acc.find(item => item.name === curr.name);
        if (existing) {
          existing.count += curr.count;
          existing.reads += curr.reads;
          existing.uniqueReaders += curr.uniqueReaders;
        } else {
          acc.push(curr);
        }
        return acc;
      }, [])
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    stats.recentActivity = stats.recentActivity
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    setStats(stats);
  };

  const handleDeleteWriteup = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        logout();
        navigate('/admin/login');
        return;
      }

      await axios.delete(`${API_BASE_URL}/api/admin/writeups/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Writeup deleted successfully');
      fetchWriteups(); // Refresh the list
      setDeleteModal({ show: false, writeupId: null, writeupTitle: '' });
    } catch (error) {
      if (error.response?.status === 401) {
        logout();
        navigate('/admin/login');
      } else {
        toast.error(error.response?.data?.message || 'Error deleting writeup');
      }
    }
  };

  const handleTogglePublish = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        logout();
        navigate('/admin/login');
        return;
      }

      await axios.patch(`${API_BASE_URL}/api/admin/writeups/${id}/publish`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(currentStatus ? 'Writeup unpublished successfully' : 'Writeup published successfully');
      fetchWriteups(); // Refresh the list
    } catch (error) {
      if (error.response?.status === 401) {
        logout();
        navigate('/admin/login');
      } else {
        toast.error(error.response?.data?.message || 'Error updating writeup status');
      }
    }
  };

  // Apply filters and pagination whenever writeups or filters change
  useEffect(() => {
    applyFiltersAndPagination();
  }, [writeups, filters]);

  // Reset subcategory filter when category changes
  useEffect(() => {
    if (filters.category === '') {
      setFilters(prev => ({ ...prev, subcategory: '' }));
    }
  }, [filters.category]);

  const applyFiltersAndPagination = () => {
    let filtered = [...writeups];

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(writeup =>
        writeup.title.toLowerCase().includes(searchTerm) ||
        writeup.description.toLowerCase().includes(searchTerm) ||
        writeup.platform.toLowerCase().includes(searchTerm) ||
        writeup.category?.name.toLowerCase().includes(searchTerm) ||
        writeup.subcategory?.name.toLowerCase().includes(searchTerm)
      );
    }

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(writeup => 
        writeup.category?._id === filters.category
      );
    }

    // Apply subcategory filter
    if (filters.subcategory) {
      filtered = filtered.filter(writeup => 
        writeup.subcategory?._id === filters.subcategory
      );
    }

    // Apply difficulty filter
    if (filters.difficulty) {
      filtered = filtered.filter(writeup => 
        writeup.difficulty === filters.difficulty
      );
    }

    // Apply time range filter
    if (filters.timeRange !== 'all') {
      const now = new Date();
      let startDate = new Date();
      
      switch (filters.timeRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          break;
      }
      
      filtered = filtered.filter(writeup => 
        new Date(writeup.createdAt) >= startDate
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(writeup => {
        if (filters.status === 'published') return writeup.isPublished;
        if (filters.status === 'draft') return !writeup.isPublished;
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'mostReads':
          return (b.reads || 0) - (a.reads || 0);
        case 'leastReads':
          return (a.reads || 0) - (b.reads || 0);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    setFilteredWriteups(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      subcategory: '',
      difficulty: '',
      timeRange: 'all',
      status: 'all',
      sortBy: 'newest'
    });
  };

  // Get current writeups for pagination
  const indexOfLastWriteup = currentPage * writeupsPerPage;
  const indexOfFirstWriteup = indexOfLastWriteup - writeupsPerPage;
  const currentWriteups = filteredWriteups.slice(indexOfFirstWriteup, indexOfLastWriteup);
  const totalPages = Math.ceil(filteredWriteups.length / writeupsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-500 text-white p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-11">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Writeups Dashboard</h1>
        <p className="text-gray-400">Monitor writeup statistics and performance</p>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Writeups */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Writeups</p>
              <p className="text-white text-3xl font-bold mt-2">{stats.totalWriteups}</p>
              <p className="text-blue-100 text-sm mt-2">
                {stats.thisMonthAdded} added this month
              </p>
            </div>
            <div className="bg-blue-400/20 p-3 rounded-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Reads */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Total Reads</p>
              <p className="text-white text-3xl font-bold mt-2">{stats.totalReads}</p>
              <p className="text-purple-100 text-sm mt-2">
                {stats.readAnalytics.averageReadsPerWriteup} avg. reads per writeup
              </p>
            </div>
            <div className="bg-purple-400/20 p-3 rounded-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Unique Readers */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Unique Readers</p>
              <p className="text-white text-3xl font-bold mt-2">{stats.readAnalytics.totalUniqueReaders}</p>
              <p className="text-green-100 text-sm mt-2">
                {stats.todayReads} reads today
              </p>
            </div>
            <div className="bg-green-400/20 p-3 rounded-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* This Month */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm font-medium">This Month</p>
              <p className="text-white text-3xl font-bold mt-2">{stats.thisMonthAdded}</p>
              <p className="text-indigo-100 text-sm mt-2">
                New writeups added
              </p>
            </div>
            <div className="bg-indigo-400/20 p-3 rounded-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Read Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Read Retention */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Read Retention</h3>
            <span className="text-sm text-gray-400">User engagement</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-400">One-Time Readers</p>
              <p className="text-2xl font-bold text-white mt-2">
                {stats.readAnalytics.readRetention.oneTimeReaders}
              </p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-400">Repeat Readers</p>
              <p className="text-2xl font-bold text-white mt-2">
                {stats.readAnalytics.readRetention.repeatReaders}
              </p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-400">Avg. Reads/User</p>
              <p className="text-2xl font-bold text-white mt-2">
                {stats.readAnalytics.readRetention.averageReadsPerUser.toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        {/* Read Timing */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Read Timing</h3>
            <span className="text-sm text-gray-400">By time of day</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Morning', value: stats.readAnalytics.readTiming.morning },
                    { name: 'Afternoon', value: stats.readAnalytics.readTiming.afternoon },
                    { name: 'Evening', value: stats.readAnalytics.readTiming.evening },
                    { name: 'Night', value: stats.readAnalytics.readTiming.night }
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  innerRadius={60}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} stroke="#1f2937" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: '#fff'
                  }}
                  formatter={(value) => [`${value} reads`, 'Reads']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Read Engagement */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Read Engagement</h3>
            <span className="text-sm text-gray-400">By duration</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Quick (<1min)', value: stats.readAnalytics.readEngagement.quickReads },
                { name: 'Medium (1-5min)', value: stats.readAnalytics.readEngagement.mediumReads },
                { name: 'Long (>5min)', value: stats.readAnalytics.readEngagement.longReads }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis 
                  dataKey="name" 
                  stroke="#888"
                  tick={{ fill: '#888' }}
                  axisLine={{ stroke: '#444' }}
                />
                <YAxis 
                  stroke="#888" 
                  tick={{ fill: '#888' }}
                  axisLine={{ stroke: '#444' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: '#fff'
                  }}
                  formatter={(value) => [`${value} reads`, 'Reads']}
                />
                <Bar 
                  dataKey="value" 
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Most Read Writeups with Engagement */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Most Read Writeups</h3>
            <span className="text-sm text-gray-400">With engagement metrics</span>
          </div>
          <div className="space-y-4">
            {stats.readAnalytics.mostReadWriteups.map((writeup, index) => (
              <div key={index} className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-lg font-bold text-purple-400 mr-3">#{index + 1}</span>
                    <div>
                      <p className="text-white font-medium">{writeup.title}</p>
                      <p className="text-sm text-gray-400">
                        {writeup.platform} • {writeup.difficulty}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{writeup.reads} reads</p>
                    <p className="text-sm text-gray-400">
                      {writeup.uniqueReaders} unique readers
                    </p>
                    <p className="text-sm text-gray-400">
                      Avg. {Math.round(writeup.averageReadTime / 60)} min read
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Daily Writeups Chart */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Daily Writeups</h3>
            <span className="text-sm text-gray-400">Last 30 days</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.dailyStats}>
                <defs>
                  <linearGradient id="writeupGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis 
                  dataKey="date" 
                  stroke="#888"
                  tick={{ fill: '#888' }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  axisLine={{ stroke: '#444' }}
                />
                <YAxis 
                  stroke="#888" 
                  tick={{ fill: '#888' }}
                  axisLine={{ stroke: '#444' }}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value) => [`${value} writeups`, 'Count']}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  content={({ payload }) => (
                    <div className="flex justify-center space-x-4">
                      {payload.map((entry, index) => (
                        <div key={index} className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
                          <span className="text-sm text-gray-400">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Writeups"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ 
                    fill: '#3b82f6',
                    strokeWidth: 2,
                    r: 4,
                    strokeDasharray: ''
                  }}
                  activeDot={{ 
                    r: 8,
                    strokeWidth: 2,
                    fill: '#3b82f6',
                    stroke: '#fff'
                  }}
                  animationDuration={1500}
                  animationBegin={0}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="false"
                  fillOpacity={1}
                  fill="url(#writeupGradient)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Reads Chart */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Monthly Reads</h3>
            <span className="text-sm text-gray-400">By month</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyReads}>
                <defs>
                  <linearGradient id="readGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis 
                  dataKey="month" 
                  stroke="#888"
                  tick={{ fill: '#888' }}
                  tickFormatter={(value) => new Date(value + '-01').toLocaleDateString('default', { month: 'short', year: 'numeric' })}
                  axisLine={{ stroke: '#444' }}
                />
                <YAxis 
                  stroke="#888" 
                  tick={{ fill: '#888' }}
                  axisLine={{ stroke: '#444' }}
                  tickFormatter={(value) => `${value.toLocaleString()}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                  labelFormatter={(value) => new Date(value + '-01').toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                  formatter={(value) => [`${value.toLocaleString()} reads`, 'Total Reads']}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  content={({ payload }) => (
                    <div className="flex justify-center space-x-4">
                      {payload.map((entry, index) => (
                        <div key={index} className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
                          <span className="text-sm text-gray-400">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                />
                <Bar 
                  dataKey="reads" 
                  name="Total Reads"
                  fill="url(#readGradient)"
                  radius={[4, 4, 0, 0]}
                  animationDuration={1500}
                  animationBegin={0}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Distribution */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Platform Distribution</h3>
            <span className="text-sm text-gray-400">By platform</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  {Object.entries(stats.byPlatform).map((entry, index) => (
                    <linearGradient key={index} id={`platformGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.1}/>
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={Object.entries(stats.byPlatform).map(([name, value]) => ({
                    name,
                    value
                  }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  innerRadius={60}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                  animationDuration={1500}
                  animationBegin={0}
                >
                  {Object.entries(stats.byPlatform).map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`url(#platformGradient${index})`}
                      stroke="#1f2937"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                  formatter={(value, name) => [`${value} writeups`, name]}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  content={({ payload }) => (
                    <div className="flex justify-center flex-wrap gap-4 mt-4">
                      {payload.map((entry, index) => (
                        <div key={index} className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
                          <span className="text-sm text-gray-400">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Difficulty Distribution */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Difficulty Distribution</h3>
            <span className="text-sm text-gray-400">By level</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={Object.entries(stats.difficultyStats).map(([name, data]) => ({
                name,
                count: data.count,
                reads: data.reads,
                todayReads: data.todayReads
              }))}>
                <defs>
                  <linearGradient id="difficultyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis 
                  dataKey="name" 
                  stroke="#888"
                  tick={{ fill: '#888' }}
                  axisLine={{ stroke: '#444' }}
                />
                <YAxis 
                  stroke="#888" 
                  tick={{ fill: '#888' }}
                  axisLine={{ stroke: '#444' }}
                  tickFormatter={(value) => `${value.toLocaleString()}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                  formatter={(value, name) => {
                    if (name === 'count') return [`${value} writeups`, 'Count'];
                    if (name === 'reads') return [`${value.toLocaleString()} reads`, 'Total Reads'];
                    if (name === 'todayReads') return [`${value} reads`, 'Today\'s Reads'];
                    return [value, name];
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  content={({ payload }) => (
                    <div className="flex justify-center space-x-4">
                      {payload.map((entry, index) => (
                        <div key={index} className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
                          <span className="text-sm text-gray-400">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                />
                <Bar 
                  dataKey="count" 
                  name="Writeups"
                  fill="url(#difficultyGradient)"
                  radius={[4, 4, 0, 0]}
                  animationDuration={1500}
                  animationBegin={0}
                />
                <Bar 
                  dataKey="reads" 
                  name="Total Reads"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  animationDuration={1500}
                  animationBegin={200}
                />
                <Bar 
                  dataKey="todayReads" 
                  name="Today's Reads"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                  animationDuration={1500}
                  animationBegin={400}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Top Categories</h3>
            <span className="text-sm text-gray-400">By writeup count</span>
          </div>
          <div className="space-y-4">
            {stats.topCategories.map((category, index) => (
              <div key={category.name} className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-lg font-bold text-blue-400 mr-3">#{index + 1}</span>
                    <div>
                      <p className="text-white font-medium">{category.name}</p>
                      <p className="text-sm text-gray-400">
                        {Math.round((category.count / stats.totalWriteups) * 100)}% of total
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{category.count} writeups</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Subcategories */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Top Subcategories</h3>
            <span className="text-sm text-gray-400">By writeup count</span>
          </div>
          <div className="space-y-4">
            {stats.topSubcategories.map((subcategory, index) => (
              <div key={subcategory.name} className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-lg font-bold text-green-400 mr-3">#{index + 1}</span>
                    <div>
                      <p className="text-white font-medium">{subcategory.name}</p>
                      <p className="text-sm text-gray-400">{subcategory.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{subcategory.count} writeups</p>
                    <p className="text-sm text-gray-400">{subcategory.reads} total reads</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
            <span className="text-sm text-gray-400">Last 30 days</span>
          </div>
          <div className="space-y-4">
            {stats.recentActivity.map((activity, index) => (
              <div key={index} className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium">{activity.title}</p>
                    <p className="text-sm text-gray-400">
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{activity.reads} reads</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Writeups List */}
      <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Writeups List</h3>
            <Link
              to="/admin/writeups/new"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Add New Writeup
            </Link>
          </div>
        </div>

        {/* Filters Section */}
        <div className="p-6 border-b border-gray-700 bg-gray-750">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search writeups..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Subcategory</label>
              <select
                value={filters.subcategory}
                onChange={(e) => handleFilterChange('subcategory', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Subcategories</option>
                {subcategories
                  .filter(sub => !filters.category || sub.category === filters.category)
                  .map((subcategory) => (
                    <option key={subcategory._id} value={subcategory._id}>
                      {subcategory.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
              <select
                value={filters.difficulty}
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Time Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Time Range</label>
              <select
                value={filters.timeRange}
                onChange={(e) => handleFilterChange('timeRange', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="year">Last Year</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="mostReads">Most Reads</option>
                <option value="leastReads">Least Reads</option>
                <option value="title">Title A-Z</option>
              </select>
            </div>
          </div>

          {/* Filter Summary and Clear Button */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              Showing {filteredWriteups.length} of {writeups.length} writeups
              {filters.search && ` matching "${filters.search}"`}
            </div>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Platform
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Difficulty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Today's Reads
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Total Reads
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {currentWriteups.length > 0 ? (
                currentWriteups.map((writeup) => (
                  <tr key={writeup._id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{writeup.title}</div>
                      {writeup.bounty?.amount > 0 && (
                        <div className="text-xs text-green-400 mt-1">
                          Bounty: {writeup.bounty.amount} {writeup.bounty.currency}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{writeup.platform}</div>
                      {writeup.platformUrl && (
                        <a 
                          href={writeup.platformUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 mt-1 block"
                        >
                          View on Platform →
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        writeup.difficulty === 'Easy' 
                          ? 'bg-green-100 text-green-800'
                          : writeup.difficulty === 'Medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {writeup.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{writeup.category?.name || 'N/A'}</div>
                      {writeup.subcategory && (
                        <div className="text-xs text-gray-400 mt-1">{writeup.subcategory.name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{writeup.todayReads || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{writeup.reads || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(writeup.updatedAt).toLocaleDateString()}
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(writeup.updatedAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        writeup.isPublished 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {writeup.isPublished ? 'Published' : 'Draft'}
                      </span>
                      {writeup.isFeatured && (
                        <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                          Featured
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          to={`/admin/writeups/edit/${writeup._id}`}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleTogglePublish(writeup._id, writeup.isPublished)}
                          className={`px-3 py-1 rounded transition-colors ${
                            writeup.isPublished
                              ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                              : 'bg-green-500 text-white hover:bg-green-600'
                          }`}
                        >
                          {writeup.isPublished ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          onClick={() => setDeleteModal({ show: true, writeupId: writeup._id, writeupTitle: writeup.title })}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center">
                    <div className="text-gray-400">
                      <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-lg font-medium">No writeups found</p>
                      <p className="text-sm">Try adjusting your filters or search terms</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-700 bg-gray-750">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {indexOfFirstWriteup + 1} to {Math.min(indexOfLastWriteup, filteredWriteups.length)} of {filteredWriteups.length} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                
                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => paginate(pageNumber)}
                        className={`px-3 py-2 rounded-lg transition-colors ${
                          currentPage === pageNumber
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-700 text-white hover:bg-gray-600'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Writeup Details Modal */}
      {selectedWriteup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedWriteup.title}</h3>
                  <p className="text-gray-400 mt-1">
                    {selectedWriteup.platform} • {selectedWriteup.difficulty}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedWriteup(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Basic Information</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-400">Category</p>
                      <p className="text-white">{selectedWriteup.category?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Subcategory</p>
                      <p className="text-white">{selectedWriteup.subcategory?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Status</p>
                      <p className="text-white">
                        {selectedWriteup.isPublished ? 'Published' : 'Draft'}
                        {selectedWriteup.isFeatured && ' • Featured'}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Statistics</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-400">Total Reads</p>
                      <p className="text-white">{selectedWriteup.reads || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Today's Reads</p>
                      <p className="text-white">{selectedWriteup.todayReads || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Created</p>
                      <p className="text-white">{new Date(selectedWriteup.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Last Updated</p>
                      <p className="text-white">{new Date(selectedWriteup.updatedAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
              {selectedWriteup.bounty?.amount > 0 && (
                <div className="mt-6 p-4 bg-green-500/10 rounded-lg">
                  <h4 className="text-sm font-medium text-green-400 mb-2">Bounty Information</h4>
                  <p className="text-white">
                    Amount: {selectedWriteup.bounty.amount} {selectedWriteup.bounty.currency}
                  </p>
                  {selectedWriteup.bounty.description && (
                    <p className="text-gray-400 mt-1">{selectedWriteup.bounty.description}</p>
                  )}
                </div>
              )}
              <div className="mt-6 flex justify-end space-x-3">
                <Link
                  to={`/admin/writeups/edit/${selectedWriteup._id}`}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Edit Writeup
                </Link>
                <button
                  onClick={() => setSelectedWriteup(null)}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.show}
        onClose={() => setDeleteModal({ show: false, writeupId: null, writeupTitle: '' })}
        onConfirm={() => handleDeleteWriteup(deleteModal.writeupId)}
        title="Delete Writeup"
        message="Are you sure you want to delete this writeup? This action cannot be undone."
        itemName={deleteModal.writeupTitle}
        type="danger"
      />
    </div>
  );
};

export default WriteupsPage; 