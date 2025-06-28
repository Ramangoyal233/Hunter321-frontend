import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const AboutPage = () => {
  const resources = [
    {
      title: "Getting Started with Bug Bounty",
      description: "Essential resources to begin your bug bounty journey",
      items: [
        { name: "PortSwigger Web Security Academy", url: "https://portswigger.net/web-security", description: "Free web security training" },
        { name: "OWASP Top 10", url: "https://owasp.org/www-project-top-ten/", description: "Most critical web application security risks" },
        { name: "HackerOne 101", url: "https://www.hackerone.com/for-hackers/how-to-start-hacking", description: "Official HackerOne beginner guide" },
        { name: "Bugcrowd University", url: "https://www.bugcrowd.com/university/", description: "Free security training courses" }
      ]
    },
    {
      title: "Tools & Techniques",
      description: "Essential tools and techniques for security researchers",
      items: [
        { name: "Burp Suite Community", url: "https://portswigger.net/burp/communitydownload", description: "Web application security testing platform" },
        { name: "OWASP ZAP", url: "https://owasp.org/www-project-zap/", description: "Free web application security scanner" },
        { name: "Nmap", url: "https://nmap.org/", description: "Network discovery and security auditing" },
        { name: "Wireshark", url: "https://www.wireshark.org/", description: "Network protocol analyzer" }
      ]
    },
    {
      title: "Learning Platforms",
      description: "Platforms to enhance your security skills",
      items: [
        { name: "TryHackMe", url: "https://tryhackme.com/", description: "Learn cybersecurity through hands-on exercises" },
        { name: "HackTheBox", url: "https://www.hackthebox.com/", description: "Online penetration testing platform" },
        { name: "VulnHub", url: "https://www.vulnhub.com/", description: "Vulnerable machines for practice" },
        { name: "PentesterLab", url: "https://pentesterlab.com/", description: "Web application security training" }
      ]
    },
    {
      title: "Bug Bounty Platforms",
      description: "Popular platforms to find bug bounty programs",
      items: [
        { name: "HackerOne", url: "https://hackerone.com/", description: "Leading bug bounty platform" },
        { name: "Bugcrowd", url: "https://www.bugcrowd.com/", description: "Crowdsourced security platform" },
        { name: "Intigriti", url: "https://www.intigriti.com/", description: "European bug bounty platform" },
        { name: "Synack", url: "https://www.synack.com/", description: "Managed security testing platform" }
      ]
    }
  ];

  const features = [
    {
      icon: "📚",
      title: "Comprehensive Writeups",
      description: "Access detailed writeups from successful bug bounty hunters covering various vulnerability types and exploitation techniques."
    },
    {
      icon: "🎯",
      title: "Beginner-Friendly",
      description: "Specially curated content for newcomers to the bug bounty world with step-by-step explanations and learning paths."
    },
    {
      icon: "🔍",
      title: "Advanced Search",
      description: "Find specific vulnerabilities, tools, or techniques with our powerful search functionality across all writeups."
    },
    {
      icon: "📖",
      title: "Security Books",
      description: "Access a curated collection of security books and resources to deepen your knowledge and skills."
    },
    {
      icon: "👥",
      title: "Community Driven",
      description: "Join a community of security researchers, share your findings, and learn from others' experiences."
    },
    {
      icon: "🚀",
      title: "Stay Updated",
      description: "Get the latest information about new vulnerabilities, tools, and techniques in the security landscape."
    }
  ];

  const stats = [
    { number: "1000+", label: "Writeups" },
    { number: "50+", label: "Categories" },
    { number: "100+", label: "Security Books" },
    { number: "24/7", label: "Access" }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white pt-20 sm:pt-24 pb-8 sm:pb-12">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent leading-tight">
            About BugBounty Hub
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed px-4">
            Your ultimate destination for bug bounty writeups, security resources, and learning materials. 
            Whether you're a beginner or an experienced security researcher, we're here to help you succeed.
          </p>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 mb-12 sm:mb-16"
        >
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-400 mb-1 sm:mb-2">{stat.number}</div>
              <div className="text-xs sm:text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Mission Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-gray-800/50 rounded-xl sm:rounded-2xl p-6 sm:p-8 mb-12 sm:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center">Our Mission</h2>
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
            <div>
              <p className="text-sm sm:text-base md:text-lg text-gray-300 leading-relaxed mb-4 sm:mb-6">
                We believe that cybersecurity knowledge should be accessible to everyone. Our platform serves as a bridge 
                between experienced security researchers and newcomers to the field, fostering a collaborative environment 
                where knowledge is shared freely.
              </p>
              <p className="text-sm sm:text-base md:text-lg text-gray-300 leading-relaxed">
                By providing comprehensive writeups, curated resources, and a supportive community, we aim to help 
                aspiring security researchers develop their skills and contribute to making the internet a safer place.
              </p>
            </div>
            <div className="flex justify-center">
              <div className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                <div className="text-4xl sm:text-5xl md:text-6xl">🛡️</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mb-12 sm:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center">What We Offer</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 + index * 0.1 }}
                className="bg-gray-800/50 rounded-lg sm:rounded-xl p-4 sm:p-6 hover:bg-gray-800/70 transition-all duration-300"
              >
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{feature.icon}</div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">{feature.title}</h3>
                <p className="text-sm sm:text-base text-gray-300 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Resources Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mb-12 sm:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center">Essential Resources for Beginners</h2>
          <div className="space-y-6 sm:space-y-8">
            {resources.map((category, categoryIndex) => (
              <motion.div
                key={categoryIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1 + categoryIndex * 0.1 }}
                className="bg-gray-800/50 rounded-lg sm:rounded-xl p-4 sm:p-6"
              >
                <h3 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-3 text-blue-400">{category.title}</h3>
                <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6">{category.description}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {category.items.map((item, itemIndex) => (
                    <a
                      key={itemIndex}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 sm:p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-all duration-300 border border-gray-600/50 hover:border-blue-500/50"
                    >
                      <div className="font-semibold text-blue-400 mb-1 text-sm sm:text-base">{item.name}</div>
                      <div className="text-xs sm:text-sm text-gray-300">{item.description}</div>
                    </a>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Getting Started Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg sm:rounded-2xl p-6 sm:p-8 mb-12 sm:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center">Ready to Get Started?</h2>
          <div className="text-center">
            <p className="text-sm sm:text-base md:text-lg text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
              Join our community of security researchers and start your bug bounty journey today. 
              Explore our writeups, read security books, and connect with fellow researchers.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <Link
                to="/writeups"
                className="px-6 sm:px-8 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300 inline-block text-center text-sm sm:text-base"
              >
                Browse Writeups
              </Link>
              <Link
                to="/books"
                className="px-6 sm:px-8 py-2.5 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all duration-300 inline-block text-center text-sm sm:text-base"
              >
                Explore Books
              </Link>
              <Link
                to="/signup"
                className="px-6 sm:px-8 py-2.5 sm:py-3 border border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white font-semibold rounded-lg transition-all duration-300 inline-block text-center text-sm sm:text-base"
              >
                Join Community
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="text-center"
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Have Questions?</h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-300 mb-6 sm:mb-8 px-4">
            We're here to help! Reach out to us if you have any questions about the platform, 
            need guidance on getting started, or want to contribute.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <a
              href="mailto:contact@bugbountyhub.com"
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-300 inline-block text-center text-sm sm:text-base"
            >
              Contact Us
            </a>
            <a
              href="https://github.com/bugbountyhub"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-600 text-gray-300 hover:bg-gray-700 font-semibold rounded-lg transition-all duration-300 inline-block text-center text-sm sm:text-base"
            >
              GitHub
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutPage; 