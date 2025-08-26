import { useState } from 'react';
import { AuthTokenManager } from '../../utils/auth';
import Sidebar from './Sidebar';
import TeacherSidebar from './TeacherSidebar';
import ParentSidebar from './ParentSidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeItem: string;
  onItemSelect: (itemId: string) => void;
  title?: string;
  subtitle?: string;
}

export default function DashboardLayout({ 
  children, 
  activeItem, 
  onItemSelect, 
  title,
  subtitle 
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const user = AuthTokenManager.getUser();

  const handleLogout = () => {
    AuthTokenManager.clearTokens();
    window.location.href = '/login';
  };

  const renderSidebar = () => {
    const isAdmin = user?.admin_profile?.admin_level || user?.is_superuser;
    const isTeacher = user?.user_type === 'teacher';
    const isParent = user?.user_type === 'parent';

    if (isAdmin) {
      return (
        <Sidebar
          isOpen={sidebarOpen}
          isCollapsed={sidebarCollapsed}
          onClose={() => setSidebarOpen(false)}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeItem={activeItem}
          onItemSelect={(itemId) => {
            onItemSelect(itemId);
            setSidebarOpen(false);
          }}
          onLogout={handleLogout}
        />
      );
    } else if (isTeacher) {
      return (
        <TeacherSidebar
          isOpen={sidebarOpen}
          isCollapsed={sidebarCollapsed}
          onClose={() => setSidebarOpen(false)}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeItem={activeItem}
          onItemSelect={(itemId) => {
            onItemSelect(itemId);
            setSidebarOpen(false);
          }}
          onLogout={handleLogout}
        />
      );
    } else if (isParent) {
      return (
        <ParentSidebar
          isOpen={sidebarOpen}
          isCollapsed={sidebarCollapsed}
          onClose={() => setSidebarOpen(false)}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeItem={activeItem}
          onItemSelect={(itemId) => {
            onItemSelect(itemId);
            setSidebarOpen(false);
          }}
          onLogout={handleLogout}
        />
      );
    }
    
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      {renderSidebar()}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                {/* Sidebar Toggle Button */}
                <button
                  type="button"
                  className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                  onClick={() => {
                    if (window.innerWidth >= 1024) {
                      setSidebarCollapsed(!sidebarCollapsed);
                    } else {
                      setSidebarOpen(true);
                    }
                  }}
                >
                  <span className="sr-only">{sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}</span>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

              </div>

              {/* Right side - Notifications and User */}
              <div className="flex items-center space-x-4">
                {/* Notification Bell */}
                <button className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 relative">
                  <span className="sr-only">View notifications</span>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {/* Notification dot */}
                  <div className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-red-500 rounded-full border-2 border-white"></div>
                </button>

                {/* User Profile */}
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <img 
                      className="w-8 h-8 rounded-full" 
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.first_name || '')}+${encodeURIComponent(user?.last_name || '')}&background=4F46E5&color=fff&size=32`}
                      alt="User avatar" 
                    />
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-gray-900">{user?.first_name} {user?.last_name}</p>
                    </div>
                    {/* Dropdown icon */}
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Profile Dropdown */}
                  {profileDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setProfileDropdownOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-20">
                        <div className="py-1">
                          <div className="px-4 py-2 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-900">{user?.first_name} {user?.last_name}</p>
                            <p className="text-xs text-gray-500">{user?.email}</p>
                          </div>
                          <button
                            onClick={() => {
                              setProfileDropdownOpen(false);
                              onItemSelect('settings');
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Profile Settings
                          </button>
                          <button
                            onClick={() => {
                              setProfileDropdownOpen(false);
                              handleLogout();
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            Sign out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 bg-gray-50 overflow-auto">
          <div className="bg-white border border-gray-200 shadow-sm h-full">
            <div className="p-6">
              {/* Page Title */}
              {title && (
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                  {subtitle && (
                    <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
                  )}
                </div>
              )}
              
              {/* Dynamic Content */}
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}