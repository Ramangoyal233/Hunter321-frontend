import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;


  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setDebugInfo('Fetching categories...');
        const response = await axios.get(`${API_BASE_URL}api/categories`);
        setDebugInfo(`Received ${response.data.length} categories`);
       
        setCategories(response.data);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setDebugInfo(`Error: ${err.message}`);
        setError('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zinc-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-8">
          Bug Bounty Categories
        </h1>

        {/* Debug Information */}
        <div className="mb-4 p-4 bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-400">Debug Info: {debugInfo}</p>
          <p className="text-sm text-gray-400">Number of categories: {categories.length}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Categories List */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold mb-4">Categories</h2>
              {categories.length === 0 ? (
                <p className="text-gray-400 text-center">No categories found</p>
              ) : (
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category._id}
                      onClick={() => {
                        setSelectedCategory(category);
                        setSelectedSubcategory(null);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                        selectedCategory?._id === category._id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-800/50 text-gray-300 hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{category.name}</span>
                        <span className="text-sm opacity-75">
                          {category.subcategories?.length || 0} subcategories
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Subcategories and Writeups */}
          <div className="lg:col-span-2">
            {selectedCategory ? (
              <div className="space-y-8">
                {/* Subcategories */}
                <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
                  <h2 className="text-xl font-semibold mb-4">
                    Subcategories in {selectedCategory.name}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedCategory.subcategories?.map((subcategory) => (
                      <button
                        key={subcategory._id}
                        onClick={() => setSelectedSubcategory(subcategory)}
                        className={`p-4 rounded-lg transition-colors ${
                          selectedSubcategory?._id === subcategory._id
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-800/50 text-gray-300 hover:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{subcategory.name}</span>
                          <span className="text-sm opacity-75">
                            {subcategory.writeups?.length || 0} writeups
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Writeups */}
                {selectedSubcategory ? (
                  <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
                    <h2 className="text-xl font-semibold mb-4">
                      Writeups in {selectedSubcategory.name}
                    </h2>
                    <div className="space-y-4">
                      {selectedSubcategory.writeups?.map((writeup) => (
                        <Link
                          key={writeup._id}
                          to={`/writeups/${writeup._id}`}
                          className="block p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                        >
                          <h3 className="text-lg font-medium text-blue-400">
                            {writeup.title}
                          </h3>
                          <p className="text-gray-400 mt-2 line-clamp-2">
                            {writeup.description}
                          </p>
                          <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                            <span>By {writeup.author.username}</span>
                            <span>•</span>
                            <span>
                              {new Date(writeup.createdAt).toLocaleDateString()}
                            </span>
                            <span>•</span>
                            <span>{writeup.difficulty}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
                    <p className="text-gray-400 text-center">
                      Select a subcategory to view its writeups
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
                <p className="text-gray-400 text-center">
                  Select a category to view its subcategories and writeups
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories; 