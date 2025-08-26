import React, { useState, useEffect } from 'react';
import { teacherApi } from '../../services/api';
import TeacherLearningActivitiesChart from './TeacherLearningActivitiesChart';
import TeacherAttendanceChart from './TeacherAttendanceChart';

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

interface Student {
  id: number;
  student_name: string;
  student_id: string;
  date_of_birth: string;
  gender: string;
  medical_conditions?: string;
  is_active: boolean;
}

const Reports: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const response = await teacherApi.getMyClasses();
      const classesData = response.data || response;
      const activeClasses = Array.isArray(classesData) ? classesData.filter(cls => cls.is_active) : [];
      setClasses(activeClasses);
    } catch (error) {
      console.error('Failed to load classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    if (!selectedClass) return;

    setLoading(true);
    try {
      const response = await teacherApi.getClassStudents(selectedClass);
      const studentsData = response.data || response;
      const activeStudents = Array.isArray(studentsData) ? studentsData.filter(student => student.is_active) : [];
      setStudents(activeStudents);
    } catch (error) {
      console.error('Failed to load students:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadStudents();
      setSelectedStudent(null); // Reset selected student when class changes
    } else {
      setStudents([]);
      setSelectedStudent(null);
    }
  }, [selectedClass]);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Student Reports</h2>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  {cls.class_name} ({cls.class_code})
                </option>
              ))}
            </select>
          </div>

          {/* Student Selection */}
          <div>
            <label htmlFor="student-select" className="block text-sm font-medium text-gray-700 mb-2">
              Select Student
            </label>
            <select
              id="student-select"
              value={selectedStudent || ''}
              onChange={(e) => setSelectedStudent(e.target.value ? Number(e.target.value) : null)}
              className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={!selectedClass || loading}
            >
              <option value="">Select a student...</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.student_name} ({student.student_id})
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-4 mt-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600">Loading...</span>
          </div>
        )}
      </div>

      {/* Charts Section */}
      {selectedStudent && (
        <div className="space-y-6">
          {/* Learning Activities Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <TeacherLearningActivitiesChart 
              selectedStudentId={selectedStudent}
            />
          </div>

          {/* Attendance Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <TeacherAttendanceChart 
              selectedStudentId={selectedStudent}
            />
          </div>
        </div>
      )}

      {/* Empty State */}
      {!selectedStudent && selectedClass && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-gray-500">Select a student to view their learning activities and attendance reports.</p>
          </div>
        </div>
      )}

      {!selectedClass && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-gray-500">Select a class to get started with student reports.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;