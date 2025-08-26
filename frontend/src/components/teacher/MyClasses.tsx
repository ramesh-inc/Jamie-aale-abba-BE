import { useState, useEffect, useCallback } from 'react';
import { teacherApi } from '../../services/api';
import ClassStudentsModal from './ClassStudentsModal';
import ClassDetailsModal from './ClassDetailsModal';

interface Class {
  id: number;
  class_name: string;
  class_code: string;
  age_group: string;
  capacity: number;
  room_number: string;
  academic_year: string;
  is_active: boolean;
  description?: string;
}

interface NotificationModalProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
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

const MyClasses: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [studentsModal, setStudentsModal] = useState<{
    isOpen: boolean;
    classId: number | null;
    className: string;
  }>({
    isOpen: false,
    classId: null,
    className: ''
  });
  const [detailsModal, setDetailsModal] = useState<{
    isOpen: boolean;
    classItem: Class | null;
  }>({
    isOpen: false,
    classItem: null
  });

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

  const handleViewStudents = (classId: number, className: string) => {
    setStudentsModal({
      isOpen: true,
      classId,
      className
    });
  };

  const handleCloseStudentsModal = () => {
    setStudentsModal({
      isOpen: false,
      classId: null,
      className: ''
    });
  };

  const handleViewDetails = (classItem: Class) => {
    setDetailsModal({
      isOpen: true,
      classItem
    });
  };

  const handleCloseDetailsModal = () => {
    setDetailsModal({
      isOpen: false,
      classItem: null
    });
  };

  const getAgeGroupColor = (ageGroup: string) => {
    const group = ageGroup.toLowerCase();
    if (group.includes('infant') || group.includes('baby')) {
      return 'bg-pink-100 text-pink-800';
    } else if (group.includes('toddler') || group.includes('1-2')) {
      return 'bg-orange-100 text-orange-800';
    } else if (group.includes('preschool') || group.includes('3-4')) {
      return 'bg-blue-100 text-blue-800';
    } else if (group.includes('kindergarten') || group.includes('5-6')) {
      return 'bg-green-100 text-green-800';
    } else {
      return 'bg-gray-100 text-gray-800';
    }
  };

  const getCapacityStatus = (capacity: number) => {
    if (capacity <= 10) {
      return { color: 'text-green-600', label: 'Small' };
    } else if (capacity <= 20) {
      return { color: 'text-blue-600', label: 'Medium' };
    } else {
      return { color: 'text-orange-600', label: 'Large' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">My Classes</h2>
        <p className="text-gray-600">Manage and view details of your assigned classes</p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Classes Grid */}
      {!loading && classes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((classItem) => {
            const capacityStatus = getCapacityStatus(classItem.capacity);
            return (
              <div key={classItem.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Class Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {classItem.class_name}
                      </h3>
                      <p className="text-sm text-gray-600">Code: {classItem.class_code}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAgeGroupColor(classItem.age_group)}`}>
                      {classItem.age_group}
                    </span>
                  </div>

                  {/* Class Details */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm text-gray-600">Room</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{classItem.room_number}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                        <span className="text-sm text-gray-600">Capacity</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">{classItem.capacity}</span>
                        <span className={`text-xs ${capacityStatus.color}`}>({capacityStatus.label})</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h2z" />
                        </svg>
                        <span className="text-sm text-gray-600">Academic Year</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{classItem.academic_year}</span>
                    </div>
                  </div>

                  {/* Description */}
                  {classItem.description && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-600 line-clamp-2">{classItem.description}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-6 flex space-x-3">
                    <button 
                      onClick={() => handleViewStudents(classItem.id, classItem.class_name)}
                      className="flex-1 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    >
                      View Students
                    </button>
                    <button 
                      onClick={() => handleViewDetails(classItem)}
                      className="flex-1 bg-gray-100 text-gray-700 text-sm font-medium px-4 py-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                    >
                      Class Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && classes.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Assigned</h3>
          <p className="text-gray-500">You haven't been assigned to any classes yet. Contact your administrator for class assignments.</p>
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

      {/* Students Modal */}
      <ClassStudentsModal
        classId={studentsModal.classId || 0}
        className={studentsModal.className}
        isOpen={studentsModal.isOpen}
        onClose={handleCloseStudentsModal}
      />

      {/* Class Details Modal */}
      <ClassDetailsModal
        classItem={detailsModal.classItem}
        isOpen={detailsModal.isOpen}
        onClose={handleCloseDetailsModal}
      />
    </div>
  );
};

export default MyClasses;