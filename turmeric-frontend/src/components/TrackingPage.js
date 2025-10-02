import React, { useState } from 'react';
import { Search, Package, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
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

  const renderObject = (obj) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Object.entries(obj).map(([key, value]) => {
          if (typeof value === 'object' || value === null || value === '') return null;
          return (
            <div key={key} className="border-l-4 border-green-500 pl-3">
              <p className="text-sm text-gray-600 font-medium">
                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </p>
              <p className="text-gray-800">{value.toString()}</p>
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
      <div className="bg-white rounded-lg shadow-md p-6 mb-4">
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

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg shadow-lg p-8 mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Track Your Product</h2>
        <p className="text-green-100">Enter your packet ID to view the complete journey</p>
      </div>

      <form onSubmit={handleTrack} className="bg-white rounded-lg shadow-md p-6 mb-8">
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

      {journeyData && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Tracking Information Found</span>
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