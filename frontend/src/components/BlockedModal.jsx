import React, { useState } from 'react';
import { ShieldAlert, Globe, RefreshCcw, LogOut, Zap, Loader2 } from 'lucide-react';
import { vpnApi } from '../api';
import { toast } from 'sonner';

const BlockedModal = ({ deviceInfo, onRetry, onLogout }) => {
    const [isConnecting, setIsConnecting] = useState(false);

    const handleSimulateVPN = async () => {
        setIsConnecting(true);
        try {
            await vpnApi.connect({ country: 'Germany' });
            toast.success("VPN Tunnel Established. Re-validating...");
            setTimeout(() => {
                onRetry();
                setIsConnecting(false);
            }, 2000);
        } catch (err) {
            toast.error("Failed to establish VPN connection");
            setIsConnecting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950 p-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.1),transparent_70%)]" />
            
            <div className="bg-[#0a0f1d] border border-rose-500/30 rounded-[2.5rem] p-10 w-full max-w-xl shadow-[0_0_50px_rgba(244,63,94,0.15)] relative overflow-hidden text-center">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent" />
                
                <div className="mb-8 flex flex-col items-center justify-center relative py-8">
                    {/* Visualizer Container */}
                    <div className="flex items-center justify-between w-full max-w-sm relative">
                        {/* User Node */}
                        <div className="flex flex-col items-center gap-2 relative z-10">
                            <div className="w-12 h-12 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center z-10">
                                <Globe className="text-slate-400" size={24} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">You</span>
                        </div>

                        {/* Connection Lines & Firewall */}
                        <div className="flex-1 relative flex items-center justify-center h-12">
                            {/* Blocked Direct Route */}
                            <div className="absolute w-full h-[2px] bg-rose-500/30 flex items-center justify-center">
                                {/* Moving Packet that gets blocked */}
                                {!isConnecting && (
                                    <div className="absolute left-0 w-2 h-2 bg-rose-500 rounded-full animate-[ping_1.5s_infinite]" style={{ animationTimingFunction: 'linear' }} />
                                )}
                            </div>

                            {/* Firewall Wall */}
                            <div className="absolute w-2 h-16 bg-rose-500 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.5)] z-20" />
                            
                            {/* VPN Tunnel (bypassing firewall) */}
                            {isConnecting && (
                                <div className="absolute w-[120%] h-[120%] -top-4 rounded-t-full border-t-2 border-dashed border-emerald-500/50 flex items-start justify-center">
                                    <div className="absolute -top-[5px] w-2 h-2 bg-emerald-400 rounded-full animate-[ping_1.5s_infinite]" />
                                    <span className="absolute -top-6 text-[8px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full">Secure Tunnel</span>
                                </div>
                            )}
                        </div>

                        {/* Server Node */}
                        <div className="flex flex-col items-center gap-2 relative z-10">
                            <div className="w-12 h-12 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center z-10">
                                <ShieldAlert className={isConnecting ? "text-emerald-500" : "text-rose-500"} size={24} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Server</span>
                        </div>
                    </div>
                </div>

                <h1 className="text-4xl font-black text-white mb-4 tracking-tight">
                    Access Blocked by Firewall
                </h1>
                
                <p className="text-rose-400/80 text-lg mb-8 font-medium">
                    {deviceInfo?.detail || "Your network/device is currently restricted."}
                </p>

                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 mb-8 text-left space-y-4">
                    <div className="flex justify-between items-center pb-4 border-b border-slate-800/50">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Device ID</span>
                        <span className="text-xs font-mono text-slate-300">{deviceInfo?.device_id || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-slate-800/50">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">IP Address</span>
                        <span className="text-xs font-mono text-slate-300">{deviceInfo?.ip_address || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Location</span>
                        <div className="flex items-center gap-2">
                            <Globe size={14} className="text-sky-400" />
                            <span className="text-xs font-bold text-slate-300">{deviceInfo?.country || 'Unknown'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="p-4 bg-sky-500/5 border border-sky-500/20 rounded-2xl mb-2 text-sm text-sky-400 flex flex-col gap-3 text-left">
                        <div className="flex items-start gap-3">
                            <div className="mt-1"><RefreshCcw size={16} className="animate-spin-slow" /></div>
                            <p>
                                <span className="font-bold">VPN Detection Active:</span> If you believe this is an error, try connecting to a secure VPN tunnel. The system will automatically re-validate your access.
                            </p>
                        </div>
                        <button
                            onClick={handleSimulateVPN}
                            disabled={isConnecting}
                            className="mt-2 py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl flex justify-center items-center gap-2 transition-all disabled:opacity-50"
                        >
                            {isConnecting ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                            {isConnecting ? 'Establishing Tunnel...' : 'Simulate VPN Connection'}
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={onRetry}
                            className="flex items-center justify-center gap-2 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-all border border-slate-700"
                        >
                            <RefreshCcw size={18} /> Re-validate
                        </button>
                        <button 
                            onClick={onLogout}
                            className="flex items-center justify-center gap-2 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-rose-500/20"
                        >
                            <LogOut size={18} /> Logout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BlockedModal;
