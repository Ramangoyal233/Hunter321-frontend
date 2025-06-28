import axios from 'axios';

const API_URL = 'http://192.168.29.240:5001/api/admin'; // Base URL for admin API endpoints

const getToken = () => {
  return localStorage.getItem('token');
};

const getAuthHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchCategories = async () => {
  const headers = getAuthHeaders();
  if (!headers.Authorization) {
    throw new Error('No token found');
  }
  const response = await axios.get(`${API_URL}/categories`, { headers });
  return response.data;
};

export const fetchWriteups = async () => {
  const headers = getAuthHeaders();
   if (!headers.Authorization) {
    throw new Error('No token found');
  }
  const response = await axios.get(`${API_URL}/writeups`, { headers });
  return response.data;
};

export const deleteCategory = async (id) => {
  const headers = getAuthHeaders();
   if (!headers.Authorization) {
    throw new Error('No token found');
  }
  const response = await axios.delete(`${API_URL}/categories/${id}`, { headers });
  return response.data;
};

export const deleteWriteup = async (id) => {
  const headers = getAuthHeaders();
   if (!headers.Authorization) {
    throw new Error('No token found');
  }
  const response = await axios.delete(`${API_URL}/writeups/${id}`, { headers });
  return response.data;
};

export const fetchSubcategories = async (categoryId) => {
  const headers = getAuthHeaders();
  if (!headers.Authorization) {
    throw new Error('No token found');
  }
  const response = await axios.get(`${API_URL}/categories/${categoryId}/subcategories`, { headers });
  return response.data;
};

export const createSubcategory = async (categoryId, subcategoryData) => {
  const headers = getAuthHeaders();
  if (!headers.Authorization) {
    throw new Error('No token found');
  }
  const response = await axios.post(`${API_URL}/categories/${categoryId}/subcategories`, subcategoryData, { headers });
  return response.data;
};

export const fetchCategory = async (id) => {
  const headers = getAuthHeaders();
  if (!headers.Authorization) {
    throw new Error('No token found');
  }
  const response = await axios.get(`${API_URL}/categories/${id}`, { headers });
  return response.data;
};

export const updateSubcategory = async (categoryId, subcategoryId, subcategoryData) => {
  const headers = getAuthHeaders();
  if (!headers.Authorization) {
    throw new Error('No token found');
  }
  const response = await axios.put(`${API_URL}/categories/${categoryId}/subcategories/${subcategoryId}`, subcategoryData, { headers });
  return response.data;
};

export const deleteSubcategory = async (categoryId, subcategoryId) => {
  const headers = getAuthHeaders();
  if (!headers.Authorization) {
    throw new Error('No token found');
  }
  const response = await axios.delete(`${API_URL}/categories/${categoryId}/subcategories/${subcategoryId}`, { headers });
  return response.data;
}; 