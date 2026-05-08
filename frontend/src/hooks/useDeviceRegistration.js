import { useEffect, useState } from 'react';
import { userDevicesApi, vpnApi } from '../api';
import { toast } from 'sonner';

const useDeviceRegistration = (isAuthenticated, user) => {
    const [isBlocked, setIsBlocked] = useState(false);
    const [deviceInfo, setDeviceInfo] = useState(null);

    const getDeviceFingerprint = () => {
        let fingerprint = localStorage.getItem('device_fingerprint');
        if (!fingerprint) {
            fingerprint = 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('device_fingerprint', fingerprint);
        }
        return fingerprint;
    };

    const registerDevice = async () => {
        if (!isAuthenticated || !user) return;

        try {
            // Get IP and Location info
            const ipRes = await fetch('https://ipapi.co/json/').then(r => r.json()).catch(() => ({}));
            
            // Get VPN Status from our API
            const vpnRes = await vpnApi.status().catch(() => ({ data: { is_active: false } }));
            const vpnData = vpnRes.data || { is_active: false };
            
            const payload = {
                device_id: getDeviceFingerprint(),
                device_name: `${navigator.platform} - ${navigator.vendor || 'Generic'}`,
                ip_address: vpnData.is_active && vpnData.simulated_ip ? vpnData.simulated_ip : (ipRes.ip || '127.0.0.1'),
                country: vpnData.is_active && vpnData.selected_country ? vpnData.selected_country : (ipRes.country_name || 'Unknown'),
                location: vpnData.is_active ? `VPN Node (${vpnData.selected_country})` : (`${ipRes.city || ''}, ${ipRes.region || ''}`.trim() || 'Unknown'),
                browser_info: navigator.userAgent,
                vpn_status: vpnData.is_active
            };

            const res = await userDevicesApi.register(payload);
            setDeviceInfo(res.data.device || res.data);
            setIsBlocked(false);
            
            if (res.data.status === 'RESTORED') {
                toast.success(res.data.message);
            }
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
        }
    }, [isAuthenticated, user]);

    return { isBlocked, deviceInfo, reCheck: registerDevice };
};

export default useDeviceRegistration;
