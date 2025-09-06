import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { useAuth } from '../../utils/auth';
import StoryCreation from './StoryCreation';
import StoryFeed from './StoryFeed';

const NewsFeed: React.FC = () => {
  const { user } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [feedFilter, setFeedFilter] = useState<'all' | 'mine'>('all');

  const handleStoryCreated = () => {
    // Trigger a refresh of the stories feed
    setRefreshTrigger(prev => prev + 1);
  };

  // Check if user can create stories (teachers and admins only)
  const canCreateStories = user && (user.user_type === 'teacher' || user.user_type === 'admin');

  return (
    <div className="space-y-6">
      {/* Story Creation Panel - Only for teachers and admins */}
      {canCreateStories && (
        <StoryCreation onStoryCreated={handleStoryCreated} />
      )}

      {/* Story Feed */}
      <StoryFeed 
        refreshTrigger={refreshTrigger} 
        filterType={feedFilter}
      />
    </div>
  );
};

export default NewsFeed;