import React, { useState } from 'react';
import { User, LogOut } from 'lucide-react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
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

function RequireAdminAuth({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
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
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

function RequireStageAuth({ children }) {
  const { isAuthenticated, isLoading } = useStageAuth();
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
    return <Navigate to="/stage/login" replace />;
  }
  return children;
}

function StageLoginPage() {
  const { login, isAuthenticated, isLoading } = useStageAuth();
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const navigate = useNavigate();
  const handleLogin = async (credentials) => {
    setIsAuthLoading(true);
    try {
      await login(credentials);
      navigate('/stage/dashboard', { replace: true });
    } finally {
      setIsAuthLoading(false);
    }
  };
  if (!isLoading && isAuthenticated) {
    return <Navigate to="/stage/dashboard" replace />;
  }
  return <StageLogin onLogin={handleLogin} isLoading={isAuthLoading} showBackButton={false} />;
}

function StageDashboardPage() {
  const { stageUser, logout } = useStageAuth();
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
                <p className="text-sm text-gray-500">Welcome, {stageUser?.username}</p>
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

function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Turmeric Supply Chain</h1>
        <p className="text-gray-600 text-center mb-8">Choose what you want to do</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/tracking" className="block bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-xl p-6 text-center transition-all">
            <div className="text-xl font-bold text-blue-800 mb-1">Track Packet History</div>
          </Link>
          <Link
  to="/stage/login"
  className="block bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 rounded-xl p-6 text-center transition-all w-full break-words"
>
  <div className="text-xl font-bold text-purple-800 mb-1 break-words">
    Stage Login
  </div>
  <div className="text-purple-600 break-words">
   Farmer / Processor / Distributor / Supplier / Shopkeeper
  </div>
</Link>

          <Link to="/admin/login" className="block bg-green-50 hover:bg-green-100 border-2 border-green-200 rounded-xl p-6 text-center transition-all">
            <div className="text-xl font-bold text-green-800 mb-1">Admin</div>
            <div className="text-green-600">Admin authentication and panel</div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function AdminLoginPage() {
  const { login, register, isLoading, isAuthenticated } = useAuth();
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const navigate = useNavigate();
  const handleLogin = async (credentials) => {
    setIsAuthLoading(true);
    try {
      await login(credentials);
      navigate('/admin/panel', { replace: true });
    } finally {
      setIsAuthLoading(false);
    }
  };
  const handleRegister = async (credentials) => {
    setIsAuthLoading(true);
    try {
      await register(credentials);
      navigate('/admin/panel', { replace: true });
    } finally {
      setIsAuthLoading(false);
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
  if (isAuthenticated) {
    return <Navigate to="/admin/panel" replace />;
  }
  return (
    <AdminLogin onLogin={handleLogin} onRegister={handleRegister} isLoading={isAuthLoading} />
  );
}

function AdminPanelPage() {
  const [userRole, setUserRole] = useState('admin');
  const [activeTab, setActiveTab] = useState('dashboard');
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
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar
          userRole={userRole}
          setUserRole={setUserRole}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          showStageLogin={false}
          setShowStageLogin={() => {}}
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
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/tracking" element={<TrackingPage />} />
            {/* Admin routes */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route
              path="/admin/panel"
              element={
                <RequireAdminAuth>
                  <AdminPanelPage />
                </RequireAdminAuth>
              }
            />
            {/* Stage routes */}
            <Route path="/stage/login" element={<StageLoginPage />} />
            <Route
              path="/stage/dashboard"
              element={
                <RequireStageAuth>
                  <StageDashboardPage />
                </RequireStageAuth>
              }
            />
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </StageAuthProvider>
    </AuthProvider>
  );
}

export default App;