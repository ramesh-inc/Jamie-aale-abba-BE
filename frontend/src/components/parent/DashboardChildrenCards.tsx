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

interface DashboardChildrenCardsProps {
  onChildSelect?: (childId: number) => void;
  selectedChildId?: number;
}

const DashboardChildrenCards: React.FC<DashboardChildrenCardsProps> = ({ 
  onChildSelect, 
  selectedChildId 
}) => {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await parentApi.getChildren();
      setChildren(response);
      // Auto-select first child if none selected
      if (response.length > 0 && !selectedChildId && onChildSelect) {
        onChildSelect(response[0].id);
      }
    } catch (error: any) {
      console.error('Error fetching children:', error);
      setError('Failed to load children. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultAvatar = (name: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4F46E5&color=fff&size=64`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">My Children</h3>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">My Children</h3>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={fetchChildren}
            className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">My Children</h3>
        <div className="text-center py-8">
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
          <h4 className="mt-2 text-sm font-medium text-gray-900">No children added</h4>
          <p className="mt-1 text-sm text-gray-500">
            Add your first child to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">My Children</h3>
        <span className="text-sm text-gray-500">
          {children.length} child{children.length !== 1 ? 'ren' : ''}
        </span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {children.map((child) => (
          <div
            key={child.id}
            onClick={() => onChildSelect?.(child.id)}
            className={`p-6 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-md relative ${
              selectedChildId === child.id
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Selection Indicator */}
            {selectedChildId === child.id && (
              <div className="absolute top-3 right-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}

            {/* Profile Picture - Centered at top */}
            <div className="flex justify-center mb-4">
              <img
                src={child.avatar_url || getDefaultAvatar(child.student_name)}
                alt={child.student_name}
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getDefaultAvatar(child.student_name);
                }}
              />
            </div>
            
            {/* Child Info - Centered below avatar */}
            <div className="text-center space-y-1">
              <h4 className="text-base font-semibold text-gray-900">
                {child.student_name}
              </h4>
              <p className="text-sm text-gray-500">
                {child.current_class_name !== 'Not Assigned' 
                  ? child.current_class_name 
                  : 'Not enrolled'
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
      </div>
      
    </div>
  );
};

export default DashboardChildrenCards;