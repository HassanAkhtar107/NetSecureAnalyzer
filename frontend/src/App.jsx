import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import Transfers from './pages/Transfers';
import Received from './pages/Received';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { NetworkProvider } from './context/NetworkContext';
import useDeviceRegistration from './hooks/useDeviceRegistration';
import BlockedModal from './components/BlockedModal';
import { Toaster } from 'sonner';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });

  const [userType, setUserType] = useState(() => {
    return localStorage.getItem('userType');
  });

  const [user, setUser] = useState(null);

  const { isBlocked, deviceInfo, reCheck } = useDeviceRegistration(isAuthenticated, user);

  useEffect(() => {
    if (isAuthenticated) {
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
    // Trigger immediate re-check after login
    reCheck();
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userType');
    localStorage.removeItem('access_token');
  };

  return (
    <NetworkProvider>
      <Toaster position="top-right" theme="dark" richColors />

      {isBlocked && (
        <BlockedModal
          deviceInfo={deviceInfo}
          onRetry={reCheck}
          onLogout={handleLogout}
        />
      )}

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
                    {userType === 'ADMIN' ? (
                      <>
                        <Route path="/data-transfer" element={<Transfers userType={userType} />} />
                        <Route path="/received" element={<Received userType={userType} />} />
                        <Route path="/" element={<Dashboard userType={userType} />} />
                        <Route path="/devices" element={<Devices userType={userType} />} />
                      </>
                    ) : (
                      <>
                        <Route path="/" element={<Transfers userType={userType} />} />
                        <Route path="/data-transfer" element={<Transfers userType={userType} />} />
                      </>
                    )}

                    <Route path="*" element={
                      <Navigate
                        to={userType === "ADMIN" ? "/" : "/data-transfer"}
                        replace
                      />
                    } />
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
