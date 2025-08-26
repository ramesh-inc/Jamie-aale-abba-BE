import React, { useState } from 'react';
import ViewActivities from './ViewActivities';
import ActivityRecording from './ActivityRecording';

const ActivitiesManagement: React.FC = () => {
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRecordActivity = () => {
    setShowRecordingModal(true);
  };

  const handleCloseModal = () => {
    setShowRecordingModal(false);
  };

  const handleActivityRecorded = () => {
    setShowRecordingModal(false);
    // Increment refresh trigger to force ViewActivities to refresh
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header with Record Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Learning Activities</h2>
          <p className="text-sm text-gray-600 mt-1">View and manage learning activities</p>
        </div>
        <button
          onClick={handleRecordActivity}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Record Activity</span>
        </button>
      </div>

      {/* View Activities Component */}
      <ViewActivities refreshTrigger={refreshTrigger} />

      {/* Modal for Recording Activity */}
      {showRecordingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Record Learning Activity</h2>
                <p className="text-blue-100 mt-1">Plan and record learning activities</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-white hover:text-gray-200 transition-colors p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
              <ActivityRecording onActivityRecorded={handleActivityRecorded} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivitiesManagement;