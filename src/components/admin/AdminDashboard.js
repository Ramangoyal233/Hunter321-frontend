import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { fetchCategories, fetchWriteups, deleteCategory, deleteWriteup, fetchSubcategories, createSubcategory, fetchCategory, updateSubcategory, deleteSubcategory } from '../../api/adminApi';
import { toast } from 'react-hot-toast';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const { isAdmin, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('categories');
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [writeups, setWriteups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for subcategory modal
  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);
  const [parentCategoryId, setParentCategoryId] = useState(null);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [showAddSubcategoryForm, setShowAddSubcategoryForm] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const [chartData, setChartData] = useState({
    categories: {
      labels: [],
      datasets: []
    },
    writeups: {
      labels: [],
      datasets: []
    }
  });

  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', icon: '' });
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);

  const [subcategoryFormData, setSubcategoryFormData] = useState({ name: '', description: '', icon: '' });

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/admin/login');
      return;
    }
    if (!loading && isAdmin) {
      fetchData();
    }
  }, [activeTab, isAdmin, loading, navigate]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null); // Clear any previous errors
      const token = localStorage.getItem('token');
     
      
      if (!token) {
       
        logout();
        navigate('/admin/login');
        return;
      }

      // Debug token format
      const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
     

      if (activeTab === 'categories') {
        try {
             // Fetch categories with their subcategories
          const categoriesRes = await axios.get(`${API_BASE_URL}/api/admin/categories`, {
            headers: { 
              Authorization: formattedToken,
              'Content-Type': 'application/json'
            }
          });
          
          // Fetch all subcategories
          const subcategoriesRes = await axios.get(`${API_BASE_URL}/api/admin/subcategories`, {
            headers: { 
              Authorization: formattedToken,
              'Content-Type': 'application/json'
            }
          });
          

          if (!categoriesRes.data || !categoriesRes.data.categories) {
            console.error('Invalid categories response format:', categoriesRes.data);
            throw new Error('Invalid response format from categories API');
          }

          if (!subcategoriesRes.data || !subcategoriesRes.data.subcategories) {
            console.error('Invalid subcategories response format:', subcategoriesRes.data);
            throw new Error('Invalid response format from subcategories API');
          }

          // Organize subcategories by their parent category
          const categoriesWithSubcategories = categoriesRes.data.categories.map(category => {
            const categorySubcategories = subcategoriesRes.data.subcategories.filter(
              sub => sub.category?._id === category._id
            );
            return {
              ...category,
              subcategories: categorySubcategories
            };
          });

      
          setCategories(categoriesWithSubcategories);
          setSubcategories(subcategoriesRes.data.subcategories);
          
          // Prepare chart data for categories
          const last6Months = Array.from({ length: 6 }, (_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            return date.toLocaleString('default', { month: 'short' });
          }).reverse();

          const categoryData = {
            labels: last6Months,
            datasets: [
              {
                label: 'Categories',
                data: Array(6).fill(0).map(() => Math.floor(Math.random() * 5) + 1),
                borderColor: 'rgb(255, 159, 64)',
                backgroundColor: 'rgba(255, 159, 64, 0.2)',
                pointBackgroundColor: 'rgb(255, 159, 64)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(255, 159, 64)',
                pointRadius: 5,
                pointHoverRadius: 5,
                tension: 0.4
              },
              {
                label: 'Subcategories',
                data: Array(6).fill(0).map(() => Math.floor(Math.random() * 2) + 1),
                borderColor: 'rgb(234, 88, 124)',
                backgroundColor: 'rgba(234, 88, 124, 0.2)',
                pointBackgroundColor: 'rgb(234, 88, 124)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(234, 88, 124)',
                pointRadius: 5,
                pointHoverRadius: 5,
                tension: 0.4
              }
            ]
          };
          setChartData(prev => ({ ...prev, categories: categoryData }));
        } catch (error) {
          console.error('Error fetching categories:', error);
          console.error('Error response:', error.response);
          console.error('Error status:', error.response?.status);
          console.error('Error data:', error.response?.data);
          throw new Error(error.response?.data?.message || 'Failed to fetch categories');
        }
      } else {
        try {
         
          const response = await axios.get(`${API_BASE_URL}/api/admin/writeups`, {
            headers: { 
              Authorization: formattedToken,
              'Content-Type': 'application/json'
            }
          });
         
          
          if (!response.data) {
            console.error('Invalid writeups response format:', response.data);
            throw new Error('Invalid response format from writeups API');
          }

          setWriteups(response.data || []);
          
          // Prepare chart data for writeups
          const last6Months = Array.from({ length: 6 }, (_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            return date.toLocaleString('default', { month: 'short' });
          }).reverse();

          const writeupData = {
            labels: last6Months,
            datasets: [
              {
                label: 'Writeups Published',
                data: Array(6).fill(0).map(() => Math.floor(Math.random() * 5) + 1),
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                pointBackgroundColor: 'rgb(34, 197, 94)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(34, 197, 94)',
                pointRadius: 5,
                pointHoverRadius: 5,
                tension: 0.4
              }
            ]
          };
          setChartData(prev => ({ ...prev, writeups: writeupData }));
        } catch (error) {
          console.error('Error fetching writeups:', error);
          console.error('Error response:', error.response);
          console.error('Error status:', error.response?.status);
          console.error('Error data:', error.response?.data);
          throw new Error(error.response?.data?.message || 'Failed to fetch writeups');
        }
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error in fetchData:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      if (error.response?.status === 401) {
       
        logout();
        navigate('/admin/login');
      } else {
        setError(error.message || 'An error occurred while fetching data');
        toast.error(error.message || 'An error occurred while fetching data');
      }
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        logout();
        navigate('/admin/login');
        return;
      }

      if (editingCategory) {
        // Update existing category
        const response = await axios.put(
          `${API_BASE_URL}/api/admin/categories/` + editingCategory._id,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setCategories(categories.map(cat => 
          cat._id === editingCategory._id ? response.data : cat
        ));
        toast.success('Category updated successfully');
      } else {
        // Create new category
        const response = await axios.post(
          `${API_BASE_URL}/api/admin/categories`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setCategories([...categories, response.data]);
        toast.success('Category created successfully');
      }
      setShowAddCategoryForm(false);
      setEditingCategory(null);
      setFormData({ name: '', description: '', icon: '' });
    } catch (error) {
      if (error.response?.status === 401) {
        logout();
        navigate('/admin/login');
      } else {
        toast.error(error.response?.data?.message || 'Error saving category');
      }
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
          `${API_BASE_URL}/api/admin/subcategories/` + editingSubcategory._id,
          subcategoryFormData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        // Update the subcategories in the state
        setSubcategories(subcategories.map(sub => 
          sub._id === editingSubcategory._id ? response.data : sub
        ));
        
        // Update the subcategories in the categories state
        setCategories(categories.map(category => ({
          ...category,
          subcategories: category.subcategories.map(sub =>
            sub._id === editingSubcategory._id ? response.data : sub
          )
        })));
        
        toast.success('Subcategory updated successfully');
      } else {
        // Create new subcategory
        const response = await axios.post(
          `${API_BASE_URL}/api/admin/categories/` + parentCategoryId + '/subcategories',
          subcategoryFormData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        // Add the new subcategory to the subcategories state
        setSubcategories([...subcategories, response.data]);
        
        // Add the new subcategory to the appropriate category
        setCategories(categories.map(category => {
          if (category._id === parentCategoryId) {
            return {
              ...category,
              subcategories: [...(category.subcategories || []), response.data]
            };
          }
          return category;
        }));
        
        toast.success('Subcategory created successfully');
      }
      
      setIsSubcategoryModalOpen(false);
      setEditingSubcategory(null);
      setSubcategoryFormData({ name: '', description: '', icon: '' });
      setParentCategoryId(null);
    } catch (error) {
      if (error.response?.status === 401) {
        logout();
        navigate('/admin/login');
      } else {
        toast.error(error.response?.data?.message || 'Error saving subcategory');
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
    setShowAddCategoryForm(true);
  };

  const handleEditSubcategory = (subcategory) => {
    setEditingSubcategory(subcategory);
    setSubcategoryFormData({
      name: subcategory.name,
      description: subcategory.description,
      icon: subcategory.icon
    });
    setParentCategoryId(subcategory.parent._id);
    setIsSubcategoryModalOpen(true);
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        logout();
        navigate('/admin/login');
        return;
      }

      if (type === 'category') {
        await axios.delete(`${API_BASE_URL}/api/admin/categories/` + id, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCategories(categories.filter(cat => cat._id !== id));
        toast.success('Category deleted successfully');
      } else {
        await axios.delete(`${API_BASE_URL}/api/admin/subcategories/` + id, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Remove from subcategories state
        setSubcategories(subcategories.filter(sub => sub._id !== id));
        
        // Remove from categories state
        setCategories(categories.map(category => ({
          ...category,
          subcategories: category.subcategories.filter(sub => sub._id !== id)
        })));
        
        toast.success('Subcategory deleted successfully');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        logout();
        navigate('/admin/login');
      } else {
        toast.error(error.response?.data?.message || `Error deleting ${type}`);
      }
    }
  };

  const handleAddSubcategory = async () => {
    try {
      const subcategoryData = {
        name: newSubcategoryName,
        description: `Subcategory of ${categories.find(cat => cat._id === parentCategoryId)?.name || 'Category'}`,
        icon: '🔒',
        slug: newSubcategoryName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      };
      
      const newSubcategory = await createSubcategory(parentCategoryId, subcategoryData);
      setSubcategories([...subcategories, newSubcategory]);
      setShowAddSubcategoryForm(false);
      setNewSubcategoryName('');
    } catch (error) {
      console.error('Error adding subcategory:', error);
      // TODO: Add error handling UI
    }
  };

  const loadSubcategories = async (categoryId) => {
    try {
      const subcats = await fetchSubcategories(categoryId);
      setSubcategories(subcats);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      // TODO: Add error handling UI
    }
  };

  // Update the onClick handler for the Add Subcategory button
  const handleOpenSubcategoryModal = async (categoryId) => {
    try {
      setParentCategoryId(categoryId);
      const [category, subcats] = await Promise.all([
        fetchCategory(categoryId),
        fetchSubcategories(categoryId)
      ]);
      setSubcategories(subcats);
      setIsSubcategoryModalOpen(true);
      setShowAddSubcategoryForm(false);
    } catch (error) {
      console.error('Error opening subcategory modal:', error);
      // TODO: Add error handling UI
    }
  };

  const handleUpdateSubcategory = async () => {
    try {
      const subcategoryData = {
        name: newSubcategoryName,
        description: editingSubcategory.description,
        icon: editingSubcategory.icon,
        slug: newSubcategoryName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      };
      
      const updatedSubcategory = await updateSubcategory(
        parentCategoryId,
        editingSubcategory._id,
        subcategoryData
      );
      
      setSubcategories(subcategories.map(subcat => 
        subcat._id === updatedSubcategory._id ? updatedSubcategory : subcat
      ));
      
      setShowAddSubcategoryForm(false);
      setNewSubcategoryName('');
      setEditingSubcategory(null);
    } catch (error) {
      console.error('Error updating subcategory:', error);
      // TODO: Add error handling UI
    }
  };

  const handleDeleteSubcategory = async (subcategoryId) => {
    try {
      await deleteSubcategory(parentCategoryId, subcategoryId);
      setSubcategories(subcategories.filter(subcat => subcat._id !== subcategoryId));
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      // TODO: Add error handling UI
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'rgb(156, 163, 175)',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(17, 24, 39, 0.8)',
        titleColor: 'rgb(255, 255, 255)',
        bodyColor: 'rgb(255, 255, 255)',
        borderColor: 'rgba(75, 85, 99, 1)',
        borderWidth: 1
      },
      beforeDraw: (chart) => {
        const ctx = chart.canvas.getContext('2d');
        ctx.save();
        ctx.fillStyle = 'rgb(31, 41, 55)';
        ctx.fillRect(0, 0, chart.width, chart.height);
        ctx.restore();
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(75, 85, 99, 0.5)',
          borderColor: 'rgb(75, 85, 99)'
        },
        ticks: {
          color: 'rgb(156, 163, 175)'
        }
      },
      y: {
        grid: {
          color: 'rgba(75, 85, 99, 0.5)',
          borderColor: 'rgb(75, 85, 99)'
        },
        ticks: {
          color: 'rgb(156, 163, 175)'
        }
      }
    },
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
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white pt-11">
      {/* Dashboard Header */}
      <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
            <div className="w-full sm:w-auto text-center sm:text-left">
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                Admin Dashboard
              </h1>
              <p className="text-gray-400 mt-1">Manage your content and settings</p>
            </div>
            <div className="flex space-x-2 sm:space-x-4 w-full sm:w-auto justify-center sm:justify-end">
              <button
                onClick={() => setActiveTab('categories')}
                className={`px-4 sm:px-6 py-2.5 rounded-lg transition-all duration-300 text-sm font-medium flex items-center space-x-2 w-1/2 sm:w-auto ${
                  activeTab === 'categories'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 border border-gray-700 hover:border-blue-500/50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span>Categories</span>
              </button>
              <button
                onClick={() => setActiveTab('writeups')}
                className={`px-4 sm:px-6 py-2.5 rounded-lg transition-all duration-300 text-sm font-medium flex items-center space-x-2 w-1/2 sm:w-auto ${
                  activeTab === 'writeups'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 border border-gray-700 hover:border-blue-500/50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Writeups</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Analytics */}
          <div className="w-full lg:w-1/3 space-y-6">
            {/* Quick Stats */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-white mb-4">Quick Stats</h2>
              <div className="space-y-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-400 text-sm">Total {activeTab === 'categories' ? 'Categories' : 'Writeups'}</p>
                      <p className="text-white text-2xl font-bold mt-1">
                        {activeTab === 'categories' ? categories.length : writeups.length}
                      </p>
                    </div>
                    <div className="bg-blue-500/20 p-3 rounded-lg">
                      <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-400 text-sm">This Month</p>
                      <p className="text-white text-2xl font-bold mt-1">
                        {activeTab === 'categories' 
                          ? categories.filter(cat => new Date(cat.createdAt).getMonth() === new Date().getMonth()).length
                          : writeups.filter(w => new Date(w.createdAt).getMonth() === new Date().getMonth()).length}
                      </p>
                    </div>
                    <div className="bg-green-500/20 p-3 rounded-lg">
                      <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart Section */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-white mb-4">
                {activeTab === 'categories' ? 'Content Growth' : 'Writeup Activity'}
              </h2>
              <div className="h-64">
                <Line
                  data={activeTab === 'categories' ? chartData.categories : chartData.writeups}
                  options={chartOptions}
                />
              </div>
            </div>

            {/* Distribution Stats */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-white mb-4">Distribution</h2>
              {activeTab === 'categories' ? (
                <div className="space-y-4">
                  {categories.map((category) => (
                    <div key={category._id} className="bg-gray-800/50 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">{category.name}</span>
                        <span className="text-blue-400">{category.subcategories?.length || 0} subcategories</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {writeups.map((writeup) => (
                    <div key={writeup._id} className="bg-gray-800/50 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">{writeup.title}</span>
                        <span className="text-green-400">{writeup.reads || 0} reads</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="w-full lg:w-2/3 space-y-6">
            {activeTab === 'categories' ? (
              <div className="space-y-6">
                {/* Categories Header */}
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl sm:text-2xl md:text-3xl font-semibold text-white">Categories</h2>
                    <p className="text-sm sm:text-base text-gray-400 mt-1">Manage your content categories and subcategories</p>
                  </div>
                  <button
                    onClick={() => navigate('/admin/categories/new')}
                    className="px-3 py-2 sm:px-4 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-md shadow-blue-500/20 flex items-center space-x-2 text-sm sm:text-base"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add Category</span>
                  </button>
                </div>

                {/* Categories Grid */}
                <div className="grid gap-6">
                  {categories.map((category) => (
                    <div
                      key={category._id}
                      className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 transition-all duration-300 border border-gray-800 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <h3 className="text-xl font-semibold text-white">
                            {category.name}
                          </h3>
                          <p className="text-gray-400">{category.description}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleOpenSubcategoryModal(category._id)}
                            className="p-2 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors duration-300"
                            title="Add Subcategory"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                          <button
                            onClick={() => navigate(`/admin/categories/edit/${category._id}`)}
                            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors duration-300"
                            title="Edit Category"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(category._id, 'category')}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors duration-300"
                            title="Delete Category"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Subcategories List */}
                      {category.subcategories && category.subcategories.length > 0 && (
                        <div className="mt-4 pl-4 border-l-2 border-gray-800">
                          <h4 className="text-sm font-medium text-gray-400 mb-2">Subcategories</h4>
                          <div className="space-y-2">
                            {category.subcategories.map((subcategory) => (
                              <div
                                key={subcategory._id}
                                className="flex items-center justify-between py-2 px-3 bg-gray-800/50 rounded-lg"
                              >
                                <span className="text-gray-300">{subcategory.name}</span>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleEditSubcategory(subcategory)}
                                    className="p-1 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors duration-300"
                                    title="Edit Subcategory"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDelete(subcategory._id, 'subcategory')}
                                    className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors duration-300"
                                    title="Delete Subcategory"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Writeups Header */}
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">Writeups</h2>
                    <p className="text-gray-400 mt-1">Manage your security writeups and content</p>
                  </div>
                  <button
                    onClick={() => navigate('/admin/writeups/new')}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-md shadow-blue-500/20 flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add Writeup</span>
                  </button>
                </div>

                {/* Writeups Grid */}
                <div className="grid gap-6">
                  {writeups.map((writeup) => (
                    <div
                      key={writeup._id}
                      className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 transition-all duration-300 border border-gray-800 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <h3 className="text-xl font-semibold text-white">{writeup.title}</h3>
                          <p className="text-gray-400 line-clamp-2">{writeup.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {writeup.author?.username || 'Unknown'}
                            </span>
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {new Date(writeup.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => navigate(`/admin/writeups/edit/${writeup._id}`)}
                            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors duration-300"
                            title="Edit Writeup"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(writeup._id, 'writeup')}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors duration-300"
                            title="Delete Writeup"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subcategory Modal */}
      {isSubcategoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-2">
          <div className="bg-gray-900 rounded-xl p-4 sm:p-6 w-full max-w-sm mx-2 sm:mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">Manage Subcategories</h3>
              <button
                onClick={() => setIsSubcategoryModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors duration-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {showAddSubcategoryForm ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    {editingSubcategory ? 'Edit Subcategory' : 'New Subcategory Name'}
                  </label>
                  <input
                    type="text"
                    value={newSubcategoryName}
                    onChange={(e) => setNewSubcategoryName(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter subcategory name"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowAddSubcategoryForm(false);
                      setNewSubcategoryName('');
                      setEditingSubcategory(null);
                    }}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingSubcategory ? handleUpdateSubcategory : handleAddSubcategory}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300"
                  >
                    {editingSubcategory ? 'Update' : 'Add'} Subcategory
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  {subcategories.map((subcategory) => (
                    <div
                      key={subcategory._id}
                      className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                    >
                      <span className="text-gray-300">{subcategory.name}</span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditSubcategory(subcategory)}
                          className="p-1 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors duration-300"
                          title="Edit Subcategory"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(subcategory._id, 'subcategory')}
                          className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors duration-300"
                          title="Delete Subcategory"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setShowAddSubcategoryForm(true)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add New Subcategory</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;