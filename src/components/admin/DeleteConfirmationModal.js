import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DeleteConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Delete Confirmation", 
  message = "Are you sure you want to delete this item?", 
  itemName = "",
  confirmText = "Delete",
  cancelText = "Cancel",
  type = "danger" // danger, warning, info
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: '🗑️',
          confirmButton: 'bg-red-500 hover:bg-red-600',
          iconBg: 'bg-red-500/10',
          iconColor: 'text-red-500'
        };
      case 'warning':
        return {
          icon: '⚠️',
          confirmButton: 'bg-yellow-500 hover:bg-yellow-600',
          iconBg: 'bg-yellow-500/10',
          iconColor: 'text-yellow-500'
        };
      case 'info':
        return {
          icon: 'ℹ️',
          confirmButton: 'bg-blue-500 hover:bg-blue-600',
          iconBg: 'bg-blue-500/10',
          iconColor: 'text-blue-500'
        };
      default:
        return {
          icon: '🗑️',
          confirmButton: 'bg-red-500 hover:bg-red-600',
          iconBg: 'bg-red-500/10',
          iconColor: 'text-red-500'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-gray-800 rounded-xl max-w-md w-full shadow-2xl border border-gray-700/50"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full ${styles.iconBg} flex items-center justify-center text-xl`}>
                {styles.icon}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{title}</h3>
                <p className="text-gray-400 text-sm mt-1">
                  This action cannot be undone
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-300 mb-6">
              {message}
              {itemName && (
                <span className="font-semibold text-white block mt-2">
                  "{itemName}"
                </span>
              )}
            </p>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 font-medium"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`px-4 py-2 ${styles.confirmButton} text-white rounded-lg transition-colors duration-200 font-medium`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DeleteConfirmationModal; 