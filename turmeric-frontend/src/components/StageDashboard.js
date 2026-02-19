import React, { useState } from 'react';
import { useStageAuth } from '../context/StageAuthContext';
import { User, Shield, ArrowRight, Plus, Eye, BarChart3 } from 'lucide-react';
import StageDataEntryForm from './StageDataEntryForm';

const StageDashboard = () => {
  const { stageUser } = useStageAuth();
  const [activeView, setActiveView] = useState('dashboard');

  const getStageInfo = (stage) => {
    const stageConfig = {
      farmer: {
        name: 'Farmer',
        color: 'green',
        description: 'Harvest and initial processing stage',
        features: ['Add harvest data', 'Record GPS coordinates', 'Track organic status', 'Manage batch information']
      },
      processing: {
        name: 'Processing',
        color: 'blue',
        description: 'Grinding and packaging stage',
        features: ['Record processing data', 'Track moisture content', 'Monitor curcumin levels', 'Manage packaging']
      },
      distributor: {
        name: 'Distributor',
        color: 'purple',
        description: 'Distribution and logistics stage',
        features: ['Track distribution', 'Record dispatch data', 'Monitor logistics', 'Manage inventory']
      },
      supplier: {
        name: 'Supplier',
        color: 'yellow',
        description: 'Supply chain management stage',
        features: ['Manage supplies', 'Track receipts', 'Monitor inventory', 'Coordinate logistics']
      },
      shopkeeper: {
        name: 'Shopkeeper',
        color: 'red',
        description: 'Retail and final sale stage',
        features: ['Record sales', 'Track inventory', 'Manage customer data', 'Monitor product status']
      }
    };
    return stageConfig[stage] || stageConfig.farmer;
  };

  const stageInfo = getStageInfo(stageUser?.stage);

  if (activeView === 'data-entry') {
    return <StageDataEntryForm onBack={() => setActiveView('dashboard')} />;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className={`bg-gradient-to-br from-${stageInfo.color}-600 to-${stageInfo.color}-700 p-4 rounded-xl`}>
              <User className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {stageInfo.name} Dashboard
              </h1>
              <p className="text-gray-600">{stageInfo.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
            <Shield className="text-green-600" size={20} />
            <div className="text-left">
              <p className="text-xs text-gray-500">Status</p>
              <p className="text-sm font-semibold text-green-700">
                Authenticated
              </p>
            </div>
          </div>
        </div>

        {/* Welcome Section */}
        <div className={`bg-gradient-to-r from-${stageInfo.color}-50 to-${stageInfo.color}-100 rounded-xl p-6 mb-8`}>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Welcome, {stageUser?.username}!
          </h2>
          <p className="text-gray-700">
            You are logged in as a {stageInfo.name.toLowerCase()} in the turmeric supply chain. 
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stageInfo.features.map((feature, index) => (
            <div
              key={index}
              className={`bg-white border-2 border-${stageInfo.color}-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 group`}
            >
              <div className={`bg-${stageInfo.color}-100 p-3 rounded-lg w-12 h-12 mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                <ArrowRight className={`text-${stageInfo.color}-600`} size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {feature}
              </h3>
              <p className="text-gray-600 text-sm">
              {feature.toLowerCase()} for your stage
              </p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => setActiveView('data-entry')}
              className={`bg-gradient-to-r from-${stageInfo.color}-600 to-${stageInfo.color}-700 text-white py-3 px-6 rounded-lg font-medium hover:from-${stageInfo.color}-700 hover:to-${stageInfo.color}-800 transition-all duration-200 flex items-center gap-2`}
            >
              <Plus size={20} />
              Add New Data Entry
            </button>
          </div>
        </div>

        {/* Stage Information */}
        <div className="mt-8 bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Stage Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Username</p>
              <p className="text-lg font-medium text-gray-800">{stageUser?.username}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Stage</p>
              <p className="text-lg font-medium text-gray-800">{stageInfo.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Status</p>
              <p className="text-lg font-medium text-green-600">Active</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StageDashboard;
