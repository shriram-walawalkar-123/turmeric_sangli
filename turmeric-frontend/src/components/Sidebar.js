import React from 'react';
import { Eye, Settings, Users, LogIn } from 'lucide-react';
import { ROLES } from '../utils/constants';

const Sidebar = ({ userRole, setUserRole, activeTab, setActiveTab, showStageLogin, setShowStageLogin }) => {

return (
    <div className="bg-white rounded-2xl shadow-xl p-6 space-y-3 sticky top-24 border border-gray-100">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-1">Navigation</h2>
        <p className="text-xs text-gray-500">Manage your supply chain</p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => setActiveTab('admin-panel')}
          className={`group w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 ${
            activeTab === 'admin-panel' 
              ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-200 scale-[1.02]' 
              : 'hover:bg-gray-50 text-gray-700 hover:shadow-md hover:scale-[1.01] border border-gray-100'
          }`}
        >
          <div className={`p-2 rounded-lg ${
            activeTab === 'admin-panel' 
              ? 'bg-white/20' 
              : 'bg-purple-50 text-purple-600 group-hover:bg-purple-100'
          }`}>
            <Settings size={22} />
          </div>
          <div className="text-left flex-1">
            <div className="font-semibold text-base">Admin Panel</div>
            <div className={`text-xs mt-0.5 ${
              activeTab === 'admin-panel' ? 'text-purple-100' : 'text-gray-500'
            }`}>Manage users & access</div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;