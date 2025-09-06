import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface NotificationContextType {
  unreadCount: number;
  lastReadTime: string | null;
  setUnreadCount: (count: number) => void;
  markAsRead: () => void;
  checkForNewPosts: (totalPosts: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [lastReadTime, setLastReadTime] = useState<string | null>(null);

  // Load last read time from localStorage on mount
  useEffect(() => {
    const storedLastRead = localStorage.getItem('newsfeed_last_read');
    if (storedLastRead) {
      setLastReadTime(storedLastRead);
    }
  }, []);

  const markAsRead = () => {
    const now = new Date().toISOString();
    setLastReadTime(now);
    setUnreadCount(0);
    localStorage.setItem('newsfeed_last_read', now);
  };

  const checkForNewPosts = (totalPosts: number) => {
    // Store current total for reference
    localStorage.setItem('newsfeed_total_count', totalPosts.toString());
    
    if (!lastReadTime) {
      // If no last read time, don't show notifications for initial load
      setUnreadCount(0);
      return;
    }
    
    // Compare current total with last read count
    const lastReadCount = parseInt(localStorage.getItem('newsfeed_last_count') || '0');
    const newPosts = Math.max(0, totalPosts - lastReadCount);
    setUnreadCount(newPosts);
  };

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        lastReadTime,
        setUnreadCount,
        markAsRead,
        checkForNewPosts,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};