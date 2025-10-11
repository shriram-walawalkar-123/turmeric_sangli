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