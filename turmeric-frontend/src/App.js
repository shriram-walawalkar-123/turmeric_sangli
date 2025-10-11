import React, { useState } from 'react';
import { User, LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StageAuthProvider, useStageAuth } from './context/StageAuthContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TrackingPage from './components/TrackingPage';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';
import StageLogin from './components/StageLogin';
import StageDashboard from './components/StageDashboard';

function StageAppContent() {
  const { stageUser, isAuthenticated, isLoading, login, logout } = useStageAuth();
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const handleLogin = async (credentials) => {
    setIsAuthLoading(true);
    try {
      await login(credentials);
    } finally {
      setIsAuthLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <StageLogin onLogin={handleLogin} isLoading={isAuthLoading} showBackButton={false} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-lg shadow-lg">
                <User className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {stageUser?.stage?.charAt(0).toUpperCase() + stageUser?.stage?.slice(1)} Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                  Welcome, {stageUser?.username}
                </p>
              </div>
            </div>
            
            <button
              onClick={logout}
              className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-lg border border-red-200 hover:bg-red-100 transition-colors duration-200"
            >
              <LogOut className="text-red-600" size={20} />
              <span className="text-sm font-medium text-red-700">Logout</span>
            </button>
          </div>
        </div>
      </div>
      
      <main className="p-8">
        <StageDashboard />
      </main>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading, login, register } = useAuth();
  const [userRole, setUserRole] = useState('admin');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [showStageLogin, setShowStageLogin] = useState(false);

  const handleLogin = async (credentials) => {
    setIsAuthLoading(true);
    try {
      await login(credentials);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleRegister = async (credentials) => {
    setIsAuthLoading(true);
    try {
      await register(credentials);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'tracking':
        return <TrackingPage />;
      case 'admin-panel':
        return <AdminPanel />;
      default:
        return <Dashboard />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} onRegister={handleRegister} isLoading={isAuthLoading} />;
  }

  if (showStageLogin) {
    return (
      <StageAuthProvider>
        <StageAppContent />
      </StageAuthProvider>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        <Sidebar
          userRole={userRole}
          setUserRole={setUserRole}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          showStageLogin={showStageLogin}
          setShowStageLogin={setShowStageLogin}
        />
        
        <main className="flex-1 p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <StageAuthProvider>
        <AppContent />
      </StageAuthProvider>
    </AuthProvider>
  );
}

export default App;