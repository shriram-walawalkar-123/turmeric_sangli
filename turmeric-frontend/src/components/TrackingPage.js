import React, { useMemo, useState } from 'react';
import { Search, Package, MapPin, CheckCircle, AlertCircle, Clock, ChevronRight } from 'lucide-react';
import { API } from '../config/api';

const TrackingPage = () => {
  const [packetId, setPacketId] = useState('');
  const [journeyData, setJourneyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!packetId.trim()) {
      setError('Please enter a packet ID');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await API.getJourney(packetId);
      setJourneyData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch tracking information');
      setJourneyData(null);
    } finally {
      setLoading(false);
    }
  };

  const mapLink = (value) => {
    if (!value || typeof value !== 'string') return null;
    const parts = value.split(',').map((s) => s.trim());
    if (parts.length !== 2) return null;
    const [lat, lng] = parts;
    const url = `https://www.google.com/maps?q=${encodeURIComponent(lat)},${encodeURIComponent(lng)}`;
    return url;
  };

  const renderObject = (obj) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Object.entries(obj).map(([key, value]) => {
          if (typeof value === 'object' || value === null || value === '') return null;
          const isGps = key.toLowerCase().includes('gps');
          const link = isGps ? mapLink(String(value)) : null;
          return (
            <div key={key} className="border-l-4 border-green-500 pl-3">
              <p className="text-sm text-gray-600 font-medium">
                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </p>
              {isGps && link ? (
                <a href={link} target="_blank" rel="noreferrer" className="text-green-700 hover:underline inline-flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {String(value)}
                </a>
              ) : (
                <p className="text-gray-800">{value.toString()}</p>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderStageCard = (title, data) => {
    if (!data) return null;

    const items = Array.isArray(data) ? data : [data];
    if (items.length === 0) return null;

    return (
      <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100">
        <div className="flex items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
        </div>
        {items.map((item, idx) => (
          <div key={idx} className="mb-4 last:mb-0">
            {renderObject(item)}
          </div>
        ))}
      </div>
    );
  };

  const timeline = useMemo(() => {
    const steps = [
      { key: 'harvest', title: 'Harvested', color: 'green' },
      { key: 'processing', title: 'Processed & Packed', color: 'blue' },
      { key: 'distributor', title: 'At Distributor', color: 'purple' },
      { key: 'supplier', title: 'At Supplier', color: 'orange' },
      { key: 'shopkeeper', title: 'In Retail Store', color: 'red' },
    ];
    const present = (journeyData || {});
    return steps.map((s) => ({
      ...s,
      done: Boolean(present[s.key]),
    }));
  }, [journeyData]);

  const Skeleton = () => (
    <div className="space-y-4">
      {[1,2,3].map((i) => (
        <div key={i} className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="h-6 w-40 bg-gray-200 rounded mb-4 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[...Array(6)].map((_, j) => (
              <div key={j} className="border-l-4 border-gray-200 pl-3">
                <div className="h-4 w-24 bg-gray-200 rounded mb-2 animate-pulse"></div>
                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg shadow-lg p-8 mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Track Your Product</h2>
        <p className="text-green-100">Enter your packet ID to view the complete journey</p>
      </div>

      <form onSubmit={handleTrack} className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={packetId}
              onChange={(e) => setPacketId(e.target.value)}
              placeholder="Enter Packet ID (e.g., PKT001)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            <Search className="w-5 h-5" />
            {loading ? 'Tracking...' : 'Track'}
          </button>
        </div>
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}
      </form>

      {loading && <Skeleton />}

      {journeyData && !loading && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 mb-2">
            <div className="flex items-center gap-2 text-green-700 mb-4">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Tracking Information Found</span>
            </div>
            <div className="flex items-center gap-3 overflow-x-auto">
              {timeline.map((step, idx) => (
                <div key={step.key} className="flex items-center">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-full border ${step.done ? `border-${step.color}-300 bg-${step.color}-50 text-${step.color}-700` : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
                    <Clock className="w-4 h-4" />
                    <span className="whitespace-nowrap text-sm font-medium">{step.title}</span>
                  </div>
                  {idx < timeline.length - 1 && (
                    <ChevronRight className="mx-2 text-gray-300" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {renderStageCard('Packet Information', journeyData.packet)}
          {renderStageCard('Harvest Details', journeyData.harvest)}
          {renderStageCard('Processing & Quality Check', journeyData.processing)}
          {renderStageCard('Distribution', journeyData.distributor)}
          {renderStageCard('Supplier', journeyData.supplier)}
          {renderStageCard('Retail Store', journeyData.shopkeeper)}
        </div>
      )}

      {!journeyData && !loading && !error && (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Enter a packet ID to start tracking</p>
        </div>
      )}
    </div>
  );
};

export default TrackingPage;