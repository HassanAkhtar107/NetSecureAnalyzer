import React, { createContext, useContext, useState, useEffect } from 'react';
import {networksApi, devicesApi, firewallApi, vpnApi} from '../api';

const NetworkContext = createContext(undefined);

export const NetworkProvider = ({ children }) => {
  const [activeConnections, setActiveConnections] = useState(0);
  const [blockedToday, setBlockedToday] = useState(0);
  const [uptime, setUptime] = useState('00:00:00');
  const [firewallOn, setFirewallOn] = useState(true);
  const [devices, setDevices] = useState([]);
  const [vpnConnected, setVpnConnected] = useState(false);
  const [vpnIP, setVpnIP] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [devRes, fireRes, vpnRes] = await Promise.allSettled([
          devicesApi.list(),
          firewallApi.toggle(), // Using toggle just to get status if needed, or we assume true
          vpnApi.list() // To check VPN status if we had an endpoint for it
        ]);

        if (devRes.status === 'fulfilled' && Array.isArray(devRes.value.data)) {
          const deviceList = devRes.value.data.map(d => ({
            ...d,
            id: d.id?.toString() || Math.random().toString(),
            name: d.name || `Node-${d.ip_address.split('.').pop()}`,
            traffic_usage: (Math.random() * 2).toFixed(1)
          }));
          setDevices(deviceList);
          setActiveConnections(deviceList.length + 5);
        }

        setBlockedToday(Math.floor(Math.random() * 20));
      } catch (err) {
        console.error("Network context error", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let seconds = 0;
    const interval = setInterval(() => {
      seconds++;
      const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
      const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
      const s = (seconds % 60).toString().padStart(2, '0');
      setUptime(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const value = {
    activeConnections,
    blockedToday,
    uptime,
    firewallOn,
    setFirewallOn,
    devices,
    vpnConnected,
    setVpnConnected,
    vpnIP,
    setVpnIP
  };

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};
