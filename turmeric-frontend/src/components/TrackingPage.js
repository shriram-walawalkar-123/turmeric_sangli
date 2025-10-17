import React, { useState, useEffect, useMemo } from 'react';
import { Search, Package, MapPin, CheckCircle, AlertCircle, Sprout, Factory, Truck, Store, ShoppingBag, Loader, ArrowRight, ChevronDown } from 'lucide-react';
import { API } from '../config/api';

const stageConfigs = [
  { 
    key: 'packet', 
    title: 'Packet Info', 
    fullTitle: 'Packet Information',
    icon: Package, 
    bgGradient: 'bg-gradient-to-r from-red-200 to-red-700',
    lightBg: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-400'
  },
  { 
    key: 'harvest', 
    title: 'Harvest', 
    fullTitle: 'Harvest Details',
    icon: Sprout, 
    bgGradient: 'bg-gradient-to-r from-green-200 to-green-600',
    lightBg: 'bg-green-50',
    textColor: 'text-green-200',
    borderColor: 'border-green-200'
  },
  { 
    key: 'processing', 
    title: 'Processing', 
    fullTitle: 'Processing & Quality',
    icon: Factory, 
    bgGradient: 'bg-gradient-to-r from-blue-200 to-blue-400',
    lightBg: 'bg-lightblue-50',
    textColor: 'text-lightblue-200',
    borderColor: 'border-lightblue-200'
  },
  { 
    key: 'distributor', 
    title: 'Distribution', 
    fullTitle: 'Distribution',
    icon: Truck, 
    bgGradient: 'bg-gradient-to-r from-gray-200 to-gray-400',
    lightBg: 'bg-gray-50',
    textColor: 'text-gray-200',
    borderColor: 'border-gray-200'
  },
  { 
    key: 'supplier', 
    title: 'Supplier', 
    fullTitle: 'Supplier',
    icon: Store, 
    bgGradient: 'bg-gradient-to-r from-yellow-200 to-yellow-400',
    lightBg: 'bg-yellow-50',
    textColor: 'text-yellow-200',
    borderColor: 'border-yellow-200'
  },
  { 
    key: 'shopkeeper', 
    title: 'Retail', 
    fullTitle: 'Retail Store',
    icon: ShoppingBag, 
    bgGradient: 'bg-gradient-to-r from-blue-200 to-indigo-600',
    lightBg: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-400'
  },
];

const TrackingPage = () => {
  const [packetId, setPacketId] = useState('');
  const [journeyData, setJourneyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedStage, setSelectedStage] = useState(null);
  const [verificationSteps, setVerificationSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(-1);

  const verificationSequence = [
    'Data pushed to Blockchain',
    'Fetched from Blockchain',
    'Fetched from Database',
    'Hash generated',
    'Hash Matched',
    'Data Verified'
  ];

  useEffect(() => {
    if (loading) {
      setVerificationSteps([]);
      setCurrentStep(-1);
      const interval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < verificationSequence.length - 1) {
            setVerificationSteps(prevSteps => [...prevSteps, verificationSequence[prev + 1]]);
            return prev + 1;
          }
          return prev;
        });
      }, 400);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const handleTrack = async () => {
    if (!packetId.trim()) {
      setError('Please enter a packet ID');
      return;
    }
    setLoading(true);
    setError('');
    setJourneyData(null);
    setSelectedStage(null);

    try {
      const res = await API.getJourney(packetId);
      setJourneyData(res.data);
      // Auto-select first available stage
      const firstStage = stageConfigs.find(config => res.data[config.key]);
      if (firstStage) {
        setSelectedStage(firstStage.key);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch tracking info');
      setJourneyData(null);
    } finally {
      setTimeout(() => setLoading(false), 2800);
    }
  };

  const mapLink = (value) => {
    if (!value) return null;
    const parts = value.toString().split(',').map(v => v.trim());
    if (parts.length !== 2) return null;
    const [lat, lng] = parts;
    return `https://www.google.com/maps?q=${lat},${lng}`;
  };

  const renderDetails = (obj) => (
    <div className="space-y-3">
      {Object.entries(obj).map(([key, val]) => {
        if (!val || typeof val === 'object') return null;
        const isGps = key.toLowerCase().includes('gps') || key.toLowerCase().includes('coordinates') || key.toLowerCase().includes('location');
        const link = isGps ? mapLink(val) : null;
        
        return (
          <div key={key} className="flex justify-between items-start py-3 border-b border-gray-200 last:border-0">
            <span className="text-sm font-semibold text-gray-700 uppercase">
              {key.replace(/_/g, ' ')}
            </span>
            {isGps && link ? (
              <a 
                href={link} 
                target="_blank" 
                rel="noreferrer" 
                className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1"
              >
                <MapPin className="w-4 h-4" />
                <span className="underline">{val.toString()}</span>
              </a>
            ) : (
              <span className="text-gray-900 font-semibold text-right max-w-xs break-words">{val.toString()}</span>
            )}
          </div>
        );
      })}
    </div>
  );

  const timeline = useMemo(() => {
    if (!journeyData) return [];
    return stageConfigs.map(s => ({
      ...s,
      done: Boolean(journeyData[s.key])
    }));
  }, [journeyData]);

  const StageCard = ({ config, index }) => {
    if (!journeyData || !journeyData[config.key]) return null;
    
    const Icon = config.icon;
    const isSelected = selectedStage === config.key;

    return (
      <div 
        onClick={() => setSelectedStage(isSelected ? null : config.key)}
        className={`cursor-pointer transition-all duration-200 rounded-xl overflow-hidden ${
          isSelected 
            ? `ring-4 ${config.borderColor} shadow-xl` 
            : 'hover:shadow-lg shadow-md'
        }`}
      >
        <div className={`${config.bgGradient} px-6 py-4 flex items-center gap-4`}>
          <div className="bg-white p-2 rounded-lg">
            <Icon className="w-6 h-6 text-gray-800" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white">{config.fullTitle}</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white px-3 py-1 rounded-full">
              <span className="text-xs font-bold text-gray-800">Stage {index + 1}</span>
            </div>
            <ChevronDown className={`w-5 h-5 text-white transition-transform duration-200 ${isSelected ? 'rotate-180' : ''}`} />
          </div>
        </div>
        {isSelected && (
          <div className={`${config.lightBg} p-6 border-t-2 ${config.borderColor}`}>
            {renderDetails(journeyData[config.key])}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Track Your Product
        </h1>
        <p className="text-gray-600 text-lg">Enter packet ID to trace the complete supply chain journey</p>
      </div>

      {/* Search Box */}
      <div className="max-w-3xl mx-auto mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              value={packetId}
              onChange={(e) => setPacketId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleTrack()}
              placeholder="Enter Packet ID"
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
            />
            <button 
              onClick={handleTrack} 
              disabled={loading}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold text-lg shadow-md"
            >
              <Search className="w-5 h-5" />
              Track
            </button>
          </div>
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {journeyData && !loading && (
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Verification Badge */}
          <div className="bg-green-50 rounded-xl shadow-md p-5 border-2 border-green-400">
            <div className="flex items-center gap-3 text-green-700">
              <CheckCircle className="w-7 h-7" />
              <span className="font-bold text-xl">Journey Verified on Blockchain</span>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Supply Chain Timeline</h2>
            <div className="flex items-center justify-between overflow-x-auto pb-2">
              {timeline.map((stage, idx) => {
                const Icon = stage.icon;
                const isActive = selectedStage === stage.key;
                
                return (
                  <React.Fragment key={stage.key}>
                    <div 
                      onClick={() => stage.done && setSelectedStage(stage.key)}
                      className={`flex flex-col items-center min-w-[100px] ${stage.done ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                    >
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-2 transition-all ${
                        stage.done 
                          ? isActive
                            ? `${stage.bgGradient} scale-110 shadow-lg`
                            : `${stage.bgGradient} hover:scale-105`
                          : 'bg-gray-300'
                      }`}>
                        <Icon className={`w-7 h-7 ${stage.done ? 'text-white' : 'text-gray-500'}`} />
                      </div>
                      <span className={`text-sm font-bold text-center ${
                        stage.done 
                          ? isActive 
                            ? stage.textColor
                            : 'text-gray-700'
                          : 'text-gray-400'
                      }`}>
                        {stage.title}
                      </span>
                    </div>
                    {idx < timeline.length - 1 && (
                      <div className="flex-1 mx-2 min-w-[30px]">
                        <div className={`h-2 rounded-full ${
                          stage.done && timeline[idx + 1].done 
                            ? 'bg-green-500' 
                            : 'bg-gray-300'
                        }`}></div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 rounded-xl p-5 border-2 border-blue-300">
            <div className="flex items-start gap-3">
              <ArrowRight className="w-6 h-6 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-bold text-gray-900 text-lg mb-1">Click to View Details</h3>
                <p className="text-gray-700">Select any stage from the timeline or cards below to expand and see complete information</p>
              </div>
            </div>
          </div>

          {/* Stage Cards */}
          <div className="space-y-4">
            {stageConfigs.map((config, index) => (
              <StageCard key={config.key} config={config} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!journeyData && !loading && !error && (
        <div className="max-w-3xl mx-auto text-center py-16 bg-white rounded-xl shadow-lg">
          <div className="bg-gray-200 w-20 h-20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Package className="w-10 h-10 text-gray-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Ready to Track</h3>
          <p className="text-gray-600 text-lg">Enter a packet ID above to start tracking your product's journey</p>
        </div>
      )}

      {/* Verification Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <div className="inline-block p-3 bg-green-600 rounded-full mb-4">
                <Loader className="w-10 h-10 text-white animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Verifying on Blockchain...</h2>
              <p className="text-gray-300">Tracking packet: <span className="font-semibold text-green-400">{packetId}</span></p>
            </div>

            <div className="space-y-3">
              {verificationSteps.map((step, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg"
                >
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-white font-medium text-sm">{step}</p>
                </div>
              ))}
            </div>

            {currentStep === verificationSequence.length - 1 && (
              <button className="w-full mt-6 px-6 py-3 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 shadow-lg">
                Trace successfully verified
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackingPage;