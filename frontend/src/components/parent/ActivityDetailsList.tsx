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
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (selectedDate && childId) {
      fetchActivityDetails();
    }
  }, [selectedDate, childId]);

  const fetchActivityDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      // Use the new daily activities API endpoint
      const activities = await parentApi.getDailyActivities(childId, selectedDate!);
      
      // Convert the response to match our interface
      const formattedActivities: ActivityDetail[] = activities.map((activity: any) => ({
        id: activity.id,
        activity_name: activity.activity_name,
        category: activity.category,
        session_date: activity.session_date,
        start_time: activity.start_time || '',
        end_time: activity.end_time || '',
        duration_minutes: activity.duration_minutes,
        notes: activity.notes || '',
        teacher_name: activity.teacher_name,
        participation_level: activity.participation_level || 'good'
      }));
      
      setActivities(formattedActivities);
    } catch (error: any) {
      console.error('Error fetching activity details:', error);
      
      // Fallback to sample data for development
      if (error?.response?.status === 404) {
        setActivities([]);
        setError('No activities found for this date');
      } else {
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
          }
        ];
        
        setActivities(mockActivities);
        setError('Using sample data - API connection issue');
      }
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
    const date = new Date(dateString);
    // Since we're showing monthly activities, show the month and year instead of specific date
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
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
              <h2 className="text-2xl font-bold mb-2">Learning Activities</h2>
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

              {/* Activities List Grouped by Date */}
              <div className="space-y-6">
                {Object.entries(
                  activities.reduce((groups, activity) => {
                    const date = activity.session_date;
                    if (!groups[date]) {
                      groups[date] = [];
                    }
                    groups[date].push(activity);
                    return groups;
                  }, {} as Record<string, ActivityDetail[]>)
                )
                .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
                .map(([date, dayActivities]) => {
                  const isCollapsed = collapsedDates.has(date);
                  const toggleCollapse = () => {
                    const newCollapsed = new Set(collapsedDates);
                    if (isCollapsed) {
                      newCollapsed.delete(date);
                    } else {
                      newCollapsed.add(date);
                    }
                    setCollapsedDates(newCollapsed);
                  };

                  return (
                    <div key={date} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Date Header */}
                      <div 
                        className="bg-blue-50 px-4 py-3 border-b border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
                        onClick={toggleCollapse}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-blue-900">
                            {new Date(date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })} - {dayActivities.length} {dayActivities.length === 1 ? 'activity' : 'activities'}
                          </h4>
                          <svg 
                            className={`w-5 h-5 text-blue-700 transform transition-transform ${
                              isCollapsed ? 'rotate-0' : 'rotate-180'
                            }`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      
                      {/* Activities for this date */}
                      {!isCollapsed && (
                        <div className="p-4 space-y-4">
                      {dayActivities.map((activity) => (
                        <div key={activity.id} className="border border-gray-100 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
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
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
                                  {activity.duration_minutes} minutes
                                </span>
                              </div>
                              <div className="flex items-center space-x-4 text-sm">
                                <span className="text-gray-600">
                                  Teacher: <span className="font-medium">{activity.teacher_name}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Learning Objectives */}
                          {activity.learning_objectives && (
                            <div className="mt-3 p-3 bg-green-50 rounded-lg">
                              <p className="text-sm text-gray-700">
                                <span className="font-medium text-green-800">Learning Objectives: </span>
                                {activity.learning_objectives}
                              </p>
                            </div>
                          )}
                          
                          {/* Materials Used */}
                          {activity.materials_used && (
                            <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                              <p className="text-sm text-gray-700">
                                <span className="font-medium text-yellow-800">Materials Used: </span>
                                {activity.materials_used}
                              </p>
                            </div>
                          )}
                          
                          {/* Notes */}
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
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityDetailsList;