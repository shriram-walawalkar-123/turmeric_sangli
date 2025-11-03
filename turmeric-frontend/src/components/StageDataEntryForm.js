import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useStageAuth } from '../context/StageAuthContext';
import { API } from '../config/api';
import { Save, CheckCircle, AlertCircle, ArrowLeft, MapPin, RefreshCw } from 'lucide-react';
import QRCode from 'qrcode';

const StageDataEntryForm = ({ onBack }) => {
  const { stageUser } = useStageAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Processing stage specific state
  const [farmers, setFarmers] = useState([]);
  const [selectedFarmer, setSelectedFarmer] = useState('');
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [batchPacketCount, setBatchPacketCount] = useState(null);
  const [loadingFarmers, setLoadingFarmers] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);

  const getStageFormConfig = (stage) => {
    const configs = {
      farmer: {
        title: 'Harvest Data Entry',
        description: 'Record harvest information and initial processing data',
        fields: [
          { name: 'farmer_id', label: 'Farmer ID', type: 'text', required: true },
          { name: 'product_name', label: 'Product Name', type: 'text', required: true },
          { name: 'batch_id', label: 'Batch ID', type: 'text', required: true },
          { name: 'harvest_date', label: 'Harvest Date', type: 'date', required: true },
          { name: 'gps_coordinates', label: 'GPS Coordinates', type: 'text', required: true, placeholder: 'lat, lng' },
          { name: 'fertilizer', label: 'Fertilizer Used', type: 'text', required: false },
          { name: 'organic_status', label: 'Organic Status', type: 'select', required: true, options: ['Organic', 'Non-Organic'] }
        ],
        submitEndpoint: 'addHarvest'
      },
      processing: {
        title: 'Processing Data Entry',
        description: 'Record processing and packaging information',
        fields: [
          // batch_id will be handled separately with dropdowns
          { name: 'processing_gps', label: 'Processing GPS', type: 'text', required: true, placeholder: 'lat, lng' },
          { name: 'grinding_facility_name', label: 'Grinding Facility Name', type: 'text', required: true },
          { name: 'moisture_content', label: 'Moisture Content (%)', type: 'number', required: true },
          { name: 'curcumin_content', label: 'Curcumin Content (%)', type: 'number', required: true },
          { name: 'heavy_metals', label: 'Heavy Metals Check', type: 'select', required: true, options: ['Pass', 'Fail'] },
          { name: 'physical_properties', label: 'Physical Properties', type: 'text', required: true },
          { name: 'packaging_date', label: 'Packaging Date', type: 'date', required: true },
          { name: 'packaging_unit', label: 'Packaging Unit', type: 'text', required: true },
          { name: 'packet_id', label: 'Packet ID', type: 'text', required: true },
          { name: 'expiry_date', label: 'Expiry Date', type: 'date', required: true },
          { name: 'sending_box_code', label: 'Sending Box Code', type: 'text', required: true },
          { name: 'distributor_id', label: 'Distributor ID', type: 'text', required: true }
        ],
        submitEndpoint: 'addProcessing'
      },
      distributor: {
        title: 'Distributor Data Entry',
        description: 'Record distribution and logistics information',
        fields: [
          { name: 'packet_id', label: 'Packet ID', type: 'text', required: true },
          { name: 'distributor_id', label: 'Distributor ID', type: 'text', required: true },
          { name: 'gps_coordinates', label: 'GPS Coordinates', type: 'text', required: true, placeholder: 'lat, lng' },
          { name: 'received_box_code', label: 'Received Box Code', type: 'text', required: true },
          { name: 'dispatch_date', label: 'Dispatch Date', type: 'date', required: true },
          { name: 'sending_box_code', label: 'Sending Box Code', type: 'text', required: true },
          { name: 'supplier_id', label: 'Supplier ID', type: 'text', required: true }
        ],
        submitEndpoint: 'addDistributor'
      },
      supplier: {
        title: 'Supplier Data Entry',
        description: 'Record supply chain management information',
        fields: [
          { name: 'supplier_id', label: 'Supplier ID', type: 'text', required: true },
          { name: 'received_box_code', label: 'Received Box Code', type: 'text', required: true },
          { name: 'gps_coordinates', label: 'GPS Coordinates', type: 'text', required: true, placeholder: 'lat, lng' },
          { name: 'receipt_date', label: 'Receipt Date', type: 'date', required: true },
          { name: 'shopkeeper_id', label: 'Shopkeeper ID', type: 'text', required: true },
          { name: 'packet_id', label: 'Packet ID', type: 'text', required: true }
        ],
        submitEndpoint: 'addSupplier'
      },
      shopkeeper: {
        title: 'Shopkeeper Data Entry',
        description: 'Record retail and final sale information',
        fields: [
          { name: 'shopkeeper_id', label: 'Shopkeeper ID', type: 'text', required: true },
          { name: 'packet_id', label: 'Packet ID', type: 'text', required: true },
          { name: 'gps_coordinates', label: 'GPS Coordinates', type: 'text', required: true, placeholder: 'lat, lng' },
          { name: 'date_received', label: 'Date Received', type: 'date', required: true }
        ],
        submitEndpoint: 'addShopkeeper'
      }
    };
    return configs[stage] || configs.farmer;
  };

  const stageConfig = getStageFormConfig(stageUser?.stage);
  const [formData, setFormData] = useState({});
  const [geoStatus, setGeoStatus] = useState({ fetching: false, error: '' });
  const [qrDataUrl, setQrDataUrl] = useState('');
  const qrCanvasRef = useRef(null);

  const gpsFieldNames = useMemo(
    () => stageConfig.fields.filter(f => f.name.includes('gps')).map(f => f.name),
    [stageConfig]
  );

  const formatCoords = (coords) => `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;

  const fetchLocation = async () => {
    if (!('geolocation' in navigator)) {
      setGeoStatus({ fetching: false, error: 'Geolocation not supported' });
      return;
    }
    setGeoStatus({ fetching: true, error: '' });
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const value = formatCoords(position.coords);
      setFormData((prev) => {
        const next = { ...prev };
        gpsFieldNames.forEach((name) => {
          next[name] = value;
        });
        return next;
      });
      setGeoStatus({ fetching: false, error: '' });
    } catch (err) {
      const message = err?.message || 'Unable to fetch location';
      setGeoStatus({ fetching: false, error: message });
    }
  };

  // Auto-fetch GPS on mount when relevant fields exist
  useEffect(() => {
    if (gpsFieldNames.length > 0) {
      fetchLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageConfig.title]);

  // Fetch farmers for processing stage
  useEffect(() => {
    if (stageUser?.stage === 'processing') {
      fetchFarmers();
    }
  }, [stageUser?.stage]);

  // Fetch batches when farmer is selected
  useEffect(() => {
    if (stageUser?.stage === 'processing' && selectedFarmer) {
      fetchBatchesForFarmer(selectedFarmer);
    } else {
      setBatches([]);
      setSelectedBatch('');
      setBatchPacketCount(null);
    }
  }, [selectedFarmer, stageUser?.stage]);

  // Fetch packet count when batch is selected
  useEffect(() => {
    if (stageUser?.stage === 'processing' && selectedBatch) {
      fetchBatchPacketCount(selectedBatch);
      // Update formData with batch_id
      setFormData(prev => ({ ...prev, batch_id: selectedBatch }));
    } else {
      setBatchPacketCount(null);
    }
  }, [selectedBatch, stageUser?.stage]);

  const fetchFarmers = async () => {
    setLoadingFarmers(true);
    try {
      const response = await API.getFarmers();
      console.log('Fetched farmers:', response);
      setFarmers(response.data.farmers || []);
    } catch (err) {
      setError(`Failed to load farmers: ${err.message}`);
    } finally {
      setLoadingFarmers(false);
    }
  };

  const fetchBatchesForFarmer = async (farmerId) => {
    setLoadingBatches(true);
    try {
      const response = await API.getBatchesForFarmer(farmerId);
      setBatches(response.data.batches || []);
      setSelectedBatch(''); // Reset batch selection
    } catch (err) {
      setError(`Failed to load batches: ${err.message}`);
      setBatches([]);
    } finally {
      setLoadingBatches(false);
    }
  };

  const fetchBatchPacketCount = async (batchId) => {
    try {
      const response = await API.getBatchPacketCount(batchId);
      setBatchPacketCount({
        count: parseInt(response.data.packetCount) || 0,
        exists: response.data.exists
      });
    } catch (err) {
      console.error('Failed to load packet count:', err);
      setBatchPacketCount({ count: 0, exists: false });
    }
  };

  const handleFarmerChange = (e) => {
    setSelectedFarmer(e.target.value);
  };

  const handleBatchChange = (e) => {
    setSelectedBatch(e.target.value);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Validate packet ID uniqueness when changed (for processing stage)
    if (stageUser?.stage === 'processing' && name === 'packet_id' && value) {
      validatePacketId(value);
    }
  };

  const validatePacketId = async (packetId) => {
    try {
      const response = await API.checkPacketExists(packetId);
      if (response.data.exists) {
        setError(`Packet ID "${packetId}" already exists. Each packet must be unique.`);
      }
    } catch (err) {
      // Ignore validation errors, contract will handle it
      console.error('Packet validation error:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // For processing stage, ensure batch_id is set from selection
      const submitData = { ...formData };
      if (stageUser?.stage === 'processing') {
        if (!selectedBatch) {
          setError('Please select a batch ID');
          setLoading(false);
          return;
        }
        submitData.batch_id = selectedBatch;
      }

      const data = await API[stageConfig.submitEndpoint](submitData);
      setSuccess('Data submitted successfully!');
      // Generate QR only for processing stage using packet_id (or packetId field name)
      if (stageUser?.stage === 'processing') {
        const packetId = submitData.packet_id || submitData.packetId || submitData['packet_id'];
        if (packetId) {
          const origin = window.location.origin;
          // Point to public tracking route
          const trackingUrl = `${origin}/tracking?packetId=${encodeURIComponent(packetId)}`;
          try {
            const url = await QRCode.toDataURL(trackingUrl, { width: 512, margin: 2 });
            setQrDataUrl(url);
          } catch (qrErr) {
            console.error('QR generation failed', qrErr);
          }
        }
      }
      setFormData({});
      // Reset farmer/batch selections for processing stage
      if (stageUser?.stage === 'processing') {
        setSelectedFarmer('');
        setSelectedBatch('');
        setBatchPacketCount(null);
      }
    } catch (error) {
      setError(error?.message || error?.response?.data?.message || 'Failed to submit data');
    } finally {
      setLoading(false);
    }
  };

  const getStageColor = (stage) => {
    const colors = {
      farmer: 'green',
      processing: 'blue',
      distributor: 'purple',
      supplier: 'orange',
      shopkeeper: 'red'
    };
    return colors[stage] || 'gray';
  };

  const stageColor = getStageColor(stageUser?.stage);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                <ArrowLeft size={20} />
                Back to Dashboard
              </button>
            )}
          </div>
          <div className={`bg-gradient-to-r from-${stageColor}-600 to-${stageColor}-700 p-4 rounded-xl`}>
            <h1 className="text-3xl font-bold text-white mb-2">
              {stageConfig.title}
            </h1>
            <p className="text-white/90">
              {stageConfig.description}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <CheckCircle size={20} />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Special handling for processing stage: Farmer and Batch dropdowns */}
            {stageUser?.stage === 'processing' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Farmer <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    value={selectedFarmer}
                    onChange={handleFarmerChange}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${stageColor}-500 focus:border-transparent transition-all duration-200`}
                    required
                    disabled={loadingFarmers}
                  >
                    <option value="">{loadingFarmers ? 'Loading farmers...' : 'Select Farmer'}</option>
                    {farmers.map((farmer) => {
                      // Ensure farmer is a string (defensive check)
                      const farmerId = typeof farmer === 'string' ? farmer : String(farmer || '');
                      return (
                        <option key={farmerId} value={farmerId}>
                          {farmerId}
                        </option>
                      );
                    })}
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Batch ID <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="flex gap-2 items-start">
                    <select
                      value={selectedBatch}
                      onChange={handleBatchChange}
                      className={`flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${stageColor}-500 focus:border-transparent transition-all duration-200`}
                      required
                      disabled={!selectedFarmer || loadingBatches}
                    >
                      <option value="">
                        {!selectedFarmer 
                          ? '👆 Select farmer first' 
                          : loadingBatches 
                          ? 'Loading batches...' 
                          : batches.length === 0
                          ? 'No batches found for this farmer'
                          : 'Select Batch ID'}
                      </option>
                      {batches.map((batch) => (
                        <option key={batch.batchId} value={batch.batchId}>
                          {batch.batchId} {batch.productName ? `(${batch.productName})` : ''} {batch.harvestDate ? `- ${batch.harvestDate}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedBatch && batchPacketCount !== null && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-900">Packet Information</p>
                          <p className="text-sm text-blue-700 mt-1">
                            Total packets created: <span className="font-bold text-blue-900">{batchPacketCount.count}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-blue-600">Batch Status: {batchPacketCount.exists ? 'Active' : 'Unknown'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
            
            {stageConfig.fields.map((field) => (
              <div key={field.name} className={field.name.includes('gps') || field.name.includes('properties') ? 'md:col-span-2' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                
                {field.type === 'select' ? (
                  <select
                    name={field.name}
                    value={formData[field.name] || ''}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${stageColor}-500 focus:border-transparent transition-all duration-200`}
                    required={field.required}
                  >
                    <option value="">Select {field.label}</option>
                    {field.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex gap-2 items-center">
                    <input
                      type={field.type}
                      name={field.name}
                      value={formData[field.name] || ''}
                      onChange={handleInputChange}
                      placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${stageColor}-500 focus:border-transparent transition-all duration-200 ${field.name.includes('gps') ? 'bg-gray-50' : ''}`}
                      required={field.required}
                      readOnly={field.name.includes('gps')}
                    />
                    {field.name.includes('gps') && (
                      <button
                        type="button"
                        onClick={fetchLocation}
                        title="Use current location"
                        className={`shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-${stageColor}-500`}
                        disabled={geoStatus.fetching}
                      >
                        {geoStatus.fetching ? (
                          <RefreshCw className="animate-spin" size={16} />
                        ) : (
                          <MapPin size={16} />
                        )}
                        <span className="hidden md:inline">{geoStatus.fetching ? 'Locating...' : 'Use GPS'}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {gpsFieldNames.length > 0 && geoStatus.error && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mt-2">
              {geoStatus.error}. Please allow location access or click "Use GPS" to retry.
            </div>
          )}

          <div className="flex justify-end pt-6">
            <button
              type="submit"
              disabled={loading}
              className={`bg-gradient-to-r from-${stageColor}-600 to-${stageColor}-700 text-white px-8 py-3 rounded-lg font-medium hover:from-${stageColor}-700 hover:to-${stageColor}-800 focus:ring-4 focus:ring-${stageColor}-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Submit Data
                </>
              )}
            </button>
          </div>
        </form>
        {/* QR Output - only shows after processing submit with packetId */}
        {qrDataUrl && stageUser?.stage === 'processing' && (
          <div className="mt-8 border border-gray-200 rounded-xl p-6 bg-gray-50">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Packet Tracking QR</h3>
            <p className="text-gray-600 mb-4">Scan to open tracking page for this packet.</p>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <img src={qrDataUrl} alt="Tracking QR" className="w-56 h-56 border bg-white p-2 rounded-lg" />
              <div className="flex flex-col gap-2 w-full md:w-auto">
                <a
                  href={qrDataUrl}
                  download={`packet-tracking-qr.png`}
                  className="inline-block text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Download QR PNG
                </a>
                <button
                  onClick={() => {
                    const w = window.open('');
                    if (!w) return;
                    w.document.write(`<img src="${qrDataUrl}" style="width:320px;height:320px;" />`);
                    w.document.close();
                    w.focus();
                    w.print();
                  }}
                  className="inline-block text-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
                >
                  Print QR
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">Embed this QR on the packet. It encodes the public tracking URL.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StageDataEntryForm;
