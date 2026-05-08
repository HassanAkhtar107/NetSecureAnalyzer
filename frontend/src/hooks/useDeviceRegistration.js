import { useEffect, useState, useRef } from 'react';
import { userDevicesApi, vpnApi } from '../api';
import { toast } from 'sonner';

const useDeviceRegistration = (isAuthenticated, user) => {
    const [isBlocked, setIsBlocked] = useState(false);
    const [deviceInfo, setDeviceInfo] = useState(null);
    const [lastCheck, setLastCheck] = useState({ ip: null, vpn: null, country: null });
    const pollInterval = useRef(null);

    const getDeviceFingerprint = () => {
        let fingerprint = localStorage.getItem('device_fingerprint');
        if (!fingerprint) {
            fingerprint = 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('device_fingerprint', fingerprint);
        }
        return fingerprint;
    };

    const registerDevice = async (isManual = false) => {
        if (!isAuthenticated || !user) return;

        try {
            // Get IP and Location info from external API (with fallback)
            let ipData = {};
            try {
                const response = await fetch('https://ipapi.co/json/');
                if (response.ok) {
                    ipData = await response.json();
                } else {
                    // Fallback to simpler IP service if ipapi is blocking
                    const altRes = await fetch('https://api.ipify.org?format=json');
                    ipData = await altRes.json();
                }
            } catch (e) {
                console.warn("IP geolocation blocked, using local fallback");
            }
            const ipRes = ipData;

            // Get VPN Status from our backend
            const vpnRes = await vpnApi.status().catch(() => ({ data: { is_active: false } }));
            const vpnData = vpnRes.data || { is_active: false };

            const currentIp = vpnData.is_active && vpnData.simulated_ip ? vpnData.simulated_ip : (ipRes.ip || '127.0.0.1');
            const currentCountry = vpnData.is_active && vpnData.selected_country ? vpnData.selected_country : (ipRes.country_name || 'Unknown');
            const currentVpn = vpnData.is_active;

            const payload = {
                device_id: getDeviceFingerprint(),
                device_name: `${navigator.platform} - ${navigator.vendor || 'Generic'}`,
                ip_address: currentIp,
                country: currentCountry,
                location: vpnData.is_active ? `VPN Node (${vpnData.selected_country})` : (`${ipRes.city || ''}, ${ipRes.region || ''}`.trim() || 'Unknown'),
                browser_info: navigator.userAgent,
                vpn_status: currentVpn
            };

            const res = await userDevicesApi.register(payload);

            // Check if status changed from blocked to restored
            if (isBlocked && res.data.status !== 'BLOCKED') {
                toast.success("VPN Detected - Access Restored", {
                    description: "Your secure connection has bypassed the firewall restrictions.",
                    duration: 5000,
                });
            }

            setDeviceInfo(res.data.device || res.data);
            setIsBlocked(res.data.status === 'BLOCKED' || res.data.is_blocked);
            setLastCheck({ ip: currentIp, vpn: currentVpn, country: currentCountry });

        } catch (err) {
            if (err.response?.status === 403) {
                setIsBlocked(true);
                setDeviceInfo(err.response.data);
            }
            console.error("Device registration failed", err);
        }
    };

    useEffect(() => {
        if (isAuthenticated && user) {
            registerDevice();

            // Start polling for IP/VPN changes every 10 seconds
            pollInterval.current = setInterval(() => {
                registerDevice();
            }, 10000);
        } else {
            if (pollInterval.current) clearInterval(pollInterval.current);
            setIsBlocked(false);
            setDeviceInfo(null);
        }

        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current);
        };
    }, [isAuthenticated, user]);

    return { isBlocked, deviceInfo, reCheck: () => registerDevice(true) };
};

export default useDeviceRegistration;
