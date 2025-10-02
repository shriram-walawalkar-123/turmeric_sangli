import React from 'react';
import { Eye } from 'lucide-react';
import { ROLES } from '../utils/constants';

const Sidebar = ({ userRole, setUserRole, activeTab, setActiveTab }) => {
  const handleRoleChange = (roleId) => {
    setUserRole(roleId);
    setActiveTab(roleId === 'admin' ? 'dashboard' : 'entry');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 space-y-2 sticky top-24">
      <h3 className="font-semibold text-gray-700 mb-4 text-lg">
        Select Role
      </h3>
      
      {ROLES.map(role => {
        const IconComponent = role.icon;
        return (
          <button
            key={role.id}
            onClick={() => handleRoleChange(role.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              userRole === role.id 
                ? 'bg-green-100 text-green-800 font-medium shadow-sm' 
                : 'hover:bg-gray-50 text-gray-700 hover:shadow-sm'
            }`}
          >
            <IconComponent size={20} />
            <div className="text-left flex-1">
              <div className="font-medium">{role.name}</div>
              <div className="text-xs text-gray-500">{role.description}</div>
            </div>
          </button>
        );
      })}
      
      <div className="pt-4 border-t mt-4">
        <button
          onClick={() => setActiveTab('tracking')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
            activeTab === 'tracking' 
              ? 'bg-blue-100 text-blue-800 font-medium shadow-sm' 
              : 'hover:bg-gray-50 text-gray-700 hover:shadow-sm'
          }`}
        >
          <Eye size={20} />
          <div className="text-left flex-1">
            <div className="font-medium">Track Product</div>
            <div className="text-xs text-gray-500">View full journey</div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;