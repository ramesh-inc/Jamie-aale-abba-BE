import React, { useState } from 'react';
import { Paperclip, Loader2 } from 'lucide-react';
import BaseStoryModal from './BaseStoryModal';
import FileUploadZone from './FileUploadZone';
import { simpleStoryApi } from '../../services/api';
import type { FileValidationError } from '../../types/story';

interface FileStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoryCreated: () => void;
}

const FileStoryModal: React.FC<FileStoryModalProps> = ({
  isOpen,
  onClose,
  onStoryCreated
}) => {
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fileErrors, setFileErrors] = useState<FileValidationError[]>([]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be 100 characters or less';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Description is required';
    }

    if (files.length === 0) {
      newErrors.files = 'At least one file is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || fileErrors.length > 0) return;

    setIsLoading(true);
    try {
      const submitData = new FormData();
      submitData.append('title', formData.title.trim());
      submitData.append('content', formData.content.trim());
      submitData.append('story_type', 'file');

      // Add files
      files.forEach((file) => {
        submitData.append('attachments', file);
      });

      await simpleStoryApi.createStory(submitData);
      
      // Reset form
      setFormData({ title: '', content: '' });
      setFiles([]);
      setErrors({});
      setFileErrors([]);
      
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

  const handleFilesChange = (newFiles: File[]) => {
    setFiles(newFiles);
    setFileErrors([]);
    // Clear file error if files are now present
    if (newFiles.length > 0 && errors.files) {
      setErrors(prev => ({ ...prev, files: '' }));
    }
  };

  return (
    <BaseStoryModal
      isOpen={isOpen}
      onClose={onClose}
      title="📋 Share Files"
      size="xl"
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
            placeholder="Enter file story title"
            maxLength={100}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {formData.title.length}/100 characters
          </p>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            id="content"
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            rows={3}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.content ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Describe your files..."
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-600">{errors.content}</p>
          )}
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Files * (Max 5 files, 3MB each)
          </label>
          <FileUploadZone
            files={files}
            onFilesChange={handleFilesChange}
            onErrorsChange={setFileErrors}
            storyType="file"
            errors={fileErrors}
          />
          {errors.files && (
            <p className="mt-1 text-sm text-red-600">{errors.files}</p>
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
            disabled={isLoading || fileErrors.length > 0}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Paperclip className="h-4 w-4 mr-2" />
                Publish Files
              </>
            )}
          </button>
        </div>
      </form>
    </BaseStoryModal>
  );
};

export default FileStoryModal;