import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import BaseStoryModal from './BaseStoryModal';
import { simpleStoryApi } from '../../services/api';

interface JournalStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoryCreated: () => void;
}

const JournalStoryModal: React.FC<JournalStoryModalProps> = ({
  isOpen,
  onClose,
  onStoryCreated
}) => {
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be 100 characters or less';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const submitData = new FormData();
      submitData.append('title', formData.title.trim());
      submitData.append('content', formData.content.trim());
      submitData.append('story_type', 'journal');

      await simpleStoryApi.createStory(submitData);
      
      // Reset form
      setFormData({ title: '', content: '' });
      setErrors({});
      
      onStoryCreated();
    } catch (error: any) {
      console.error('Error creating story:', error);
      if (error.response?.data) {
        const apiErrors: Record<string, string> = {};
        Object.entries(error.response.data).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            apiErrors[key] = value[0];
          } else {
            apiErrors[key] = String(value);
          }
        });
        setErrors(apiErrors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BaseStoryModal
      isOpen={isOpen}
      onClose={onClose}
      title="📝 Write Journal Entry"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter journal entry title"
            maxLength={100}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {formData.title.length}/100 characters
          </p>
        </div>

        {/* Content */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            Journal Entry *
          </label>
          <textarea
            id="content"
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            rows={8}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.content ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Write your journal entry here..."
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-600">{errors.content}</p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Publish Entry
              </>
            )}
          </button>
        </div>
      </form>
    </BaseStoryModal>
  );
};

export default JournalStoryModal;