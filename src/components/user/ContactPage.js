import React, { useState } from 'react';
import { motion } from 'framer-motion';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setSubmitStatus(null);
      }, 3000);
    }, 1500);
  };

  const contactMethods = [
    {
      icon: "📧",
      title: "Email Support",
      description: "Get in touch with our support team",
      contact: "support@bugbountyhub.com",
      link: "mailto:support@bugbountyhub.com"
    },
    {
      icon: "💬",
      title: "Discord Community",
      description: "Join our Discord server for real-time help",
      contact: "discord.gg/bugbountyhub",
      link: "https://discord.gg/bugbountyhub"
    },
    {
      icon: "🐛",
      title: "Bug Reports",
      description: "Report platform issues or bugs",
      contact: "bugs@bugbountyhub.com",
      link: "mailto:bugs@bugbountyhub.com"
    },
    {
      icon: "💡",
      title: "Feature Requests",
      description: "Suggest new features or improvements",
      contact: "features@bugbountyhub.com",
      link: "mailto:features@bugbountyhub.com"
    }
  ];

  const faqs = [
    {
      question: "How do I get started with bug bounty hunting?",
      answer: "Start by reading our comprehensive writeups, exploring the resources in our About page, and practicing on platforms like HackerOne, Bugcrowd, or TryHackMe. We recommend beginning with web application security basics."
    },
    {
      question: "Can I contribute writeups to the platform?",
      answer: "Yes! We welcome contributions from the community. You can submit your writeups through your profile page, and our team will review them before publishing."
    },
    {
      question: "Is the platform free to use?",
      answer: "Yes, BugBounty Hub is completely free to use. We believe in making security knowledge accessible to everyone."
    },
    {
      question: "How can I report inappropriate content?",
      answer: "If you find any inappropriate content, please email us at support@bugbountyhub.com with the details, and we'll review it immediately."
    },
    {
      question: "Do you offer mentorship programs?",
      answer: "We're working on launching mentorship programs. Join our Discord community to stay updated on upcoming initiatives and connect with experienced researchers."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white pt-20 sm:pt-24 pb-8 sm:pb-12">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent leading-tight">
            Contact Us
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed px-4">
            Have questions, suggestions, or need help? We're here to assist you. 
            Reach out to us through any of the channels below or use our contact form.
          </p>
        </motion.div>

        {/* Contact Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16"
        >
          {contactMethods.map((method, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 + index * 0.1 }}
              className="bg-gray-800/50 rounded-lg sm:rounded-xl p-4 sm:p-6 text-center hover:bg-gray-800/70 transition-all duration-300"
            >
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{method.icon}</div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">{method.title}</h3>
              <p className="text-xs sm:text-sm text-gray-300 mb-3 sm:mb-4">{method.description}</p>
              <a
                href={method.link}
                target={method.link.startsWith('http') ? '_blank' : '_self'}
                rel={method.link.startsWith('http') ? 'noopener noreferrer' : ''}
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-300 text-sm sm:text-base break-all"
              >
                {method.contact}
              </a>
            </motion.div>
          ))}
        </motion.div>

        {/* Contact Form and FAQ Grid */}
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="bg-gray-800/50 rounded-lg sm:rounded-2xl p-6 sm:p-8"
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Send us a Message</h2>
            
            {submitStatus === 'success' && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-600/20 border border-green-500/50 rounded-lg">
                <p className="text-green-400 text-sm sm:text-base">Thank you for your message! We'll get back to you soon.</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div>
                <label htmlFor="name" className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 transition-colors duration-300 text-sm sm:text-base"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 transition-colors duration-300 text-sm sm:text-base"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 transition-colors duration-300 text-sm sm:text-base"
                  placeholder="What's this about?"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={5}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 transition-colors duration-300 resize-vertical text-sm sm:text-base"
                  placeholder="Tell us more about your inquiry..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 sm:px-8 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center text-sm sm:text-base"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  'Send Message'
                )}
              </button>
            </form>
          </motion.div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Frequently Asked Questions</h2>
            <div className="space-y-4 sm:space-y-6">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 1 + index * 0.1 }}
                  className="bg-gray-800/50 rounded-lg sm:rounded-xl p-4 sm:p-6"
                >
                  <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-blue-400">{faq.question}</h3>
                  <p className="text-sm sm:text-base text-gray-300 leading-relaxed">{faq.answer}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="mt-12 sm:mt-16 text-center"
        >
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg sm:rounded-2xl p-6 sm:p-8">
            <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Join Our Community</h3>
            <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6 max-w-2xl mx-auto px-4">
              Connect with fellow security researchers, share your findings, and stay updated with the latest 
              in cybersecurity. Our community is here to support your journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <a
                href="https://discord.gg/bugbountyhub"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300 inline-block text-center text-sm sm:text-base"
              >
                Join Discord
              </a>
              <a
                href="https://github.com/bugbountyhub"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-600 text-gray-300 hover:bg-gray-700 font-semibold rounded-lg transition-all duration-300 inline-block text-center text-sm sm:text-base"
              >
                Follow on GitHub
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ContactPage; 