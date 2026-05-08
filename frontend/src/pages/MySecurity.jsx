import React, { useState, useEffect } from 'react';
import { 
  Shield, Globe, Lock, Clock, MapPin, Activity, 
  Terminal, ShieldCheck, ShieldAlert, Cpu, HardDrive
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { userDevicesApi, vpnApi, firewallApi } from '../api';
import SecurityFlow from '../components/SecurityFlow';
import { formatDistanceToNow } from 'date-fns';

const MySecurity = () => {
    const [device, setDevice] = useState(null);
    const [vpnStatus, setVpnStatus] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [dRes, vRes, lRes] = await Promise.all([
                userDevicesApi.list(),
                vpnApi.status(),
                firewallApi.logs()
            ]);
            
            // Get the current device (matching by fingerprint)
            const fingerprint = localStorage.getItem('device_fingerprint');
            const currentDevice = dRes.data.find(d => d.device_id === fingerprint) || dRes.data[0];
            
            setDevice(currentDevice);
            setVpnStatus(vRes.data);
            setLogs(lRes.data.slice(0, 5)); // Just the last 5 logs
        } catch (err) {
            console.error("Failed to fetch security data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    if (loading && !device) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Activity className="animate-spin text-sky-500" size={48} />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white">My Security</h1>
                    <p className="text-slate-500">Real-time monitoring of your device's connection and security status.</p>
                </div>
                <Badge variant={device?.is_blocked ? "destructive" : "success"} className="px-4 py-1 text-xs uppercase tracking-widest">
                    {device?.is_blocked ? "Access Restricted" : "Fully Protected"}
                </Badge>
            </div>

            {/* Security Flow Visualization */}
            <Card className="p-8 border-slate-800 bg-[#0a0f1d]/50 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Shield size={120} />
                </div>
                <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
                    <Activity size={20} className="text-sky-500" />
                    Live Security Path
                </h3>
                <SecurityFlow deviceInfo={device} />
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Device Profile */}
                <Card className="lg:col-span-2 p-6 border-slate-800 bg-[#0d1117]">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <Cpu size={16} />
                        Device Intelligence
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                                <span className="text-xs text-slate-500 font-medium">Device ID</span>
                                <span className="text-xs font-mono text-slate-300">{device?.device_id || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                                <span className="text-xs text-slate-500 font-medium">Public IP Address</span>
                                <span className="text-xs font-mono text-sky-400">{device?.ip_address || '0.0.0.0'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                                <span className="text-xs text-slate-500 font-medium">Country / Region</span>
                                <div className="flex items-center gap-2">
                                    <MapPin size={12} className="text-rose-500" />
                                    <span className="text-xs text-slate-300 font-bold">{device?.country || 'Unknown'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                                <span className="text-xs text-slate-500 font-medium">VPN Status</span>
                                <Badge variant={device?.vpn_status ? "success" : "secondary"} className="text-[10px]">
                                    {device?.vpn_status ? "Tunnel Active" : "Direct Connection"}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                                <span className="text-xs text-slate-500 font-medium">Firewall Status</span>
                                <div className="flex items-center gap-2">
                                    {device?.is_blocked ? <ShieldAlert size={14} className="text-rose-500" /> : <ShieldCheck size={14} className="text-emerald-500" />}
                                    <span className={device?.is_blocked ? "text-xs text-rose-500 font-bold" : "text-xs text-emerald-500 font-bold"}>
                                        {device?.is_blocked ? "Blocked" : "Filtering Active"}
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                                <span className="text-xs text-slate-500 font-medium">Last Sync</span>
                                <div className="flex items-center gap-2">
                                    <Clock size={12} className="text-slate-500" />
                                    <span className="text-xs text-slate-400">
                                        {device?.last_active ? formatDistanceToNow(new Date(device.last_active), { addSuffix: true }) : 'Never'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 p-4 bg-slate-900/50 rounded-xl border border-slate-800 flex items-start gap-4">
                        <div className="p-2 bg-sky-500/10 rounded-lg">
                            <Terminal size={20} className="text-sky-500" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white mb-1">Fingerprint Data</p>
                            <p className="text-[10px] text-slate-500 font-mono leading-relaxed">
                                {device?.browser_info || 'Analyzing browser metadata...'}
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Security Logs */}
                <Card className="p-6 border-slate-800 bg-[#0d1117] flex flex-col">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <HardDrive size={16} />
                        Security Logs
                    </h3>

                    <div className="space-y-4 flex-1">
                        {logs.length > 0 ? logs.map((log, i) => (
                            <div key={i} className="group relative pl-4 border-l-2 border-slate-800 hover:border-sky-500 transition-colors">
                                <p className="text-[10px] font-bold text-slate-500 uppercase">{new Date(log.timestamp).toLocaleTimeString()}</p>
                                <p className="text-xs text-slate-300 font-medium mt-0.5">
                                    {log.action === 'ALLOW' ? 'Connection Permitted' : log.action === 'BLOCK' ? 'Access Denied' : 'Threat Blocked'}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-1 truncate">Source: {log.source_ip}</p>
                            </div>
                        )) : (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-2 py-8">
                                <ShieldCheck size={32} className="text-slate-700" />
                                <p className="text-xs text-slate-600">No security incidents detected.</p>
                            </div>
                        )}
                    </div>
                    
                    <button className="mt-6 text-[10px] font-bold text-sky-500 uppercase tracking-widest hover:text-sky-400 transition-colors text-left">
                        View Detailed Audit Trail →
                    </button>
                </Card>
            </div>
        </div>
    );
};

export default MySecurity;
