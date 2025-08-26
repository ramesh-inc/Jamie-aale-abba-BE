import React, { useState, useEffect } from 'react';
import { parentApi } from '../../services/api';

interface ActivityDetail {
  id: number;
  activity_name: string;
  category: string;
  session_date: string;
  start_time: string;
  end_time?: string;
  duration_minutes: number;
  notes?: string;
  teacher_name: string;
  participation_level: string;
}

interface ActivityDetailsListProps {
  childId: number;
  selectedDate: string | null;
  onClose: () => void;
}

const ActivityDetailsList: React.FC<ActivityDetailsListProps> = ({
  childId,
  selectedDate,
  onClose
}) => {
  const [activities, setActivities] = useState<ActivityDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedDate && childId) {
      fetchActivityDetails();
    }
  }, [selectedDate, childId]);

  const fetchActivityDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      // For now, we'll use mock data since the detailed endpoint doesn't exist yet
      // TODO: Replace with actual API call when backend endpoint is ready
      
      const mockActivities: ActivityDetail[] = [
        {
          id: 1,
          activity_name: "Circle Time - Weather Discussion",
          category: "literacy",
          session_date: selectedDate!,
          start_time: "09:00",
          end_time: "09:30",
          duration_minutes: 30,
          notes: "Child actively participated in weather discussion",
          teacher_name: "Ms. Sarah Johnson",
          participation_level: "excellent"
        },
        {
          id: 2,
          activity_name: "Math Games with Blocks",
          category: "numeracy",
          session_date: selectedDate!,
          start_time: "10:15",
          end_time: "10:45",
          duration_minutes: 30,
          notes: "Great counting skills demonstrated",
          teacher_name: "Ms. Sarah Johnson",
          participation_level: "good"
        },
        {
          id: 3,
          activity_name: "Art - Finger Painting",
          category: "art",
          session_date: selectedDate!,
          start_time: "14:00",
          end_time: "14:30",
          duration_minutes: 30,
          notes: "Creative expression through colors",
          teacher_name: "Ms. Sarah Johnson",
          participation_level: "excellent"
        }
      ];

      setActivities(mockActivities);
    } catch (error: any) {
      console.error('Error fetching activity details:', error);
      setError('Failed to load activity details');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'literacy':
        return 'bg-blue-100 text-blue-800';
      case 'numeracy':
        return 'bg-green-100 text-green-800';
      case 'science':
        return 'bg-purple-100 text-purple-800';
      case 'art':
        return 'bg-pink-100 text-pink-800';
      case 'music':
        return 'bg-yellow-100 text-yellow-800';
      case 'physical':
        return 'bg-red-100 text-red-800';
      case 'social':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getParticipationColor = (level: string) => {
    switch (level) {
      case 'excellent':
        return 'text-green-600';
      case 'good':
        return 'text-blue-600';
      case 'fair':
        return 'text-yellow-600';
      case 'needs_improvement':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!selectedDate) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">Daily Activities</h2>
              <p className="text-blue-100">{formatDate(selectedDate)}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 mb-2">{error}</div>
              <button
                onClick={fetchActivityDetails}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Try again
              </button>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="text-gray-500">No activities found for this date</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {activities.length}
                    </div>
                    <div className="text-sm text-gray-600">Total Activities</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(activities.reduce((sum, act) => sum + act.duration_minutes, 0) / 60 * 10) / 10}h
                    </div>
                    <div className="text-sm text-gray-600">Total Hours</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {activities.filter(act => act.participation_level === 'excellent').length}
                    </div>
                    <div className="text-sm text-gray-600">Excellent Participation</div>
                  </div>
                </div>
              </div>

              {/* Activities List */}
              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <div key={activity.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {activity.activity_name}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(activity.category)}`}>
                            {activity.category.charAt(0).toUpperCase() + activity.category.slice(1)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatTime(activity.start_time)} - {activity.end_time ? formatTime(activity.end_time) : 'Ongoing'}
                          </span>
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            {activity.duration_minutes} minutes
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-gray-600">
                            Teacher: <span className="font-medium">{activity.teacher_name}</span>
                          </span>
                          <span className={`font-medium ${getParticipationColor(activity.participation_level)}`}>
                            Participation: {activity.participation_level.replace('_', ' ').charAt(0).toUpperCase() + activity.participation_level.replace('_', ' ').slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {activity.notes && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium text-blue-800">Notes: </span>
                          {activity.notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityDetailsList;