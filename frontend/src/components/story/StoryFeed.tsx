import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Calendar, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../utils/auth';
import { simpleStoryApi } from '../../services/api';
import type { Story, PaginatedResponse } from '../../types/story';
import StoryCard from './StoryCard';
import { useNotifications } from '../../contexts/NotificationContext';

interface StoryFeedProps {
  refreshTrigger?: number;
  filterType?: 'all' | 'mine';
}

const StoryFeed: React.FC<StoryFeedProps> = ({ refreshTrigger, filterType = 'all' }) => {
  const { user } = useAuth();
  const { checkForNewPosts, markAsRead } = useNotifications();
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<'all' | 'mine'>(filterType);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Check if user can create stories (teachers and admins only)
  const canCreateStories = user && (user.user_type === 'teacher' || user.user_type === 'admin');

  useEffect(() => {
    // Reset pagination when filter changes or refresh is triggered
    setCurrentPage(1);
    setStories([]);
    setHasNextPage(true);
    loadStories(1);
  }, [refreshTrigger, currentFilter]);

  useEffect(() => {
    setCurrentFilter(filterType);
  }, [filterType]);

  // Mark as read when user first visits the news feed
  useEffect(() => {
    if (stories.length > 0 && currentFilter === 'all') {
      // Set the initial last read count if not already set
      const hasLastRead = localStorage.getItem('newsfeed_last_read');
      if (!hasLastRead) {
        markAsRead();
        localStorage.setItem('newsfeed_last_count', totalCount.toString());
      }
    }
  }, [stories.length, currentFilter, totalCount, markAsRead]);

  const loadStories = async (page: number = 1, append: boolean = false) => {
    try {
      if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);
      
      const response: PaginatedResponse<Story> = currentFilter === 'mine' 
        ? await simpleStoryApi.getTeacherStories(page, 10)
        : await simpleStoryApi.getStories(page, 10);
      
      if (append) {
        setStories(prev => [...prev, ...response.results]);
      } else {
        setStories(response.results);
      }
      
      setTotalCount(response.count);
      setHasNextPage(!!response.next);
      setCurrentPage(page);
      
      // Check for new posts when loading stories (only for 'all' filter to avoid notification spam)
      if (currentFilter === 'all' && !append && response.count > 0) {
        checkForNewPosts(response.count);
      }
    } catch (error) {
      console.error('Error loading stories:', error);
      setError('Failed to load stories. Please try again.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleStoryUpdate = (updatedStory: Story) => {
    setStories(prev => 
      prev.map(story => 
        story.id === updatedStory.id ? updatedStory : story
      )
    );
  };

  const handleStoryDelete = (storyId: number) => {
    setStories(prev => prev.filter(story => story.id !== storyId));
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasNextPage) {
      loadStories(currentPage + 1, true);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6 text-center">
        <div className="text-red-500 mb-4">
          <Eye className="h-8 w-8 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Stories</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={loadStories}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="text-gray-400 mb-4">
          <EyeOff className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {currentFilter === 'mine' ? 'No Stories Yet' : 'No Stories Found'}
        </h3>
        <p className="text-gray-600 mb-4">
          {currentFilter === 'mine' 
            ? "You haven't created any stories yet. Click on one of the story types above to get started!"
            : "There are no stories to display at the moment. Check back later!"
          }
        </p>
        {currentFilter === 'mine' && (
          <button
            onClick={() => setCurrentFilter('all')}
            className="text-blue-600 hover:text-blue-700 underline"
          >
            View all stories instead
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Toggle - Only for teachers and admins */}
      {canCreateStories && (
        <div className="flex justify-center">
          <div className="bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setCurrentFilter('all')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                currentFilter === 'all'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Stories
            </button>
            <button
              onClick={() => setCurrentFilter('mine')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                currentFilter === 'mine'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              My Stories
            </button>
          </div>
        </div>
      )}

      {/* Stories List */}
      <div className="space-y-4">
        {stories.map((story) => (
          <StoryCard
            key={story.id}
            story={story}
            onUpdate={handleStoryUpdate}
            onDelete={handleStoryDelete}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasNextPage && (
        <div className="flex justify-center mt-6">
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <span>Load More Stories</span>
            )}
          </button>
        </div>
      )}

      {/* Total Count Display */}
      {totalCount > 0 && (
        <div className="text-center text-sm text-gray-500 mt-4">
          Showing {stories.length} of {totalCount} stories
        </div>
      )}
    </div>
  );
};

export default StoryFeed;