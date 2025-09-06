import React, { useState } from 'react';
import { Camera, Video, Paperclip, Edit3 } from 'lucide-react';
import PhotoStoryModal from './PhotoStoryModal';
import VideoStoryModal from './VideoStoryModal';
import FileStoryModal from './FileStoryModal';
import JournalStoryModal from './JournalStoryModal';

export type StoryType = 'photo' | 'video' | 'file' | 'journal';

interface StoryCreationProps {
  onStoryCreated?: () => void;
}

const StoryCreation: React.FC<StoryCreationProps> = ({ onStoryCreated }) => {
  const [activeModal, setActiveModal] = useState<StoryType | null>(null);

  const storyTypes = [
    {
      type: 'photo' as const,
      title: 'Photo',
      icon: Camera,
      color: 'bg-amber-50 hover:bg-amber-100 border-amber-200',
      iconColor: 'text-amber-600',
      description: 'Share photos with your students'
    },
    {
      type: 'video' as const,
      title: 'Video',
      icon: Video,
      color: 'bg-red-50 hover:bg-red-100 border-red-200',
      iconColor: 'text-red-600',
      description: 'Upload and share videos'
    },
    {
      type: 'file' as const,
      title: 'File',
      icon: Paperclip,
      color: 'bg-green-50 hover:bg-green-100 border-green-200',
      iconColor: 'text-green-600',
      description: 'Share documents and files'
    },
    {
      type: 'journal' as const,
      title: 'Journal',
      icon: Edit3,
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
      iconColor: 'text-blue-600',
      description: 'Write a text-based story'
    }
  ];

  const handleStoryCreated = () => {
    setActiveModal(null);
    onStoryCreated?.();
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Edit3 className="h-5 w-5 mr-2 text-blue-600" />
          Create Story
        </h3>
        
        <div className="grid grid-cols-4 gap-3">
          {storyTypes.map(({ type, title, icon: Icon, color, iconColor }) => (
            <button
              key={type}
              onClick={() => setActiveModal(type)}
              className={`${color} border-2 rounded-lg p-3 text-center transition-all duration-200 hover:scale-105 hover:shadow-md`}
            >
              <Icon className={`h-5 w-5 mx-auto mb-1 ${iconColor}`} />
              <h4 className="text-sm font-medium text-gray-800">{title}</h4>
            </button>
          ))}
        </div>
      </div>

      {/* Modals */}
      {activeModal === 'photo' && (
        <PhotoStoryModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          onStoryCreated={handleStoryCreated}
        />
      )}

      {activeModal === 'video' && (
        <VideoStoryModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          onStoryCreated={handleStoryCreated}
        />
      )}

      {activeModal === 'file' && (
        <FileStoryModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          onStoryCreated={handleStoryCreated}
        />
      )}

      {activeModal === 'journal' && (
        <JournalStoryModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          onStoryCreated={handleStoryCreated}
        />
      )}
    </>
  );
};

export default StoryCreation;