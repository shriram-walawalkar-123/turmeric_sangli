import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const StageAuthContext = createContext();

export const useStageAuth = () => {
  const context = useContext(StageAuthContext);
  if (!context) {
    throw new Error('useStageAuth must be used within a StageAuthProvider');
  }
  return context;
};

export const StageAuthProvider = ({ children }) => {
  const [stageUser, setStageUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Set up axios defaults
  useEffect(() => {
    const token = localStorage.getItem('stageToken');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    axios.defaults.baseURL = API_BASE_URL;
  }, []);

  // Check if stage user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('stageToken');
      if (token) {
        try {
          const response = await axios.get('/api/stage/me');
          setStageUser(response.data.stageUser);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Stage auth check failed:', error);
          localStorage.removeItem('stageToken');
          delete axios.defaults.headers.common['Authorization'];
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await axios.post('/api/stage/login', credentials);
      const { token, stageUser: stageUserData } = response.data;
      
      localStorage.setItem('stageToken', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setStageUser(stageUserData);
      setIsAuthenticated(true);
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('stageToken');
      delete axios.defaults.headers.common['Authorization'];
      setStageUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    stageUser,
    isAuthenticated,
    isLoading,
    login,
    logout
  };

  return (
    <StageAuthContext.Provider value={value}>
      {children}
    </StageAuthContext.Provider>
  );
};
