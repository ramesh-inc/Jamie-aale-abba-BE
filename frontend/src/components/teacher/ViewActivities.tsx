import React, { useState, useEffect } from 'react';
import { teacherApi } from '../../services/api';

interface Activity {
  id: number;
  activity_date: string;
  activity_type: string;
  title: string;
  description?: string;
  learning_objectives?: string;
  materials_used?: string;
  duration_minutes: number;
  class_name: string;
  class_id: number;
  student_count: number;
  created_at: string;
  start_time?: string;
  end_time?: string;
}

interface Class {
  id: number;
  class_name: string;
  class_code: string;
}

interface ViewActivitiesProps {
  refreshTrigger?: number;
}

const ViewActivities: React.FC<ViewActivitiesProps> = ({ refreshTrigger }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchActivities();
    }
  }, [selectedDate, selectedClassId]);

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchActivities();
    }
  }, [refreshTrigger]);

  const fetchClasses = async () => {
    try {
      const response = await teacherApi.getMyClasses();
      // Ensure response is an array
      const classesData = Array.isArray(response) ? response : (response?.classes || response?.data || []);
      setClasses(classesData);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setError('Failed to load classes');
      setClasses([]); // Set empty array on error
    }
  };

  const fetchActivities = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: { date?: string; class_id?: number } = {};
      
      if (selectedDate) {
        params.date = selectedDate;
      }
      
      if (selectedClassId) {
        params.class_id = selectedClassId;
      }

      const response = await teacherApi.getTeacherActivities(params);
      
      // Ensure response is an array
      const activitiesData = Array.isArray(response) ? response : (response?.activities || response?.data || []);
      
      setActivities(activitiesData);
    } catch (error: any) {
      console.error('Error fetching activities:', error);
      
      // Handle different error types
      if (error?.response?.status === 401) {
        setError('Please log in to view activities');
      } else if (error?.response?.status === 403) {
        setError('Access denied - teacher account required');
      } else if (error?.response?.status === 404) {
        setError('No activities found for the selected date');
        setActivities([]);
      } else {
        // For development, show mock data if API fails
        console.log('API failed, using mock data for development');
        const mockActivities: Activity[] = [
          {
            id: 1,
            activity_date: selectedDate,
            activity_type: 'literacy',
            title: 'Circle Time - Weather Discussion',
            description: 'Children discussed different types of weather and their characteristics.',
            learning_objectives: 'Develop vocabulary related to weather; Improve speaking and listening skills',
            materials_used: 'Weather picture cards, felt board, weather songs',
            duration_minutes: 30,
            class_name: 'Rainbow Class',
            class_id: 1,
            student_count: 15,
            created_at: new Date().toISOString(),
            start_time: '09:00',
            end_time: '09:30'
          },
          {
            id: 2,
            activity_date: selectedDate,
            activity_type: 'numeracy',
            title: 'Math Games with Blocks',
            description: 'Students used building blocks to practice counting and basic addition.',
            learning_objectives: 'Practice counting 1-10; Introduction to addition concepts',
            materials_used: 'Wooden blocks, counting worksheets, number cards',
            duration_minutes: 45,
            class_name: 'Rainbow Class',
            class_id: 1,
            student_count: 12,
            created_at: new Date().toISOString(),
            start_time: '10:15',
            end_time: '11:00'
          }
        ];
        
        const filteredActivities = selectedClassId 
          ? mockActivities.filter(activity => activity.class_id === selectedClassId)
          : mockActivities;
          
        setActivities(filteredActivities);
        setError('Using sample data - API may not have data for this date');
      }
    } finally {
      setLoading(false);
    }
  };

  const getActivityTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'literacy':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'numeracy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'science':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'art':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'music':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'physical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'social':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTime = (time?: string) => {
    if (!time) return '';
    try {
      return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return time;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Activity Date *
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Class
          </label>
          <select
            value={selectedClassId || ''}
            onChange={(e) => setSelectedClassId(e.target.value ? Number(e.target.value) : null)}
            className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.class_name} ({cls.class_code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="text-gray-500">No activities found for {formatDate(selectedDate)}</p>
            <p className="text-sm text-gray-400 mt-1">
              {selectedClassId ? 'Try selecting a different class or date' : 'Try selecting a different date'}
            </p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
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
                  <div className="text-sm text-gray-600">Total Duration</div>
                </div>
              </div>
            </div>

            {/* Activities List */}
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {activity.title}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getActivityTypeColor(activity.activity_type)}`}>
                          {activity.activity_type.charAt(0).toUpperCase() + activity.activity_type.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          {activity.class_name}
                        </span>
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {activity.start_time && activity.end_time 
                            ? `${formatTime(activity.start_time)} - ${formatTime(activity.end_time)}`
                            : `${activity.duration_minutes} minutes`
                          }
                        </span>
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          {activity.student_count} students
                        </span>
                      </div>
                    </div>
                  </div>

                  {activity.description && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium text-gray-900">Description: </span>
                        {activity.description}
                      </p>
                    </div>
                  )}

                  {activity.learning_objectives && (
                    <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium text-blue-800">Learning Objectives: </span>
                        {activity.learning_objectives}
                      </p>
                    </div>
                  )}

                  {activity.materials_used && (
                    <div className="mb-3 p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium text-green-800">Materials Used: </span>
                        {activity.materials_used}
                      </p>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-500">
                      Recorded {new Date(activity.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ViewActivities;