import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const STAGES = [
  { id: 'farmer', name: 'Farmer', color: 'green', description: 'Harvest and initial processing' },
  { id: 'processing', name: 'Processing', color: 'blue', description: 'Grinding and packaging' },
  { id: 'distributor', name: 'Distributor', color: 'purple', description: 'Distribution and logistics' },
  { id: 'supplier', name: 'Supplier', color: 'yellow', description: 'Supply chain management' },
  { id: 'shopkeeper', name: 'Shopkeeper', color: 'red', description: 'Retail and final sale' }
];

const StageLogin = ({ onLogin, onBack, isLoading, showBackButton = true }) => {
  const [selectedStage, setSelectedStage] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');

  if (!formData.username || !formData.password) {
    setError('Please fill in all fields');
    return;
  }

  try {
    // 🔑 Call the backend login endpoint (through onLogin)
    const res = await onLogin({
      ...formData,
      stage: selectedStage.id,
    });

   // StageLogin handleSubmit
if (res?.token) {
  localStorage.setItem("stageToken", res.token); // use the same key your interceptor reads
}


  } catch (err) {
    setError(err.message || 'Login failed');
  }
};


  const handleStageSelect = (stage) => {
    setSelectedStage(stage);
    setFormData({ username: '', password: '' });
    setError('');
  };

  if (!selectedStage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-4xl">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <User className="text-white" size={40} />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Select Your Stage
            </h2>
            <p className="text-gray-600">
              Choose your role in the supply chain to access your dashboard
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {STAGES.map((stage) => (
              <button
                key={stage.id}
                onClick={() => handleStageSelect(stage)}
                className={`bg-gradient-to-br from-${stage.color}-50 to-${stage.color}-100 p-6 rounded-xl border-2 border-transparent hover:border-${stage.color}-300 transition-all duration-200 group`}
              >
                <div className={`bg-${stage.color}-100 p-4 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                  <User className={`text-${stage.color}-600`} size={32} />
                </div>
                <h3 className={`text-xl font-bold text-${stage.color}-800 mb-2`}>
                  {stage.name}
                </h3>
                <p className={`text-${stage.color}-600 text-sm`}>
                  {stage.description}
                </p>
              </button>
            ))}
          </div>

          {showBackButton && onBack && (
            <div className="mt-8 text-center">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors duration-200 mx-auto"
              >
                <ArrowLeft size={20} />
                Back to Admin Panel
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className={`bg-gradient-to-br from-${selectedStage.color}-600 to-${selectedStage.color}-700 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center`}>
            <User className="text-white" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {selectedStage.name} Login
          </h2>
          <p className="text-gray-600">
            Enter your credentials to access the {selectedStage.name.toLowerCase()} dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
  type="submit"
  disabled={isLoading}
  className={`w-full bg-gradient-to-r from-${selectedStage.color}-600 to-${selectedStage.color}-700 text-white hover:from-${selectedStage.color}-700 hover:to-${selectedStage.color}-800 focus:ring-4 focus:ring-${selectedStage.color}-300
   py-3 px-4 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
>
  {isLoading ? 'Logging in...' : `Login as ${selectedStage.name}`}
</button>

        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setSelectedStage(null)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors duration-200 mx-auto"
          >
            <ArrowLeft size={20} />
            Back to Stage Selection
          </button>
          {showBackButton && onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors duration-200 mx-auto mt-2"
            >
              <ArrowLeft size={20} />
              Back to Admin Panel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StageLogin;
