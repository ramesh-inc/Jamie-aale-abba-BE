import React, { useState, useEffect } from 'react';
import { parentApi } from '../../services/api';

interface Child {
  id: number;
  student_name: string;
  student_id: string;
  date_of_birth: string;
  gender: string;
  avatar_url: string;
  current_class_name: string;
  age: number | null;
  relationship_type: string;
}

interface ChildDetailData {
  id: number;
  student_name: string;
  student_id: string;
  date_of_birth: string;
  gender: string;
  avatar_url: string;
  medical_conditions: string;
  current_class: {
    id: number;
    class_name: string;
    class_code: string;
    age_group: string;
    room_number: string;
    enrollment_date: string;
  } | null;
  age: number | null;
  relationship_info: {
    relationship_type: string;
    is_primary_contact: boolean;
    pickup_authorized: boolean;
  } | null;
  created_at: string;
  updated_at: string;
}

interface ViewChildrenProps {
  onAddChild?: () => void;
}

const ViewChildren: React.FC<ViewChildrenProps> = ({ onAddChild }) => {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await parentApi.getChildren();
      setChildren(response);
    } catch (error: any) {
      console.error('Error fetching children:', error);
      setError('Failed to load children. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (childId: number) => {
    try {
      const response = await parentApi.getChildDetails(childId);
      setSelectedChild(response);
      setShowDetailModal(true);
    } catch (error: any) {
      console.error('Error fetching child details:', error);
      setError('Failed to load child details. Please try again.');
    }
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedChild(null);
  };

  const getDefaultAvatar = (name: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4F46E5&color=fff&size=80`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={fetchChildren}
              className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Who's here?</h2>
        <p className="text-gray-600">
          {children.length === 0 
            ? 'Add your first child to get started' 
            : `${children.length} child${children.length !== 1 ? 'ren' : ''} in your family`
          }
        </p>
      </div>

      {/* Children Grid */}
      {children.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No children added</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first child.
          </p>
          {onAddChild && (
            <div className="mt-6">
              <button
                onClick={onAddChild}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add Child
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {children.map((child) => (
            <div
              key={child.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 cursor-pointer group"
              onClick={() => handleViewDetails(child.id)}
            >
              {/* Profile Picture */}
              <div className="flex justify-center mb-4">
                <img
                  src={child.avatar_url || getDefaultAvatar(child.student_name)}
                  alt={child.student_name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-100 group-hover:border-blue-200 transition-colors"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getDefaultAvatar(child.student_name);
                  }}
                />
              </div>

              {/* Child Information */}
              <div className="text-center space-y-2">
                <h3 className="text-base font-semibold text-gray-900 truncate">
                  {child.student_name}
                </h3>
                
                <p className="text-sm text-gray-500">
                  {child.current_class_name !== 'Not Assigned' 
                    ? child.current_class_name 
                    : 'Not enrolled yet'
                  }
                </p>
                
                {child.age !== null && (
                  <p className="text-xs text-gray-400">
                    {child.age} years old
                  </p>
                )}
              </div>
            </div>
          ))}
          
          {/* Add Child Card */}
          {onAddChild && (
            <div
              className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl shadow-sm border-2 border-dashed border-amber-200 p-6 hover:shadow-md hover:border-amber-300 transition-all duration-200 cursor-pointer group flex flex-col items-center justify-center min-h-[140px]"
              onClick={onAddChild}
            >
              <div className="flex justify-center mb-3">
                <div className="w-16 h-16 rounded-full bg-amber-200 flex items-center justify-center group-hover:bg-amber-300 transition-colors">
                  <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-base font-semibold text-amber-800 mb-1">
                  Add a Child
                </h3>
                <p className="text-sm text-amber-600">
                  Add your child's profile
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Child Detail Modal */}
      {showDetailModal && selectedChild && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Child Details</h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Child Information */}
              <div className="space-y-6">
                {/* Profile Section */}
                <div className="flex items-center space-x-4">
                  <img
                    src={selectedChild.avatar_url || getDefaultAvatar(selectedChild.student_name)}
                    alt={selectedChild.student_name}
                    className="w-24 h-24 rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getDefaultAvatar(selectedChild.student_name);
                    }}
                  />
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">
                      {selectedChild.student_name}
                    </h4>
                    {selectedChild.student_id && (
                      <p className="text-gray-600">Student ID: {selectedChild.student_id}</p>
                    )}
                    {selectedChild.age !== null && (
                      <p className="text-gray-600">Age: {selectedChild.age} years old</p>
                    )}
                  </div>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 bg-gray-100 px-2 py-1 rounded-sm mb-1">Date of Birth</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatDate(selectedChild.date_of_birth)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 bg-gray-100 px-2 py-1 rounded-sm mb-1">Gender</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">
                      {selectedChild.gender}
                    </p>
                  </div>
                </div>

                {/* Class Information */}
                {selectedChild.current_class && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Class
                    </label>
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Class:</span> {selectedChild.current_class.class_name}
                        </div>
                        <div>
                          <span className="font-medium">Code:</span> {selectedChild.current_class.class_code}
                        </div>
                        <div>
                          <span className="font-medium">Age Group:</span> {selectedChild.current_class.age_group}
                        </div>
                        <div>
                          <span className="font-medium">Room:</span> {selectedChild.current_class.room_number}
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium">Enrolled:</span> {formatDate(selectedChild.current_class.enrollment_date)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Relationship Information */}
                {selectedChild.relationship_info && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Relationship
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Relationship:</span>{' '}
                          <span className="capitalize">{selectedChild.relationship_info.relationship_type}</span>
                        </div>
                        <div>
                          <span className="font-medium">Primary Contact:</span>{' '}
                          <span className={selectedChild.relationship_info.is_primary_contact ? 'text-green-600' : 'text-gray-600'}>
                            {selectedChild.relationship_info.is_primary_contact ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Pickup Authorized:</span>{' '}
                          <span className={selectedChild.relationship_info.pickup_authorized ? 'text-green-600' : 'text-red-600'}>
                            {selectedChild.relationship_info.pickup_authorized ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Medical Conditions */}
                {selectedChild.medical_conditions && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Medical Conditions / Allergies
                    </label>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                      <p className="text-sm text-gray-900">
                        {selectedChild.medical_conditions}
                      </p>
                    </div>
                  </div>
                )}

                {/* Added Date */}
                <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
                  Added on {formatDate(selectedChild.created_at)}
                  {selectedChild.updated_at !== selectedChild.created_at && (
                    <span> • Last updated {formatDate(selectedChild.updated_at)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewChildren;