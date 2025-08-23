
interface ProgressChartProps {
  data?: Array<{ month: string; hours: number; isHighlight?: boolean }>;
  year?: number;
}

export default function ProgressChart({ data, year = 2024 }: ProgressChartProps) {
  // Sample data if none provided
  const defaultData = [
    { month: 'Jan', hours: 3.5, isHighlight: false },
    { month: 'Feb', hours: 2.5, isHighlight: false },
    { month: 'Mar', hours: 4.2, isHighlight: false },
    { month: 'Apr', hours: 4.8, isHighlight: false },
    { month: 'May', hours: 5.0, isHighlight: true }, // Highlighted month
    { month: 'Jun', hours: 2.0, isHighlight: false },
    { month: 'Jul', hours: 3.8, isHighlight: false },
    { month: 'Aug', hours: 4.5, isHighlight: false },
    { month: 'Sep', hours: 3.5, isHighlight: false },
    { month: 'Oct', hours: 3.2, isHighlight: false },
    { month: 'Nov', hours: 4.0, isHighlight: false },
    { month: 'Dec', hours: 3.8, isHighlight: false },
  ];

  const chartData = data || defaultData;
  const maxHours = Math.max(...chartData.map(d => d.hours));
  const totalHours = chartData.reduce((sum, d) => sum + d.hours, 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Your Progress This Year</h2>
          <p className="text-sm text-gray-600 mt-1">
            01 January {year} – 31 December {year}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {totalHours.toFixed(1)}h
            </div>
            <div className="text-xs text-gray-500">Total Hours</div>
          </div>
          <select className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value={year}>{year}</option>
            <option value={year - 1}>{year - 1}</option>
            <option value={year - 2}>{year - 2}</option>
          </select>
        </div>
      </div>

      {/* Learning Activity Chart */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-800">Learning Activity</h3>
          <div className="flex items-center space-x-2">
            <div className="text-sm bg-orange-100 text-orange-800 px-2 py-1 rounded">
              30 hours
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="relative h-64">
          <svg
            className="w-full h-full"
            viewBox="0 0 800 200"
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            {[1, 2, 3, 4, 5].map((line) => (
              <line
                key={line}
                x1="0"
                y1={line * 40}
                x2="800"
                y2={line * 40}
                stroke="#f3f4f6"
                strokeWidth="1"
              />
            ))}

            {/* Y-axis labels */}
            {[5, 4, 3, 2, 1].map((hour, index) => (
              <text
                key={hour}
                x="10"
                y={index * 40 + 25}
                className="text-xs fill-gray-500"
                textAnchor="start"
              >
                {hour}h
              </text>
            ))}

            {/* Chart Path */}
            <path
              d={`M 50 ${200 - (chartData[0].hours / maxHours) * 160} ${chartData
                .map(
                  (point, index) =>
                    `L ${50 + (index * 700) / (chartData.length - 1)} ${
                      200 - (point.hours / maxHours) * 160
                    }`
                )
                .join(' ')}`}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              className="drop-shadow-sm"
            />

            {/* Fill area under the curve */}
            <path
              d={`M 50 200 L 50 ${200 - (chartData[0].hours / maxHours) * 160} ${chartData
                .map(
                  (point, index) =>
                    `L ${50 + (index * 700) / (chartData.length - 1)} ${
                      200 - (point.hours / maxHours) * 160
                    }`
                )
                .join(' ')} L 750 200 Z`}
              fill="url(#gradient)"
              className="opacity-20"
            />

            {/* Data points */}
            {chartData.map((point, index) => (
              <g key={point.month}>
                <circle
                  cx={50 + (index * 700) / (chartData.length - 1)}
                  cy={200 - (point.hours / maxHours) * 160}
                  r="4"
                  fill="#3b82f6"
                  className="drop-shadow-sm"
                />
                
                {/* Highlighted point */}
                {point.isHighlight && (
                  <>
                    <line
                      x1={50 + (index * 700) / (chartData.length - 1)}
                      y1="20"
                      x2={50 + (index * 700) / (chartData.length - 1)}
                      y2="180"
                      stroke="#f97316"
                      strokeWidth="2"
                      strokeDasharray="4,4"
                    />
                    <circle
                      cx={50 + (index * 700) / (chartData.length - 1)}
                      cy={200 - (point.hours / maxHours) * 160}
                      r="6"
                      fill="#f97316"
                      className="drop-shadow-sm"
                    />
                  </>
                )}
              </g>
            ))}

            {/* Gradient definition */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>

          {/* X-axis labels */}
          <div className="absolute bottom-0 left-0 w-full flex justify-between px-2">
            {chartData.map((point) => (
              <div key={point.month} className="text-xs text-gray-500">
                {point.month}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}