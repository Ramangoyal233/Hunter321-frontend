import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { toast } from 'react-toastify';
import DeleteConfirmationModal from './DeleteConfirmationModal';

const COLORS = {
  primary: '#3B82F6',
  secondary: '#6B7280',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  light: '#F3F4F6',
  dark: '#1F2937'
};

const CategoriesPage = () => {
  const { isAdmin, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '🔒'
  });
  const [subcategoryFormData, setSubcategoryFormData] = useState({
    name: '',
    description: '',
    icon: '🔒',
    category: ''
  });
  const [stats, setStats] = useState({
    totalCategories: 0,
    totalSubcategories: 0,
    totalWriteups: 0,
    activeUsers: 0,
    categoryGrowth: [],
    subcategoryDistribution: [],
    writeupDistribution: [],
    userActivity: [],
    topCategories: [],
    recentActivity: [],
    monthlyStats: {
      newCategories: [],
      newSubcategories: [],
      newWriteups: []
    },
    writeupsByCategory: {},
    writeupsBySubcategory: {}
  });
  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);
  const [parentCategoryId, setParentCategoryId] = useState(null);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [showAddSubcategoryForm, setShowAddSubcategoryForm] = useState(false);

  // State for delete confirmation modal
  const [deleteModal, setDeleteModal] = useState({ 
    show: false, 
    id: null, 
    type: '', 
    name: '' 
  });

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin/login');
      return;
    }
    fetchCategories();
    fetchSubcategories();
  }, [isAdmin, navigate]);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        logout();
        navigate('/admin/login');
        return;
      }

      const [categoriesRes, subcategoriesRes, writeupsRes, usersRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/admin/categories`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/api/admin/subcategories`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/api/admin/writeups`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (!categoriesRes.data || !categoriesRes.data.categories) {
        throw new Error('Invalid response format from categories API');
      }

      if (!subcategoriesRes.data || !subcategoriesRes.data.subcategories) {
        throw new Error('Invalid response format from subcategories API');
      }

      if (!writeupsRes.data) {
        throw new Error('Invalid response format from writeups API');
      }

      if (!usersRes.data) {
        throw new Error('Invalid response format from users API');
      }

      // Create a map of categories for quick lookup
      const categoryMap = new Map(
        categoriesRes.data.categories.map(cat => [cat._id, cat])
      );

      // Map subcategories with their parent category information
      const subcategoriesWithParent = subcategoriesRes.data.subcategories.map(sub => ({
        ...sub,
        category: categoryMap.get(sub.category?._id) || { name: 'Unknown Category' }
      }));

      // Map categories with their subcategories
      const categoriesWithSubcategories = categoriesRes.data.categories.map(category => ({
        ...category,
        subcategories: subcategoriesWithParent.filter(sub => sub.category?._id === category._id)
      }));

      setCategories(categoriesWithSubcategories);
      setSubcategories(subcategoriesWithParent);
      calculateStats(
        categoriesWithSubcategories,
        writeupsRes.data,
        usersRes.data
      );
    } catch (err) {
      console.error('Error fetching data:', err);
      if (err.response?.status === 401) {
        logout();
        navigate('/admin/login');
      } else {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch data';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubcategories = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        logout();
        navigate('/admin/login');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/admin/subcategories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubcategories(response.data.subcategories || []);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      if (error.response?.status === 401) {
        logout();
        navigate('/admin/login');
      } else {
        setError('Error fetching subcategories');
      }
    }
  };

  const calculateStats = (categoriesData, writeupsData, usersData) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Calculate writeups per category and subcategory
    const writeupsByCategory = {};
    const writeupsBySubcategory = {};
    writeupsData.forEach(writeup => {
      if (writeup.category) {
        writeupsByCategory[writeup.category._id] = (writeupsByCategory[writeup.category._id] || 0) + 1;
      }
      if (writeup.subcategory) {
        writeupsBySubcategory[writeup.subcategory._id] = (writeupsBySubcategory[writeup.subcategory._id] || 0) + 1;
      }
    });

    const stats = {
      totalCategories: categoriesData.length,
      totalSubcategories: categoriesData.reduce((acc, cat) => acc + (cat.subcategories?.length || 0), 0),
      totalWriteups: writeupsData.length,
      activeUsers: usersData.filter(user => user.isActive).length,
      categoryGrowth: [],
      subcategoryDistribution: [],
      writeupDistribution: [],
      userActivity: [],
      topCategories: [],
      recentActivity: [],
      monthlyStats: {
        newCategories: [],
        newSubcategories: [],
        newWriteups: []
      },
      writeupsByCategory,
      writeupsBySubcategory
    };

    // Calculate category growth
    const dailyData = {};
    categoriesData.forEach(category => {
      const date = new Date(category.createdAt).toISOString().split('T')[0];
      dailyData[date] = (dailyData[date] || 0) + 1;
    });

    stats.categoryGrowth = Object.entries(dailyData)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate subcategory distribution
    stats.subcategoryDistribution = categoriesData
      .map(category => ({
        name: category.name,
        value: category.subcategories?.length || 0
      }))
      .sort((a, b) => b.value - a.value);

    // Calculate writeup distribution
    stats.writeupDistribution = categoriesData
      .map(category => ({
        name: category.name,
        value: writeupsData.filter(w => w.category?._id === category._id).length
      }))
      .sort((a, b) => b.value - a.value);

    // Calculate top categories
    stats.topCategories = categoriesData
      .map(category => {
        const categoryWriteups = writeupsData.filter(w => w.category?._id === category._id);
        return {
          name: category.name,
          writeups: categoryWriteups.length,
          subcategories: category.subcategories?.length || 0,
          totalReads: categoryWriteups.reduce((acc, w) => acc + (w.reads || 0), 0),
          todayReads: categoryWriteups.reduce((acc, w) => acc + (w.todayReads || 0), 0)
        };
      })
      .sort((a, b) => b.writeups - a.writeups)
      .slice(0, 5);

    // Calculate recent activity
    const allActivity = [
      ...categoriesData.map(cat => ({
        type: 'category',
        name: cat.name,
        date: cat.updatedAt,
        action: 'updated'
      })),
      ...writeupsData.map(w => ({
        type: 'writeup',
        name: w.title,
        date: w.updatedAt,
        action: 'updated'
      }))
    ];

    stats.recentActivity = allActivity
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    // Calculate monthly stats
    const monthlyData = {
      categories: {},
      subcategories: {},
      writeups: {}
    };

    categoriesData.forEach(category => {
      const month = new Date(category.createdAt).toISOString().slice(0, 7);
      monthlyData.categories[month] = (monthlyData.categories[month] || 0) + 1;
      
      category.subcategories?.forEach(sub => {
        const subMonth = new Date(sub.createdAt).toISOString().slice(0, 7);
        monthlyData.subcategories[subMonth] = (monthlyData.subcategories[subMonth] || 0) + 1;
      });
    });

    writeupsData.forEach(writeup => {
      const month = new Date(writeup.createdAt).toISOString().slice(0, 7);
      monthlyData.writeups[month] = (monthlyData.writeups[month] || 0) + 1;
    });

    stats.monthlyStats = {
      newCategories: Object.entries(monthlyData.categories)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month)),
      newSubcategories: Object.entries(monthlyData.subcategories)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month)),
      newWriteups: Object.entries(monthlyData.writeups)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month))
    };

    setStats(stats);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await axios.put(`${API_BASE_URL}/api/admin/categories/${editingCategory._id}`, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        toast.success('Category updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/api/admin/categories`, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        toast.success('Category created successfully');
      }
      setFormData({ name: '', description: '', icon: '🔒' });
      setEditingCategory(null);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    }
  };

  const handleSubcategorySubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        logout();
        navigate('/admin/login');
        return;
      }

      if (editingSubcategory) {
        // Update existing subcategory
        const response = await axios.put(
          `${API_BASE_URL}/api/admin/subcategories/${editingSubcategory._id}`,
          subcategoryFormData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        // Update the subcategories in the state
        setSubcategories(subcategories.map(sub => 
          sub._id === editingSubcategory._id ? response.data : sub
        ));
        
        toast.success('Subcategory updated successfully');
      } else {
        // Create new subcategory
        const response = await axios.post(
          `${API_BASE_URL}/api/admin/categories/${subcategoryFormData.category}/subcategories`,
          subcategoryFormData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        // Add the new subcategory to the subcategories state
        setSubcategories([...subcategories, response.data]);
        
        // Add the new subcategory to the appropriate category
        setCategories(categories.map(category => {
          if (category._id === subcategoryFormData.category) {
            return {
              ...category,
              subcategories: [...(category.subcategories || []), response.data]
            };
          }
          return category;
        }));
        
        toast.success('Subcategory created successfully');
      }
      
      // Close modal and reset form
      setIsSubcategoryModalOpen(false);
      setEditingSubcategory(null);
      setSubcategoryFormData({ name: '', description: '', icon: '🔒', category: '' });
      
      // Refresh the data to ensure everything is in sync
      await fetchCategories();
      await fetchSubcategories();
    } catch (error) {
      if (error.response?.status === 401) {
        logout();
        navigate('/admin/login');
      } else {
        toast.error(error.response?.data?.message || 'Failed to save subcategory');
      }
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      icon: category.icon
    });
  };

  const handleEditSubcategory = (subcategory) => {
    setSubcategoryFormData({
      name: subcategory.name,
      description: subcategory.description,
      icon: subcategory.icon,
      category: subcategory.category
    });
    setEditingSubcategory(subcategory);
    setIsSubcategoryModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/admin/categories/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Category deleted successfully');
      fetchCategories();
      
      // Close the modal
      setDeleteModal({ show: false, id: null, type: '', name: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    }
  };

  const handleDeleteSubcategory = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/admin/subcategories/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Subcategory deleted successfully');
      fetchCategories();
      
      // Close the modal
      setDeleteModal({ show: false, id: null, type: '', name: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete subcategory');
    }
  };

  const handleDeleteClick = (id, type, name) => {
    setDeleteModal({ show: true, id, type, name });
  };

  const handleOpenSubcategoryModal = (categoryId) => {
    setSubcategoryFormData({
      name: '',
      description: '',
      icon: '🔒',
      category: categoryId
    });
    setEditingSubcategory(null);
    setIsSubcategoryModalOpen(true);
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
        <h1 className="text-3xl font-bold text-white mb-2">Categories Dashboard</h1>
        <p className="text-gray-400">Monitor category performance and analytics</p>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Categories */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Categories</p>
              <p className="text-white text-3xl font-bold mt-2">{stats.totalCategories}</p>
              <p className="text-blue-100 text-sm mt-2">
                {stats.totalSubcategories} subcategories
              </p>
            </div>
            <div className="bg-blue-400/20 p-3 rounded-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Writeups */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Writeups</p>
              <p className="text-white text-3xl font-bold mt-2">{stats.totalWriteups}</p>
              <p className="text-green-100 text-sm mt-2">
                Across all categories
              </p>
            </div>
            <div className="bg-green-400/20 p-3 rounded-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Active Users</p>
              <p className="text-white text-3xl font-bold mt-2">{stats.activeUsers}</p>
              <p className="text-purple-100 text-sm mt-2">
                Contributing to categories
              </p>
            </div>
            <div className="bg-purple-400/20 p-3 rounded-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Growth Rate */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm font-medium">Growth Rate</p>
              <p className="text-white text-3xl font-bold mt-2">
                {stats.monthlyStats.newCategories[stats.monthlyStats.newCategories.length - 1]?.count || 0}
              </p>
              <p className="text-indigo-100 text-sm mt-2">
                New categories this month
              </p>
            </div>
            <div className="bg-indigo-400/20 p-3 rounded-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Category Growth Chart */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Category Growth</h3>
            <span className="text-sm text-gray-400">Last 30 days</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.categoryGrowth}>
                <defs>
                  <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
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
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="New Categories"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ 
                    fill: '#3b82f6',
                    strokeWidth: 2,
                    r: 4
                  }}
                  activeDot={{ 
                    r: 8,
                    strokeWidth: 2,
                    fill: '#3b82f6',
                    stroke: '#fff'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="false"
                  fillOpacity={1}
                  fill="url(#growthGradient)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Activity */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Monthly Activity</h3>
            <span className="text-sm text-gray-400">By type</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyStats.newCategories}>
                <defs>
                  <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
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
                />
                <Legend />
                <Bar 
                  dataKey="count" 
                  name="New Categories"
                  fill="url(#activityGradient)"
                  radius={[4, 4, 0, 0]}
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
                        {category.subcategories} subcategories
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{category.writeups} writeups</p>
                    <p className="text-sm text-gray-400">
                      {category.totalReads} total reads
                    </p>
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
            <span className="text-sm text-gray-400">Last 10 updates</span>
          </div>
          <div className="space-y-4">
            {stats.recentActivity.map((activity, index) => (
              <div key={index} className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium">{activity.name}</p>
                    <p className="text-sm text-gray-400">
                      {activity.type} {activity.action}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Categories List */}
      <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Categories List</h3>
            <Link
              to="/admin/categories/new"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Add New Category
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Subcategories
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Writeups
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Total Reads
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {categories.map((category) => {
                const subcategoryCount = subcategories.filter(
                  sub => sub.category?._id === category._id
                ).length;
                
                return (
                  <tr key={category._id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{category.name}</div>
                      <div className="text-sm text-gray-400">{category.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        {subcategoryCount} subcategories
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        {stats.writeupsByCategory[category._id] || 0} writeups
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        {stats.topCategories.find(c => c.name === category.name)?.totalReads || 0} reads
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(category.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleOpenSubcategoryModal(category._id)}
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors duration-300"
                          title="Add Subcategory"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                        <Link
                          to={`/admin/categories/edit/${category._id}`}
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors duration-300"
                          title="Edit Category"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(category._id, 'category', category.name)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors duration-300"
                          title="Delete Category"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subcategory Modal */}
      {isSubcategoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">
                {editingSubcategory ? 'Edit Subcategory' : 'Add Subcategory'}
              </h3>
              <button
                onClick={() => {
                  setIsSubcategoryModalOpen(false);
                  setEditingSubcategory(null);
                  setSubcategoryFormData({
                    name: '',
                    description: '',
                    icon: '🔒',
                    category: ''
                  });
                }}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubcategorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={subcategoryFormData.name}
                  onChange={(e) => setSubcategoryFormData({
                    ...subcategoryFormData,
                    name: e.target.value
                  })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Description
                </label>
                <textarea
                  value={subcategoryFormData.description}
                  onChange={(e) => setSubcategoryFormData({
                    ...subcategoryFormData,
                    description: e.target.value
                  })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Icon
                </label>
                <input
                  type="text"
                  value={subcategoryFormData.icon}
                  onChange={(e) => setSubcategoryFormData({
                    ...subcategoryFormData,
                    icon: e.target.value
                  })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsSubcategoryModalOpen(false);
                    setEditingSubcategory(null);
                    setSubcategoryFormData({
                      name: '',
                      description: '',
                      icon: '🔒',
                      category: ''
                    });
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  {editingSubcategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subcategories List */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Subcategories List</h2>
        </div>
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Icon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Writeups
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Total Reads
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {subcategories.map((subcategory) => (
                  <tr key={subcategory._id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {subcategory.icon}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {subcategory.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {subcategory.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {categories.find(cat => cat._id === subcategory.category)?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {subcategory.writeups?.length || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {subcategory.writeups?.reduce((total, writeup) => total + (writeup.reads || 0), 0) || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditSubcategory(subcategory)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(subcategory._id, 'subcategory', subcategory.name)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.show}
        onClose={() => setDeleteModal({ show: false, id: null, type: '', name: '' })}
        onConfirm={() => {
          if (deleteModal.type === 'category') {
            handleDelete(deleteModal.id);
          } else if (deleteModal.type === 'subcategory') {
            handleDeleteSubcategory(deleteModal.id);
          }
        }}
        title={`Delete ${deleteModal.type.charAt(0).toUpperCase() + deleteModal.type.slice(1)}`}
        message={`Are you sure you want to delete this ${deleteModal.type}? This action cannot be undone.`}
        itemName={deleteModal.name}
        type="danger"
      />
    </div>
  );
};

export default CategoriesPage; 