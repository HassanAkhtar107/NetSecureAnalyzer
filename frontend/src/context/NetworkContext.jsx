import React, { createContext, useContext, useState, useEffect } from 'react';
import { networksApi, devicesApi, firewallApi, vpnApi, userDevicesApi, adminUsersApi } from '../api';

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
        const [devRes, vpnRes, udRes, uRes] = await Promise.allSettled([
          devicesApi.list(),
          vpnApi.status(),
          userDevicesApi.list(),
          adminUsersApi.list()
        ]);

        const safeArr = (res) => {
          if (res.status !== 'fulfilled' || !res.value?.data) return [];
          return Array.isArray(res.value.data.results) ? res.value.data.results :
            Array.isArray(res.value.data) ? res.value.data : [];
        };

        let fetchedDevices = safeArr(devRes);
        let fetchedUserDevices = safeArr(udRes);
        let fetchedUsers = safeArr(uRes);

        // Build map of existing user devices by email to prevent double registration
        const userDeviceMap = new Map();
        for (const ud of fetchedUserDevices) {
          if (ud.user_email) {
            userDeviceMap.set(ud.user_email.toLowerCase(), ud);
          }
        }

        // Generate placeholders for users in User table who don't have a device registered
        const userPlaceholders = [];
        for (const u of fetchedUsers) {
          if (u.user_type !== 'ADMIN' && u.email) {
            const emailKey = u.email.toLowerCase();
            if (!userDeviceMap.has(emailKey)) {
              userPlaceholders.push({
                id: `u-placeholder-${u.id}`,
                device_name: u.name || u.email,
                user_email: u.email,
                ip_address: '0.0.0.0',
                vpn_status: false,
                is_blocked: false,
                last_active: null,
                created_at: null
              });
            }
          }
        }

        // Combine devices, marking user-registered ones and placeholders
        const combined = [
          ...fetchedDevices.map(d => ({
            ...d,
            source: 'infrastructure',
            status: d.status || 'ACTIVE'
          })),
          ...fetchedUserDevices
            .filter(d => d.user_type !== 'ADMIN')
            .map(d => ({
              ...d,
              id: `ud-${d.id}`,
              name: d.device_name || d.user_email || 'Unnamed Device',
              status: d.is_blocked ? 'BLOCKED' : (d.vpn_status ? 'VPN ACTIVE' : 'ACTIVE'),
              source: 'user_registration',
            })),
          ...userPlaceholders.map(u => ({
            ...u,
            id: u.id,
            name: u.name || u.device_name,
            ip: u.ip_address,
            ip_address: u.ip_address,
            status: 'active',
            source: 'user_registration',
          }))
        ];

        // De-duplicate: Keep only the most recent device entry per unique user email
        // and per unique IP for infrastructure devices that don't have an email.
        const seenEmails = new Set();
        const seenIPsForInfra = new Set();
        const uniqueDevices = [];

        const sorted = [...combined].sort((a, b) => {
          const emailA = a.user_email || a.email ? 1 : 0;
          const emailB = b.user_email || b.email ? 1 : 0;
          if (emailB !== emailA) return emailB - emailA;

          const dateA = a.last_active ? new Date(a.last_active) : new Date(a.created_at || 0);
          const dateB = b.last_active ? new Date(b.last_active) : new Date(b.created_at || 0);
          return dateB - dateA;
        });

        for (const d of sorted) {
          const email = d.user_email || d.email;
          const ip = d.ip_address || d.ip;

          if (email) {
            // Distinct users are identified and de-duplicated by email
            if (!seenEmails.has(email)) {
              seenEmails.add(email);
              if (ip) seenIPsForInfra.add(ip); // Mark their IP as seen so background scan won't duplicate it
              uniqueDevices.push(d);
            }
          } else {
            // Background infrastructure scans (without email) are de-duplicated by unique IP
            if (ip && !seenIPsForInfra.has(ip)) {
              seenIPsForInfra.add(ip);
              uniqueDevices.push(d);
            }
          }
        }

        setDevices(uniqueDevices);

        // Calculate actual active connections and blocked devices
        const activeCount = uniqueDevices.filter(d => d.status === 'ACTIVE' || d.status === 'VPN ACTIVE').length;
        const blockedCount = uniqueDevices.filter(d => d.status === 'BLOCKED').length;

        setActiveConnections(activeCount);
        setBlockedToday(blockedCount);

        if (vpnRes.status === 'fulfilled' && vpnRes.value.data) {
          setVpnConnected(vpnRes.value.data.is_active);
          setVpnIP(vpnRes.value.data.simulated_ip || '0.0.0.0');
        }
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
