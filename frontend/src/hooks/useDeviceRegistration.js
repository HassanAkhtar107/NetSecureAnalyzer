import { useEffect, useState, useRef } from 'react';
import { userDevicesApi, vpnApi } from '../api';
import { toast } from 'sonner';

const useDeviceRegistration = (isAuthenticated, user) => {
    const [isBlocked, setIsBlocked] = useState(() => {
        return localStorage.getItem('is_device_blocked') === 'true';
    });
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
            // Get IP and Location info from external API
            let ipData = {};
            try {
                const response = await fetch('https://ipapi.co/json/');
                if (response.ok) {
                    ipData = await response.json();
                } else {
                    const altRes = await fetch('https://api.ipify.org?format=json');
                    ipData = await altRes.json();
                }
            } catch (e) {
                console.warn("IP geolocation blocked, using local fallback");
            }
            const ipRes = ipData;
            const currentIp = ipRes.ip || '127.0.0.1';
            const currentCountry = ipRes.country_name || 'Unknown';

            const payload = {
                device_id: getDeviceFingerprint(),
                device_name: `${navigator.platform} - ${navigator.vendor || 'Generic'}`,
                ip_address: currentIp,
                country: currentCountry,
                location: `${ipRes.city || ''}, ${ipRes.region || ''}`.trim() || 'Unknown',
                browser_info: navigator.userAgent
            };

            const res = await userDevicesApi.register(payload);

            // Check if status changed from blocked to restored via VPN (Backend returns VPN_BYPASS)
            if (isBlocked && res.data.status === 'VPN_BYPASS') {
                toast.success("VPN Detected - Access Restored", {
                    description: "Your secure connection (IP Change) has bypassed the firewall restrictions.",
                    duration: 5000,
                });
            }

            // Update device info and block status
            const updatedDevice = res.data.device || res.data;
            setDeviceInfo(updatedDevice);
            setIsBlocked(res.data.status === 'BLOCKED' || updatedDevice.is_blocked);
            setLastCheck({
                ip: currentIp,
                vpn: updatedDevice.vpn_status,
                country: currentCountry
            });

        } catch (err) {
            if (err.response?.status === 403) {
                setIsBlocked(true);
                setDeviceInfo(err.response.data);
            }
            console.error("Device registration failed", err);
        }
    };

    useEffect(() => {
        localStorage.setItem('is_device_blocked', isBlocked);
    }, [isBlocked]);

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
            localStorage.removeItem('is_device_blocked');
        }

        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current);
        };
    }, [isAuthenticated, user]);

    return { isBlocked, deviceInfo, reCheck: () => window.location.reload() };
};

export default useDeviceRegistration;
