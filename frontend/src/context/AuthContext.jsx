import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // 1. Check local storage FIRST when the app loads so you don't lose session on refresh
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  
  // Safely parse the user object from local storage
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // 2. The Login Function: Update state AND save to browser memory instantly
  const login = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    
    // Save to local storage so the Traffic Cop can see it
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // 3. The Logout Function: Clear everything
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};