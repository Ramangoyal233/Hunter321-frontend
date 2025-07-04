import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useMotionValue, animate } from 'framer-motion';
import axios from 'axios';
import RecentWriteups from './RecentWriteups';
import * as THREE from 'three';

const AnimatedCounter = ({ from, to }) => {
  const count = useMotionValue(from);
  const rounded = useTransform(count, Math.round);

  useEffect(() => {
   
    const controls = animate(count, to, { duration: 1 });
    return controls.stop;
  }, [from, to, count]);

  return <motion.h3 className="text-3xl font-bold text-white mb-2">{rounded}</motion.h3>;
};

const HomePage = () => {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const [stats, setStats] = useState({
    totalWriteups: 0,
    totalCategories: 0,
    totalUsers: 0,
    totalReads: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  // Modal for error
  const [showErrorModal, setShowErrorModal] = useState(false);
  useEffect(() => {
    if (error) setShowErrorModal(true);
  }, [error]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/stats`);
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
        if (error.response) {
          // Server responded with a status other than 2xx
          if (error.response.status === 404) {
            setError('Statistics not found (404).');
          } else if (error.response.status === 500) {
            setError('A server error occurred (500). Please try again later.');
          } else {
            setError(`Error: ${error.response.status} ${error.response.statusText}`);
          }
        } else if (error.request) {
          // Request was made but no response received
          setError('Network error: Unable to reach the server. Please check your connection.');
        } else {
          // Something else happened
          setError('An unexpected error occurred. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Three.js setup for 3D background
  useEffect(() => {
    if (loading || !containerRef.current) {
      if (loading) {
    
      } else if (!containerRef.current) {
        console.warn("Three.js container ref is not available after loading.");
      }
      return;
    }

    let scene, camera, renderer, starField, planets = [], pointLight1, pointLight2;
    let particlesGeometry, particlesMaterial; // Declare here
    let animationFrameId;
    let handleMouseMove, handleResize;
    let initTimeoutId;
    let starGeometry, starMaterial;
    let asteroidBelt = []; // New array to hold asteroid meshes

    try {
      // Scene setup
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance"
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      containerRef.current.appendChild(renderer.domElement);

      // Create starfield
      starGeometry = new THREE.BufferGeometry(); // Assign here
      const starCount = 2000;
      const starPositions = new Float32Array(starCount * 3);
      const starSizes = new Float32Array(starCount);

      for (let i = 0; i < starCount * 3; i += 3) {
        // Random positions in a sphere
        const radius = 50;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        starPositions[i] = radius * Math.sin(phi) * Math.cos(theta);
        starPositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
        starPositions[i + 2] = radius * Math.cos(phi);
        
        starSizes[i / 3] = Math.random() * 2;
      }

      starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
      starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));

      starMaterial = new THREE.PointsMaterial({ // Assign here
        size: 0.1,
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending
      });

      starField = new THREE.Points(starGeometry, starMaterial);
      scene.add(starField);

      // Create asteroid belt
      const asteroidCount = 1000; // Number of asteroids
      const asteroidMinRadius = 8; // Inner radius of the belt
      const asteroidMaxRadius = 12; // Outer radius of the belt
      const asteroidHeight = 1; // Spread of the belt along Y-axis
      const asteroidSize = 0.05; // Base size of asteroids

      for (let i = 0; i < asteroidCount; i++) {
        const geometry = new THREE.SphereGeometry(asteroidSize * (Math.random() * 0.8 + 0.6), 8, 8); // Randomize size slightly
        const material = new THREE.MeshPhongMaterial({ color: 0x888888, shininess: 30 });

        const asteroid = new THREE.Mesh(geometry, material);

        // Random position in a ring shape
        const angle = Math.random() * Math.PI * 2;
        const radius = asteroidMinRadius + Math.random() * (asteroidMaxRadius - asteroidMinRadius);
        asteroid.position.x = Math.cos(angle) * radius;
        asteroid.position.z = Math.sin(angle) * radius;
        asteroid.position.y = (Math.random() - 0.5) * asteroidHeight;

        // Random rotation
        asteroid.rotation.x = Math.random() * Math.PI * 2;
        asteroid.rotation.y = Math.random() * Math.PI * 2;
        asteroid.rotation.z = Math.random() * Math.PI * 2;

        // Store initial rotation for animation
        asteroid.userData.rotationSpeed = new THREE.Vector3(
          (Math.random() - 0.5) * 0.005,
          (Math.random() - 0.5) * 0.005,
          (Math.random() - 0.5) * 0.005
        );
        asteroid.userData.orbitSpeed = Math.random() * 0.0001 + 0.00005; // Slower orbital speed
        asteroid.userData.orbitRadius = radius;
        asteroid.userData.orbitAngle = angle;

        asteroidBelt.push(asteroid);
        scene.add(asteroid);
      }

      // Create planets
      const planetCount = 3;
      const planetTextures = [
        process.env.PUBLIC_URL + '/textures/planets/2k_earth_daymap.jpg',
        process.env.PUBLIC_URL + '/textures/planets/2k_mars.jpg',
        process.env.PUBLIC_URL + '/textures/planets/2k_jupiter.jpg'
      ];

      const textureLoader = new THREE.TextureLoader();
      
      for (let i = 0; i < planetCount; i++) {
        const geometry = new THREE.SphereGeometry(0.5 + i * 0.2, 32, 32);
        const material = new THREE.MeshPhongMaterial({
          map: textureLoader.load(planetTextures[i]),
          bumpScale: 0.05,
          specular: new THREE.Color(0x333333),
          shininess: 5
        });

        const planet = new THREE.Mesh(geometry, material);
        
        // Position planets in a circular orbit
        const angle = (i / planetCount) * Math.PI * 2;
        const radius = 3 + i * 0.5;
        planet.position.x = Math.cos(angle) * radius;
        planet.position.z = Math.sin(angle) * radius;
        planet.position.y = (Math.random() - 0.5) * 2;

        planets.push(planet);
        scene.add(planet);
      }

      // Add ambient light
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);

      // Add point lights
      pointLight1 = new THREE.PointLight(0x4F46E5, 1);
      pointLight1.position.set(2, 2, 2);
      scene.add(pointLight1);

      pointLight2 = new THREE.PointLight(0xEC4899, 1);
      pointLight2.position.set(-2, -2, -2);
      scene.add(pointLight2);

      // Position camera
      camera.position.z = 5;

      // Mouse movement effect
      let mouseX = 0;
      let mouseY = 0;
      let targetX = 0;
      let targetY = 0;

      handleMouseMove = (event) => {
        mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
      };

      window.addEventListener('mousemove', handleMouseMove);

      // Animation
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);

        // Smooth mouse movement
        targetX = mouseX * 0.001;
        targetY = mouseY * 0.001;

        // Update starfield
        starField.rotation.y += 0.0001;
        starField.rotation.x += 0.0001;

        // Update asteroid belt
        asteroidBelt.forEach(asteroid => {
          // Self-rotation
          asteroid.rotation.x += asteroid.userData.rotationSpeed.x;
          asteroid.rotation.y += asteroid.userData.rotationSpeed.y;
          asteroid.rotation.z += asteroid.userData.rotationSpeed.z;

          // Orbital rotation around the center
          asteroid.userData.orbitAngle += asteroid.userData.orbitSpeed;
          asteroid.position.x = Math.cos(asteroid.userData.orbitAngle) * asteroid.userData.orbitRadius;
          asteroid.position.z = Math.sin(asteroid.userData.orbitAngle) * asteroid.userData.orbitRadius;
        });

        // Update planets
        planets.forEach((planet, index) => {
          planet.rotation.y += 0.002 * (index + 1);
          planet.rotation.x += 0.001 * (index + 1);
          
          // Orbit movement
          const time = Date.now() * 0.0001;
          const radius = 3 + index * 0.5;
          planet.position.x = Math.cos(time + index) * radius;
          planet.position.z = Math.sin(time + index) * radius;
          
          // Update glow effect
          if (planet.children[0] && planet.children[0].material) planet.children[0].material.dispose();
        });

        // Update lights
        pointLight1.position.x = Math.sin(Date.now() * 0.001) * 3;
        pointLight1.position.z = Math.cos(Date.now() * 0.001) * 3;

        pointLight2.position.x = Math.sin(Date.now() * 0.001 + Math.PI) * 3;
        pointLight2.position.z = Math.cos(Date.now() * 0.001 + Math.PI) * 3;

        renderer.render(scene, camera);
      };

      animate();

      // Handle resize
      handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      };

      window.addEventListener('resize', handleResize);
    } catch (e) {
      console.error("Error initializing Three.js:", e);
    }

    // Cleanup
    return () => {
      clearTimeout(initTimeoutId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (containerRef.current && renderer && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      if (scene) {
        scene.remove(starField);
        planets.forEach(planet => {
          scene.remove(planet);
          if (planet.geometry) planet.geometry.dispose();
          if (planet.material) planet.material.dispose();
        });
        if (starGeometry) starGeometry.dispose();
        if (starMaterial) starMaterial.dispose();
        asteroidBelt.forEach(asteroid => {
          if (asteroid.geometry) asteroid.geometry.dispose();
          if (asteroid.material) asteroid.material.dispose();
        });
      }
      if (renderer) renderer.dispose();
    };
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zinc-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative">
      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 px-4">
          <div className="bg-zinc-900 rounded-2xl shadow-xl border border-zinc-800 p-8 max-w-md w-full flex flex-col items-center animate-fadeIn">
            <svg className="w-20 h-20 text-red-500 mb-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-white mb-2 text-center">Something went wrong</h2>
            <p className="text-zinc-400 mb-6 text-center">{error || "We couldn't load the page. Please try again later."}</p>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-medium text-lg"
              >
                Retry
              </button>
              <button
                onClick={() => setShowErrorModal(false)}
                className="w-full px-6 py-3 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 border border-zinc-700 transition-all font-medium text-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Hero Section */}
      <section className="relative min-h-screen overflow-hidden bg-black">
        {/* 3D Background */}
        <div ref={containerRef} className="absolute inset-0 z-0" />
        
        {/* Content */}
        <div className="container mx-auto px-4 relative z-20 min-h-screen flex items-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl mx-auto text-center py-20 md:py-32 lg:py-48"
          >
            {/* Animated Title */}
            <motion.h1 
              className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                BugBounty Writeups
              </span>
            </motion.h1>

            {/* Animated Description */}
            <motion.p 
              className="text-lg md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              Discover, learn, and share your knowledge with the cybersecurity community.
              Explore our collection of BugBounty writeups and enhance your skills.
            </motion.p>

            {/* Animated Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row justify-center gap-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <Link
                to="/writeups"
                className="group relative inline-flex items-center justify-center px-8 py-4 font-medium tracking-wide text-white transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none"
              >
                {/* Animated gradient background */}
                <span className="absolute inset-0 w-full h-full transition duration-300 ease-out transform translate-x-1 translate-y-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 group-hover:-translate-x-0 group-hover:-translate-y-0"></span>
                
                {/* Glowing effect */}
                <span className="absolute inset-0 w-full h-full bg-black border-2 border-gray-800 group-hover:border-blue-500/50 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-300"></span>
                
                {/* Button content */}
                <span className="relative flex items-center gap-3">
                  <span className="text-lg font-semibold tracking-wide">Browse Writeups</span>
                  <svg className="w-5 h-5 transition-all duration-300 group-hover:translate-x-1 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>

              <Link
                to="/signup"
                className="group relative inline-flex items-center justify-center px-8 py-4 font-medium tracking-wide text-white transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none"
              >
                {/* Animated gradient background */}
                <span className="absolute inset-0 w-full h-full transition duration-300 ease-out transform translate-x-1 translate-y-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 group-hover:-translate-x-0 group-hover:-translate-y-0"></span>
                
                {/* Glowing effect */}
                <span className="absolute inset-0 w-full h-full bg-black border-2 border-gray-800 group-hover:border-purple-500/50 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all duration-300"></span>
                
                {/* Button content */}
                <span className="relative flex items-center gap-3">
                  <span className="text-lg font-semibold tracking-wide">Join Community</span>
                  <svg className="w-5 h-5 transition-all duration-300 group-hover:translate-x-1 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </span>
              </Link>
            </motion.div>

            {/* Scroll Indicator */}
            <motion.div 
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
            >
              <div className="flex flex-col items-center">
                <span className="text-gray-400 text-sm mb-2">Scroll to explore</span>
                <motion.div
                  animate={{
                    y: [0, 10, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                >
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-zinc-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-zinc-800 rounded-xl p-6 text-center"
            >
              <motion.h3 className="text-3xl font-bold text-white mb-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>250+</motion.h3>
              <p className="text-gray-400">Total Writeups</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-zinc-800 rounded-xl p-6 text-center"
            >
              <motion.h3 className="text-3xl font-bold text-white mb-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>20+</motion.h3>
              <p className="text-gray-400">Categories</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-zinc-800 rounded-xl p-6 text-center"
            >
              <motion.h3 className="text-3xl font-bold text-white mb-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>500+</motion.h3>
              <p className="text-gray-400">Active Users</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-zinc-800 rounded-xl p-6 text-center"
            >
              <motion.h3 className="text-3xl font-bold text-white mb-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>10,000+</motion.h3>
              <p className="text-gray-400">Total Reads</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Recent Writeups Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <RecentWriteups />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-zinc-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Why Choose Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-zinc-800 rounded-xl p-6"
            >
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Quality Writeups</h3>
              <p className="text-gray-400">
                Access high-quality writeups from experienced security researchers and CTF players.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-zinc-800 rounded-xl p-6"
            >
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Active Community</h3>
              <p className="text-gray-400">
                Join a vibrant community of security enthusiasts and share your knowledge.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-zinc-800 rounded-xl p-6"
            >
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM3 10h4m-4 4h4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Comprehensive Search & Filtering</h3>
              <p className="text-gray-400">
                Easily find specific writeups with powerful search and advanced filtering options.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-zinc-800 rounded-xl p-6"
            >
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.117A9.955 9.955 0 0112 4c4.97 0 9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Community Discussions</h3>
              <p className="text-gray-400">
                Engage with fellow enthusiasts, ask questions, and share insights in our active forums.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-zinc-800 rounded-xl p-6"
            >
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Bookmark & Save Progress</h3>
              <p className="text-gray-400">
                Save your favorite writeups and track your reading progress for a seamless experience.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-zinc-800 rounded-xl p-6"
            >
              <div className="w-12 h-12 bg-teal-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 4v2m0 4v2m-6 0H6m6 0h6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Bounty Tracking</h3>
              <p className="text-gray-400">
                Track your bounty submissions and see the real-world impact of your writeups.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
            <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
              Join our community today and start exploring, learning, and sharing your knowledge
              with fellow security enthusiasts.
            </p>
            <div className="flex justify-center gap-4">
              <Link
                to="/signup"
                className="bg-white text-blue-500 hover:bg-blue-50 px-8 py-3 rounded-lg font-medium transition-colors"
              >
                Sign Up Now
              </Link>
              <Link
                to="/writeups"
                className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-8 py-3 rounded-lg font-medium transition-colors"
              >
                Browse Writeups
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 