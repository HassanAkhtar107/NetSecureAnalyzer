import React, { useState, useEffect } from 'react';
import { RefreshCcw, LogOut, Zap, Loader2, ShieldCheck, Lock, MapPin } from 'lucide-react';
import { vpnApi } from '../api';
import { toast } from 'sonner';

const BlockedModal = ({ deviceInfo, onRetry, onLogout }) => {
    const [isConnecting, setIsConnecting] = useState(false);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950 p-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.1),transparent_70%)]" />

            <div className="bg-[#0a0f1d] border border-rose-500/30 rounded-[2.5rem] p-8 md:p-10 w-full max-w-2xl shadow-[0_0_50px_rgba(244,63,94,0.15)] relative overflow-hidden text-center">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent" />

                <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
                    Access Blocked by Firewall
                </h1>

                <p className="text-rose-400/80 text-base md:text-lg mb-8 font-medium max-w-md mx-auto">
                    Your device/network is currently restricted by security policies.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 text-left space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-800/50">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Connection IP</span>
                            <span className="text-xs font-mono text-sky-400">{deviceInfo?.ip_address || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-slate-800/50">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Network Location</span>
                            <div className="flex items-center gap-2">
                                <MapPin size={12} className="text-rose-500" />
                                <span className="text-xs font-bold text-slate-300">{deviceInfo?.country || 'Unknown'}</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">VPN Status</span>
                            <div className="flex items-center gap-2">
                                <Badge className={deviceInfo?.vpn_status ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-slate-800 text-slate-500 border-slate-700"}>
                                    {deviceInfo?.vpn_status ? 'ENCRYPTED' : 'DIRECT'}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 flex flex-col justify-center gap-4">
                        <div className="flex items-start gap-3 text-left">
                            <div className="mt-1">
                                {deviceInfo?.vpn_status ?
                                    <ShieldCheck size={18} className="text-emerald-500" /> :
                                    <Zap size={18} className="text-sky-500 animate-pulse" />
                                }
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                                    {deviceInfo?.vpn_status ? 'VPN Connected' : 'VPN Bypass Available'}
                                </p>
                                <p className="text-[10px] text-slate-500 leading-relaxed">
                                    {deviceInfo?.vpn_status ?
                                        'Secure tunnel active. Try re-validating access.' :
                                        'Turn on a real VPN on your device to bypass firewall restrictions.'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                    <button
                        onClick={() => window.location.reload()}
                        className="flex-1 flex items-center justify-center gap-2 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-all border border-slate-700"
                    >
                        <RefreshCcw size={18} className={isConnecting ? "animate-spin" : ""} /> Retry Access
                    </button>
                    <button
                        onClick={onLogout}
                        className="flex-1 flex items-center justify-center gap-2 py-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-2xl font-bold transition-all border border-rose-500/20"
                    >
                        <LogOut size={18} /> Logout Session
                    </button>
                </div>
            </div>
        </div>
    );
};

const Badge = ({ children, className }) => (
    <span className={cn("px-2 py-0.5 rounded text-[10px] font-black border", className)}>
        {children}
    </span>
);

const cn = (...classes) => classes.filter(Boolean).join(' ');

export default BlockedModal;
