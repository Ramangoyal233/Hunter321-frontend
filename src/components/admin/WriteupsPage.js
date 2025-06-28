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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const WriteupsPage = () => {
  const { isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [writeups, setWriteups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const [stats, setStats] = useState({
    totalWriteups: 0,
    todayAdded: 0,
    thisMonthAdded: 0,
    totalReads: 0,
    todayReads: 0,
    averageReads: 0,
    byDifficulty: {},
    byPlatform: {},
    byCategory: {},
    dailyStats: [],
    monthlyStats: [],
    topCategories: [],
    topSubcategories: [],
    topAuthors: [],
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
  const [selectedWriteup, setSelectedWriteup] = useState(null);
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
      topAuthors: [],
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
    if (!window.confirm('Are you sure you want to delete this writeup?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/admin/writeups/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWriteups(writeups.filter(writeup => writeup._id !== id));
      calculateStats(writeups.filter(writeup => writeup._id !== id));
    } catch (error) {
      setError(error.response?.data?.message || 'Error deleting writeup');
    }
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

        {/* Top Authors */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Top Authors</h3>
            <span className="text-sm text-gray-400">By writeup count</span>
          </div>
          <div className="space-y-4">
            {stats.topAuthors.map((author, index) => (
              <div key={author.name} className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-lg font-bold text-purple-400 mr-3">#{index + 1}</span>
                    <div>
                      <p className="text-white font-medium">{author.name}</p>
                      <p className="text-sm text-gray-400">{author.reads} total reads</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{author.count} writeups</p>
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
                  Author
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
              {writeups.map((writeup) => (
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
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <span className="text-blue-400 text-sm font-medium">
                            {writeup.author?.username?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm text-white">{writeup.author?.username || 'Unknown'}</div>
                        <div className="text-xs text-gray-400">{writeup.author?.email || ''}</div>
                      </div>
                    </div>
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
                        onClick={() => handleDeleteWriteup(writeup._id)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
                      <p className="text-sm text-gray-400">Author</p>
                      <p className="text-white">{selectedWriteup.author?.username || 'Unknown'}</p>
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
    </div>
  );
};

export default WriteupsPage; 