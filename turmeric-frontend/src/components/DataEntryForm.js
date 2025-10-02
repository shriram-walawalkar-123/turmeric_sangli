import React, { useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import { FORM_FIELDS, ROLES } from '../utils/constants';
import { API } from '../config/api';

const DataEntryForm = ({ userRole }) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getFormFields = () => {
    switch (userRole) {
      case 'farmer': return FORM_FIELDS.HARVEST;
      case 'processor': return FORM_FIELDS.PROCESSING;
      case 'distributor': return FORM_FIELDS.DISTRIBUTOR;
      case 'supplier': return FORM_FIELDS.SUPPLIER;
      case 'shopkeeper': return FORM_FIELDS.SHOPKEEPER;
      default: return [];
    }
  };

  const getRoleInfo = () => {
    return ROLES.find(role => role.id === userRole);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  const validateForm = () => {
    const fields = getFormFields();
    for (let field of fields) {
      if (field.required && !formData[field.name]) {
        setError(`${field.label} is required`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

try {
      let response;
      
      switch (userRole) {
        case 'farmer':
          response = await API.addHarvest(submitData);
          break;
        case 'processor':
          response = await API.addProcessing(submitData);
          break;
        case 'distributor':
          response = await API.addDistributor(submitData);
          break;
        case 'supplier':
          response = await API.addSupplier(submitData);
          break;
        case 'shopkeeper':
          response = await API.addShopkeeper(submitData);
          break;
        case 'admin':
          response = await API.addPacket(submitData);
          break;
        default:
          throw new Error('Invalid role');
      }
      
      setSuccess('Data submitted successfully!');
      setFormData({});
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit data');
    } finally {
      setSubmitting(false);
    }
  };

  const roleInfo = getRoleInfo();
  const fields = getFormFields();
  const IconComponent = roleInfo?.icon;

  if (!roleInfo) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        {IconComponent && (
          <div className={`bg-${roleInfo.color}-100 p-3 rounded-lg`}>
            <IconComponent className={`text-${roleInfo.color}-600`} size={24} />
          </div>
        )}
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {roleInfo.name} Data Entry
          </h2>
          <p className="text-sm text-gray-500">{roleInfo.description}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded flex items-start gap-2">
          <AlertCircle className="text-red-500 mt-0.5" size={20} />
          <div>
            <p className="font-medium text-red-800">Error</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 rounded flex items-start gap-2">
          <AlertCircle className="text-green-500 mt-0.5" size={20} />
          <div>
            <p className="font-medium text-green-800">Success</p>
            <p className="text-sm text-green-600">{success}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map(field => (
            <div 
              key={field.name} 
              className={field.type === 'textarea' ? 'md:col-span-2' : ''}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              
              {field.type === 'textarea' ? (
                <textarea
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                  rows="3"
                  placeholder={field.label}
                />
              ) : field.type === 'checkbox' ? (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name={field.name}
                    checked={formData[field.name] || false}
                    onChange={handleChange}
                    className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    Mark as organic certified
                  </span>
                </div>
              ) : (
                <input
                  type={field.type}
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                  placeholder={field.label}
                />
              )}
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full md:w-auto bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Submitting to Blockchain...</span>
            </>
          ) : (
            <>
              <Save size={20} />
              <span>Submit to Blockchain</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default DataEntryForm;