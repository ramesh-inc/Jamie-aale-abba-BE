
interface Activity {
  id: string;
  type: 'positive' | 'achievement' | 'work';
  icon: 'thumbs-up' | 'star' | 'trophy';
  points: string;
  title: string;
  description: string;
  timestamp: string;
  day: string;
}

interface ActivityTimelineProps {
  activities?: Activity[];
}

export default function ActivityTimeline({ activities }: ActivityTimelineProps) {
  // Sample data if none provided
  const defaultActivities: Activity[] = [
    {
      id: '1',
      type: 'positive',
      icon: 'thumbs-up',
      points: '+1 for On Task',
      title: 'Earned 1 Lauren Watson\'s Reception - Miss Watson - 2023/24',
      description: 'class on Mon February 5th at 3:07 pm',
      timestamp: '3:07 pm',
      day: 'Monday'
    },
    {
      id: '2',
      type: 'achievement',
      icon: 'star',
      points: '+5 for Amazing Work!',
      title: 'Earned 5 Lauren Watson\'s Reception - Miss Watson - 2023/24',
      description: 'class on Mon February 5th at 2:31 pm',
      timestamp: '2:31 pm',
      day: 'Monday'
    },
    {
      id: '3',
      type: 'achievement',
      icon: 'star',
      points: '+5 for Amazing Work!',
      title: 'Earned 5 Lauren Watson\'s Reception - Miss Watson - 2023/24',
      description: 'class on Mon February 5th at 2:31 pm',
      timestamp: '2:31 pm',
      day: 'Monday'
    },
    {
      id: '4',
      type: 'achievement',
      icon: 'star',
      points: '+5 for Amazing Work!',
      title: 'Earned 5 Lauren Watson\'s Reception - Miss Watson - 2023/24',
      description: 'class on Mon February 5th at 2:31 pm',
      timestamp: '2:31 pm',
      day: 'Monday'
    },
    {
      id: '5',
      type: 'achievement',
      icon: 'star',
      points: '+5 for Amazing Work!',
      title: 'Earned 5 Lauren Watson\'s Reception - Miss Watson - 2023/24',
      description: 'class on Mon February 5th at 2:31 pm',
      timestamp: '2:31 pm',
      day: 'Monday'
    },
    {
      id: '6',
      type: 'work',
      icon: 'trophy',
      points: '+1 for Working Hard',
      title: 'Earned 1 Lauren Eva\'s Reception - Miss Watson - 2023/24',
      description: 'class on Tue February 6th at 7:35 pm',
      timestamp: '7:35 pm',
      day: 'Tuesday'
    },
    {
      id: '7',
      type: 'achievement',
      icon: 'star',
      points: '+5 for Amazing Work!',
      title: 'Earned 5 Lauren Eva\'s Reception - Miss Watson - 2023/24',
      description: 'class on Tue February 6th at 6:33 pm',
      timestamp: '6:33 pm',
      day: 'Tuesday'
    },
    {
      id: '8',
      type: 'achievement',
      icon: 'star',
      points: '+5 for Amazing Work!',
      title: 'Earned 5 Lauren Eva\'s Reception - Miss Watson - 2023/24',
      description: 'class on Tue February 6th at 3:27 pm',
      timestamp: '3:27 pm',
      day: 'Tuesday'
    },
  ];

  const timelineData = activities || defaultActivities;

  const getIconComponent = (icon: string) => {
    const baseClasses = "w-4 h-4";
    
    switch (icon) {
      case 'thumbs-up':
        return (
          <svg className={`${baseClasses} text-blue-600`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558-.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23h-.777zM2.331 10.977a11.969 11.969 0 00-.831 4.398 12 12 0 00.52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 01-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227z"/>
          </svg>
        );
      case 'star':
        return (
          <svg className={`${baseClasses} text-yellow-500`} fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd"/>
          </svg>
        );
      case 'trophy':
        return (
          <svg className={`${baseClasses} text-orange-500`} fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 00-.584.859 6.753 6.753 0 006.138 5.6 6.73 6.73 0 002.743 1.346A6.707 6.707 0 019.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 00-2.25 2.25c0 .414.336.75.75.75h9.282a.75.75 0 00.75-.75 2.25 2.25 0 00-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 01-1.112-3.173 6.73 6.73 0 002.743-1.347 6.753 6.753 0 006.139-5.6.75.75 0 00-.585-.858 47.077 47.077 0 00-3.07-.543V2.62a.75.75 0 00-.658-.744 49.22 49.22 0 00-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 00-.657.744zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 013.16 5.337a45.6 45.6 0 012.006-.343v.256zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 01-2.863 3.207A6.72 6.72 0 0018.666 5.25z" clipRule="evenodd"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'bg-blue-100';
      case 'achievement':
        return 'bg-yellow-100';
      case 'work':
        return 'bg-orange-100';
      default:
        return 'bg-gray-100';
    }
  };

  // Group activities by day
  const groupedActivities = timelineData.reduce((acc, activity) => {
    if (!acc[activity.day]) {
      acc[activity.day] = [];
    }
    acc[activity.day].push(activity);
    return acc;
  }, {} as Record<string, Activity[]>);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 max-h-96 overflow-y-auto">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
      
      <div className="space-y-4">
        {Object.entries(groupedActivities).map(([day, dayActivities]) => (
          <div key={day}>
            {/* Day Header */}
            <div className="bg-blue-500 text-white text-sm font-medium px-3 py-1.5 rounded-md mb-3">
              {day}
            </div>
            
            {/* Activities for this day */}
            <div className="space-y-3 ml-2">
              {dayActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-8 h-8 ${getBackgroundColor(activity.type)} rounded-full flex items-center justify-center`}>
                    {getIconComponent(activity.icon)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-medium text-green-600">
                        {activity.points}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-tight">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {activity.description}
                    </p>
                  </div>
                  
                  {/* Time */}
                  <div className="flex-shrink-0 text-xs text-gray-400">
                    {activity.timestamp}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Show more activities section headers */}
      <div className="mt-4 space-y-2">
        <div className="bg-blue-500 text-white text-sm font-medium px-3 py-1.5 rounded-md">
          Wednesday
        </div>
        <div className="bg-blue-500 text-white text-sm font-medium px-3 py-1.5 rounded-md">
          Thursday
        </div>
        <div className="bg-blue-500 text-white text-sm font-medium px-3 py-1.5 rounded-md">
          Friday
        </div>
      </div>
    </div>
  );
}