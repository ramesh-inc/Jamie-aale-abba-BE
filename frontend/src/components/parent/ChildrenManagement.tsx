import React, { useState } from 'react';
import AddChildForm from './AddChildForm';
import ViewChildren from './ViewChildren';

type ViewMode = 'list' | 'add';

const ChildrenManagement: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>('list');

  const handleAddChild = () => {
    setCurrentView('add');
  };

  const handleChildAdded = (child: any) => {
    console.log('Child added:', child);
    // Switch back to list view after successful addition
    setCurrentView('list');
  };

  const handleCancel = () => {
    setCurrentView('list');
  };

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setCurrentView('list')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              currentView === 'list'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Children
          </button>
          <button
            onClick={() => setCurrentView('add')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              currentView === 'add'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Add Child
          </button>
        </nav>
      </div>

      {/* Content */}
      <div>
        {currentView === 'list' && (
          <ViewChildren onAddChild={handleAddChild} />
        )}
        {currentView === 'add' && (
          <AddChildForm
            onSuccess={handleChildAdded}
            onCancel={handleCancel}
          />
        )}
      </div>
    </div>
  );
};

export default ChildrenManagement;