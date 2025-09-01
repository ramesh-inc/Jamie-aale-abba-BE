import React, { useState, useEffect } from 'react';
import { teacherApi } from '../../services/api';

interface AttendanceData {
  month: string;
  total_days: number;
  present_days: number;
  late_days: number;
  absent_days: number;
  attendance_rate: number;
}

interface TeacherAttendanceChartProps {
  selectedStudentId: number;
}

const TeacherAttendanceChart: React.FC<TeacherAttendanceChartProps> = ({ 
  selectedStudentId
}) => {
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [chartData, setChartData] = useState<AttendanceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate academic years (current year and previous years)
  const generateAcademicYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 5; i++) {
      years.push((currentYear - i).toString());
    }
    return years;
  };

  const academicYears = generateAcademicYears();


  useEffect(() => {
    if (selectedStudentId && selectedYear) {
      fetchAttendanceData();
    }
  }, [selectedStudentId, selectedYear]);

  const fetchAttendanceData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await teacherApi.getStudentAttendanceData(selectedStudentId, selectedYear);
      setChartData(response);
    } catch (error: any) {
      console.error('Error fetching attendance data:', error);
      
      if (error?.response?.status === 404) {
        setError('Student not found or no attendance data available');
        setChartData([]);
      } else if (error?.response?.status === 403) {
        setError('You do not have access to this student');
        setChartData([]);
      } else if (error?.response?.status === 401) {
        setError('Authentication required');
        setChartData([]);
      } else {
        // For other errors, show error message
        setError('Failed to load attendance data');
        setChartData([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate max value for Y-axis scaling based on individual day counts
  const maxDays = chartData.length > 0 ? Math.max(
    ...chartData.flatMap(d => [d.present_days || 0, d.late_days || 0, d.absent_days || 0])
  ) : 0;
  const yAxisMax = Math.max(maxDays + 2, 10); // Minimum of 10 days

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Attendance</h3>
        
        {/* Controls */}
        <div className="flex justify-end mb-6">
          {/* Academic Year Selection */}
          <div className="w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Academic Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {academicYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="relative">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Chart */}
            <div className="relative bg-gray-50 rounded-lg p-6">
              {/* Y-axis label */}
              <div className="absolute -left-6 top-1/2 transform -rotate-90 -translate-y-1/2 text-sm font-medium text-gray-700 whitespace-nowrap">
                Number of Days
              </div>

              {/* Chart bars */}
              <div className="ml-8 mr-4" style={{ height: '300px', position: 'relative' }}>
                {/* Light horizontal grid lines for reference */}
                <div className="absolute inset-0">
                  {[25, 50, 75].map((percent) => (
                    <div
                      key={percent}
                      className="absolute w-full border-t border-gray-100"
                      style={{ bottom: `${percent}%` }}
                    />
                  ))}
                </div>
                
                <div className="flex items-end justify-between h-full space-x-1 relative z-10">
                  {chartData.map((data, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      {/* Bar Container with fixed height */}
                      <div className="flex items-end justify-center" style={{ height: '280px' }}>
                        {/* Three separate bars for Present, Late, Absent */}
                        <div className="relative group flex items-end space-x-1">
                          {/* Present Days - Green */}
                          {data.present_days > 0 && (
                            <div className="relative">
                              {/* Show value above bar */}
                              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 text-xs text-gray-700 font-bold">
                                {data.present_days}
                              </div>
                              <div
                                className="w-4 bg-green-500 hover:bg-green-600 transition-colors border border-green-600"
                                style={{
                                  height: `${(data.present_days / yAxisMax) * 280}px`
                                }}
                                title={`Present: ${data.present_days} days`}
                              />
                            </div>
                          )}
                          
                          {/* Late Days - Yellow */}
                          {data.late_days > 0 && (
                            <div className="relative">
                              {/* Show value above bar */}
                              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 text-xs text-gray-700 font-bold">
                                {data.late_days}
                              </div>
                              <div
                                className="w-4 bg-yellow-500 hover:bg-yellow-600 transition-colors border border-yellow-600"
                                style={{
                                  height: `${(data.late_days / yAxisMax) * 280}px`
                                }}
                                title={`Late: ${data.late_days} days`}
                              />
                            </div>
                          )}
                          
                          {/* Absent Days - Red */}
                          {data.absent_days > 0 && (
                            <div className="relative">
                              {/* Show value above bar */}
                              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 text-xs text-gray-700 font-bold">
                                {data.absent_days}
                              </div>
                              <div
                                className="w-4 bg-red-500 hover:bg-red-600 transition-colors border border-red-600"
                                style={{
                                  height: `${(data.absent_days / yAxisMax) * 280}px`
                                }}
                                title={`Absent: ${data.absent_days} days`}
                              />
                            </div>
                          )}
                          
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                            <div>Present: {data.present_days} days</div>
                            <div>Late: {data.late_days} days</div>
                            <div>Absent: {data.absent_days} days</div>
                            <div>Total: {data.total_days} days</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Month Label directly below bar */}
                      <div className="mt-2 text-xs text-gray-600 font-medium">
                        {data.month}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* X-axis label */}
              <div className="text-center mt-4 text-sm font-medium text-gray-700">
                Months ({selectedYear})
              </div>
            </div>

            {/* Legend */}
            <div className="flex justify-center space-x-6 py-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm text-gray-700">Present</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="text-sm text-gray-700">Late</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm text-gray-700">Absent</span>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {chartData.reduce((sum, data) => sum + data.total_days, 0)}
                </p>
                <p className="text-sm text-gray-600">Total Days</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {chartData.reduce((sum, data) => sum + data.present_days, 0)}
                </p>
                <p className="text-sm text-gray-600">Present Days</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {chartData.reduce((sum, data) => sum + data.late_days, 0)}
                </p>
                <p className="text-sm text-gray-600">Late Days</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {chartData.reduce((sum, data) => sum + data.absent_days, 0)}
                </p>
                <p className="text-sm text-gray-600">Absent Days</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherAttendanceChart;