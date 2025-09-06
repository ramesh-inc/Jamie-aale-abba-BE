import { useState, useEffect, useCallback } from 'react';
import { teacherApi } from '../../services/api';

interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string;
      error?: string;
    };
    status?: number;
  };
}

interface Class {
  id: number;
  class_name: string;
  class_code: string;
  age_group: string;
  capacity: number;
  room_number: string;
  academic_year: string;
  is_active: boolean;
}


interface NotificationModalProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

interface ActivityRecordingProps {
  onActivityRecorded?: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ message, type, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center mb-4">
          {type === 'success' ? (
            <div className="flex-shrink-0 w-10 h-10 mx-auto">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          ) : (
            <div className="flex-shrink-0 w-10 h-10 mx-auto">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          )}
        </div>
        <div className="text-center">
          <h3 className={`text-lg font-medium ${type === 'success' ? 'text-green-900' : 'text-red-900'} mb-2`}>
            {type === 'success' ? 'Success' : 'Error'}
          </h3>
          <p className="text-sm text-gray-500 mb-6">{message}</p>
          <button
            onClick={onClose}
            className={`w-full px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              type === 'success'
                ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                : 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
            }`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

const ActivityRecording: React.FC<ActivityRecordingProps> = ({ onActivityRecorded }) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [activityDate, setActivityDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [activityType, setActivityType] = useState<string>('');
  const [activityTitle, setActivityTitle] = useState<string>('');
  const [activityDescription, setActivityDescription] = useState<string>('');
  const [objectives, setObjectives] = useState<string>('');
  const [materials, setMaterials] = useState<string>('');
  const [duration, setDuration] = useState<number>(30);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const loadClasses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await teacherApi.getMyClasses();
      const classesData = response.data || response;
      const activeClasses = Array.isArray(classesData) ? classesData.filter(cls => cls.is_active) : [];
      setClasses(activeClasses);
    } catch (error) {
      console.error('Failed to load classes:', error);
      setNotification({
        message: 'Failed to load classes. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, []);


  // Load classes on component mount
  useEffect(() => {
    loadClasses();
  }, [loadClasses]);



  const saveActivity = async () => {
    if (!selectedClass || !activityTitle.trim() || !activityType.trim()) {
      setNotification({
        message: 'Please fill in all required fields (Class, Activity Type, and Title).',
        type: 'error'
      });
      return;
    }

    setSaving(true);
    try {
      const activityData = {
        class_id: selectedClass,
        session_date: activityDate,
        activity_name: activityTitle,
        category: activityType,
        description: activityDescription || '',
        learning_objectives: objectives || '',
        materials_used: materials || '',
        duration_minutes: duration,
        student_records: []
      };

      const response = await teacherApi.recordLearningActivity(activityData);
      
      setNotification({
        message: response.message || `Learning activity "${activityTitle}" has been recorded successfully!`,
        type: 'success'
      });
      
      // Reset form after successful save
      setSelectedClass(null);
      setActivityTitle('');
      
      // Call the callback if provided (for modal closing)
      if (onActivityRecorded) {
        setTimeout(() => {
          onActivityRecorded();
        }, 1500); // Wait 1.5 seconds to show success message before closing
      }
      setActivityType('');
      setActivityDescription('');
      setObjectives('');
      setMaterials('');
      setDuration(30);
    } catch (error) {
      console.error('Failed to save activity:', error);
      let errorMessage = 'Failed to save learning activity. Please try again.';
      
      const apiError = error as ApiErrorResponse;
      if (apiError?.response?.data?.message) {
        errorMessage = apiError.response.data.message;
      } else if (apiError?.response?.data?.error) {
        errorMessage = apiError.response.data.error;
      }
      
      setNotification({
        message: errorMessage,
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };


  const activityTypes = [
    { value: 'literacy', label: 'Literacy' },
    { value: 'numeracy', label: 'Numeracy' },
    { value: 'science', label: 'Science' },
    { value: 'art', label: 'Art' },
    { value: 'music', label: 'Music' },
    { value: 'physical', label: 'Physical' },
    { value: 'social', label: 'Social' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Record Learning Activity</h2>
        
        {/* Basic Activity Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Date */}
          <div>
            <label htmlFor="activity-date" className="block text-sm font-medium text-gray-700 mb-2">
              Activity Date *
            </label>
            <input
              type="date"
              id="activity-date"
              value={activityDate}
              onChange={(e) => setActivityDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Class Selection */}
          <div>
            <label htmlFor="class-select" className="block text-sm font-medium text-gray-700 mb-2">
              Select Class *
            </label>
            <select
              id="class-select"
              value={selectedClass || ''}
              onChange={(e) => setSelectedClass(e.target.value ? Number(e.target.value) : null)}
              className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              <option value="">Select a class...</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.class_name} ({cls.class_code}) - {cls.room_number}
                </option>
              ))}
            </select>
          </div>

          {/* Activity Type */}
          <div>
            <label htmlFor="activity-type" className="block text-sm font-medium text-gray-700 mb-2">
              Activity Type *
            </label>
            <select
              id="activity-type"
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select activity type...</option>
              {activityTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Activity Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Title */}
          <div>
            <label htmlFor="activity-title" className="block text-sm font-medium text-gray-700 mb-2">
              Activity Title *
            </label>
            <input
              type="text"
              id="activity-title"
              value={activityTitle}
              onChange={(e) => setActivityTitle(e.target.value)}
              placeholder="Enter activity title..."
              className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Duration */}
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
              Duration (minutes)
            </label>
            <input
              type="number"
              id="duration"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              min="1"
              max="480"
              className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <label htmlFor="activity-description" className="block text-sm font-medium text-gray-700 mb-2">
            Activity Description
          </label>
          <textarea
            id="activity-description"
            value={activityDescription}
            onChange={(e) => setActivityDescription(e.target.value)}
            rows={3}
            placeholder="Describe what happened during the activity..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Learning Objectives and Materials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="objectives" className="block text-sm font-medium text-gray-700 mb-2">
              Learning Objectives
            </label>
            <textarea
              id="objectives"
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              rows={3}
              placeholder="What were the learning goals for this activity?"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="materials" className="block text-sm font-medium text-gray-700 mb-2">
              Materials Used
            </label>
            <textarea
              id="materials"
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              rows={3}
              placeholder="List materials and resources used..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={saveActivity}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </div>
            ) : (
              'Record Activity'
            )}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Notification Modal */}
      {notification && (
        <NotificationModal
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default ActivityRecording;