import { useState, useEffect, useCallback } from 'react';
import { teacherApi } from '../../services/api';

interface Student {
  id: number;
  student_name: string;
  student_id: string;
  date_of_birth: string;
  gender: string;
  medical_conditions?: string;
  is_active: boolean;
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

interface AttendanceRecord {
  student_id: number;
  status: 'present' | 'absent' | 'late';
  remarks?: string;
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

const AttendanceMarking: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
  );
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [markedDates, setMarkedDates] = useState<string[]>([]);
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
      // Handle the response structure from backend: { success: true, data: [...], count: n }
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

  const loadMarkedDates = useCallback(async () => {
    if (!selectedClass) return;

    try {
      const response = await teacherApi.getMarkedAttendanceDates(selectedClass);
      const markedDatesData = response.data?.marked_dates || [];
      setMarkedDates(markedDatesData);
    } catch (error) {
      console.error('Failed to load marked dates:', error);
      // Don't show error notification for this since it's not critical
    }
  }, [selectedClass]);

  const loadStudents = useCallback(async () => {
    if (!selectedClass) return;

    setLoading(true);
    try {
      const response = await teacherApi.getClassStudents(selectedClass);
      // Handle the response structure from backend: { success: true, data: [...], count: n, class_info: {...} }
      const studentsData = response.data || response;
      const activeStudents = Array.isArray(studentsData) ? studentsData.filter(student => student.is_active) : [];
      setStudents(activeStudents);
      
      // Initialize attendance records with default 'present' status
      const initialRecords: AttendanceRecord[] = activeStudents.map(student => ({
        student_id: student.id,
        status: 'present',
        remarks: ''
      }));
      setAttendanceRecords(initialRecords);
    } catch (error) {
      console.error('Failed to load students:', error);
      setNotification({
        message: 'Failed to load students. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [selectedClass]);

  const updateAttendanceStatus = (studentId: number, status: 'present' | 'absent' | 'late') => {
    setAttendanceRecords(prev =>
      prev.map(record =>
        record.student_id === studentId
          ? { ...record, status }
          : record
      )
    );
  };

  const updateRemarks = (studentId: number, remarks: string) => {
    setAttendanceRecords(prev =>
      prev.map(record =>
        record.student_id === studentId
          ? { ...record, remarks }
          : record
      )
    );
  };

  const saveAttendance = async () => {
    if (!selectedClass || attendanceRecords.length === 0) {
      setNotification({
        message: 'Please select a class and mark attendance for students.',
        type: 'error'
      });
      return;
    }

    setSaving(true);
    try {
      // Prepare attendance data for API call
      const attendanceData = {
        class_id: selectedClass,
        attendance_date: selectedDate,
        attendance_records: attendanceRecords.map(record => ({
          student_id: record.student_id,
          status: record.status,
          notes: record.remarks || undefined
        }))
      };

      await teacherApi.markAttendance(attendanceData);
      
      setNotification({
        message: `Attendance for ${selectedDate} has been saved successfully!`,
        type: 'success'
      });
      
      // Refresh marked dates to include the newly saved date
      if (selectedClass) {
        await loadMarkedDates();
      }
      
      // Reset form after successful save
      setSelectedClass(null);
      setStudents([]);
      setAttendanceRecords([]);
      setMarkedDates([]);
    } catch (error) {
      console.error('Failed to save attendance:', error);
      let errorMessage = 'Failed to save attendance. Please try again.';
      
      // Handle specific error messages from the API
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      setNotification({
        message: errorMessage,
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'absent':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'late':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Load classes on component mount
  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  // Load students and marked dates when class is selected
  useEffect(() => {
    if (selectedClass) {
      loadStudents();
      loadMarkedDates();
    } else {
      setStudents([]);
      setAttendanceRecords([]);
      setMarkedDates([]);
    }
  }, [selectedClass, loadStudents, loadMarkedDates]);

  // Helper function to check if a date is already marked
  const isDateMarked = (date: string) => {
    return markedDates.includes(date);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Mark Attendance</h2>
        
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Date Selection */}
          <div>
            <label htmlFor="attendance-date" className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <div className="relative">
              <input
                type="date"
                id="attendance-date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]} // Cannot select future dates
                className={`w-full h-10 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 ${
                  selectedClass && isDateMarked(selectedDate)
                    ? 'border-red-300 bg-red-50 text-red-900 focus:ring-red-500 pr-10'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {selectedClass && isDateMarked(selectedDate) && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            {selectedClass && isDateMarked(selectedDate) && (
              <p className="mt-2 text-sm text-red-600">
                Attendance for this date has already been marked for this class.
              </p>
            )}
          </div>

          {/* Class Selection */}
          <div>
            <label htmlFor="class-select" className="block text-sm font-medium text-gray-700 mb-2">
              Select Class
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
        </div>
      </div>

      {/* Student List and Attendance */}
      {selectedClass && students.length > 0 && !isDateMarked(selectedDate) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Students ({students.length})
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span>Present</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <span>Absent</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <span>Late</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {students.map((student) => {
              const attendanceRecord = attendanceRecords.find(r => r.student_id === student.id);
              return (
                <div key={student.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                    {/* Student Info */}
                    <div className="space-y-1">
                      <h4 className="font-medium text-gray-900">{student.student_name}</h4>
                      <p className="text-sm text-gray-600">ID: {student.student_id}</p>
                      <p className="text-sm text-gray-600">
                        Age: {new Date().getFullYear() - new Date(student.date_of_birth).getFullYear()} years
                      </p>
                    </div>

                    {/* Attendance Status */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <div className="flex space-x-2">
                        {['present', 'absent', 'late'].map((status) => (
                          <button
                            key={status}
                            onClick={() => updateAttendanceStatus(student.id, status as 'present' | 'absent' | 'late')}
                            className={`px-3 py-2 text-sm font-medium rounded-md border transition-colors ${
                              attendanceRecord?.status === status
                                ? getStatusColor(status)
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Remarks */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Remarks (Optional)</label>
                      <input
                        type="text"
                        placeholder="Add remarks..."
                        value={attendanceRecord?.remarks || ''}
                        onChange={(e) => updateRemarks(student.id, e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Save Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={saveAttendance}
              disabled={saving || isDateMarked(selectedDate)}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </div>
              ) : isDateMarked(selectedDate) ? (
                'Attendance Already Marked'
              ) : (
                'Save Attendance'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Empty State */}
      {selectedClass && !loading && students.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          <p className="text-gray-500">No students found in this class.</p>
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

export default AttendanceMarking;