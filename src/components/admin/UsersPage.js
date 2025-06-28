import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
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
  Cell
} from 'recharts';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const [activeView, setActiveView] = useState('overview'); // 'overview', 'ip', 'country', 'local'
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    adminUsers: 0
  });
  const [analytics, setAnalytics] = useState({
    newUsersToday: 0,
    activeUsersToday: 0,
    monthlyNewUsers: 0,
    userLocations: [],
    dailyActiveUsers: [],
    userGrowth: [],
    ipAnalytics: [],
    ipDailyVisits: []
  });
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    // Filter users based on search query
    const filtered = users.filter(user => 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      if (!token) {
        console.error('No token available');
        setError('Authentication token is missing');
        logout();
        navigate('/signin');
        return;
      }

     
      const headers = { Authorization: `Bearer ${token}` };
   
      
      const response = await axios.get(`${API_BASE_URL}/api/admin/users`, { headers });
   
      setUsers(response.data);
      setFilteredUsers(response.data);
      
      // Calculate stats
      const stats = {
        totalUsers: response.data.length,
        activeUsers: response.data.filter(user => user.isActive).length,
        blockedUsers: response.data.filter(user => !user.isActive).length,
        adminUsers: response.data.filter(user => user.role === 'admin').length
      };
      setStats(stats);
    } catch (error) {
      console.error('Full error object:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.response?.data?.message);
      setError(error.response?.data?.message || 'Error fetching users');
      if (error.response?.status === 401) {
        logout();
        navigate('/signin');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      if (!token) {
        console.error('No token available for analytics');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/admin/analytics/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      if (error.response?.status === 401) {
        logout();
        navigate('/signin');
      }
    }
  };

  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${API_BASE_URL}/api/admin/users/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setUsers(users.map(user => 
        user._id === userId ? { ...user, role: newRole } : user
      ));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        adminUsers: newRole === 'admin' ? prev.adminUsers + 1 : prev.adminUsers - 1
      }));
    } catch (error) {
      setError(error.response?.data?.message || 'Error updating user role');
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${API_BASE_URL}/api/admin/users/${userId}/status`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setUsers(users.map(user => 
        user._id === userId ? { ...user, isActive: response.data.isActive } : user
      ));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        activeUsers: response.data.isActive ? prev.activeUsers + 1 : prev.activeUsers - 1,
        blockedUsers: response.data.isActive ? prev.blockedUsers - 1 : prev.blockedUsers + 1
      }));
    } catch (error) {
      setError(error.response?.data?.message || 'Error updating user status');
    }
  };

  // Format data for charts
  const formatChartData = (data) => {
    if (!data || !Array.isArray(data)) return [];
    return data.map(item => ({
      date: item._id,
      value: item.count
    }));
  };

  const formatIPChartData = (data) => {
    if (!data || !Array.isArray(data)) return [];
    return data.map(item => ({
      date: item.date,
      totalVisits: item.totalVisits,
      uniqueIPs: item.uniqueIPs
    }));
  };

  // Add this new function to process country data
  const processCountryData = () => {
    if (!analytics?.ipAnalytics) return [];
    
    const countryMap = new Map();
    
    analytics.ipAnalytics.forEach(ip => {
      const country = ip.country || 'Unknown';
      const count = countryMap.get(country) || 0;
      countryMap.set(country, count + 1);
    });
    
    return Array.from(countryMap.entries())
      .map(([country, count]) => ({ name: country, value: count }))
      .sort((a, b) => b.value - a.value);
  };

  // Custom tooltip for the pie chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-700">
          <p className="text-white font-medium">{data.name}</p>
          <p className="text-gray-300">{`Users: ${data.value}`}</p>
          <p className="text-gray-300">{`Percentage: ${((data.value / processCountryData().reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%`}</p>
        </div>
      );
    }
    return null;
  };

  // Custom label for the pie chart
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
      >
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
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
        <h1 className="text-3xl font-bold text-white mb-2">User Analytics Dashboard</h1>
        <p className="text-gray-400">Monitor user activity, growth, and engagement</p>
      </div>

      {/* View Selection Buttons */}
      <div className="mb-8">
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setActiveView('overview')}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeView === 'overview'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Overview
              </div>
            </button>
            <button
              onClick={() => setActiveView('ip')}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeView === 'ip'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                IP Analytics
              </div>
            </button>
            <button
              onClick={() => setActiveView('country')}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeView === 'country'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Country Stats
              </div>
            </button>
            <button
              onClick={() => setActiveView('local')}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeView === 'local'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Local Visits
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Content based on active view */}
      {activeView === 'overview' && (
        <>
          {/* Quick Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Users Box */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 shadow-lg transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Users</p>
                  <p className="text-white text-3xl font-bold mt-2">{stats.totalUsers}</p>
                  <p className="text-blue-100 text-sm mt-2">
                    {analytics.monthlyNewUsers} new this month
                  </p>
                </div>
                <div className="bg-blue-400/20 p-3 rounded-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Active Users Box */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 shadow-lg transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Active Users</p>
                  <p className="text-white text-3xl font-bold mt-2">{stats.activeUsers}</p>
                  <p className="text-green-100 text-sm mt-2">
                    {analytics.activeUsersToday} active today
                  </p>
                </div>
                <div className="bg-green-400/20 p-3 rounded-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Blocked Users Box */}
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 shadow-lg transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Blocked Users</p>
                  <p className="text-white text-3xl font-bold mt-2">{stats.blockedUsers}</p>
                  <p className="text-red-100 text-sm mt-2">
                    {Math.round((stats.blockedUsers / stats.totalUsers) * 100)}% of total
                  </p>
                </div>
                <div className="bg-red-400/20 p-3 rounded-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Admin Users Box */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 shadow-lg transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Admin Users</p>
                  <p className="text-white text-3xl font-bold mt-2">{stats.adminUsers}</p>
                  <p className="text-purple-100 text-sm mt-2">
                    {Math.round((stats.adminUsers / stats.totalUsers) * 100)}% of total
                  </p>
                </div>
                <div className="bg-purple-400/20 p-3 rounded-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="bg-gray-800 rounded-xl p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-xl">
                <input
                  type="text"
                  placeholder="Search users by username or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex gap-4">
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  Export Data
                </button>
                <button className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
                  Filter
                </button>
              </div>
            </div>
          </div>

          {/* Main Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* User Growth Chart */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">User Growth</h3>
                <span className="text-sm text-gray-400">Last 30 days</span>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formatChartData(analytics.userGrowth)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#888"
                      tick={{ fill: '#888' }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis 
                      stroke="#888"
                      tick={{ fill: '#888' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: '#fff'
                      }}
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name="New Users"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6' }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Daily Active Users Chart */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Daily Active Users</h3>
                <span className="text-sm text-gray-400">Last 30 days</span>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={formatChartData(analytics.dailyActiveUsers)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#888"
                      tick={{ fill: '#888' }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis 
                      stroke="#888"
                      tick={{ fill: '#888' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: '#fff'
                      }}
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Legend />
                    <Bar 
                      dataKey="value" 
                      name="Active Users"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {activeView === 'ip' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* IP Analytics */}
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Top IP Addresses</h3>
              <span className="text-sm text-gray-400">Most active</span>
            </div>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {analytics.ipAnalytics.map((ip, index) => (
                <div key={ip.ip} className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium">{ip.ip}</p>
                      <p className="text-sm text-gray-400">
                        Last visit: {new Date(ip.lastVisit).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">{ip.visitCount} visits</p>
                      <p className="text-sm text-gray-400">{ip.uniqueUsers} unique users</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* IP Daily Activity */}
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">IP Activity</h3>
              <span className="text-sm text-gray-400">Daily overview</span>
            </div>
            <div className="h-[600px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formatIPChartData(analytics.ipDailyVisits)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#888"
                    tick={{ fill: '#888' }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis 
                    yAxisId="left"
                    stroke="#888"
                    tick={{ fill: '#888' }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#888"
                    tick={{ fill: '#888' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '0.5rem',
                      color: '#fff'
                    }}
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="totalVisits"
                    name="Total Visits"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="uniqueIPs"
                    name="Unique IPs"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981' }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeView === 'country' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Country Distribution */}
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">User Distribution by Country</h3>
              <span className="text-sm text-gray-400">Top locations</span>
            </div>
            <div className="h-[600px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.userLocations}
                    dataKey="count"
                    nameKey="_id"
                    cx="50%"
                    cy="50%"
                    outerRadius={200}
                    label
                  >
                    {analytics.userLocations.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '0.5rem',
                      color: '#fff'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Country List */}
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Country Statistics</h3>
              <span className="text-sm text-gray-400">Detailed view</span>
            </div>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {analytics.userLocations.map((location, index) => (
                <div key={location._id} className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium">{location._id}</p>
                      <p className="text-sm text-gray-400">
                        {Math.round((location.count / analytics.userLocations.reduce((acc, curr) => acc + curr.count, 0)) * 100)}% of total users
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">{location.count} users</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeView === 'local' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Local Visit Stats */}
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Local Visit Statistics</h3>
              <span className="text-sm text-gray-400">Last 30 days</span>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total Local Visits</span>
                  <span className="text-2xl font-bold text-white">
                    {analytics.ipDailyVisits.reduce((acc, curr) => acc + curr.totalVisits, 0)}
                  </span>
                </div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Average Daily Visits</span>
                  <span className="text-2xl font-bold text-white">
                    {Math.round(
                      analytics.ipDailyVisits.reduce((acc, curr) => acc + curr.totalVisits, 0) /
                        analytics.ipDailyVisits.length
                    )}
                  </span>
                </div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Peak Daily Visits</span>
                  <span className="text-2xl font-bold text-white">
                    {Math.max(...analytics.ipDailyVisits.map(v => v.totalVisits))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Local Visit Chart */}
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Local Visit Trends</h3>
              <span className="text-sm text-gray-400">Daily activity</span>
            </div>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formatIPChartData(analytics.ipDailyVisits)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#888"
                    tick={{ fill: '#888' }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis 
                    stroke="#888"
                    tick={{ fill: '#888' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '0.5rem',
                      color: '#fff'
                    }}
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="totalVisits"
                    name="Total Visits"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* User Table Section */}
      <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">User Management</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user._id} className={`hover:bg-gray-700/50 ${!user.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <span className="text-blue-400 text-lg font-medium">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">
                          {user.username}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Blocked'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleToggleRole(user._id, user.role)}
                        className={`px-3 py-1 rounded text-sm ${
                          user.role === 'admin'
                            ? 'bg-yellow-500 hover:bg-yellow-600'
                            : 'bg-blue-500 hover:bg-blue-600'
                        } text-white transition-colors`}
                      >
                        {user.role === 'admin' ? 'Make User' : 'Make Admin'}
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user._id, user.isActive)}
                        className={`px-3 py-1 rounded text-sm ${
                          user.isActive
                            ? 'bg-red-500 hover:bg-red-600'
                            : 'bg-green-500 hover:bg-green-600'
                        } text-white transition-colors`}
                      >
                        {user.isActive ? 'Block' : 'Unblock'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UsersPage; 