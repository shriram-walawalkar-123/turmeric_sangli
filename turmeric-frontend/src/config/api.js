import axios from 'axios';

// Backend API base URL
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// API endpoints
export const API = {
  // Harvest endpoints
  addHarvest: (data) => apiClient.post('/harvest', data),
  
  // Processing endpoints
  addProcessing: (data) => apiClient.post('/processing', data),
  
  // Distributor endpoints
  addDistributor: (data) => apiClient.post('/distributor', data),
  
  // Supplier endpoints
  addSupplier: (data) => apiClient.post('/supplier', data),
  
  // Shopkeeper endpoints
  addShopkeeper: (data) => apiClient.post('/shopkeeper', data),
  
  // Packet endpoints
  addPacket: (data) => apiClient.post('/packet', data),
  
  // Journey tracking
  getJourney: (packetId) => apiClient.get(`/journey/${packetId}`),
  
  // Dashboard stats
  getStats: () => apiClient.get('/stats'),
  
  // Recent activity
  getRecentActivity: () => apiClient.get('/activity'),
};

export default apiClient;