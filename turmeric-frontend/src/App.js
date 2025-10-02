import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import DataEntryForm from './components/DataEntryForm';
import TrackingPage from './components/TrackingPage';

function App() {
  const [userRole, setUserRole] = useState('admin');
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'entry':
        return <DataEntryForm userRole={userRole} />;
      case 'tracking':
        return <TrackingPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        <Sidebar
          userRole={userRole}
          setUserRole={setUserRole}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        
        <main className="flex-1 p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;