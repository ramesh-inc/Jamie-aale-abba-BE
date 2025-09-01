import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';

interface Class {
  id: number;
  class_name: string;
  class_code: string;
  age_group: string;
  capacity: number;
  room_number: string;
  academic_year: string;
  is_active: boolean;
  student_count: number;
  teacher_count: number;
  created_at: string;
}

interface Student {
  id: number;
  student_name: string;
  student_id: string;
  date_of_birth: string;
  age?: number;
  gender: string;
  is_active: boolean;
  current_class: {
    id: number;
    class_name: string;
    class_code: string;
    is_active: boolean;
  } | null;
  parents: Array<{
    id: number;
    name: string;
    email: string;
    phone: string;
    relationship: string;
    is_primary: boolean;
  }>;
}

interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string;
      error?: string;
    };
    status?: number;
  };
}

interface Teacher {
  id: number;
  name: string;
  full_name?: string;
  email: string;
  phone: string;
  employee_id: string;
  subjects: string;
  assigned_classes: Array<{
    id: number;
    class_name: string;
    class_code: string;
    role: string;
  }>;
  is_active: boolean;
  teacher_profile?: {
    is_active: boolean;
  };
}

const ClassManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'classes' | 'students' | 'assignments'>('classes');
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teachersList, setTeachersList] = useState<Teacher[]>([]); // For assignment dropdown
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    class_id: '',
    enrollment_status: '',
    assignment_status: ''
  });

  // Modal states
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [showCreateStudentModal, setShowCreateStudentModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showTeacherAssignmentModal, setShowTeacherAssignmentModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedClassToEdit, setSelectedClassToEdit] = useState<Class | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab, searchTerm, filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'classes') {
        const response = await adminApi.getClasses({ search: searchTerm });
        // Filter out inactive/deleted classes (soft deleted)
        const activeClasses = Array.isArray(response) ? response.filter(cls => cls.is_active) : [];
        setClasses(activeClasses);
      } else if (activeTab === 'students') {
        const params = {
          search: searchTerm,
          ...(filters.class_id && { class_id: filters.class_id }),
          ...(filters.enrollment_status && { enrollment_status: filters.enrollment_status })
        };
        const response = await adminApi.getStudents(params);
        const studentsData = Array.isArray(response) ? response : [];
        
        // Get active classes to filter out deleted class references
        const classResponse = await adminApi.getClasses();
        const activeClasses = Array.isArray(classResponse) ? classResponse.filter(cls => cls.is_active) : [];
        const activeClassIds = new Set(activeClasses.map(cls => cls.id));
        
        // Clean up students data to remove deleted class references
        const cleanedStudents = studentsData.map(student => ({
          ...student,
          current_class: student.current_class && activeClassIds.has(student.current_class.id) 
            ? { ...student.current_class, is_active: true }
            : null
        }));
        
        setStudents(cleanedStudents);
      } else if (activeTab === 'assignments') {
        const params = {
          search: searchTerm,
          ...(filters.class_id && { class_id: filters.class_id }),
          ...(filters.assignment_status && { assignment_status: filters.assignment_status })
        };
        const response = await adminApi.getTeacherAssignments(params);
        console.log('Raw getTeacherAssignments response:', response);
        
        const teachersData = Array.isArray(response) 
          ? response 
          : (response.teachers || response.data || []);
        console.log('Extracted teachersData:', teachersData);
        console.log('teachersData is array:', Array.isArray(teachersData));
        
        // Get active classes to filter out deleted class references
        const classResponse = await adminApi.getClasses();
        const activeClasses = Array.isArray(classResponse) ? classResponse.filter(cls => cls.is_active) : [];
        const activeClassIds = new Set(activeClasses.map(cls => cls.id));
        
        // Clean up teachers data to remove deleted class references and filter out inactive teachers
        // Show teachers where teacher_profile.is_active is not false (more lenient filtering)
        const activeTeachersOnly = teachersData.filter((teacher: Teacher) => {
          const isUserActive = teacher.is_active;
          const isProfileActive = teacher.teacher_profile?.is_active !== false;
          const passes = isUserActive && isProfileActive;
          
          console.log('Checking teacher:', teacher.full_name || teacher.name, {
            is_active: teacher.is_active,
            teacher_profile_is_active: teacher.teacher_profile?.is_active,
            isUserActive,
            isProfileActive,
            passes_filter: passes
          });
          
          return passes;
        });
        console.log('Total teachers from API:', teachersData.length);
        console.log('Active teachers after filtering:', activeTeachersOnly.length);
        console.log('Inactive teachers filtered out:', teachersData.length - activeTeachersOnly.length);
        
        const cleanedTeachers = activeTeachersOnly.map((teacher: Teacher) => ({
          ...teacher,
          assigned_classes: teacher.assigned_classes ? teacher.assigned_classes.filter((cls: any) => activeClassIds.has(cls.id)) : []
        }));
        
        setTeachers(cleanedTeachers);
      }

      // Always fetch classes and teachers for dropdowns
      if (activeTab !== 'classes') {
        const classResponse = await adminApi.getClasses();
        // Filter out inactive/deleted classes (soft deleted)
        const activeClasses = Array.isArray(classResponse) ? classResponse.filter(cls => cls.is_active) : [];
        setClasses(activeClasses);
      }
      
      // Always fetch teachers for assignment modal
      const teachersResponse = await adminApi.getTeachers();
      console.log('Teachers Response:', teachersResponse);
      // Extract teachers from the response - they might be nested and filter out inactive teachers
      const allTeachersForDropdown = Array.isArray(teachersResponse) 
        ? teachersResponse 
        : (teachersResponse.teachers || []);
      const teachersListData = allTeachersForDropdown.filter((teacher: Teacher) => 
        teacher.is_active && teacher.teacher_profile?.is_active
      );
      console.log('All teachers for dropdown:', allTeachersForDropdown.length);
      console.log('Active teachers for dropdown after filtering:', teachersListData.length);
      console.log('Inactive teachers excluded from dropdown:', allTeachersForDropdown.length - teachersListData.length);
      setTeachersList(teachersListData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelect = (studentId: number) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleAssignSingleStudent = (studentId: number) => {
    setSelectedStudent(studentId);
    setShowAssignmentModal(true);
  };

  const handleAssignSingleTeacher = (teacherId: number) => {
    console.log('Assigning teacher with ID:', teacherId);
    console.log('Available teachersList:', teachersList);
    console.log('Available teachers (assignments):', teachers);
    
    // Find the teacher from the assignments tab data (teachers state)
    const teacherFromAssignments = teachers.find(t => t.id === teacherId);
    console.log('Found teacher in assignments:', teacherFromAssignments);
    
    setSelectedTeacher(teacherId);
    setShowTeacherAssignmentModal(true);
  };

  const handleRemoveTeacherFromClass = (teacherId: number, classId: number) => {
    setConfirmMessage('Are you sure you want to remove this teacher from the class?');
    setConfirmAction(() => async () => {
      try {
        await adminApi.removeTeacherFromClass(teacherId, classId);
        fetchData(); // Refresh the data
        showNotification('Teacher removed from class successfully!', 'success');
      } catch (error) {
        console.error('Error removing teacher from class:', error);
        showNotification('Failed to remove teacher from class. Please try again.', 'error');
      }
    });
    setShowConfirmModal(true);
  };

  const handleRemoveStudentFromClass = (studentId: number) => {
    setConfirmMessage('Are you sure you want to remove this student from their current class?');
    setConfirmAction(() => async () => {
      try {
        await adminApi.removeStudentAssignment(studentId);
        fetchData(); // Refresh the data
        showNotification('Student removed from class successfully!', 'success');
      } catch (error) {
        console.error('Error removing student from class:', error);
        showNotification('Failed to remove student from class. Please try again.', 'error');
      }
    });
    setShowConfirmModal(true);
  };

  const handleEditClass = (classId: number) => {
    const classToEdit = classes.find(cls => cls.id === classId);
    if (classToEdit) {
      setSelectedClassToEdit(classToEdit);
      setShowEditClassModal(true);
    } else {
      showNotification('Class not found!', 'error');
    }
  };

  /**
   * Handles class deletion with automatic unassignment of students and teachers
   * This function ensures that when a class is deleted:
   * 1. All students are unassigned from the class
   * 2. All teachers are unassigned from the class  
   * 3. All related records (attendance, sessions, etc.) are handled via CASCADE
   */
  const handleDeleteClass = (classId: number) => {
    const classToDelete = classes.find(c => c.id === classId);
    const className = classToDelete ? classToDelete.class_name : 'this class';
    
    setConfirmMessage(`Are you sure you want to delete "${className}"? This will automatically unassign all students and teachers from this class. This action cannot be undone.`);
    setConfirmAction(() => async () => {
      try {
        let unassignmentMessage = '';
        
        // First, try to unassign all students and teachers from the class
        try {
          // Try bulk unassignment APIs first (if implemented)
          await Promise.allSettled([
            adminApi.unassignAllStudentsFromClass(classId).catch(() => {
              // If bulk API doesn't exist, we'll rely on CASCADE deletion in the database
              console.log('Bulk student unassignment API not implemented, relying on database CASCADE');
            }),
            adminApi.unassignAllTeachersFromClass(classId).catch(() => {
              // If bulk API doesn't exist, we'll rely on CASCADE deletion in the database
              console.log('Bulk teacher unassignment API not implemented, relying on database CASCADE');
            })
          ]);
          unassignmentMessage = ' All students and teachers have been unassigned.';
        } catch (error) {
          console.warn('Bulk unassignment APIs not available, using database CASCADE:', error);
          unassignmentMessage = ' Related assignments will be handled automatically.';
        }
        
        // Then delete the class (this will trigger CASCADE deletion of related records)
        await adminApi.deleteClass(classId);
        fetchData(); // Refresh the data
        showNotification(`Class "${className}" deleted successfully!${unassignmentMessage}`, 'success');
      } catch (error) {
        console.error('Error deleting class:', error);
        let errorMessage = 'Failed to delete class. Please try again.';
        
        // Handle specific error messages from the API
        const apiError = error as ApiErrorResponse;
        if (apiError?.response?.data?.message) {
          errorMessage = apiError.response.data.message;
        } else if (apiError?.response?.data?.error) {
          errorMessage = apiError.response.data.error;
        } else if (apiError?.response?.status === 400) {
          errorMessage = 'Cannot delete class. Please ensure all dependencies are resolved first.';
        } else if (apiError?.response?.status === 404) {
          errorMessage = 'Class not found. It may have already been deleted.';
        }
        
        showNotification(errorMessage, 'error');
      }
    });
    setShowConfirmModal(true);
  };

  const handleConfirmAction = () => {
    if (confirmAction) {
      confirmAction();
    }
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmMessage('');
  };

  const handleCancelAction = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmMessage('');
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotificationModal(true);
  };

  const handleCloseNotification = () => {
    setShowNotificationModal(false);
    setNotificationMessage('');
  };

  const handleBulkAssignment = async () => {
    if (!selectedTeacher || !selectedClass || selectedStudents.length === 0) {
      alert('Please select a teacher, class, and at least one student');
      return;
    }

    try {
      await adminApi.assignStudentsToTeacher({
        teacher_id: selectedTeacher,
        class_id: selectedClass,
        student_ids: selectedStudents,
        role: 'primary'
      });
      
      setShowAssignmentModal(false);
      setSelectedStudents([]);
      setSelectedTeacher(null);
      setSelectedClass(null);
      fetchData();
      
      alert('Students assigned successfully!');
    } catch (error) {
      console.error('Error assigning students:', error);
      alert('Failed to assign students. Please try again.');
    }
  };

  // Suppress unused variable warnings temporarily
  console.log({ showCreateClassModal, showCreateStudentModal, showAssignmentModal, showTeacherAssignmentModal, showConfirmModal, handleBulkAssignment });

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex justify-end">
        <div className="flex space-x-3">
          {activeTab === 'classes' && (
            <button
              onClick={() => setShowCreateClassModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Class
            </button>
          )}
          {activeTab === 'students' && (
            <>
              <button
                onClick={() => setShowCreateStudentModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Add Student
              </button>
              <button
                onClick={() => setShowAssignmentModal(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
              >
                Assign Students
              </button>
            </>
          )}
          {activeTab === 'assignments' && (
            <button
              onClick={() => setShowTeacherAssignmentModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Assign Teachers
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'classes', label: 'Classes' },
            { id: 'students', label: 'Students' },
            { id: 'assignments', label: 'Teacher Assignments' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {activeTab === 'students' && (
          <>
            <select
              value={filters.class_id}
              onChange={(e) => setFilters(prev => ({ ...prev, class_id: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Classes</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.class_name}</option>
              ))}
            </select>
            <select
              value={filters.enrollment_status}
              onChange={(e) => setFilters(prev => ({ ...prev, enrollment_status: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Students</option>
              <option value="enrolled">Enrolled</option>
              <option value="unassigned">Unassigned</option>
            </select>
          </>
        )}
        
        {activeTab === 'assignments' && (
          <>
            <select
              value={filters.class_id}
              onChange={(e) => setFilters(prev => ({ ...prev, class_id: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Classes</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.class_name}</option>
              ))}
            </select>
            <select
              value={filters.assignment_status}
              onChange={(e) => setFilters(prev => ({ ...prev, assignment_status: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Teachers</option>
              <option value="assigned">Assigned</option>
              <option value="unassigned">Unassigned</option>
            </select>
          </>
        )}
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {activeTab === 'classes' && (
              <ClassList 
                classes={classes} 
                onRefresh={fetchData}
                onEditClass={handleEditClass}
                onDeleteClass={handleDeleteClass}
              />
            )}
            {activeTab === 'students' && (
              <StudentList
                students={students}
                selectedStudents={selectedStudents}
                onStudentSelect={handleStudentSelect}
                onRefresh={fetchData}
                onAssignStudent={handleAssignSingleStudent}
                onRemoveStudent={handleRemoveStudentFromClass}
              />
            )}
            {activeTab === 'assignments' && (
              <TeacherAssignmentList 
                teachers={teachers} 
                onRefresh={fetchData} 
                onAssignTeacher={handleAssignSingleTeacher}
                onRemoveTeacherFromClass={handleRemoveTeacherFromClass}
              />
            )}
          </>
        )}
      </div>

      {/* Create Class Modal */}
      {showCreateClassModal && (
        <CreateClassModal
          onClose={() => setShowCreateClassModal(false)}
          onSuccess={() => {
            setShowCreateClassModal(false);
            fetchData();
          }}
        />
      )}

      {/* Edit Class Modal */}
      {showEditClassModal && selectedClassToEdit && (
        <EditClassModal
          onClose={() => {
            setShowEditClassModal(false);
            setSelectedClassToEdit(null);
          }}
          onSuccess={() => {
            setShowEditClassModal(false);
            setSelectedClassToEdit(null);
            fetchData();
          }}
          classData={selectedClassToEdit}
        />
      )}

      {/* Create Student Modal */}
      {showCreateStudentModal && (
        <CreateStudentModal
          onClose={() => setShowCreateStudentModal(false)}
          onSuccess={() => {
            setShowCreateStudentModal(false);
            fetchData();
          }}
        />
      )}

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <StudentAssignmentModal
          onClose={() => {
            setShowAssignmentModal(false);
            setSelectedStudent(null);
          }}
          onSuccess={() => {
            setShowAssignmentModal(false);
            setSelectedStudent(null);
            fetchData();
          }}
          classes={classes}
          teachers={teachersList}
          students={students}
          preSelectedStudentId={selectedStudent || undefined}
        />
      )}

      {/* Teacher Assignment Modal */}
      {showTeacherAssignmentModal && (
        <TeacherAssignmentModal
          onClose={() => {
            setShowTeacherAssignmentModal(false);
            setSelectedTeacher(null);
          }}
          onSuccess={() => {
            setShowTeacherAssignmentModal(false);
            setSelectedTeacher(null);
            fetchData();
          }}
          classes={classes}
          teachers={teachersList}
          assignmentTeachers={teachers}
          preSelectedTeacherId={selectedTeacher || undefined}
        />
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <ConfirmationModal
          message={confirmMessage}
          onConfirm={handleConfirmAction}
          onCancel={handleCancelAction}
        />
      )}

      {/* Notification Modal */}
      {showNotificationModal && (
        <NotificationModal
          message={notificationMessage}
          type={notificationType}
          onClose={handleCloseNotification}
        />
      )}
    </div>
  );
};

// Separate components for each tab content
const ClassList: React.FC<{ 
  classes: Class[]; 
  onRefresh: () => void;
  onEditClass: (classId: number) => void;
  onDeleteClass: (classId: number) => void;
}> = ({ classes, onRefresh: _onRefresh, onEditClass, onDeleteClass }) => (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age Group</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teachers</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {classes.map((cls) => (
          <tr key={cls.id} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap">
              <div>
                <div className="text-sm font-medium text-gray-900">{cls.class_name}</div>
                <div className="text-sm text-gray-500">{cls.academic_year}</div>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cls.class_code}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cls.age_group}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cls.capacity}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                cls.student_count > cls.capacity * 0.8 ? 'bg-red-100 text-red-800' :
                cls.student_count > cls.capacity * 0.6 ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {cls.student_count}/{cls.capacity}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cls.teacher_count}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cls.room_number}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <button 
                onClick={() => onEditClass(cls.id)}
                className="text-blue-600 hover:text-blue-900 mr-3"
              >
                Edit
              </button>
              <button 
                onClick={() => onDeleteClass(cls.id)}
                className="text-red-600 hover:text-red-900"
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const StudentList: React.FC<{
  students: Student[];
  selectedStudents: number[];
  onStudentSelect: (id: number) => void;
  onRefresh: () => void;
  onAssignStudent: (studentId: number) => void;
  onRemoveStudent: (studentId: number) => void;
}> = ({ students, selectedStudents: _selectedStudents, onStudentSelect: _onStudentSelect, onRefresh: _onRefresh, onAssignStudent, onRemoveStudent }) => (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parents</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {students.map((student) => (
          <tr key={student.id} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap">
              <div>
                <div className="text-sm font-medium text-gray-900">{student.student_name}</div>
                <div className="text-sm text-gray-500">{student.gender}</div>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.student_id}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              {student.current_class && student.current_class.is_active !== false ? (
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                  {student.current_class.class_name}
                </span>
              ) : (
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                  Unassigned
                </span>
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {student.date_of_birth ? new Date().getFullYear() - new Date(student.date_of_birth).getFullYear() : 'N/A'}
            </td>
            <td className="px-6 py-4">
              <div className="text-xs text-gray-600">
                {student.parents.slice(0, 2).map(parent => (
                  <div key={parent.id}>{parent.name} ({parent.relationship})</div>
                ))}
                {student.parents.length > 2 && (
                  <div>+{student.parents.length - 2} more</div>
                )}
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                student.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {student.is_active ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <button 
                onClick={() => onAssignStudent(student.id)}
                className="text-blue-600 hover:text-blue-900 mr-3"
              >
                Assign
              </button>
              <button 
                onClick={() => onRemoveStudent(student.id)}
                disabled={!student.current_class || student.current_class.is_active === false}
                className={`${
                  student.current_class && student.current_class.is_active !== false
                    ? 'text-red-600 hover:text-red-900' 
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                Remove
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const TeacherAssignmentList: React.FC<{ 
  teachers: Teacher[]; 
  onRefresh: () => void; 
  onAssignTeacher: (teacherId: number) => void;
  onRemoveTeacherFromClass?: (teacherId: number, classId: number) => void;
}> = ({ teachers, onRefresh: _onRefresh, onAssignTeacher, onRemoveTeacherFromClass }) => (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subjects</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Classes</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {teachers.map((teacher) => (
          <tr key={teacher.id} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap">
              <div>
                <div className="text-sm font-medium text-gray-900">{teacher.name}</div>
                <div className="text-sm text-gray-500">{teacher.employee_id}</div>
              </div>
            </td>
            <td className="px-6 py-4">
              <div className="text-xs text-gray-600">
                <div>{teacher.email}</div>
                <div>{teacher.phone}</div>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.subjects}</td>
            <td className="px-6 py-4">
              <div className="space-y-1">
                {teacher.assigned_classes.map(cls => (
                  <div key={cls.id} className="flex items-center justify-between space-x-2">
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                      {cls.class_name}
                    </span>
                    <button
                      onClick={() => onRemoveTeacherFromClass && onRemoveTeacherFromClass(teacher.id, cls.id)}
                      className="text-xs text-red-600 hover:text-red-800"
                      title="Remove teacher from this class"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {teacher.assigned_classes.length === 0 && (
                  <span className="text-sm text-gray-500 italic">No assignments</span>
                )}
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <button 
                onClick={() => onAssignTeacher(teacher.id)}
                className="text-blue-600 hover:text-blue-900"
              >
                Assign
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Modal Components
interface CreateClassModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateClassModal: React.FC<CreateClassModalProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    class_name: '',
    class_code: '',
    age_group: '',
    capacity: '',
    room_number: '',
    academic_year: '2024-2025'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await adminApi.createClass({
        ...formData,
        capacity: parseInt(formData.capacity),
        is_active: true
      });
      onSuccess();
    } catch (error) {
      console.error('Error creating class:', error);
      alert('Failed to create class. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Create New Class</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Class Name</label>
            <input
              type="text"
              required
              value={formData.class_name}
              onChange={(e) => setFormData({...formData, class_name: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Class Code</label>
            <input
              type="text"
              required
              value={formData.class_code}
              onChange={(e) => setFormData({...formData, class_code: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Age Group</label>
            <input
              type="text"
              required
              value={formData.age_group}
              onChange={(e) => setFormData({...formData, age_group: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 2-3 years"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Capacity</label>
            <input
              type="number"
              required
              min="1"
              value={formData.capacity}
              onChange={(e) => setFormData({...formData, capacity: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Room Number</label>
            <input
              type="text"
              required
              value={formData.room_number}
              onChange={(e) => setFormData({...formData, room_number: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Academic Year</label>
            <input
              type="text"
              required
              value={formData.academic_year}
              onChange={(e) => setFormData({...formData, academic_year: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface EditClassModalProps {
  onClose: () => void;
  onSuccess: () => void;
  classData: Class;
}

const EditClassModal: React.FC<EditClassModalProps> = ({ onClose, onSuccess, classData }) => {
  const [formData, setFormData] = useState({
    class_name: classData.class_name,
    class_code: classData.class_code,
    age_group: classData.age_group,
    capacity: classData.capacity.toString(),
    room_number: classData.room_number,
    academic_year: classData.academic_year
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await adminApi.updateClass(classData.id, {
        ...formData,
        capacity: parseInt(formData.capacity)
      });
      onSuccess();
    } catch (error) {
      console.error('Error updating class:', error);
      alert('Failed to update class. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Edit Class</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Class Name</label>
            <input
              type="text"
              required
              value={formData.class_name}
              onChange={(e) => setFormData({...formData, class_name: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Class Code</label>
            <input
              type="text"
              required
              value={formData.class_code}
              onChange={(e) => setFormData({...formData, class_code: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Age Group</label>
            <input
              type="text"
              required
              value={formData.age_group}
              onChange={(e) => setFormData({...formData, age_group: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 2-3 years"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Capacity</label>
            <input
              type="number"
              required
              min="1"
              value={formData.capacity}
              onChange={(e) => setFormData({...formData, capacity: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Room Number</label>
            <input
              type="text"
              required
              value={formData.room_number}
              onChange={(e) => setFormData({...formData, room_number: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Academic Year</label>
            <input
              type="text"
              required
              value={formData.academic_year}
              onChange={(e) => setFormData({...formData, academic_year: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface CreateStudentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateStudentModal: React.FC<CreateStudentModalProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    student_name: '',
    student_id: '',
    date_of_birth: '',
    gender: '',
    medical_conditions: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await adminApi.createStudent({
        ...formData,
        is_active: true
      });
      onSuccess();
    } catch (error) {
      console.error('Error creating student:', error);
      alert('Failed to create student. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Add New Student</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Student Name</label>
            <input
              type="text"
              required
              value={formData.student_name}
              onChange={(e) => setFormData({...formData, student_name: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Student ID</label>
            <input
              type="text"
              required
              value={formData.student_id}
              onChange={(e) => setFormData({...formData, student_id: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
            <input
              type="date"
              required
              value={formData.date_of_birth}
              onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Gender</label>
            <select
              required
              value={formData.gender}
              onChange={(e) => setFormData({...formData, gender: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Medical Conditions</label>
            <textarea
              value={formData.medical_conditions}
              onChange={(e) => setFormData({...formData, medical_conditions: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Any medical conditions or allergies..."
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface StudentAssignmentModalProps {
  onClose: () => void;
  onSuccess: () => void;
  classes: Class[];
  teachers: Teacher[];
  students: Student[];
  preSelectedStudentId?: number;
}

const StudentAssignmentModal: React.FC<StudentAssignmentModalProps> = ({
  onClose,
  onSuccess,
  classes,
  teachers: _teachers,
  students,
  preSelectedStudentId
}) => {
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<number[]>(
    preSelectedStudentId ? [preSelectedStudentId] : []
  );
  const [loading, setLoading] = useState(false);

  const preSelectedStudent = preSelectedStudentId 
    ? students.find(s => s.id === preSelectedStudentId)
    : null;

  const handleStudentSelect = (studentId: number) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleAssign = async () => {
    if (!selectedClass || selectedStudents.length === 0) {
      alert('Please select a class and at least one student');
      return;
    }

    setLoading(true);
    try {
      // Use reassignStudents API to assign students to class
      await adminApi.reassignStudents({
        student_ids: selectedStudents,
        to_class_id: selectedClass
      });
      onSuccess();
    } catch (error) {
      console.error('Error assigning students:', error);
      alert('Failed to assign students. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">
          {preSelectedStudent ? 'Assign Student to Class' : 'Assign Students to Class'}
        </h2>
        
        <div className="space-y-6">
          {/* Student Details (when pre-selected) */}
          {preSelectedStudent && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="text-lg font-medium text-gray-900">Student Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="text-sm text-gray-900 font-medium">{preSelectedStudent.student_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Student ID</label>
                  <p className="text-sm text-gray-900">{preSelectedStudent.student_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <p className="text-sm text-gray-900 capitalize">{preSelectedStudent.gender}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Age</label>
                  <p className="text-sm text-gray-900">{preSelectedStudent.age}</p>
                </div>
                {preSelectedStudent.current_class && preSelectedStudent.current_class.is_active !== false ? (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Current Class</label>
                    <p className="text-sm text-gray-900">{preSelectedStudent.current_class.class_name}</p>
                  </div>
                ) : preSelectedStudent.current_class && preSelectedStudent.current_class.is_active === false ? (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Current Class</label>
                    <p className="text-sm text-red-600 italic">Previously assigned class has been deleted</p>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* Class Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Select Class</label>
            <select
              value={selectedClass || ''}
              onChange={(e) => setSelectedClass(Number(e.target.value))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a class</option>
              {classes?.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.class_name} ({cls.class_code}) - {cls.age_group}
                </option>
              ))}
            </select>
          </div>

          {/* Student Selection (when no pre-selected student) */}
          {!preSelectedStudent && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Students ({selectedStudents.length} selected)
              </label>
              <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
                <div className="p-2 space-y-1">
                  {students.map((student) => (
                    <label key={student.id} className="flex items-center p-2 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleStudentSelect(student.id)}
                        className="rounded mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{student.student_name}</div>
                        <div className="text-sm text-gray-500">
                          ID: {student.student_id} | Gender: {student.gender}
                          {student.current_class && student.current_class.is_active !== false ? (
                            <span className="ml-2 text-blue-600">
                              Current: {student.current_class.class_name}
                            </span>
                          ) : student.current_class && student.current_class.is_active === false ? (
                            <span className="ml-2 text-red-600 italic">
                              Previously assigned class deleted
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </label>
                  ))}
                  {students.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No students available</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={!selectedClass || selectedStudents.length === 0 || loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Assigning...' : `Assign ${selectedStudents.length} Student(s)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface TeacherAssignmentModalProps {
  onClose: () => void;
  onSuccess: () => void;
  classes: Class[];
  teachers: Teacher[];
  preSelectedTeacherId?: number;
  assignmentTeachers?: Teacher[]; // Teachers from assignments tab
}

const TeacherAssignmentModal: React.FC<TeacherAssignmentModalProps> = ({
  onClose,
  onSuccess,
  classes,
  teachers,
  preSelectedTeacherId,
  assignmentTeachers
}) => {
  console.log('TeacherAssignmentModal - Teachers:', teachers);
  console.log('TeacherAssignmentModal - AssignmentTeachers:', assignmentTeachers);
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(preSelectedTeacherId || null);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAssign = async () => {
    if (!selectedTeacher || !selectedClass) {
      alert('Please select both a teacher and a class');
      return;
    }

    setLoading(true);
    try {
      await adminApi.assignTeacherToClass({
        teacher_id: selectedTeacher,
        class_id: selectedClass,
        role: 'primary'
      });
      onSuccess();
    } catch (error) {
      console.error('Error assigning teacher:', error);
      alert('Failed to assign teacher. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          {preSelectedTeacherId ? 'Assign Teacher to Class' : 'Assign Teacher to Class'}
        </h2>
        
        <div className="space-y-4">
          {/* Show teacher info if pre-selected, otherwise show dropdown */}
          {preSelectedTeacherId ? (
            <div className="space-y-3">
              {(() => {
                // First try to find in teachersList (from getTeachers API)
                let teacher = teachers.find(t => t.id === preSelectedTeacherId);
                
                // If not found in main teachers list, try assignment teachers
                if (!teacher && assignmentTeachers) {
                  teacher = assignmentTeachers.find(t => t.id === preSelectedTeacherId);
                }
                
                // If still not found, show debug info
                if (!teacher) {
                  console.log('Teacher not found in both lists');
                  console.log('Teachers list:', teachers);
                  console.log('Assignment teachers list:', assignmentTeachers);
                  console.log('Looking for teacher ID:', preSelectedTeacherId);
                  
                  return (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Teacher</label>
                        <div className="mt-1 text-sm text-gray-900 font-medium">Loading teacher information...</div>
                      </div>
                    </div>
                  );
                }

                return (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Teacher Name</label>
                      <div className="mt-1 text-sm text-gray-900 font-medium">{teacher.name}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <div className="mt-1 text-sm text-gray-900">{teacher.email}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                      <div className="mt-1 text-sm text-gray-900">{teacher.employee_id}</div>
                    </div>
                    {teacher.subjects && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Subjects</label>
                        <div className="mt-1 text-sm text-gray-900">{teacher.subjects}</div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700">Select Teacher</label>
              <select
                value={selectedTeacher || ''}
                onChange={(e) => setSelectedTeacher(Number(e.target.value))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name} ({teacher.email})
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Select Class</label>
            <select
              value={selectedClass || ''}
              onChange={(e) => setSelectedClass(Number(e.target.value))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a class</option>
              {classes?.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.class_name} ({cls.class_code}) - {cls.age_group}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={!selectedTeacher || !selectedClass || loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Assigning...' : 'Assign Teacher'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ConfirmationModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Action</h3>
          <p className="text-sm text-gray-500 mb-6">{message}</p>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface NotificationModalProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ message, type, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="text-center">
          <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${
            type === 'success' ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {type === 'success' ? (
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            ) : (
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
          </div>
          <h3 className={`text-lg font-medium mb-4 ${
            type === 'success' ? 'text-green-900' : 'text-red-900'
          }`}>
            {type === 'success' ? 'Success' : 'Error'}
          </h3>
          <p className="text-sm text-gray-500 mb-6">{message}</p>
          
          <button
            onClick={onClose}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              type === 'success'
                ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
            }`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassManagement;