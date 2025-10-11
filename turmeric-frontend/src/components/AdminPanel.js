import React, { useState, useEffect } from 'react';
import { Plus, Users, Eye, EyeOff, Edit, Trash2, Shield, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';

const STAGES = [
  { id: 'farmer', name: 'Farmer', color: 'green' },
  { id: 'processing', name: 'Processing', color: 'blue' },
  { id: 'distributor', name: 'Distributor', color: 'purple' },
  { id: 'supplier', name: 'Supplier', color: 'orange' },
  { id: 'shopkeeper', name: 'Shopkeeper', color: 'red' }
];

const AdminPanel = () => {
  const [stageUsers, setStageUsers] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    stage: 'farmer'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchStageUsers();
  }, []);

  const fetchStageUsers = async () => {
    try {
      const response = await axios.get('/api/stage/all');
      setStageUsers(response.data.stageUsers);
    } catch (error) {
      console.error('Error fetching stage users:', error);
    }
  };

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
    setSuccess('');

    if (!formData.username || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/stage/create', formData);
      setSuccess('Stage user created successfully!');
      setFormData({ username: '', password: '', stage: 'farmer' });
      setShowCreateForm(false);
      fetchStageUsers();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create stage user');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await axios.patch(`/api/stage/${userId}/status`, { isActive: !currentStatus });
      fetchStageUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const deleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this stage user?')) {
      try {
        await axios.delete(`/api/stage/${userId}`);
        fetchStageUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const getStageColor = (stage) => {
    const stageConfig = STAGES.find(s => s.id === stage);
    return stageConfig?.color || 'gray';
  };

  const getStageName = (stage) => {
    const stageConfig = STAGES.find(s => s.id === stage);
    return stageConfig?.name || stage;
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-3 rounded-lg">
              <Shield className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Stage User Management</h1>
              <p className="text-gray-600">Manage credentials for each supply chain stage</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center gap-2"
          >
            <Plus size={20} />
            Create Stage User
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* Create Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-md">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Stage User</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stage
                  </label>
                  <select
                    name="stage"
                    value={formData.stage}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    {STAGES.map(stage => (
                      <option key={stage.id} value={stage.id}>
                        {stage.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter username"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-purple-800 transition-all duration-200 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create User'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Stage Users List */}
        <div className="space-y-4">
          {stageUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto text-gray-400" size={48} />
              <h3 className="text-lg font-medium text-gray-500 mt-4">No stage users created yet</h3>
              <p className="text-gray-400">Create your first stage user to get started</p>
            </div>
          ) : (
            stageUsers.map((user) => (
              <div
                key={user._id}
                className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`bg-${getStageColor(user.stage)}-100 p-3 rounded-lg`}>
                      <Users className={`text-${getStageColor(user.stage)}-600`} size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{user.username}</h3>
                      <p className="text-sm text-gray-600">
                        Stage: <span className="font-medium">{getStageName(user.stage)}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Created: {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleUserStatus(user._id, user.isActive)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                        user.isActive
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {user.isActive ? <CheckCircle size={16} /> : <XCircle size={16} />}
                      {user.isActive ? 'Active' : 'Inactive'}
                    </button>
                    
                    <button
                      onClick={() => deleteUser(user._id)}
                      className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-200"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
