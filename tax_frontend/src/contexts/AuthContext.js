import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to validate token with backend
  const validateToken = async (token) => {
    try {
      const response = await axios.get('http://localhost:8000/api/users/validate-token/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data.valid;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  };

  // Function to refresh token
  const refreshToken = async (refreshToken) => {
    try {
      const response = await axios.post('http://localhost:8000/api/users/token/refresh/', {
        refresh: refreshToken
      });
      if (response.data.access) {
        localStorage.setItem('accessToken', response.data.access);
        return response.data.access;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
    return null;
  };

  // Function to check and restore authentication state
  const checkAuth = async () => {
    const userData = localStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');
    const refreshTokenValue = localStorage.getItem('refreshToken');

    if (userData && accessToken) {
      try {
        const parsedUser = JSON.parse(userData);
        
        // First try to validate the current access token
        const isTokenValid = await validateToken(accessToken);
        
        if (isTokenValid) {
          setUser(parsedUser);
          setLoading(false);
          return;
        }
        
        // If access token is invalid, try to refresh it
        if (refreshTokenValue) {
          const newAccessToken = await refreshToken(refreshTokenValue);
          if (newAccessToken) {
            setUser(parsedUser);
            setLoading(false);
            return;
          }
        }
        
        // If both validation and refresh fail, clear storage
        logout();
      } catch (error) {
        console.error('Error parsing user data:', error);
        logout();
      }
    } else {
      setUser(null);
      setLoading(false);
    }
  };

  // Function to login user
  const login = (userData, tokens) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('accessToken', tokens.access);
    localStorage.setItem('refreshToken', tokens.refresh);
    setUser(userData);
  };

  // Function to logout user
  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value = {
    user,
    loading,
    login,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 