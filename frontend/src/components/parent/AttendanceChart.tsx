import React, { useState, useEffect } from 'react';
import { parentApi } from '../../services/api';

interface Child {
  id: number;
  student_name: string;
  student_id: string;
  avatar_url: string;
}

interface AttendanceData {
  month: string;
  present: number;
  absent: number;
  late: number;
}

interface AttendanceChartProps {
  selectedChildId?: number;
  onChildSelect?: (childId: number) => void;
}

const AttendanceChart: React.FC<AttendanceChartProps> = ({ 
  selectedChildId, 
  onChildSelect 
}) => {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<number | null>(selectedChildId || null);
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

  // Month labels
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChild && selectedYear) {
      fetchAttendanceData();
    }
  }, [selectedChild, selectedYear]);

  const fetchChildren = async () => {
    try {
      const response = await parentApi.getChildren();
      console.log('Children API response:', response);
      
      // Handle different response structures
      const childrenData = Array.isArray(response) ? response : (response?.results || response?.data || []);
      
      setChildren(childrenData);
      if (childrenData.length > 0 && !selectedChild) {
        const firstChild = childrenData[0].id;
        setSelectedChild(firstChild);
        onChildSelect?.(firstChild);
      }
    } catch (error: any) {
      console.error('Error fetching children:', error);
      
      // Handle different error types
      if (error?.response?.status === 401) {
        setError('Please log in to view children data');
      } else if (error?.response?.status === 403) {
        setError('Access denied - parent account required');
      } else if (error?.response?.status === 404) {
        setError('No children found for this account');
        setChildren([]);
      } else {
        setError('Failed to load children');
      }
    }
  };

  const fetchAttendanceData = async () => {
    if (!selectedChild) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await parentApi.getAttendanceData(selectedChild, selectedYear);
      setChartData(response);
    } catch (error: any) {
      console.error('Error fetching attendance data:', error);
      
      // Fallback to mock data if API fails
      const mockData: AttendanceData[] = months.map((month, index) => {
        // Create more realistic data with some months having actual attendance
        const isCurrentOrPastMonth = index <= new Date().getMonth();
        
        // Ensure August (index 7) has visible data for testing
        if (index === 7) { // August
          return {
            month,
            present: 2, // Fixed value for testing
            absent: 0,
            late: 1
          };
        }
        
        return {
          month,
          present: isCurrentOrPastMonth ? Math.floor(Math.random() * 15) + 5 : 0, // 5-20 present days for past months
          absent: isCurrentOrPastMonth ? Math.floor(Math.random() * 3) : 0,        // 0-3 absent days
          late: isCurrentOrPastMonth ? Math.floor(Math.random() * 2) : 0           // 0-2 late days
        };
      });
      
      setChartData(mockData);
      setError('Using sample data - API endpoint not yet available');
    } finally {
      setLoading(false);
    }
  };

  const handleChildChange = (childId: number) => {
    setSelectedChild(childId);
    onChildSelect?.(childId);
  };

  // Calculate max value for Y-axis scaling with better auto-scaling
  const maxValue = Math.max(...chartData.flatMap(d => [d.present, d.absent, d.late]));
  
  // Auto-scale Y-axis based on data range with padding for better visualization
  let yAxisMax;
  if (maxValue === 0) {
    yAxisMax = 4; // Default minimum
  } else if (maxValue <= 5) {
    yAxisMax = maxValue + 1; // Small values: add 1 for padding
  } else if (maxValue <= 10) {
    yAxisMax = Math.ceil(maxValue * 1.2); // Medium values: add 20% padding
  } else {
    yAxisMax = Math.ceil(maxValue * 1.1); // Large values: add 10% padding
  }


  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Attendance</h3>
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Child Selection */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Child
            </label>
            <select
              value={selectedChild || ''}
              onChange={(e) => handleChildChange(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a child...</option>
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.student_name}
                </option>
              ))}
            </select>
          </div>

          {/* Academic Year Selection */}
          <div className="flex-1">
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
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : !selectedChild ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Please select a child to view attendance data</p>
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
                {/* Light horizontal grid lines for reference (optional) */}
                <div className="absolute inset-0">
                  {[25, 50, 75].map((percent) => (
                    <div
                      key={percent}
                      className="absolute w-full border-t border-gray-100"
                      style={{ bottom: `${percent}%` }}
                    />
                  ))}
                </div>
                
                <div className="flex items-end justify-between h-full space-x-2 relative z-10">
                  {chartData.map((data, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      {/* Bars Container with fixed height */}
                      <div className="flex items-end justify-center space-x-1" style={{ height: '280px' }}>
                        {/* Present Bar */}
                        {data.present > 0 && (
                          <div className="relative group">
                            {/* Show value above bar */}
                            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 text-xs text-gray-700 font-bold">
                              {data.present}
                            </div>
                            <div
                              className="bg-green-500 hover:bg-green-600 transition-colors w-4 border border-green-600"
                              style={{
                                height: `${(data.present / yAxisMax) * 280}px`
                              }}
                              title={`Present: ${data.present} days`}
                            >
                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                                Present: {data.present}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Absent Bar */}
                        {data.absent > 0 && (
                          <div className="relative group">
                            {/* Show value above bar */}
                            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 text-xs text-gray-700 font-bold">
                              {data.absent}
                            </div>
                            <div
                              className="bg-red-500 hover:bg-red-600 transition-colors w-4 border border-red-600"
                              style={{
                                height: `${(data.absent / yAxisMax) * 280}px`
                              }}
                              title={`Absent: ${data.absent} days`}
                            >
                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                                Absent: {data.absent}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Late Bar */}
                        {data.late > 0 && (
                          <div className="relative group">
                            {/* Show value above bar */}
                            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 text-xs text-gray-700 font-bold">
                              {data.late}
                            </div>
                            <div
                              className="bg-yellow-500 hover:bg-yellow-600 transition-colors w-4 border border-yellow-600"
                              style={{
                                height: `${(data.late / yAxisMax) * 280}px`
                              }}
                              title={`Late: ${data.late} days`}
                            >
                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                                Late: {data.late}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Month Label directly below bars */}
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
            <div className="flex justify-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-gray-700">Present</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-gray-700">Absent</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="text-gray-700">Late</span>
              </div>
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {chartData.reduce((sum, data) => sum + data.present, 0)}
                </p>
                <p className="text-sm text-gray-600">Total Present</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {chartData.reduce((sum, data) => sum + data.absent, 0)}
                </p>
                <p className="text-sm text-gray-600">Total Absent</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {chartData.reduce((sum, data) => sum + data.late, 0)}
                </p>
                <p className="text-sm text-gray-600">Total Late</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {(() => {
                    const totalPresent = chartData.reduce((sum, data) => sum + data.present, 0);
                    const totalLate = chartData.reduce((sum, data) => sum + data.late, 0);
                    const totalAttended = totalPresent + totalLate; // Present + Late = Attended
                    const totalDays = chartData.reduce((sum, data) => sum + data.present + data.absent + data.late, 0);
                    return totalDays > 0 ? Math.round((totalAttended / totalDays) * 100) : 0;
                  })()}%
                </p>
                <p className="text-sm text-gray-600">Attendance Rate</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceChart;