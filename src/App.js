import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AdminDashboard from './components/admin/AdminDashboard';
import SearchBar from './components/SearchBar';
import CategoryForm from './components/admin/CategoryForm';
import WriteupForm from './components/admin/WriteupForm';
import AdminEditWriteupPage from './components/admin/AdminEditWriteupPage';
import AdminLogin from './components/admin/AdminLogin';
import CategoriesPage from './components/admin/CategoriesPage';
import WriteupsPage from './components/admin/WriteupsPage';
import UsersPage from './components/admin/UsersPage';
import UserWriteupsPage from './components/user/WriteupsPage';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import Profile from './components/user/Profile';
import Categories from './components/categories/Categories';
import { Toaster } from 'react-hot-toast';
import SettingsPage from './components/admin/SettingsPage';
import axios from 'axios';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import RecentWriteups from './components/user/RecentWriteups';
import HomePage from './components/user/HomePage';
import BooksPage from './components/user/BooksPage';
import AdminBooksPage from './components/admin/AdminBooksPage';
import AdminBooksAnalyticsPage from './components/admin/AdminBooksAnalyticsPage';
import AdminEditBookPage from './components/admin/AdminEditBookPage';
import AdminBookUploadPage from './components/admin/AdminBookUploadPage';
import AdminLoginPage from './components/admin/AdminLogin';
import PrivateRoute from './components/auth/PrivateRoute';
import AdminRoute from './components/auth/AdminRoute';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AboutPage from './components/user/AboutPage';
import ContactPage from './components/user/ContactPage';


const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Maintenance page component with 3D effects and engineer theme
const MaintenancePage = () => {
  const containerRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);

 


  const tasks = [
    "Optimizing database queries...",
    "Updating security protocols...",
    "Enhancing user experience...",
    "Implementing new features...",
    "Running system diagnostics..."
  ];

  useEffect(() => {
    if (!containerRef.current) return;

    // Three.js setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Create circuit board pattern
    const geometry = new THREE.PlaneGeometry(5, 5, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      wireframe: true,
      transparent: true,
      opacity: 0.2
    });
    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    // Create particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 2000;
    const posArray = new Float32Array(particlesCount * 3);

    for(let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 5;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.005,
      color: '#3b82f6',
      transparent: true,
      opacity: 0.8
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    camera.position.z = 2;

    // Animation
    const animate = () => {
      requestAnimationFrame(animate);
      particlesMesh.rotation.x += 0.0005;
      particlesMesh.rotation.y += 0.0005;
      plane.rotation.z += 0.001;
      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Progress and task animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 50);

    const taskInterval = setInterval(() => {
      setCurrentTask(prev => (prev + 1) % tasks.length);
    }, 3000);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(progressInterval);
      clearInterval(taskInterval);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      <div ref={containerRef} className="absolute inset-0" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 flex items-center justify-center min-h-screen p-4"
      >
        <div className="w-full max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center ">
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20 
              }}
              className="relative inline-block"
            >
              <h1 className="text-6xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                Site Maintenance
              </h1>
              <motion.div
                className="absolute -top-4 -right-4 w-8 h-8"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center space-x-4"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-3 h-3 bg-green-500 rounded-full"
              />
              <span className="text-green-500 font-mono text-lg">System Status: Active</span>
            </motion.div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Left Column - Current Task */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-2 bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700"
            >
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Current Task
              </h2>
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentTask}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="text-2xl text-gray-300 font-mono"
                >
                  {tasks[currentTask]}
                </motion.p>
              </AnimatePresence>
              <div className="mt-6">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <motion.div 
                  className="w-full bg-gray-700 rounded-full h-2 overflow-hidden"
                >
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </motion.div>
              </div>
            </motion.div>

            {/* Right Column - System Metrics */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700"
            >
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                System Metrics
              </h2>
              <div className="space-y-4">
                {['CPU', 'Memory', 'Network'].map((metric, index) => (
                  <motion.div
                    key={metric}
                    className="bg-gray-700/50 p-4 rounded-lg"
                    whileHover={{ scale: 1.02 }}
                    onHoverStart={() => setShowTooltip(true)}
                    onHoverEnd={() => setShowTooltip(false)}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300 font-mono">{metric}</span>
                      <span className="text-white font-mono">
                        {Math.floor(Math.random() * 100)}%
                      </span>
                    </div>
                    <motion.div
                      className="h-1.5 bg-gray-600 rounded-full overflow-hidden"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                    >
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.random() * 100}%` }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Footer Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center"
          >
            <div className="inline-flex items-center space-x-2 bg-gray-800/50 backdrop-blur-lg px-6 py-3 rounded-full">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
              <span className="text-gray-300 font-mono">System Active</span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

// Create a wrapper component to access location
const AppContent = () => {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const { user, isAuthenticated, loading, logout } = useAuth();


  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/settings/public`);
        setIsMaintenanceMode(response.data.maintenanceMode);
      } catch (error) {
        if (error.response?.status === 503) {
          setIsMaintenanceMode(true);
        }
      }
    };

    checkMaintenanceMode();
  }, []);

  // Add axios interceptor to handle maintenance mode
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 503 && error.response?.data?.maintenanceMode) {
          setIsMaintenanceMode(true);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const maxScroll = 300;
      const progress = Math.min(scrollPosition / maxScroll, 1);
      setScrollProgress(progress);
      setIsScrolled(scrollPosition > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getHeaderStyle = () => {
    const baseColor = `rgba(0, 0, 0, ${0.7 + scrollProgress * 0.2})`;
    const accentColor = `rgba(59, 130, 246, ${0.05 + scrollProgress * 0.15})`;
    const borderColor = `rgba(59, 130, 246, ${0.1 + scrollProgress * 0.2})`;
    const shadowColor = `rgba(59, 130, 246, ${0.05 + scrollProgress * 0.15})`;
    const blurAmount = `${8 + scrollProgress * 12}px`;

    return {
      background: `linear-gradient(to right, ${baseColor}, ${accentColor})`,
      borderColor: borderColor,
      boxShadow: `0 0 20px ${shadowColor}`,
      backdropFilter: `blur(${blurAmount})`,
      WebkitBackdropFilter: `blur(${blurAmount})`,
    };
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Check if current route is login page
  const isLoginPage = location.pathname === '/admin/login';
  const isAuthPage = location.pathname === '/signin' || location.pathname === '/signup';

  // Check if current route is admin route or admin login
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAdminLoginPage = location.pathname === '/admin/login';

  // Regular user navigation links
  const regularNavLinks = [
    { name: 'Writeups', path: '/writeups' },
    { name: 'Books', path: '/books' },
    { name: 'Profile', path: '/profile' },
    { name: 'Contact', path: '/contact' },
    { name: 'AboutUs', path: '/about-us' }
  ];
  
  // Admin navigation links
  const adminNavLinks = [
    { name: 'Dashboard', path: '/admin' },
    { name: 'Categories', path: '/admin/categories' },
    { name: 'Writeups', path: '/admin/writeups' },
    { name: 'Books', path: '/admin/books' },
    { name: 'Users', path: '/admin/users' },
    { name: 'Settings', path: '/admin/settings' }
  ];

  // Get current navigation links based on user role
  const getNavLinks = () => {
    if (user?.role === 'admin') {
      return adminNavLinks;
    }
    return regularNavLinks;
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  // If in maintenance mode and not admin, show maintenance page
  // But allow access to admin routes and admin login if user is admin or on admin login page
  if (isMaintenanceMode && user?.role !== 'admin' && !isAdminRoute && !isAdminLoginPage) {
    return <MaintenancePage />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white relative">
      {/* Main Content */}
      <div className="relative z-20 min-h-screen">
        {/* Header - Always visible */}
        <div className="fixed top-0 left-1/2 transform -translate-x-1/2 z-50 w-[90%] sm:w-[80%] max-w-5xl mt-4">
          <div 
            className="transition-all duration-300 rounded-[2rem] px-4 sm:px-8 py-2.5 flex items-center gap-4 border-2 transform-gpu mobile-header-3d"
            style={{
              ...getHeaderStyle(),
              transform: isScrolled ? 'translateY(0) scale(1.02)' : 'translateY(0) scale(1)',
              boxShadow: isScrolled 
                ? '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 30px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
                : '0 10px 30px rgba(0, 0, 0, 0.2), 0 0 20px rgba(59, 130, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            }}
          >
            {/* Logo Section */}
            <Link to={user?.role === 'admin' ? "/admin" : "/"} className="flex items-center group pl-[13px]">
              <span className={`text-sm sm:text-base font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent group-hover:from-blue-500 group-hover:to-purple-600 transition-all duration-300 whitespace-nowrap transform-gpu ${
                isScrolled ? 'text-shadow-glow scale-105' : 'scale-100'
              }`}>
                BugBounty Hub
              </span>
            </Link>

            {/* Divider after Logo (Desktop) */}
            <div className={`h-6 w-px transition-all duration-300 hidden md:block ${isScrolled ? 'bg-gradient-to-b from-blue-500/50 to-transparent' : 'bg-gradient-to-b from-gray-700 to-transparent'}`}></div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-4">
              {getNavLinks().map((item) => (
                <Link 
                  key={item.name}
                  to={item.path}
                  className={`text-gray-300 hover:text-white transition-all duration-300 text-sm font-medium tracking-wide transform-gpu hover:scale-105 ${isScrolled ? 'hover:text-blue-400' : ''}`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Divider before Search (Desktop) */}
            <div className={`h-6 w-px transition-all duration-300 hidden md:block ml-auto ${isScrolled ? 'bg-gradient-to-b from-blue-500/50 to-transparent' : 'bg-gradient-to-b from-gray-700 to-transparent'}`}></div>

            {/* Search Section - Fixed Width (Desktop) */}
            {user?.role !== 'admin' && (
              <div className="hidden md:block w-56">
                <SearchBar />
              </div>
            )}

            {/* User/Admin Section */}
            {isAuthenticated ? (
              <>
                {/* Divider before User/Admin Section */}
                <div className={`h-6 w-px transition-all duration-300 hidden md:block ${isScrolled ? 'bg-gradient-to-b from-blue-500/50 to-transparent' : 'bg-gradient-to-b from-gray-700 to-transparent'}`}></div>

                {/* User/Admin Profile and Logout */}
                <div className="hidden md:flex items-center gap-4">
                  <div className="flex items-center gap-2 transform-gpu hover:scale-105 transition-transform duration-300">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shadow-lg shadow-blue-500/20">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-300">{user?.role === 'admin' ? 'Admin' : user?.username}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 text-sm font-medium text-red-400 hover:text-red-300 transition-all duration-300 border border-red-400/20 hover:border-red-400/40 rounded-lg transform-gpu hover:scale-105 hover:shadow-lg hover:shadow-red-500/20"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Divider before Login Section */}
                <div className={`h-6 w-px transition-all duration-300 hidden md:block ${isScrolled ? 'bg-gradient-to-b from-blue-500/50 to-transparent' : 'bg-gradient-to-b from-gray-700 to-transparent'}`}></div>

                {/* Login Button */}
                <div className="hidden md:flex items-center gap-4">
                  <Link
                    to="/signin"
                    className="px-4 py-1.5 text-sm font-medium text-blue-400 hover:text-blue-300 transition-all duration-300 border border-blue-400/20 hover:border-blue-400/40 rounded-lg transform-gpu hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20"
                  >
                    Login
                  </Link>
                </div>
              </>
            )}

            {/* Mobile Menu Button - Enhanced 3D */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 pl-[131px] text-gray-300 hover:text-white focus:outline-none transform-gpu transition-all duration-300 hover:scale-110 active:scale-95 mobile-button-pulse"
              aria-label="Toggle menu"
              style={{
                transform: isMobileMenuOpen ? 'rotate(90deg) scale(1.1)' : 'rotate(0deg) scale(1)',
                filter: isMobileMenuOpen ? 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))' : 'none'
              }}
            >
              <svg
                className="w-6 h-6 transition-all duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu - Enhanced 3D */}
          <div
            className={`md:hidden absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden transition-all duration-500 transform-gpu glass-effect neon-glow ${
              isMobileMenuOpen 
                ? 'opacity-100 translate-y-0 scale-100 rotate-x-0' 
                : 'opacity-0 -translate-y-4 scale-95 rotate-x-12 pointer-events-none'
            }`}
            style={{
              ...getHeaderStyle(),
              transform: isMobileMenuOpen 
                ? 'perspective(1000px) rotateX(0deg) translateY(0) scale(1)' 
                : 'perspective(1000px) rotateX(12deg) translateY(-16px) scale(0.95)',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4), 0 0 40px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)'
            }}
          >
            <div className="p-6 space-y-6 relative">
              {/* 3D Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-transparent"></div>
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]"></div>
              </div>
              
              {/* Mobile Search Bar */}
              {user?.role !== 'admin' && (
                <div className="block md:hidden w-full relative z-10">
                  <div className="transform-gpu hover:scale-105 transition-transform duration-300">
                    <SearchBar />
                  </div>
                </div>
              )}
              
              {/* Mobile Navigation Links */}
              <div className="relative z-10 space-y-2">
                {getNavLinks().map((item, index) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className="block text-gray-300 hover:text-white transition-all duration-300 text-base font-medium tracking-wide py-3 px-4 rounded-xl transform-gpu hover:scale-105 hover:bg-white/5 hover:shadow-lg hover:shadow-blue-500/10 border border-transparent hover:border-blue-500/20 mobile-nav-item"
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{
                      animationDelay: `${index * 100}ms`,
                      transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(-20px)',
                      opacity: isMobileMenuOpen ? 1 : 0
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span>{item.name}</span>
                      <svg className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Mobile User/Admin Section */}
              {isAuthenticated && (
                <div className="pt-6 border-t border-gray-700/50 relative z-10">
                  <div className="flex items-center gap-4 mb-4 p-4 rounded-xl bg-white/5 border border-white/10 transform-gpu hover:scale-105 transition-all duration-300">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-500/20">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-300">{user?.role === 'admin' ? 'Admin' : user?.username}</span>
                      <div className="text-xs text-gray-500">{user?.role === 'admin' ? 'Administrator' : 'User'}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 text-red-400 hover:text-red-300 transition-all duration-300 border border-red-400/20 hover:border-red-400/40 rounded-xl transform-gpu hover:scale-105 hover:shadow-lg hover:shadow-red-500/20 bg-red-500/5 hover:bg-red-500/10"
                  >
                    <div className="flex items-center justify-between">
                      <span>Logout</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        

        <style>{`
          .text-shadow-glow {
            text-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
          }
          
          /* 3D Mobile Header Enhancements */
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotateX(0deg); }
            50% { transform: translateY(-5px) rotateX(2deg); }
          }
          
          @keyframes glow {
            0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
            50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.6), 0 0 40px rgba(147, 51, 234, 0.4); }
          }
          
          @keyframes slideInFromLeft {
            from {
              opacity: 0;
              transform: translateX(-30px) scale(0.9);
            }
            to {
              opacity: 1;
              transform: translateX(0) scale(1);
            }
          }
          
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          
          .mobile-header-3d {
            animation: float 6s ease-in-out infinite;
          }
          
          .mobile-menu-glow {
            animation: glow 3s ease-in-out infinite;
          }
          
          .mobile-nav-item {
            animation: slideInFromLeft 0.5s ease-out forwards;
          }
          
          .mobile-button-pulse {
            animation: pulse 2s ease-in-out infinite;
          }
          
          /* Enhanced 3D transforms */
          .transform-3d {
            transform-style: preserve-3d;
            perspective: 1000px;
          }
          
          .rotate-x-12 {
            transform: rotateX(12deg);
          }
          
          .rotate-x-0 {
            transform: rotateX(0deg);
          }
          
          /* Glass morphism effect */
          .glass-effect {
            background: rgba(17, 24, 39, 0.8);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          /* Neon glow effect */
          .neon-glow {
            box-shadow: 
              0 0 5px rgba(59, 130, 246, 0.5),
              0 0 10px rgba(59, 130, 246, 0.3),
              0 0 15px rgba(59, 130, 246, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
          }
        `}</style>

        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          <Route path="/admin/categories" element={
            <AdminRoute>
              <CategoriesPage />
            </AdminRoute>
          } />
          <Route path="/admin/writeups" element={
            <AdminRoute>
              <WriteupsPage />
            </AdminRoute>
          } />
          <Route path="/admin/users" element={
            <AdminRoute>
              <UsersPage />
            </AdminRoute>
          } />
          <Route path="/admin/books/upload" element={
            <AdminRoute>
              <AdminBookUploadPage />
            </AdminRoute>
          } />
          <Route path="/admin/books" element={
            <AdminRoute>
              <AdminBooksAnalyticsPage />
            </AdminRoute>
          } />
          <Route path="/admin/books/edit/:id" element={
            <AdminRoute>
              <AdminEditBookPage />
            </AdminRoute>
          } />
          <Route path="/admin/settings" element={
            <AdminRoute>
              <SettingsPage />
            </AdminRoute>
          } />
          <Route path="/admin/categories/new" element={
            <AdminRoute>
              <CategoryForm />
            </AdminRoute>
          } />
          <Route path="/admin/categories/edit/:id" element={
            <AdminRoute>
              <CategoryForm />
            </AdminRoute>
          } />
          <Route path="/admin/writeups/new" element={
            <AdminRoute>
              <WriteupForm />
            </AdminRoute>
          } />
          <Route path="/admin/writeups/edit/:id" element={
            <AdminRoute>
              <AdminEditWriteupPage />
            </AdminRoute>
          } />
          <Route path="/writeups" element={
            <PrivateRoute>
              <UserWriteupsPage />
            </PrivateRoute>
          } />
          <Route path="/profile" element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          } />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/about-us" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>

        {/* Footer - Only show if not on login, auth pages, or WriteupForm */}
        {!isLoginPage && !isAuthPage && !location.pathname.includes('/admin/writeups') && (
          <footer className="bg-zinc-900 border-t border-zinc-800 text-zinc-300 py-12">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {/* Logo and Description */}
                <div>
                  <h3 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">BugBounty</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">A community-driven platform for security researchers and bug bounty hunters to share and learn from findings.</p>
                </div>
                {/* Quick Links */}
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-white">Quick Links</h4>
                  <ul className="space-y-3 text-zinc-400">
                    <li><Link to="/about-us" className="hover:text-white transition-colors duration-200">About Us</Link></li>
                    <li><Link to="/contact" className="hover:text-white transition-colors duration-200">Contact</Link></li>
                    <li><Link to="/terms" className="hover:text-white transition-colors duration-200">Terms of Service</Link></li>
                    <li><Link to="/privacy" className="hover:text-white transition-colors duration-200">Privacy Policy</Link></li>
                  </ul>
                </div>
                {/* Connect Links */}
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-white">Connect</h4>
                  <div className="flex space-x-6">
                    <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-blue-400 transition-colors duration-200">Twitter</a>
                    <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-purple-400 transition-colors duration-200">GitHub</a>
                    <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-pink-400 transition-colors duration-200">Discord</a>
                  </div>
                </div>
              </div>
              {/* Copyright */}
              <div className="mt-12 pt-8 border-t border-zinc-800 text-center text-zinc-500 text-sm">
                &copy; {new Date().getFullYear()} BugBounty. All rights reserved.
              </div>
            </div>
          </footer>
        )}
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

// Main App component
const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
        <Toaster position="top-right" />
      </AuthProvider>
    </Router>
  );
};

export default App;
