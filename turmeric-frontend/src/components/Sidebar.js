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
          onClick={() => setActiveTab('tracking')}
          className={`group w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 ${
            activeTab === 'tracking' 
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200 scale-[1.02]' 
              : 'hover:bg-gray-50 text-gray-700 hover:shadow-md hover:scale-[1.01] border border-gray-100'
          }`}
        >
          <div className={`p-2 rounded-lg ${
            activeTab === 'tracking' 
              ? 'bg-white/20' 
              : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'
          }`}>
            <Eye size={22} />
          </div>
          <div className="text-left flex-1">
            <div className="font-semibold text-base">Track Product</div>
            <div className={`text-xs mt-0.5 ${
              activeTab === 'tracking' ? 'text-blue-100' : 'text-gray-500'
            }`}>View complete journey</div>
          </div>
        </button>

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

        <div className="pt-2 border-t border-gray-200">
          <button
            onClick={() => setShowStageLogin(true)}
            className="group w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-200 hover:shadow-xl hover:scale-[1.02]"
          >
            <div className="p-2 rounded-lg bg-white/20">
              <LogIn size={22} />
            </div>
            <div className="text-left flex-1">
              <div className="font-semibold text-base">Stage Login</div>
              <div className="text-xs text-green-100 mt-0.5">Access stage dashboard</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;