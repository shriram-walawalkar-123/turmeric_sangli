import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, MapPin, Loader } from 'lucide-react';
import { FORM_FIELDS, ROLES } from '../utils/constants';
import { API } from '../config/api';

const DataEntryForm = ({ userRole }) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [locationCaptured, setLocationCaptured] = useState(false);

  // Reset form and location state when userRole changes
  useEffect(() => {
    setFormData({});
    setLocationCaptured(false);
    setGpsError('');
    setError('');
    setSuccess('');
  }, [userRole]);

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

  // Check if form has GPS fields
  const hasGPSFields = () => {
    const fields = getFormFields();
    return fields.some(field => 
      field.name === 'latitude' || 
      field.name === 'longitude' || 
      field.name === 'gps_coordinates' ||
      field.name === 'location_lat' ||
      field.name === 'location_lng' ||
      field.name === 'gps_location' ||
      field.name === 'processing_gps' ||
      field.name === 'farm_gps' ||
      field.name === 'warehouse_gps' ||
      field.name === 'shop_gps'
    );
  };

  // Get current GPS location
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      setGpsLoading(true);
      setGpsError('');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
          setGpsLoading(false);
        },
        (error) => {
          let errorMessage = 'Unable to retrieve location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location permissions.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
            default:
              errorMessage = 'An unknown error occurred while getting location.';
          }
          setGpsError(errorMessage);
          setGpsLoading(false);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  const handleGetLocation = async () => {
    try {
      const location = await getCurrentLocation();
      const fields = getFormFields();
      
      // Update form data based on field names present in current role
      setFormData(prev => {
        const updated = { ...prev };
        
        fields.forEach(field => {
          // Handle various GPS field naming conventions
          if (field.name === 'latitude' || field.name === 'location_lat') {
            updated[field.name] = location.latitude.toFixed(6);
          }
          if (field.name === 'longitude' || field.name === 'location_lng') {
            updated[field.name] = location.longitude.toFixed(6);
          }
          if (field.name === 'gps_coordinates' || 
              field.name === 'gps_location' || 
              field.name === 'processing_gps' ||
              field.name === 'farm_gps' ||
              field.name === 'warehouse_gps' ||
              field.name === 'shop_gps') {
            updated[field.name] = `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
          }
        });
        
        return updated;
      });
      
      setLocationCaptured(true);
      setSuccess(`Location captured for ${roleInfo.name} (Accuracy: ${location.accuracy.toFixed(0)}m)`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setLocationCaptured(false);
      // Error is already set by getCurrentLocation
    }
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

    // Check if GPS fields are required and captured
    if (hasGPSFields() && !locationCaptured) {
      setError('Please capture GPS location before submitting');
      return false;
    }

    return true;
  };

  const buildSubmitData = () => {
    const data = { ...formData };

    // Normalize supplier shopkeeper list (textarea or array)
    if (userRole === 'supplier') {
      const raw = data.shopkeeper_list;
      if (Array.isArray(raw)) {
        data.shopkeeper_list = raw;
      } else if (typeof raw === 'string' && raw.trim() !== '') {
        data.shopkeeper_list = raw.split(',').map(s => s.trim()).filter(Boolean);
      } else {
        data.shopkeeper_list = [];
      }
    }

    // Normalize numbers for processing
    if (userRole === 'processor') {
      if (data.moisture_content !== undefined && data.moisture_content !== '') {
        data.moisture_content = Number(data.moisture_content);
      }
      if (data.curcumin_content !== undefined && data.curcumin_content !== '') {
        data.curcumin_content = Number(data.curcumin_content);
      }
    }

    // Convert GPS coordinates to numbers if needed
    if (data.latitude) data.latitude = Number(data.latitude);
    if (data.longitude) data.longitude = Number(data.longitude);
    if (data.location_lat) data.location_lat = Number(data.location_lat);
    if (data.location_lng) data.location_lng = Number(data.location_lng);

    return data;
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
      const submitData = buildSubmitData();
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
      
      setSuccess(response?.data?.message || 'Data submitted successfully!');
      setFormData({});
      setLocationCaptured(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to submit data');
    } finally {
      setLoading(false);
    }
  };

  const roleInfo = getRoleInfo();
  const fields = getFormFields();
  const IconComponent = roleInfo?.icon;

  if (!roleInfo) {
    return null;
  }

  const isGPSField = (fieldName) => {
    return fieldName === 'latitude' || 
           fieldName === 'longitude' || 
           fieldName === 'gps_coordinates' ||
           fieldName === 'location_lat' ||
           fieldName === 'location_lng' ||
           fieldName === 'gps_location' ||
           fieldName === 'processing_gps' ||
           fieldName === 'farm_gps' ||
           fieldName === 'warehouse_gps' ||
           fieldName === 'shop_gps';
  };

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

      {gpsError && (
        <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded flex items-start gap-2">
          <AlertCircle className="text-yellow-600 mt-0.5" size={20} />
          <div>
            <p className="font-medium text-yellow-800">Location Error</p>
            <p className="text-sm text-yellow-700">{gpsError}</p>
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

      {hasGPSFields() && (
        <div className={`mb-4 p-4 border rounded-lg ${
          locationCaptured ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className={locationCaptured ? 'text-green-600' : 'text-blue-600'} size={20} />
              <div>
                <span className={`text-sm font-medium ${
                  locationCaptured ? 'text-green-900' : 'text-blue-900'
                }`}>
                  GPS Location for {roleInfo.name} Stage
                </span>
                {locationCaptured && (
                  <p className="text-xs text-green-700 mt-1">
                    ✓ Location captured for this stage
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={gpsLoading}
              className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                locationCaptured 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {gpsLoading ? (
                <>
                  <Loader className="animate-spin" size={16} />
                  <span>Getting Location...</span>
                </>
              ) : (
                <>
                  <MapPin size={16} />
                  <span>{locationCaptured ? 'Update Location' : 'Capture Location'}</span>
                </>
              )}
            </button>
          </div>
          {!locationCaptured && (
            <p className="text-xs text-blue-700 mt-2">
              Click "Capture Location" to get GPS coordinates for this {roleInfo.name.toLowerCase()} stage.
            </p>
          )}
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
                {isGPSField(field.name) && (
                  <span className="ml-2 text-xs text-blue-600 font-normal">
                    (Auto-captured)
                  </span>
                )}
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
                  readOnly={isGPSField(field.name)}
                  className={`w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition ${
                    isGPSField(field.name) ? 'bg-gray-50 cursor-not-allowed' : ''
                  }`}
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
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <Save size={20} />
              <span>Submit</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default DataEntryForm;