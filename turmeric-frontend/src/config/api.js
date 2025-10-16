import axios from 'axios';

// Backend API base URL
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const stageToken = localStorage.getItem('stageToken');
  if (stageToken) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${stageToken}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Normalize backend error shape for consumers
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const backendMsg = err?.response?.data?.error || err?.response?.data?.message;
    if (backendMsg) {
      err.message = backendMsg;
    }
    return Promise.reject(err);
  }
);


// API endpoints
export const API = {
  // Harvest endpoints
  addHarvest: (data) => apiClient.post('/api/harvest', data),
  
  // Processing endpoints
  addProcessing: (data) => apiClient.post('/api/processing', data),
  
  // Distributor endpoints
  addDistributor: (data) => apiClient.post('/api/distributor', data),
  
  // Supplier endpoints
  addSupplier: (data) => apiClient.post('/api/supplier', data),
  
  // Shopkeeper endpoints
  addShopkeeper: (data) => apiClient.post('/api/shopkeeper', data),
  
  // Packet endpoints
  addPacket: (data) => apiClient.post('/api/packet', data),
  
  // Journey tracking
  getJourney: (packetId) => apiClient.get(`/api/journey/${packetId}`),
  
  // Dashboard stats
  getStats: () => apiClient.get('/api/stats'),
  
  // Recent activity
  getRecentActivity: () => apiClient.get('/api/activity'),
};

export default apiClient;