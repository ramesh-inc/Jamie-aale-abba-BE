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
  id: number;
  student: {
    id: number;
    student_name: string;
    student_id: string;
  };
  attendance_date: string;
  status: 'present' | 'absent' | 'late';
  notes?: string;
  marked_by: {
    id: number;
    first_name: string;
    last_name: string;
  };
  marked_at: string;
}

const AttendanceViewing: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'class' | 'student'>('class');
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

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
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStudents = useCallback(async () => {
    if (!selectedClass) return;

    setLoading(true);
    try {
      const response = await teacherApi.getClassStudents(selectedClass);
      // Handle the response structure from backend: { success: true, data: [...], count: n, class_info: {...} }
      const studentsData = response.data || response;
      const activeStudents = Array.isArray(studentsData) ? studentsData.filter(student => student.is_active) : [];
      setStudents(activeStudents);
    } catch (error) {
      console.error('Failed to load students:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedClass]);

  const loadAttendanceData = useCallback(async () => {
    if (!selectedClass) return;

    setLoading(true);
    try {
      // Build parameters for the API call
      const params: any = {
        class_id: selectedClass,
      };

      if (viewMode === 'student' && selectedStudent) {
        params.student_id = selectedStudent;
      }

      if (startDate) {
        params.start_date = startDate;
      }

      if (endDate) {
        params.end_date = endDate;
      }

      const response = await teacherApi.getAttendance(params);
      // Handle the response structure from backend: { success: true, data: [...], count: n, filters: {...} }
      const recordsData = response.data || response;
      let records = Array.isArray(recordsData) ? recordsData : [];

      // Filter by date range on frontend (if not already filtered by backend)
      if (startDate && endDate && !params.start_date && !params.end_date) {
        records = records.filter(record => {
          const recordDate = record.attendance_date;
          return recordDate >= startDate && recordDate <= endDate;
        });
      }

      setAttendanceRecords(records);
    } catch (error) {
      console.error('Failed to load attendance data:', error);
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedStudent, startDate, endDate, viewMode]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'text-green-600 bg-green-100';
      case 'absent':
        return 'text-red-600 bg-red-100';
      case 'late':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'absent':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      case 'late':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Group attendance records by date for class view
  const groupedAttendance = attendanceRecords.reduce((acc, record) => {
    const date = record.attendance_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(record);
    return acc;
  }, {} as Record<string, AttendanceRecord[]>);

  const toggleDateExpansion = (date: string) => {
    const newExpandedDates = new Set(expandedDates);
    if (newExpandedDates.has(date)) {
      newExpandedDates.delete(date);
    } else {
      newExpandedDates.add(date);
    }
    setExpandedDates(newExpandedDates);
  };

  const expandAllDates = () => {
    setExpandedDates(new Set(Object.keys(groupedAttendance)));
  };

  const collapseAllDates = () => {
    setExpandedDates(new Set());
  };

  // Initialize date range (last 30 days)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  // Load classes on component mount
  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  // Load students when class is selected
  useEffect(() => {
    if (selectedClass && viewMode === 'student') {
      loadStudents();
    }
  }, [selectedClass, viewMode, loadStudents]);

  // Load attendance data when filters change
  useEffect(() => {
    if (selectedClass && startDate && endDate) {
      // For student view, also require student selection
      if (viewMode === 'student' && !selectedStudent) {
        return; // Don't load data until student is selected
      }
      loadAttendanceData();
    }
  }, [selectedClass, selectedStudent, startDate, endDate, viewMode, loadAttendanceData]);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">View Attendance Records</h2>
        
        {/* View Mode Toggle */}
        <div className="mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => {
                setViewMode('class');
                setSelectedStudent(null);
              }}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                viewMode === 'class'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Class View
            </button>
            <button
              onClick={() => setViewMode('student')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                viewMode === 'student'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Individual Student
            </button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range */}
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              id="start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              id="end-date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
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
            >
              <option value="">Select a class...</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.class_name} ({cls.class_code})
                </option>
              ))}
            </select>
          </div>

          {/* Student Selection (only for student view) */}
          {viewMode === 'student' && (
            <div>
              <label htmlFor="student-select" className="block text-sm font-medium text-gray-700 mb-2">
                Select Student
              </label>
              <select
                id="student-select"
                value={selectedStudent || ''}
                onChange={(e) => setSelectedStudent(e.target.value ? Number(e.target.value) : null)}
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!selectedClass}
              >
                <option value="">Select a student...</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.student_name} ({student.student_id})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Attendance Records */}
      {selectedClass && (viewMode === 'class' || selectedStudent) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : attendanceRecords.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500">No attendance records found for the selected criteria.</p>
            </div>
          ) : (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Attendance Records ({attendanceRecords.length} entries)
                </h3>
                
                {viewMode === 'class' && Object.keys(groupedAttendance).length > 0 && (
                  <div className="flex space-x-2">
                    <button
                      onClick={expandAllDates}
                      className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 border border-blue-300 hover:border-blue-400 rounded-md transition-colors"
                    >
                      Expand All
                    </button>
                    <button
                      onClick={collapseAllDates}
                      className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-700 border border-gray-300 hover:border-gray-400 rounded-md transition-colors"
                    >
                      Collapse All
                    </button>
                  </div>
                )}
              </div>

              {viewMode === 'class' ? (
                /* Class View - Group by Date */
                <div className="space-y-4">
                  {Object.entries(groupedAttendance)
                    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                    .map(([date, records]) => {
                      const isExpanded = expandedDates.has(date);
                      return (
                        <div key={date} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div 
                            className="bg-gray-50 px-4 py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => toggleDateExpansion(date)}
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-gray-900">
                                {formatDate(date)} - {records.length} students
                              </h4>
                              <svg 
                                className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`}
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Student
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Notes
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Marked At
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {records.map((record) => (
                                    <tr key={record.id}>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                          <div className="text-sm font-medium text-gray-900">
                                            {record.student.student_name}
                                          </div>
                                          <div className="text-sm text-gray-500">
                                            ID: {record.student.student_id}
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                                          {getStatusIcon(record.status)}
                                          <span className="ml-1">{record.status.charAt(0).toUpperCase() + record.status.slice(1)}</span>
                                        </span>
                                      </td>
                                      <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 max-w-xs truncate">
                                          {record.notes || '-'}
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatTime(record.marked_at)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              ) : (
                /* Student View - Individual History */
                <div className="space-y-4">
                  {attendanceRecords
                    .sort((a, b) => new Date(b.attendance_date).getTime() - new Date(a.attendance_date).getTime())
                    .map((record) => (
                      <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(record.status)}`}>
                              {getStatusIcon(record.status)}
                              <span className="ml-2">{record.status.charAt(0).toUpperCase() + record.status.slice(1)}</span>
                            </span>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {formatDate(record.attendance_date)}
                              </div>
                              <div className="text-sm text-gray-500">
                                Marked at {formatTime(record.marked_at)}
                              </div>
                            </div>
                          </div>
                          {record.notes && (
                            <div className="max-w-md">
                              <div className="text-sm text-gray-900">{record.notes}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceViewing;