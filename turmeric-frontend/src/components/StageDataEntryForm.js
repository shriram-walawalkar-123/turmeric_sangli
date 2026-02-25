import React, { useEffect, useMemo, useState } from 'react';
import { useStageAuth } from '../context/StageAuthContext';
import { API } from '../config/api';
import { Save, CheckCircle, AlertCircle, ArrowLeft, MapPin, RefreshCw } from 'lucide-react';

// ── Defined OUTSIDE component so they are never recreated on re-render ─────────
const inputClass = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";
const selectClass = inputClass;

const FormField = ({ label, required, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
  </div>
);

const GpsInput = ({ value, onChange, onFetch, fetching }) => (
  <div className="flex gap-2 items-center">
    <input value={value || ''} onChange={onChange} placeholder="lat, lng" className={inputClass} readOnly />
    <button type="button" onClick={onFetch} disabled={fetching}
      className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">
      {fetching ? <RefreshCw className="animate-spin" size={16} /> : <MapPin size={16} />}
      <span className="hidden md:inline">{fetching ? 'Locating...' : 'GPS'}</span>
    </button>
  </div>
);
// ─────────────────────────────────────────────────────────────────────────────

const StageDataEntryForm = ({ onBack }) => {
  const { stageUser } = useStageAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const actorId = useMemo(
    () => stageUser?.username || stageUser?.id || '',
    [stageUser?.username, stageUser?.id]
  );
  const actorIdFieldName = useMemo(() => {
    switch (stageUser?.stage) {
      case 'farmer': return 'farmer_id';
      case 'distributor': return 'distributor_id';
      case 'supplier': return 'supplier_id';
      case 'shopkeeper': return 'shopkeeper_id';
      default: return null;
    }
  }, [stageUser?.stage]);

  const [farmers, setFarmers] = useState([]);
  const [selectedFarmer, setSelectedFarmer] = useState('');
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [loadingFarmers, setLoadingFarmers] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [batchInfo, setBatchInfo] = useState(null);
  const [packetSizeGm, setPacketSizeGm] = useState('');
  const [createPacketCount, setCreatePacketCount] = useState('');
  const [loadingBatchInfo, setLoadingBatchInfo] = useState(false);
  const [packetsAtStage, setPacketsAtStage] = useState({ count: 0, packetIds: [] });
  const [receiveCount, setReceiveCount] = useState('');
  const [loadingPacketsByStage, setLoadingPacketsByStage] = useState(false);
  const [geoStatus, setGeoStatus] = useState({ fetching: false, error: '' });

  // Single formData for processing + farmer fields
  const [formData, setFormData] = useState({});
  // Single receiveFormData for distributor/supplier/shopkeeper fields
  const [receiveFormData, setReceiveFormData] = useState({});

  const getStageColor = (stage) => {
    const colors = { farmer: 'green', processing: 'blue', distributor: 'purple', supplier: 'yellow', shopkeeper: 'red' };
    return colors[stage] || 'gray';
  };
  const stageColor = getStageColor(stageUser?.stage);

  const stageTitle = {
    farmer: 'Harvest Data Entry',
    processing: 'Processing Data Entry',
    distributor: 'Distributor Data Entry',
    supplier: 'Supplier Data Entry',
    shopkeeper: 'Shopkeeper Data Entry',
  }[stageUser?.stage] || '';

  const stageDesc = {
    farmer: 'Record harvest information.',
    processing: 'Record processing and packaging information',
    distributor: 'Receive packets from processing and record distribution details',
    supplier: 'Receive packets from distributor and record supply details',
    shopkeeper: 'Receive packets from supplier and record receipt details',
  }[stageUser?.stage] || '';

  const previousStage = useMemo(() => {
    if (stageUser?.stage === 'distributor') return 'processing';
    if (stageUser?.stage === 'supplier') return 'distributor';
    if (stageUser?.stage === 'shopkeeper') return 'supplier';
    return null;
  }, [stageUser?.stage]);

  // ── Reset on stage change ──────────────────────────────────────────────────
  useEffect(() => {
    setFormData(actorIdFieldName && actorId ? { [actorIdFieldName]: actorId } : {});
    setReceiveFormData(actorIdFieldName && actorId ? { [actorIdFieldName]: actorId } : {});
    setSelectedFarmer('');
    setSelectedBatch('');
    setSuccess('');
    setError('');
  }, [stageUser?.stage]); // eslint-disable-line

  // ── Fetch farmers ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (['processing', 'distributor', 'supplier', 'shopkeeper'].includes(stageUser?.stage)) {
      setLoadingFarmers(true);
      API.getFarmers()
        .then(r => setFarmers(r.data.farmers || []))
        .catch(e => setError(`Failed to load farmers: ${e.message}`))
        .finally(() => setLoadingFarmers(false));
    }
  }, [stageUser?.stage]);

  // ── Fetch batches when farmer selected ────────────────────────────────────
  useEffect(() => {
    if (selectedFarmer) {
      setLoadingBatches(true);
      API.getBatchesForFarmer(selectedFarmer)
        .then(r => { setBatches(r.data.batches || []); setSelectedBatch(''); })
        .catch(e => { setError(`Failed to load batches: ${e.message}`); setBatches([]); })
        .finally(() => setLoadingBatches(false));
    } else {
      setBatches([]);
      setSelectedBatch('');
    }
  }, [selectedFarmer]);

  // ── Fetch batch info (available gm / max packets) ─────────────────────────
  useEffect(() => {
    if (stageUser?.stage === 'processing' && selectedBatch) {
      setLoadingBatchInfo(true);
      const size = packetSizeGm ? Number(packetSizeGm) : null;
      (size && size > 0 ? API.getBatchInfo(selectedBatch, size) : API.getBatchInfo(selectedBatch))
        .then(r => setBatchInfo(r.data || null))
        .catch(() => setBatchInfo(null))
        .finally(() => setLoadingBatchInfo(false));
    } else {
      setBatchInfo(null);
    }
  }, [selectedBatch, packetSizeGm, stageUser?.stage]);

  // ── Fetch packets at previous stage ───────────────────────────────────────
  useEffect(() => {
    if (previousStage && selectedBatch) {
      setLoadingPacketsByStage(true);
      API.getPacketsByStage(selectedBatch, previousStage)
        .then(r => setPacketsAtStage({ count: r.data.count || 0, packetIds: r.data.packetIds || [] }))
        .catch(() => setPacketsAtStage({ count: 0, packetIds: [] }))
        .finally(() => setLoadingPacketsByStage(false));
    } else {
      setPacketsAtStage({ count: 0, packetIds: [] });
    }
  }, [previousStage, selectedBatch]);

  // ── GPS helper ─────────────────────────────────────────────────────────────
  const formatCoords = (coords) => `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;

  const fetchLocation = async (target = 'form', fieldName = 'gps_coordinates') => {
    if (!('geolocation' in navigator)) {
      setGeoStatus({ fetching: false, error: 'Geolocation not supported' });
      return;
    }
    setGeoStatus({ fetching: true, error: '' });
    try {
      const position = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 })
      );
      const value = formatCoords(position.coords);
      if (target === 'receive') {
        setReceiveFormData(prev => ({ ...prev, gps_coordinates: value }));
      } else {
        setFormData(prev => ({ ...prev, [fieldName]: value }));
      }
      setGeoStatus({ fetching: false, error: '' });
    } catch (err) {
      setGeoStatus({ fetching: false, error: err?.message || 'Unable to fetch location' });
    }
  };

  // Auto-fetch GPS on stage load
  useEffect(() => {
    if (stageUser?.stage === 'farmer') fetchLocation('form', 'gps_coordinates');
    if (stageUser?.stage === 'processing') fetchLocation('form', 'processing_gps');
    if (['distributor', 'supplier', 'shopkeeper'].includes(stageUser?.stage)) fetchLocation('receive');
  }, [stageUser?.stage]); // eslint-disable-line

  // ── Stable onChange handlers (defined once, not inline) ───────────────────
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleReceiveChange = (e) => {
    const { name, value } = e.target;
    setReceiveFormData(prev => ({ ...prev, [name]: value }));
  };

  // ── Submit: create packets (processing) ───────────────────────────────────
  const handleCreatePacketsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    const count = parseInt(createPacketCount, 10);
    const maxPackets = batchInfo?.maxPackets ?? 0;
    if (!selectedBatch || !packetSizeGm || count < 1 || count > maxPackets) {
      setError(`Enter number of packets between 1 and ${maxPackets}.`);
      setLoading(false); return;
    }
    try {
      const payload = {
        packet_size_gm: Number(packetSizeGm),
        count,
        processing_gps: formData.processing_gps || '',
        grinding_facility_name: formData.grinding_facility_name || '',
        moisture_content: formData.moisture_content || 0,
        curcumin_content: formData.curcumin_content || 0,
        heavy_metals: formData.heavy_metals || '',
        physical_properties: formData.physical_properties || '',
        packaging_date: formData.packaging_date || '',
        packaging_unit: `${packetSizeGm}g`,
        expiry_date: formData.expiry_date || '',
        sending_box_code: formData.sending_box_code || '',
        distributor_id: formData.distributor_id || '',
      };
      const res = await API.createPackets(selectedBatch, payload);
      const createdIds = res.data.packetIds || [];
      setSuccess(`${res.data.message || `Created ${count} packet(s).`} IDs: ${createdIds.join(', ')}`);
      setCreatePacketCount('');
      setPacketSizeGm('');
      const infoRes = await API.getBatchInfo(selectedBatch);
      setBatchInfo(infoRes.data);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Failed to create packets.');
    } finally {
      setLoading(false);
    }
  };

  // ── Submit: receive packets (distributor/supplier/shopkeeper) ─────────────
  const handleReceiveSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    const count = parseInt(receiveCount, 10);
    if (!selectedBatch || !selectedFarmer || count < 1 || count > (packetsAtStage.count || 0)) {
      setError(`Enter number of packets between 1 and ${packetsAtStage.count || 0}.`);
      setLoading(false); return;
    }
    try {
      const stage = stageUser?.stage;
      const base = { batch_id: selectedBatch, farmer_id: selectedFarmer, count, ...receiveFormData };
      if (actorIdFieldName && actorId) base[actorIdFieldName] = base[actorIdFieldName] ?? actorId;
      let res;
      if (stage === 'distributor') res = await API.distributorReceive(base);
      else if (stage === 'supplier') res = await API.supplierReceive(base);
      else if (stage === 'shopkeeper') res = await API.shopkeeperReceive(base);
      else throw new Error('Invalid stage');
      setSuccess(res.data.message || `Received ${count} packet(s).`);
      setReceiveCount('');
      setPacketsAtStage(p => ({ count: (p.count || 0) - count, packetIds: [] }));
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Failed to receive packets.');
    } finally {
      setLoading(false);
    }
  };

  // ── Submit: farmer harvest ─────────────────────────────────────────────────
  const handleFarmerSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      await API.addHarvest(formData);
      setSuccess('Harvest recorded successfully!');
      setFormData(actorIdFieldName && actorId ? { [actorIdFieldName]: actorId } : {});
    } catch (err) {
      setError(err?.message || err?.response?.data?.message || 'Failed to submit data');
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8">

        {/* Header */}
        <div className="mb-8">
          {onBack && (
            <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4">
              <ArrowLeft size={20} /> Back to Dashboard
            </button>
          )}
          <div className={`bg-gradient-to-r from-${stageColor}-600 to-${stageColor}-700 p-4 rounded-xl`}>
            <h1 className="text-3xl font-bold text-white mb-1">{stageTitle}</h1>
            <p className="text-white/90">{stageDesc}</p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle size={20} />{error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <CheckCircle size={20} />{success}
          </div>
        )}

        {/* ── FARMER ──────────────────────────────────────────────────────── */}
        {stageUser?.stage === 'farmer' && (
          <form onSubmit={handleFarmerSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Farmer ID" required>
                <input name="farmer_id" value={formData.farmer_id || ''} onChange={handleFormChange} className={`${inputClass} bg-gray-50`} readOnly />
              </FormField>
              <FormField label="Product Name" required>
                <input name="product_name" value={formData.product_name || ''} onChange={handleFormChange} className={inputClass} required placeholder="e.g. Turmeric" />
              </FormField>
              <FormField label="Batch ID" required>
                <input name="batch_id" value={formData.batch_id || ''} onChange={handleFormChange} className={inputClass} required placeholder="e.g. B001" />
              </FormField>
              <FormField label="Quantity (grams)" required>
                <input name="quantity_gm" type="number" value={formData.quantity_gm || ''} onChange={handleFormChange} className={inputClass} required placeholder="e.g. 750" />
              </FormField>
              <FormField label="Harvest Date" required>
                <input name="harvest_date" type="date" value={formData.harvest_date || ''} onChange={handleFormChange} className={inputClass} required />
              </FormField>
              <FormField label="Fertilizer Used">
                <input name="fertilizer" value={formData.fertilizer || ''} onChange={handleFormChange} className={inputClass} placeholder="e.g. Organic compost" />
              </FormField>
              <FormField label="Organic Status" required>
                <select name="organic_status" value={formData.organic_status || ''} onChange={handleFormChange} className={selectClass} required>
                  <option value="">Select status</option>
                  <option value="Organic">Organic</option>
                  <option value="Non-Organic">Non-Organic</option>
                </select>
              </FormField>
              <div className="md:col-span-2">
                <FormField label="GPS Coordinates" required>
                  <GpsInput
                    value={formData.gps_coordinates}
                    onChange={handleFormChange}
                    onFetch={() => fetchLocation('form', 'gps_coordinates')}
                    fetching={geoStatus.fetching}
                  />
                </FormField>
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={loading}
                className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                {loading ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />Submitting...</> : <><Save size={20} />Submit Harvest</>}
              </button>
            </div>
          </form>
        )}

        {/* ── PROCESSING ──────────────────────────────────────────────────── */}
        {stageUser?.stage === 'processing' && (
          <form onSubmit={handleCreatePacketsSubmit} className="space-y-6">

            {/* Batch Selection */}
            <div className="p-5 border-2 border-blue-200 rounded-xl bg-blue-50/40">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Batch Selection</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Select Farmer" required>
                  <select value={selectedFarmer} onChange={e => setSelectedFarmer(e.target.value)} className={selectClass} required disabled={loadingFarmers}>
                    <option value="">{loadingFarmers ? 'Loading...' : 'Select Farmer'}</option>
                    {farmers.map(f => { const id = typeof f === 'string' ? f : String(f || ''); return <option key={id} value={id}>{id}</option>; })}
                  </select>
                </FormField>
                <FormField label="Select Batch ID" required>
                  <select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)} className={selectClass} required disabled={!selectedFarmer || loadingBatches}>
                    <option value="">{!selectedFarmer ? 'Select farmer first' : loadingBatches ? 'Loading...' : batches.length === 0 ? 'No batches' : 'Select Batch'}</option>
                    {batches.map(b => <option key={b.batchId} value={b.batchId}>{b.batchId} {b.availableGm != null ? `(${b.availableGm}gm avail)` : ''}</option>)}
                  </select>
                </FormField>
              </div>
              {selectedBatch && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200 text-sm text-gray-700">
                  Available quantity (after 8% processing loss):{' '}
                  <strong>{loadingBatchInfo ? 'Loading...' : batchInfo?.availableGm != null ? `${batchInfo.availableGm} gm` : '—'}</strong>
                </div>
              )}
            </div>

            {selectedBatch && (
              <>
                {/* Lab & Quality Testing */}
                <div className="p-5 border border-gray-200 rounded-xl">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Lab & Quality Testing</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <FormField label="Processing GPS" required>
                        <GpsInput
                          value={formData.processing_gps}
                          onChange={handleFormChange}
                          onFetch={() => fetchLocation('form', 'processing_gps')}
                          fetching={geoStatus.fetching}
                        />
                      </FormField>
                    </div>
                    <FormField label="Grinding Facility Name" required>
                      <input name="grinding_facility_name" type="text" value={formData.grinding_facility_name || ''} onChange={handleFormChange} className={inputClass} required placeholder="e.g. Sri Ram Grinding Unit" />
                    </FormField>
                    <FormField label="Moisture Content (%)" required>
                      <input name="moisture_content" type="number" step="0.01" value={formData.moisture_content || ''} onChange={handleFormChange} className={inputClass} required placeholder="e.g. 8.5" />
                    </FormField>
                    <FormField label="Curcumin Content (%)" required>
                      <input name="curcumin_content" type="number" step="0.01" value={formData.curcumin_content || ''} onChange={handleFormChange} className={inputClass} required placeholder="e.g. 3.2" />
                    </FormField>
                    <FormField label="Heavy Metals Check" required>
                      <select name="heavy_metals" value={formData.heavy_metals || ''} onChange={handleFormChange} className={selectClass} required>
                        <option value="">Select result</option>
                        <option value="Pass">Pass</option>
                        <option value="Fail">Fail</option>
                      </select>
                    </FormField>
                    <FormField label="Physical Properties" required>
                      <input name="physical_properties" type="text" value={formData.physical_properties || ''} onChange={handleFormChange} className={inputClass} required placeholder="e.g. Fine yellow powder" />
                    </FormField>
                  </div>
                </div>

                {/* Packaging Info */}
                <div className="p-5 border border-gray-200 rounded-xl">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Packaging Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Packaging Date" required>
                      <input name="packaging_date" type="date" value={formData.packaging_date || ''} onChange={handleFormChange} className={inputClass} required />
                    </FormField>
                    <FormField label="Expiry Date" required>
                      <input name="expiry_date" type="date" value={formData.expiry_date || ''} onChange={handleFormChange} className={inputClass} required />
                    </FormField>
                    <FormField label="Sending Box Code" required>
                      <input name="sending_box_code" type="text" value={formData.sending_box_code || ''} onChange={handleFormChange} className={inputClass} required placeholder="e.g. BOX-001" />
                    </FormField>
                    <FormField label="Distributor ID" required>
                      <input name="distributor_id" type="text" value={formData.distributor_id || ''} onChange={handleFormChange} className={inputClass} required placeholder="e.g. dist1" />
                    </FormField>
                  </div>
                </div>

                {/* Packet Creation */}
                <div className="p-5 border-2 border-blue-300 rounded-xl bg-blue-50/40">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Create Packets</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <FormField label="Packet size (gm)" required>
                      <select value={packetSizeGm} onChange={e => setPacketSizeGm(e.target.value)} className={selectClass} required>
                        <option value="">Select size</option>
                        {[50, 100, 250, 500].map(g => <option key={g} value={g}>{g} gm</option>)}
                      </select>
                    </FormField>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Max packets (for this size)</p>
                      <p className="py-2 text-gray-800 font-semibold">{loadingBatchInfo ? '...' : batchInfo?.maxPackets != null ? batchInfo.maxPackets : '—'}</p>
                    </div>
                    <FormField label="Number of packets to create" required>
                      <input type="number" min={1} max={batchInfo?.maxPackets ?? 0} value={createPacketCount}
                        onChange={e => setCreatePacketCount(e.target.value)} className={inputClass} required placeholder="e.g. 5" />
                    </FormField>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">Packet IDs format: FarmerId-BatchId-{packetSizeGm || '50'}g-001, 002, ...</p>
                </div>

                <div className="flex justify-end">
                  <button type="submit" disabled={loading || loadingBatchInfo || (batchInfo?.maxPackets ?? 0) < 1}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                    {loading ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />Creating...</> : <><Save size={20} />Create Packets</>}
                  </button>
                </div>
              </>
            )}
          </form>
        )}

        {/* ── DISTRIBUTOR / SUPPLIER / SHOPKEEPER ─────────────────────────── */}
        {['distributor', 'supplier', 'shopkeeper'].includes(stageUser?.stage) && (
          <form onSubmit={handleReceiveSubmit} className="space-y-6">

            {/* Batch Selection */}
            <div className="p-5 border-2 border-purple-200 rounded-xl bg-purple-50/40">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Select Batch</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Select Farmer" required>
                  <select value={selectedFarmer} onChange={e => setSelectedFarmer(e.target.value)} className={selectClass} required disabled={loadingFarmers}>
                    <option value="">{loadingFarmers ? 'Loading...' : 'Select Farmer'}</option>
                    {farmers.map(f => { const id = typeof f === 'string' ? f : String(f || ''); return <option key={id} value={id}>{id}</option>; })}
                  </select>
                </FormField>
                <FormField label="Select Batch ID" required>
                  <select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)} className={selectClass} required disabled={!selectedFarmer || loadingBatches}>
                    <option value="">{!selectedFarmer ? 'Select farmer first' : loadingBatches ? 'Loading...' : batches.length === 0 ? 'No batches' : 'Select Batch'}</option>
                    {batches.map(b => <option key={b.batchId} value={b.batchId}>{b.batchId}</option>)}
                  </select>
                </FormField>
              </div>
              {selectedBatch && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-purple-200 text-sm text-gray-700">
                  Packets available at <strong>{previousStage}</strong>:{' '}
                  <strong>{loadingPacketsByStage ? 'Loading...' : packetsAtStage.count ?? 0}</strong>
                </div>
              )}
            </div>

            {selectedBatch && (
              <>
                {/* Stage-specific fields */}
                <div className="p-5 border border-gray-200 rounded-xl">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">
                    {stageUser?.stage === 'distributor' && 'Distribution Details'}
                    {stageUser?.stage === 'supplier' && 'Supply Details'}
                    {stageUser?.stage === 'shopkeeper' && 'Receipt Details'}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {stageUser?.stage === 'distributor' && (<>
                      <FormField label="Distributor ID" required>
                        <input name="distributor_id" value={receiveFormData.distributor_id ?? actorId} onChange={handleReceiveChange} className={`${inputClass} bg-gray-50`} readOnly />
                      </FormField>
                      <FormField label="GPS Coordinates" required>
                        <GpsInput value={receiveFormData.gps_coordinates} onChange={handleReceiveChange} onFetch={() => fetchLocation('receive')} fetching={geoStatus.fetching} />
                      </FormField>
                      <FormField label="Received Box Code" required>
                        <input name="received_box_code" value={receiveFormData.received_box_code || ''} onChange={handleReceiveChange} className={inputClass} required placeholder="e.g. BOX-001" />
                      </FormField>
                      <FormField label="Dispatch Date" required>
                        <input name="dispatch_date" type="date" value={receiveFormData.dispatch_date || ''} onChange={handleReceiveChange} className={inputClass} required />
                      </FormField>
                      <FormField label="Sending Box Code" required>
                        <input name="sending_box_code" value={receiveFormData.sending_box_code || ''} onChange={handleReceiveChange} className={inputClass} required placeholder="e.g. BOX-002" />
                      </FormField>
                      <FormField label="Supplier ID" required>
                        <input name="supplier_id" value={receiveFormData.supplier_id || ''} onChange={handleReceiveChange} className={inputClass} required placeholder="e.g. supplier1" />
                      </FormField>
                    </>)}

                    {stageUser?.stage === 'supplier' && (<>
                      <FormField label="Supplier ID" required>
                        <input name="supplier_id" value={receiveFormData.supplier_id ?? actorId} onChange={handleReceiveChange} className={`${inputClass} bg-gray-50`} readOnly />
                      </FormField>
                      <FormField label="Received Box Code" required>
                        <input name="received_box_code" value={receiveFormData.received_box_code || ''} onChange={handleReceiveChange} className={inputClass} required placeholder="e.g. BOX-001" />
                      </FormField>
                      <FormField label="GPS Coordinates" required>
                        <GpsInput value={receiveFormData.gps_coordinates} onChange={handleReceiveChange} onFetch={() => fetchLocation('receive')} fetching={geoStatus.fetching} />
                      </FormField>
                      <FormField label="Receipt Date" required>
                        <input name="receipt_date" type="date" value={receiveFormData.receipt_date || ''} onChange={handleReceiveChange} className={inputClass} required />
                      </FormField>
                      <FormField label="Shopkeeper ID" required>
                        <input name="shopkeeper_id" value={receiveFormData.shopkeeper_id || ''} onChange={handleReceiveChange} className={inputClass} required placeholder="e.g. shop1" />
                      </FormField>
                    </>)}

                    {stageUser?.stage === 'shopkeeper' && (<>
                      <FormField label="Shopkeeper ID" required>
                        <input name="shopkeeper_id" value={receiveFormData.shopkeeper_id ?? actorId} onChange={handleReceiveChange} className={`${inputClass} bg-gray-50`} readOnly />
                      </FormField>
                      <FormField label="GPS Coordinates" required>
                        <GpsInput value={receiveFormData.gps_coordinates} onChange={handleReceiveChange} onFetch={() => fetchLocation('receive')} fetching={geoStatus.fetching} />
                      </FormField>
                      <FormField label="Date Received" required>
                        <input name="date_received" type="date" value={receiveFormData.date_received || ''} onChange={handleReceiveChange} className={inputClass} required />
                      </FormField>
                    </>)}

                  </div>
                </div>

                {/* Packet count */}
                <div className="p-5 border-2 border-purple-300 rounded-xl bg-purple-50/40">
                  <h2 className="text-lg font-bold text-gray-800 mb-3">Receive Packets</h2>
                  <FormField label="Number of packets to receive" required>
                    <input type="number" min={1} max={packetsAtStage.count || 0} value={receiveCount}
                      onChange={e => setReceiveCount(e.target.value)}
                      className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg"
                      required placeholder="e.g. 5" />
                  </FormField>
                </div>

                <div className="flex justify-end">
                  <button type="submit" disabled={loading || loadingPacketsByStage || (packetsAtStage.count || 0) < 1}
                    className={`bg-gradient-to-r from-${stageColor}-600 to-${stageColor}-700 text-white px-8 py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2`}>
                    {loading ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />Submitting...</> : <><Save size={20} />Receive Packets</>}
                  </button>
                </div>
              </>
            )}
          </form>
        )}

      </div>
    </div>
  );
};

export default StageDataEntryForm;