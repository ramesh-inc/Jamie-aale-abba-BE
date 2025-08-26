import React, { useState, useEffect } from 'react';
import { parentApi } from '../../services/api';
import ActivityDetailsList from './ActivityDetailsList';

interface Child {
  id: number;
  student_name: string;
  student_id: string;
  avatar_url: string;
}

interface LearningActivityData {
  month: string;
  hours: number;
}

interface LearningActivitiesChartProps {
  selectedChildId?: number;
  onChildSelect?: (childId: number) => void;
}

const LearningActivitiesChart: React.FC<LearningActivitiesChartProps> = ({ 
  selectedChildId, 
  onChildSelect 
}) => {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<number | null>(selectedChildId || null);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [chartData, setChartData] = useState<LearningActivityData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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
      fetchLearningActivities();
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

  const fetchLearningActivities = async () => {
    if (!selectedChild) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await parentApi.getLearningActivities(selectedChild, selectedYear);
      setChartData(response);
    } catch (error: any) {
      console.error('Error fetching learning activities:', error);
      
      // If API fails, check if it's a real error or just no data
      if (error?.response?.status === 404) {
        setError('Child not found or no learning activities data available');
        setChartData([]);
      } else if (error?.response?.status === 401) {
        setError('Authentication required');
        setChartData([]);
      } else {
        // For other errors, fall back to mock data for development
        const mockData: LearningActivityData[] = months.map((month, index) => {
          // Create realistic data with some months having actual activities
          const isCurrentOrPastMonth = index <= new Date().getMonth();
          
          // Ensure August (index 7) has visible data for testing
          if (index === 7) { // August
            return {
              month,
              hours: 15 // Fixed value for testing
            };
          }
          
          return {
            month,
            hours: isCurrentOrPastMonth ? Math.floor(Math.random() * 20) + 5 : 0, // 5-25 hours for past months
          };
        });
        
        setChartData(mockData);
        setError('Using sample data - API endpoint may not be fully configured');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChildChange = (childId: number) => {
    setSelectedChild(childId);
    onChildSelect?.(childId);
  };

  const handleBarClick = (monthData: LearningActivityData, monthIndex: number) => {
    if (monthData.hours > 0 && selectedChild) {
      // Calculate the date for the clicked month (use the 1st day of the month)
      const year = parseInt(selectedYear);
      const clickedDate = new Date(year, monthIndex, 1).toISOString().split('T')[0];
      setSelectedDate(clickedDate);
    }
  };

  const getDefaultAvatar = (name: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4F46E5&color=fff&size=40`;
  };

  // Calculate max value for Y-axis scaling with better auto-scaling
  const maxValue = Math.max(...chartData.map(d => d.hours));
  
  // Auto-scale Y-axis based on data range with padding for better visualization
  let yAxisMax;
  if (maxValue === 0) {
    yAxisMax = 20; // Default minimum for hours
  } else if (maxValue <= 10) {
    yAxisMax = maxValue + 2; // Small values: add 2 for padding
  } else if (maxValue <= 30) {
    yAxisMax = Math.ceil(maxValue * 1.2); // Medium values: add 20% padding
  } else {
    yAxisMax = Math.ceil(maxValue * 1.1); // Large values: add 10% padding
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Learning Activities</h3>
        
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
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : !selectedChild ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Please select a child to view learning activities</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Chart */}
            <div className="relative bg-gray-50 rounded-lg p-6">
              {/* Y-axis label */}
              <div className="absolute -left-6 top-1/2 transform -rotate-90 -translate-y-1/2 text-sm font-medium text-gray-700 whitespace-nowrap">
                Learning Hours
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
                
                <div className="flex items-end justify-between h-full space-x-2 relative z-10">
                  {chartData.map((data, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      {/* Bar Container */}
                      <div className="flex items-end justify-center h-full">
                        {/* Learning Hours Bar */}
                        <div className="relative group">
                          <div
                            className={`w-8 border border-blue-600 transition-colors ${
                              data.hours > 0 
                                ? 'bg-blue-500 hover:bg-blue-600 cursor-pointer' 
                                : 'bg-transparent'
                            }`}
                            style={{
                              height: data.hours > 0 ? `${Math.max((data.hours / yAxisMax) * 100, 5)}%` : '2px',
                              minHeight: data.hours > 0 ? '8px' : '2px',
                              backgroundColor: data.hours > 0 ? '#3b82f6' : 'transparent'
                            }}
                            title={`${data.month}: ${data.hours} hours${data.hours > 0 ? ' - Click for details' : ''}`}
                            onClick={() => handleBarClick(data, index)}
                          >
                            {/* Show value on top of bar */}
                            {data.hours > 0 && (
                              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs text-gray-700 font-bold">
                                {data.hours}
                              </div>
                            )}
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                              {data.hours} hours
                            </div>
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

            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {chartData.reduce((sum, data) => sum + data.hours, 0)}
                </p>
                <p className="text-sm text-gray-600">Total Hours</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {Math.round(chartData.reduce((sum, data) => sum + data.hours, 0) / 12)}
                </p>
                <p className="text-sm text-gray-600">Avg/Month</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {Math.max(...chartData.map(d => d.hours))}
                </p>
                <p className="text-sm text-gray-600">Peak Month</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {chartData.filter(d => d.hours > 0).length}
                </p>
                <p className="text-sm text-gray-600">Active Months</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Activity Details Modal */}
      {selectedDate && selectedChild && (
        <ActivityDetailsList
          childId={selectedChild}
          selectedDate={selectedDate}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
};

export default LearningActivitiesChart;