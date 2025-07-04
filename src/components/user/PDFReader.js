import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import { FaArrowLeft, FaArrowRight, FaSearchPlus, FaSearchMinus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { formatReadingTime } from './BooksPage';

// Set up PDF.js worker - only once
const workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Helper function to get full URL for images
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  // Otherwise, prepend the API base URL
  return `${API_BASE_URL}${imagePath}`;
};

const PDFReader = ({ bookId, onPageChange, currentPage: initialPage = 1, onClose, onTotalPages, onProgressUpdate }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [manualScaleFactor, setManualScaleFactor] = useState(1.0); // User-controlled zoom multiplier
  const [currentRenderScale, setCurrentRenderScale] = useState(1.0); // Actual scale used for rendering, including responsive fit
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pdfDocument, setPdfDocument] = useState(null); // State to store the PDF document
  const [showBlankPageWarning, setShowBlankPageWarning] = useState(false); // State for blank page warning
  const [isFirstPageBlank, setIsFirstPageBlank] = useState(false); // State to track if first page is blank
  const [blankPages, setBlankPages] = useState({}); // State to track blank pages for all pages
  const [currentBlankPage, setCurrentBlankPage] = useState(null); // State to track current blank page
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const viewerRef = useRef(null); // Ref for the viewer container to get its dimensions
  const renderTaskRef = useRef(null); // Ref to store the current render task
  const [pdfRendering, setPdfRendering] = useState(false); // New state to prevent multiple renders
  const renderTimeoutRef = useRef(null); // Ref to store the timeout for debouncing renders
  const pdfDataRef = useRef(null); // Store PDF data to prevent recreation
  const [isSessionActive, setIsSessionActive] = useState(false);
  const sessionTimeoutRef = useRef(null);
  const [readingStats, setReadingStats] = useState({
    totalReadingTime: 0,
    totalPagesRead: 0,
    lastReadPage: 1
  });
  const sessionStartTimeRef = useRef(null);
  
  // Frontend calculation state
  const [accumulatedTime, setAccumulatedTime] = useState(0);
  const [accumulatedPages, setAccumulatedPages] = useState(0);
  const [lastPageUpdate, setLastPageUpdate] = useState(null);
  const [lastPage, setLastPage] = useState(initialPage);
  const [lastActivityTime, setLastActivityTime] = useState(null);

  // Use refs to track session state for immediate access in event handlers
  const isSessionActiveRef = useRef(false);
  const sessionEndingRef = useRef(false);
  const timeTrackingIntervalRef = useRef(null);
  const lastProcessedPageRef = useRef(null);
  const accumulatedTimeRef = useRef(0);
  const accumulatedPagesRef = useRef(0);
  const currentPageRef = useRef(initialPage); // Add ref to track current page

  // Function to reset session timeout (5 minutes)
  const resetSessionTimeout = () => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }
    
    sessionTimeoutRef.current = setTimeout(() => {
    
      if (isSessionActiveRef.current) {
        endReadingSession();
      }
    }, 5 * 60 * 1000); // 5 minutes
  };

  // Function to handle session start
  const startReadingSession = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Prevent starting if session is ending or already active
      if (sessionEndingRef.current || isSessionActiveRef.current) {
       
        return;
      }

     
      setIsSessionActive(true);
      isSessionActiveRef.current = true;
      sessionStartTimeRef.current = new Date();
      setLastActivityTime(new Date());
      
     
      
      // Don't reset accumulated values - keep existing progress
      // Only reset if this is the first time (no existing progress)
      if (accumulatedTimeRef.current === 0 && accumulatedPagesRef.current === 0) {
       
        setAccumulatedTime(0);
        setAccumulatedPages(0);
        accumulatedTimeRef.current = 0;
        accumulatedPagesRef.current = 0;
      } else {
       
      }
      
      // Always set lastPageUpdate to current time for time tracking
      const now = new Date();
      setLastPageUpdate(now);
      setLastPage(currentPageRef.current);
      lastProcessedPageRef.current = currentPageRef.current; // Set to current page to prevent immediate tracking

     

      // Start session timeout
      resetSessionTimeout();

      // Validate current page before sending
      const validCurrentPage = typeof currentPageRef.current === 'number' && currentPageRef.current >= 1 ? currentPageRef.current : 1;
      
     

      const response = await axios.post(
        `${API_BASE_URL}/api/books/${bookId}/progress`,
        { 
          currentPage: validCurrentPage, // Use validated current page
          isSessionStart: true,
          totalReadingTime: accumulatedTimeRef.current,
          totalPagesRead: accumulatedPagesRef.current
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

     
      
      // Notify parent component about progress update
      if (onProgressUpdate) {
        onProgressUpdate();
      }
    } catch (error) {
      console.error('❌ Error starting reading session:', error);
      // Reset state on error
      setIsSessionActive(false);
      isSessionActiveRef.current = false;
    }
  };

  // Function to handle session end
  const endReadingSession = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Prevent ending if already ending or not active
      if (sessionEndingRef.current || !isSessionActiveRef.current) {
        return;
      }

     

      sessionEndingRef.current = true;
      setIsSessionActive(false);
      isSessionActiveRef.current = false;
      
      // Clear session timeout
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
        sessionTimeoutRef.current = null;
      }

      // Calculate final session time BEFORE clearing the interval
      let finalTimeTotal = accumulatedTimeRef.current; // Use ref instead of state
      let finalPagesTotal = accumulatedPagesRef.current; // Use ref instead of state
      
      // Manual calculation as backup
      if (sessionStartTimeRef.current && lastPageUpdate) {
        const sessionDuration = Math.round((new Date() - sessionStartTimeRef.current) / 1000); // seconds
        const timeSinceLastUpdate = Math.round((new Date() - lastPageUpdate) / 1000); // seconds
        
        // Use the larger of the two calculations as backup
        const backupTimeTotal = Math.max(finalTimeTotal, sessionDuration);
        
       
        
        finalTimeTotal = Math.max(finalTimeTotal, backupTimeTotal);
      }
      
      if (lastPageUpdate) {
        const finalTime = Math.round((new Date() - lastPageUpdate) / 1000); // seconds
        finalTimeTotal = Math.max(finalTimeTotal, accumulatedTimeRef.current + finalTime);
        
     
      }

      // Clear time tracking interval AFTER calculation
      if (timeTrackingIntervalRef.current) {
        clearInterval(timeTrackingIntervalRef.current);
        timeTrackingIntervalRef.current = null;
      
      }
      
      // Add a small delay to ensure accurate time calculation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      sessionStartTimeRef.current = null;

      // Get the most current page value - use ref to ensure we have the latest value
      const finalCurrentPage = currentPageRef.current;
      
      // Validate current page before sending
      const validCurrentPage = typeof finalCurrentPage === 'number' && finalCurrentPage >= 1 ? finalCurrentPage : 1;

    

    

      const response = await axios.post(
        `${API_BASE_URL}/api/books/${bookId}/progress`,
        { 
          currentPage: validCurrentPage, // Use validated current page
          isSessionStart: false,
          totalReadingTime: finalTimeTotal,
          totalPagesRead: finalPagesTotal
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

    
      if (onProgressUpdate) {
        onProgressUpdate();
      }
    } catch (error) {
      console.error('❌ Error ending reading session:', error);
    } finally {
      sessionEndingRef.current = false;
    }
  };

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
    

      if (document.hidden && isSessionActiveRef.current) {
       
        endReadingSession();
      } else if (!document.hidden && !isSessionActiveRef.current && !sessionEndingRef.current) {
       
        startReadingSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Handle window focus/blur
  useEffect(() => {
    const handleFocus = () => {
    
      if (!isSessionActiveRef.current && !sessionEndingRef.current) {
    
        startReadingSession();
      } else if (isSessionActiveRef.current) {
     
        // Reset timeout when window gains focus
        resetSessionTimeout();
      }
    };

    const handleBlur = () => {
 

      if (isSessionActiveRef.current) {
        endReadingSession();
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Handle user activity (mouse, keyboard, scroll)
  useEffect(() => {
    let activityTimeout;
    
    const handleUserActivity = () => {
      if (isSessionActiveRef.current) {
        const now = new Date();
        setLastActivityTime(now);
        resetSessionTimeout();
        
        // Clear existing timeout to debounce activity logging
        if (activityTimeout) {
          clearTimeout(activityTimeout);
        }
        
        // Only log activity after 2 seconds of inactivity
        activityTimeout = setTimeout(() => {
        }, 2000);
      }
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
    };
  }, []);

  // Start session when component mounts
  useEffect(() => {
    const initializeReadingProgress = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

    

        // Load existing reading progress
        const response = await axios.get(
          `${API_BASE_URL}/api/books/${bookId}/progress`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.progress) {
          const progress = response.data.progress;
          const existingTime = progress.totalReadingTime || 0;
          const existingPages = progress.totalPagesRead || 0;
          const existingPage = progress.currentPage || 1;
          
        
       
          
          // Set all state and refs with existing progress
          setAccumulatedTime(existingTime);
          setAccumulatedPages(existingPages);
          setCurrentPage(existingPage);
          setLastPage(existingPage); // Set lastPage to current page
          accumulatedTimeRef.current = existingTime;
          accumulatedPagesRef.current = existingPages;
          currentPageRef.current = existingPage; // Set current page ref
          setReadingStats({
            totalReadingTime: existingTime,
            totalPagesRead: existingPages,
            lastReadPage: existingPage
          });
          
         
        } else {
        
          setAccumulatedTime(0);
          setAccumulatedPages(0);
          setCurrentPage(1);
          setLastPage(1);
          accumulatedTimeRef.current = 0;
          accumulatedPagesRef.current = 0;
          currentPageRef.current = 1; // Set current page ref
          setReadingStats({
            totalReadingTime: 0,
            totalPagesRead: 0,
            lastReadPage: 1
          });
        }
      } catch (error) {
        console.error('❌ Error loading reading progress:', error);
        // Set default values on error
        setAccumulatedTime(0);
        setAccumulatedPages(0);
        setCurrentPage(1);
        setLastPage(1);
        accumulatedTimeRef.current = 0;
        accumulatedPagesRef.current = 0;
        currentPageRef.current = 1; // Set current page ref
        setReadingStats({
          totalReadingTime: 0,
          totalPagesRead: 0,
          lastReadPage: 1
        });
      }
    };

    const initializeAndStartSession = async () => {
      await initializeReadingProgress();
      // Add a longer delay to ensure state and refs are properly set
      await new Promise(resolve => setTimeout(resolve, 300));
      
    
      
      startReadingSession();
    };

    initializeAndStartSession();
    
    return () => {
   
      endReadingSession();
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
      if (timeTrackingIntervalRef.current) {
        clearInterval(timeTrackingIntervalRef.current);
        timeTrackingIntervalRef.current = null;
      }
      
      // Notify parent component about progress update on unmount
      if (onProgressUpdate) {
        onProgressUpdate();
      }
    };
  }, []);

  useEffect(() => {
    const fetchPdf = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate(`/signin?returnTo=/books/${bookId}`);
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/api/books/${bookId}/pdf`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          responseType: 'arraybuffer'
        });

        const pdfData = new Uint8Array(response.data);
        pdfDataRef.current = pdfData; // Store the PDF data
        
        // Only create new PDF document if we don't have one or if the data has changed
        if (!pdfDocument || pdfDataRef.current !== pdfData) {
          const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
          setPdfDocument(pdf);
          setNumPages(pdf.numPages);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching PDF:', err);
        if (err.response?.status === 401) {
          navigate(`/signin?returnTo=/books/${bookId}`);
        } else {
          setError('Error loading PDF. Please try again.');
        }
        setLoading(false);
      }
    };

    fetchPdf();

    return () => {
      if (pdfDocument) {
        pdfDocument.destroy();
      }
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
      pdfDataRef.current = null; // Clear the PDF data reference
    };
  }, [bookId, navigate]);

  // This useEffect will now be responsible for rendering based on all relevant state changes
  useEffect(() => {
    const renderCurrentPage = async () => {
      if (!pdfDocument || !canvasRef.current || !viewerRef.current || pdfRendering) return;

      setPdfRendering(true);

      // Cancel any ongoing render task before starting a new one
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      try {
        const page = await pdfDocument.getPage(currentPage);
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        const baseViewport = page.getViewport({ scale: 1.0 });

        const viewerWidth = viewerRef.current.offsetWidth;
        const viewerHeight = viewerRef.current.offsetHeight;

        // Calculate scale to fit the page within the viewer, maintaining aspect ratio
        const widthFitScale = viewerWidth / baseViewport.width;
        const heightFitScale = viewerHeight / baseViewport.height;
        const responsiveFitScale = Math.min(widthFitScale, heightFitScale);

        // Combine responsive fit with manual zoom factor
        const finalScale = responsiveFitScale * manualScaleFactor;

        // Only update canvas if dimensions have changed
        const responsiveViewport = page.getViewport({ scale: finalScale });
        if (canvas.width !== responsiveViewport.width || canvas.height !== responsiveViewport.height) {
          canvas.width = responsiveViewport.width;
          canvas.height = responsiveViewport.height;
        }

        // Clear the canvas
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Create and store the render task
        const renderTask = page.render({
          canvasContext: context,
          viewport: responsiveViewport,
          intent: 'display', // Optimize for display
          renderInteractiveForms: false, // Disable interactive forms for better performance
        });
        
        renderTaskRef.current = renderTask;

        // Wait for the render to complete
        await renderTask.promise;
        
        // Add a small delay to ensure the canvas is fully rendered
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if the current page is blank (for any page, not just first)
        console.log(`🔍 Checking if page ${currentPage} is blank...`);
        const blank = isPageBlank(canvas);
        console.log(`✅ Page ${currentPage} blank check result:`, blank);
        
        // Update blank pages state
        setBlankPages(prev => ({
          ...prev,
          [currentPage]: blank
        }));
        
        // Show warning if current page is blank
        if (blank) {
          console.log(`⚠️ Page ${currentPage} is blank, showing warning`);
          setCurrentBlankPage(currentPage);
          setShowBlankPageWarning(true);
          // Auto-hide warning after 10 seconds
          setTimeout(() => {
            console.log('🕐 Auto-hiding blank page warning');
            setShowBlankPageWarning(false);
          }, 10000);
        } else {
          // Hide warning if page is not blank
          setCurrentBlankPage(null);
          setShowBlankPageWarning(false);
        }
        
        // Legacy first page check (keep for backward compatibility)
        if (currentPage === 1 && blank && !isFirstPageBlank) {
          console.log('⚠️ Setting first page blank flag');
          setIsFirstPageBlank(true);
        }
        
        // Update the actual scale being rendered for display
        setCurrentRenderScale(finalScale);

      } catch (err) {
        // Only log errors that aren't from cancellation
        if (err.name !== 'RenderingCancelledException') {
          console.error('Error rendering page:', err);
          setError('Error rendering PDF page. Please try again.');
        }
      } finally {
        setPdfRendering(false);
        renderTaskRef.current = null;
      }
    };

    // Use a more efficient resize observer
    let resizeTimeout;
    const resizeObserver = new ResizeObserver(() => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      resizeTimeout = setTimeout(renderCurrentPage, 250);
    });
    
    if (viewerRef.current) {
      resizeObserver.observe(viewerRef.current);
    }
    
    // Initial render
    renderCurrentPage();

    return () => {
      if (viewerRef.current) {
        resizeObserver.unobserve(viewerRef.current);
      }
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [pdfDocument, currentPage, manualScaleFactor]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!pdfDocument) return;

      switch (e.key.toLowerCase()) {
        case 'arrowright':
        case 'l':
          if (currentPage < numPages) {
            changePage(currentPage + 1);
          }
          break;
        case 'arrowleft':
        case 'h':
          if (currentPage > 1) {
            changePage(currentPage - 1);
          }
          break;
        case 'arrowup':
          window.scrollBy(0, -100);
          break;
        case 'arrowdown':
          window.scrollBy(0, 100);
          break;
        case 'escape':
          if (onClose) onClose();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentPage, numPages, pdfDocument, onClose]);

  // Update total pages when document is loaded
  useEffect(() => {
    if (numPages && onTotalPages) {
      onTotalPages(numPages);
    }
  }, [numPages, onTotalPages]);

  // Update current page when initialPage changes
  useEffect(() => {
    if (initialPage && initialPage !== currentPage) {
     
      setCurrentPage(initialPage);
      setLastPage(initialPage);
    }
  }, [initialPage, currentPage]);

  const changePage = (newPageNumber) => {
    if (newPageNumber >= 1 && newPageNumber <= numPages) {
    
      
      // Update current page state
      setCurrentPage(newPageNumber);
      
      // Call the parent callback if provided
      if (onPageChange) {
        onPageChange(newPageNumber);
      }
      
      
    } else {
      
    }
  };

  // Track page changes for reading progress calculation
  useEffect(() => {
    // Only track pages during active sessions
    if (!isSessionActiveRef.current) {
      
      return;
    }

    // Prevent duplicate processing of the same page
    if (lastProcessedPageRef.current === currentPage) {
     
      return;
    }

    // Only track if we have a valid lastPage and currentPage is different
    if (lastPage && currentPage !== lastPage && currentPage > lastPage) {
      const pagesDiff = currentPage - lastPage;
      
     
      
      if (pagesDiff > 0) {
        setAccumulatedPages(prev => {
          const newTotal = prev + pagesDiff;
          accumulatedPagesRef.current = newTotal; // Update ref immediately
          
          return newTotal;
        });
      }
      
      // Update lastPage and lastPageUpdate
      setLastPage(currentPage);
      setLastPageUpdate(new Date());
      lastProcessedPageRef.current = currentPage;
    
    } else if (currentPage !== lastPage) {
      // Handle backward navigation or same page
      
      
      setLastPage(currentPage);
      setLastPageUpdate(new Date());
      lastProcessedPageRef.current = currentPage;
    } else if (currentPage === lastPage && lastProcessedPageRef.current !== currentPage) {
      // Handle initial page load or same page navigation
     
      
      lastProcessedPageRef.current = currentPage;
      setLastPageUpdate(new Date());
    }
  }, [currentPage, lastPage]);

  // Debug accumulated values
  useEffect(() => {
    if (isSessionActive) {
      
    }
  }, [accumulatedTime, accumulatedPages, currentPage, isSessionActive]);

  // Keep refs in sync with state values
  useEffect(() => {
    accumulatedTimeRef.current = accumulatedTime;
  }, [accumulatedTime]);

  useEffect(() => {
    accumulatedPagesRef.current = accumulatedPages;
  }, [accumulatedPages]);

  // Keep current page ref in sync
  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  

 

  // Track reading time during active sessions
  useEffect(() => {
    // Clear existing interval if it exists
    if (timeTrackingIntervalRef.current) {
      clearInterval(timeTrackingIntervalRef.current);
      timeTrackingIntervalRef.current = null;
    }

    if (isSessionActive && lastPageUpdate) {
      
      
      timeTrackingIntervalRef.current = setInterval(() => {
        const now = new Date();
        const timeDiff = Math.round((now - lastPageUpdate) / 1000); // seconds
        
        if (timeDiff > 0) { // Only update if there's actual time difference
          setAccumulatedTime(prev => {
            const newTotal = prev + timeDiff;
            accumulatedTimeRef.current = newTotal; // Update ref immediately
           
            return newTotal;
          });
          // Update lastPageUpdate to the current time for next calculation
          setLastPageUpdate(now);
        }
      }, 1000); // Update every second
    } else {
     
    }

    return () => {
      if (timeTrackingIntervalRef.current) {
      
        clearInterval(timeTrackingIntervalRef.current);
        timeTrackingIntervalRef.current = null;
      }
    };
  }, [isSessionActive, lastPageUpdate]);

  // Zoom functions now only change manualScaleFactor
  const zoomIn = () => {
    setManualScaleFactor(prevScale => Math.min(prevScale + 0.2, 2.0));
  };

  const zoomOut = () => {
    setManualScaleFactor(prevScale => Math.max(prevScale - 0.2, 0.5));
  };

  // Manual time increment for testing
  const manualTimeIncrement = () => {
    if (isSessionActiveRef.current) {
      const increment = 10; // 10 seconds
      setAccumulatedTime(prev => {
        const newTotal = prev + increment;
        accumulatedTimeRef.current = newTotal;
       
        return newTotal;
      });
    }
  };

  // Update reading stats display when accumulated values change
  useEffect(() => {
    setReadingStats({
      totalReadingTime: accumulatedTime,
      totalPagesRead: accumulatedPages,
      lastReadPage: currentPage
    });
  }, [accumulatedTime, accumulatedPages, currentPage]);

  // Debug effect to track warning states
  useEffect(() => {
    console.log('Warning states:', { showBlankPageWarning, currentBlankPage, blankPages, currentPage });
  }, [showBlankPageWarning, currentBlankPage, blankPages, currentPage]);

  // Function to detect if a page is blank
  const isPageBlank = (canvas) => {
    const context = canvas.getContext('2d');
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    // Method 1: All pixels nearly the same
    let firstPixel = [data[0], data[1], data[2], data[3]];
    let diffPixels = 0;
    let sum = 0, sumSq = 0, n = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      let avg = (data[i] + data[i+1] + data[i+2]) / 3;
      sum += avg;
      sumSq += avg * avg;
      if (
        Math.abs(data[i] - firstPixel[0]) > 5 ||
        Math.abs(data[i+1] - firstPixel[1]) > 5 ||
        Math.abs(data[i+2] - firstPixel[2]) > 5 ||
        Math.abs(data[i+3] - firstPixel[3]) > 5
      ) {
        diffPixels++;
        if (diffPixels > 10) break;
      }
    }
    let mean = sum / n;
    let variance = sumSq / n - mean * mean;
    let stddev = Math.sqrt(variance);
    console.log('Blank page detection:', { diffPixels, stddev, mean });
    return diffPixels <= 10 || stddev < 5;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-screen bg-black">
        <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-10">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zinc-400 mb-4"></div>
            <p className="text-white text-lg">Loading PDF...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-screen bg-black">
        <div className="text-red-500 text-center">
          <p className="text-xl font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-screen bg-gray-100 dark:bg-gray-900">
      {/* Enhanced Controls Bar */}
      <div className="bg-gray-800 text-white p-4 flex flex-col sm:flex-row items-center justify-between shadow-md flex-shrink-0 relative">
        {/* Close Button - Moved to top-right corner */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors duration-200 z-10"
          title="Close PDF Viewer"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center space-x-2 sm:space-x-4 mb-2 sm:mb-0 mt-8 sm:mt-0">
          <button
            onClick={() => changePage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-3 py-1 sm:px-4 sm:py-2 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm sm:text-base flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="1"
              max={numPages || 1}
              value={currentPage}
              onChange={(e) => {
                const newPage = parseInt(e.target.value);
                if (newPage >= 1 && newPage <= numPages) {
                  changePage(newPage);
                }
              }}
              className="w-16 px-2 py-1 bg-gray-700 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm sm:text-base font-medium">
              of {numPages || '--'}
            </span>
          </div>
          <button
            onClick={() => changePage(currentPage + 1)}
            disabled={currentPage >= numPages}
            className="px-3 py-1 sm:px-4 sm:py-2 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm sm:text-base flex items-center"
          >
            Next
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          {/* Blank Page Check Button */}
          {blankPages[currentPage] && (
            <button
              onClick={() => setShowBlankPageWarning(true)}
              className="px-3 py-1 sm:px-4 sm:py-2 bg-yellow-600 rounded-lg hover:bg-yellow-700 transition-colors duration-200 text-sm sm:text-base flex items-center"
              title="Show blank page warning"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Blank Page
            </button>
          )}
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={zoomOut}
            className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors duration-200"
            title="Zoom Out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="text-sm sm:text-base font-medium min-w-[60px] text-center">
            {Math.round(currentRenderScale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors duration-200"
            title="Zoom In"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={() => setManualScaleFactor(1.0)}
            className="px-3 py-1 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors duration-200 text-sm"
            title="Reset Zoom"
          >
            Reset
          </button>
          
          
          
          {/* Reading Stats Display */}
          <div className="hidden md:flex items-center space-x-4 ml-4 pl-4 border-l border-gray-600">
            <div className="text-xs text-gray-300">
              <div className="font-semibold">Reading Time</div>
              <div>{formatReadingTime(accumulatedTime)}</div>
            </div>
            <div className="text-xs text-gray-300">
              <div className="font-semibold">Pages Read</div>
              <div>{accumulatedPages}</div>
            </div>
            <div className="text-xs text-gray-300">
              <div className="font-semibold">Current Page</div>
              <div>{currentPage}</div>
            </div>
            <div className="text-xs text-gray-300">
              <div className="font-semibold">Session</div>
              <div>{isSessionActive ? 'Active' : 'Inactive'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Viewer with Loading State */}
      <div ref={viewerRef} className="flex-1 overflow-auto p-4 flex justify-center relative">
        {loading && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-10">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zinc-400 mb-4"></div>
              <p className="text-white text-lg">Loading PDF...</p>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-10">
            <div className="bg-red-500 text-white p-4 rounded-lg shadow-lg max-w-md text-center">
              <p className="text-xl font-semibold mb-2">Error</p>
              <p>{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-white text-red-500 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                Retry
              </button>
            </div>
          </div>
        )}
        
        {/* Blank Page Warning */}
        {showBlankPageWarning && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-yellow-500 text-black p-6 rounded-lg shadow-lg max-w-md text-center z-20 animate-pulse border-2 border-yellow-600">
            <div className="flex items-center space-x-2 mb-3">
              <svg className="w-8 h-8 text-yellow-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="font-bold text-xl">⚠️ Page {currentBlankPage} appears blank!</p>
            </div>
            <p className="text-base mt-3 font-medium mb-4">Please navigate to the next page to see the content</p>
            <div className="mt-3 text-sm text-yellow-800 mb-4">
              <p>Current page: {currentPage} | Total pages: {numPages}</p>
              <p>Detection sensitivity: 85% white or 90% light pixels</p>
            </div>
            <button
              onClick={() => setShowBlankPageWarning(false)}
              className="px-6 py-3 bg-yellow-600 text-white rounded-lg text-base hover:bg-yellow-700 transition-colors font-medium"
            >
              Dismiss Warning
            </button>
          </div>
        )}
        
        <div className="w-full max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden">
            <canvas ref={canvasRef} className="block mx-auto" style={{ display: 'block', margin: '0 auto' }} />
            {pdfRendering && (
              <div className="absolute inset-0 bg-gray-900 bg-opacity-30 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-zinc-400"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Page Navigation Hints */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg opacity-0 transition-opacity duration-300 pointer-events-none"
           style={{ opacity: pdfRendering ? 1 : 0 }}>
        <p className="text-sm">Rendering page {currentPage}...</p>
      </div>
    </div>
  );
};

export default PDFReader; 