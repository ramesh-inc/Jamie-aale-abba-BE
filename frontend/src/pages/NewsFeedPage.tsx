import React, { useState, useEffect } from 'react';
import { Menu, Bell, User } from 'lucide-react';
import { useAuth } from '../utils/auth';
import { simpleStoryApi } from '../services/api';
import StoryFeed from '../components/story/StoryFeed';
import PhotoStoryModal from '../components/story/PhotoStoryModal';
import VideoStoryModal from '../components/story/VideoStoryModal';
import FileStoryModal from '../components/story/FileStoryModal';
import JournalStoryModal from '../components/story/JournalStoryModal';

type StoryType = 'photo' | 'video' | 'file' | 'journal';
type FilterType = 'all' | 'mine';

const NewsFeedPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeModal, setActiveModal] = useState<StoryType | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');

  const handleStoryCreated = () => {
    setActiveModal(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const storyTypes = [
    {
      type: 'photo' as StoryType,
      title: 'Photo',
      subtitle: 'Share photos with your students',
      icon: '📷',
      bgColor: 'bg-yellow-50',
      iconBg: 'bg-yellow-100',
      hoverBg: 'hover:bg-yellow-100'
    },
    {
      type: 'video' as StoryType,
      title: 'Video',
      subtitle: 'Upload and share videos',
      icon: '🎥',
      bgColor: 'bg-pink-50',
      iconBg: 'bg-pink-100',
      hoverBg: 'hover:bg-pink-100'
    },
    {
      type: 'file' as StoryType,
      title: 'File',
      subtitle: 'Share documents and files',
      icon: '📎',
      bgColor: 'bg-green-50',
      iconBg: 'bg-green-100',
      hoverBg: 'hover:bg-green-100'
    },
    {
      type: 'journal' as StoryType,
      title: 'Journal',
      subtitle: 'Write a text-based story',
      icon: '✏️',
      bgColor: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      hoverBg: 'hover:bg-blue-100'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <div className="flex items-center">
              <Menu className="h-6 w-6 text-gray-500 mr-4 md:hidden" />
              <h1 className="text-xl font-semibold text-gray-900">News Feed</h1>
            </div>

            {/* Right side - Notifications and Profile */}
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-500">
                <Bell className="h-5 w-5" />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                  </span>
                </div>
                <div className="hidden md:block">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.first_name} {user?.last_name}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">{user?.user_type}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Updated Layout */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">News Feed</h2>
          <p className="text-gray-600">Create and share stories with your students and parents</p>
        </div>

        {/* Create Story Section */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-lg">✏️</span>
              <h3 className="text-lg font-semibold text-gray-900">Create Story</h3>
            </div>

            {/* Story Type Cards - Horizontal layout */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {storyTypes.map((story) => (
                <button
                  key={story.type}
                  onClick={() => setActiveModal(story.type)}
                  className={`${story.bgColor} ${story.hoverBg} border border-gray-200 rounded-lg p-4 text-left transition-colors group`}
                >
                  <div className="flex flex-col items-center space-y-2 text-center">
                    <div className={`w-12 h-12 ${story.iconBg} rounded-lg flex items-center justify-center text-xl group-hover:scale-105 transition-transform`}>
                      {story.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{story.title}</h4>
                      <p className="text-sm text-gray-600">{story.subtitle}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Story Feed with Filter Controls */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentFilter('all')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                All Stories
              </button>
              <button
                onClick={() => setCurrentFilter('mine')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentFilter === 'mine'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                My Stories
              </button>
            </div>
          </div>

          <div className="p-0">
            <StoryFeed 
              key={refreshTrigger}
              filterType={currentFilter}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      <PhotoStoryModal
        isOpen={activeModal === 'photo'}
        onClose={() => setActiveModal(null)}
        onStoryCreated={handleStoryCreated}
      />

      <VideoStoryModal
        isOpen={activeModal === 'video'}
        onClose={() => setActiveModal(null)}
        onStoryCreated={handleStoryCreated}
      />

      <FileStoryModal
        isOpen={activeModal === 'file'}
        onClose={() => setActiveModal(null)}
        onStoryCreated={handleStoryCreated}
      />

      <JournalStoryModal
        isOpen={activeModal === 'journal'}
        onClose={() => setActiveModal(null)}
        onStoryCreated={handleStoryCreated}
      />
    </div>
  );
};

export default NewsFeedPage;