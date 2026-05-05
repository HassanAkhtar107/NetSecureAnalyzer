import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import Topology from './pages/Topology';
import Transfers from './pages/Transfers';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Performance from './pages/Performance';
import VPN from './pages/VPN';
import Firewall from './pages/Firewall';
import Settings from './pages/Settings';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  const [userType, setUserType] = useState<'ADMIN' | 'USER'>(() => {
    return (localStorage.getItem('userType') as 'ADMIN' | 'USER') || 'USER';
  });

  const handleLogin = (type: 'ADMIN' | 'USER', token: string) => {
    setUserType(type);
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userType', type);
    localStorage.setItem('token', token);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userType');
    localStorage.removeItem('token');
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={!isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/" replace />}
        />
        <Route
          path="/signup"
          element={!isAuthenticated ? <Signup onSignup={handleLogin} /> : <Navigate to="/" replace />}
        />

        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <Layout userType={userType} onLogout={handleLogout}>
                <Routes>
                  <Route path="/" element={<Dashboard userType={userType} />} />
                  <Route path="/devices" element={<Devices userType={userType} />} />
                  <Route path="/topology" element={<Topology />} />
                  <Route path="/transfers" element={<Transfers userType={userType} />} />
                  <Route path="/vpn" element={<VPN />} />
                  <Route path="/firewall" element={<Firewall />} />
                  <Route path="/performance" element={<Performance />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
