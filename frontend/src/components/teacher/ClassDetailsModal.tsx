import React from 'react';

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

interface ClassDetailsModalProps {
  classItem: Class | null;
  isOpen: boolean;
  onClose: () => void;
}

const ClassDetailsModal: React.FC<ClassDetailsModalProps> = ({
  classItem,
  isOpen,
  onClose
}) => {
  if (!isOpen || !classItem) return null;

  const getAgeGroupColor = (ageGroup: string) => {
    const group = ageGroup.toLowerCase();
    if (group.includes('infant') || group.includes('baby')) {
      return 'bg-pink-100 text-pink-800 border-pink-200';
    } else if (group.includes('toddler') || group.includes('1-2')) {
      return 'bg-orange-100 text-orange-800 border-orange-200';
    } else if (group.includes('preschool') || group.includes('3-4')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    } else if (group.includes('kindergarten') || group.includes('5-6')) {
      return 'bg-green-100 text-green-800 border-green-200';
    } else {
      return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCapacityStatus = (capacity: number) => {
    if (capacity <= 10) {
      return { color: 'text-green-600', label: 'Small Class', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
    } else if (capacity <= 20) {
      return { color: 'text-blue-600', label: 'Medium Class', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' };
    } else {
      return { color: 'text-orange-600', label: 'Large Class', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' };
    }
  };

  const capacityStatus = getCapacityStatus(classItem.capacity);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{classItem.class_name}</h2>
            <p className="text-sm text-gray-600 mt-1">Class Details</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Class Name</label>
                <p className="text-gray-900 font-medium">{classItem.class_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Class Code</label>
                <p className="text-gray-900 font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                  {classItem.class_code}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Academic Year</label>
                <p className="text-gray-900">{classItem.academic_year}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  classItem.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {classItem.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Age Group and Capacity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`rounded-lg p-4 border ${getAgeGroupColor(classItem.age_group)}`}>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <div>
                  <h4 className="font-medium">Age Group</h4>
                  <p className="text-sm">{classItem.age_group}</p>
                </div>
              </div>
            </div>

            <div className={`rounded-lg p-4 border ${capacityStatus.bgColor} ${capacityStatus.borderColor}`}>
              <div className="flex items-center space-x-2">
                <svg className={`w-5 h-5 ${capacityStatus.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <div>
                  <h4 className={`font-medium ${capacityStatus.color}`}>Capacity</h4>
                  <p className={`text-sm ${capacityStatus.color}`}>
                    {classItem.capacity} students ({capacityStatus.label})
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <h4 className="font-medium text-blue-900">Room Location</h4>
                <p className="text-sm text-blue-800">Room {classItem.room_number}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          {classItem.description && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Description</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed">{classItem.description}</p>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Quick Stats</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{classItem.capacity}</div>
                <div className="text-xs text-gray-600">Max Capacity</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {classItem.room_number}
                </div>
                <div className="text-xs text-gray-600">Room Number</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {classItem.is_active ? '✓' : '✗'}
                </div>
                <div className="text-xs text-gray-600">Status</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {classItem.academic_year.split('-')[0]}
                </div>
                <div className="text-xs text-gray-600">Academic Year</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassDetailsModal;