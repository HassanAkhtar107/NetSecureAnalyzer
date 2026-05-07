import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import Transfers from './pages/Transfers';
import Firewall from './pages/Firewall';
import Topology from './pages/Topology';
import VPN from './pages/VPN';
import Received from './pages/Received';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { NetworkProvider } from './context/NetworkContext';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });

  const [userType, setUserType] = useState(() => {
    return localStorage.getItem('userType') || 'USER';
  });

  const [user, setUser] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      // In a real app, you'd fetch the user profile here
      import('./api').then(({ usersApi }) => {
        usersApi.me().then(res => {
          setUser(res.data);
          setUserType(res.data.user_type);
          localStorage.setItem('userType', res.data.user_type);
        }).catch(err => {
          console.error("Failed to fetch user profile", err);
          if (err.response?.status === 401) {
            handleLogout();
          }
        });
      });
    }
  }, [isAuthenticated]);

  const handleLogin = (role) => {
    setIsAuthenticated(true);
    setUserType(role);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userType', role);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userType');
  };

  return (
    <NetworkProvider>
      <Router>
        <Routes>
          <Route
            path="/login"
            element={!isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/" />}
          />
          <Route
            path="/signup"
            element={!isAuthenticated ? <Signup /> : <Navigate to="/" />}
          />
          <Route
            path="/*"
            element={
              isAuthenticated ? (
                <AppLayout user={user} onLogout={handleLogout}>
                  <Routes>
                    <Route path="/" element={<Dashboard userType={userType} />} />
                    <Route path="/devices" element={<Devices userType={userType} />} />
                    <Route path="/received" element={<Received />} />
                    <Route path="/data-transfer" element={<Transfers userType={userType} />} />
                    <Route path="/vpn" element={<VPN />} />

                    {userType === 'ADMIN' && (
                      <>
                        <Route path="/firewall" element={<Firewall />} />
                        <Route path="/topology" element={<Topology />} />
                      </>
                    )}

                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </AppLayout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </Router>
    </NetworkProvider>
  );
}

export default App;
