import React, { useMemo } from 'react';
import { 
  Laptop, Shield, ShieldAlert, ShieldCheck, Globe, 
  Lock, ArrowRight, Zap, AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';

const SecurityFlow = ({ deviceInfo }) => {
    const isBlocked = deviceInfo?.is_blocked || deviceInfo?.status === 'BLOCKED';
    const isVpnActive = deviceInfo?.vpn_status;

    const nodes = [
        { 
            id: 'device', 
            label: 'Your Device', 
            sub: deviceInfo?.device_name?.split(' - ')[0] || 'Browser', 
            icon: Laptop, 
            status: 'active' 
        },
        { 
            id: 'firewall', 
            label: 'Firewall', 
            sub: isBlocked ? 'Deny Policy' : 'Allow Policy', 
            icon: Shield, 
            status: isBlocked ? 'blocked' : 'active' 
        },
        { 
            id: 'vpn', 
            label: 'VPN Tunnel', 
            sub: isVpnActive ? 'Encrypted' : 'No Tunnel', 
            icon: isVpnActive ? Lock : Globe, 
            status: isVpnActive ? 'active' : (isBlocked ? 'inactive' : 'active') 
        },
        { 
            id: 'access', 
            label: 'Network Access', 
            sub: (!isBlocked || isVpnActive) ? 'Granted' : 'Denied', 
            icon: (!isBlocked || isVpnActive) ? ShieldCheck : ShieldAlert, 
            status: (!isBlocked || isVpnActive) ? 'active' : 'blocked' 
        }
    ];

    return (
        <div className="relative w-full py-12 px-4 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-4 overflow-hidden">
            {/* Background Decorative Lines */}
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-slate-800 -translate-y-1/2 hidden md:block" />
            
            {nodes.map((node, index) => (
                <React.Fragment key={node.id}>
                    {/* Node */}
                    <div className="flex flex-col items-center gap-4 relative z-10 w-full md:w-auto">
                        <div className={cn(
                            "w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 shadow-lg",
                            node.status === 'active' ? "bg-sky-500/10 border-sky-500/50 text-sky-400 shadow-sky-500/10" :
                            node.status === 'blocked' ? "bg-rose-500/10 border-rose-500/50 text-rose-400 shadow-rose-500/10" :
                            "bg-slate-900 border-slate-800 text-slate-600"
                        )}>
                            <node.icon size={28} className={cn(node.status === 'active' && "animate-pulse")} />
                        </div>
                        
                        <div className="text-center">
                            <p className="text-xs font-black text-white uppercase tracking-wider">{node.label}</p>
                            <p className={cn(
                                "text-[10px] font-bold uppercase tracking-widest mt-1",
                                node.status === 'active' ? "text-sky-500" :
                                node.status === 'blocked' ? "text-rose-500" :
                                "text-slate-600"
                            )}>
                                {node.sub}
                            </p>
                        </div>

                        {/* Floating Status Indicator */}
                        {node.id === 'access' && (
                            <div className={cn(
                                "absolute -top-4 right-0 md:-right-2 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter",
                                node.status === 'active' ? "bg-emerald-500 text-slate-950" : "bg-rose-500 text-white"
                            )}>
                                {node.status === 'active' ? 'Secured' : 'Restricted'}
                            </div>
                        )}
                    </div>

                    {/* Connector */}
                    {index < nodes.length - 1 && (
                        <div className="flex-1 min-w-[40px] flex items-center justify-center relative h-8 md:h-auto">
                            <div className={cn(
                                "w-[2px] h-8 md:w-full md:h-[2px] transition-all duration-1000 overflow-hidden relative",
                                (node.status === 'active' && nodes[index+1].status !== 'blocked') ? "bg-sky-500/20" : 
                                (node.status === 'blocked' || nodes[index+1].status === 'blocked') ? "bg-rose-500/20" :
                                "bg-slate-800"
                            )}>
                                {/* Moving Signal */}
                                {node.status === 'active' && nodes[index+1].status !== 'blocked' && (
                                    <div className="absolute top-0 left-0 w-full h-full">
                                        <div className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-transparent via-sky-400 to-transparent animate-flow-horizontal" />
                                    </div>
                                )}
                                {nodes[index+1].status === 'blocked' && (
                                    <div className="absolute top-0 right-0 w-1/2 h-full bg-rose-500/50" />
                                )}
                            </div>
                            <ArrowRight className={cn(
                                "hidden md:block absolute right-0 -translate-y-1/2 top-1/2 transition-colors",
                                node.status === 'active' ? "text-sky-500" : "text-slate-700"
                            )} size={12} />
                        </div>
                    )}
                </React.Fragment>
            ))}

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes flow-horizontal {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(300%); }
                }
                .animate-flow-horizontal {
                    animation: flow-horizontal 2s infinite linear;
                }
            `}} />
        </div>
    );
};

export default SecurityFlow;
