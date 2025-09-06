import React, { useState } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';

const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount, markAsRead } = useNotifications();

  const handleClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      // Mark as read when opening the dropdown
      markAsRead();
      // Store current total count as the last read count
      const currentTotal = parseInt(localStorage.getItem('newsfeed_total_count') || '0');
      localStorage.setItem('newsfeed_last_count', currentTotal.toString());
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={handleClick}
        className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 relative"
      >
        <span className="sr-only">View notifications</span>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {/* Notification dot - only show if there are unread notifications */}
        {unreadCount > 0 && (
          <div className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-red-500 rounded-full border-2 border-white"></div>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-20">
            <div className="py-4">
              <div className="px-4 py-2 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              </div>
              
              <div className="px-4 py-6">
                {unreadCount > 0 ? (
                  <div className="text-center">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                    </div>
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      {unreadCount} New {unreadCount === 1 ? 'Post' : 'Posts'}
                    </p>
                    <p className="text-sm text-gray-500">
                      There {unreadCount === 1 ? 'is' : 'are'} {unreadCount} new {unreadCount === 1 ? 'story' : 'stories'} in the news feed since your last visit.
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      All Caught Up!
                    </p>
                    <p className="text-sm text-gray-500">
                      No new posts since your last visit to the news feed.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationDropdown;