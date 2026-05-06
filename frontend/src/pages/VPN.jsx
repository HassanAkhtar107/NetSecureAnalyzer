import React, { useState, useEffect } from 'react';
import {motion as m} from 'framer-motion';
import {Shield, Globe, Lock, Activity, Zap, Server, ChevronRight, CheckCircle2, AlertTriangle, Loader2} from 'lucide-react';
import {vpnApi} from '../api';
import {useNetwork} from '@/context/NetworkContext';
import {toast} from 'sonner';

const VPN = () => {
  const [servers, setServers] = useState([]);
  const [selectedServer, setSelectedServer] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { vpnConnected, setVpnConnected, vpnIP, setVpnIP } = useNetwork();

  const fetchServers = async () => {
    try {
      const res = await vpnApi.list();
      if (Array.isArray(res.data)) {
        setServers(res.data);
      } else {
        setServers([]);
      }
    } catch (err) {
      console.error("Failed to fetch servers", err);
    }
  };

  useEffect(() => {
    fetchServers();
  }, []);

  const handleConnect = async (server) => {
    if (vpnConnected) {
      setIsConnecting(true);
      try {
        await vpnApi.disconnect();
        setVpnConnected(false);
        setVpnIP(null);
        setSelectedServer(null);
        toast.info("VPN Tunnel Collapsed");
      } catch (err) {
        toast.error("Failed to disconnect from secure node");
      } finally {
        setIsConnecting(false);
      }
      return;
    }

    setSelectedServer(server);
    setIsConnecting(true);
    try {
      const res = await vpnApi.connect({ server_id: server.id });
      setTimeout(() => {
        setVpnConnected(true);
        setVpnIP(res.data.simulated_ip);
        setIsConnecting(false);
        toast.success(`Secure connection established to ${server.country}`);
      }, 2000);
    } catch (err) {
      toast.error("Handshake timed out");
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3 tracking-tight">
            <Lock className="text-sky-400" size={28} />
            Secure VPN Protocol
          </h2>
          <p className="text-slate-500 text-sm mt-1">Encapsulate your network traffic in an encrypted tunnel via global egress nodes.</p>
        </div>
        <div className={`px-4 py-2 rounded-xl flex items-center gap-3 border transition-all ${vpnConnected ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-900 border-slate-800'}`}>
           <div className={`w-2 h-2 rounded-full ${vpnConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></div>
           <span className={`text-[10px] font-bold uppercase tracking-widest ${vpnConnected ? 'text-emerald-400' : 'text-slate-500'}`}>
              {vpnConnected ? 'Encrypted Connection Active' : 'Unsecured Link'}
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Connection Status Panel */}
        <div className="glass-panel p-8 lg:col-span-1 space-y-8 relative overflow-hidden">
           {vpnConnected && <div className="absolute inset-0 bg-emerald-500/[0.02] animate-pulse"></div>}
           
           <div className="relative z-10 space-y-8">
              <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
                 {isConnecting ? (
                    <div className="flex flex-col items-center gap-4">
                       <Loader2 className="animate-spin text-sky-400" size={48} />
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest animate-pulse">Establishing Tunnel...</p>
                    </div>
                 ) : vpnConnected ? (
                    <div className="flex flex-col items-center gap-4 text-center">
                       <div className="p-4 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="text-emerald-400" size={48} />
                       </div>
                       <div>
                          <p className="text-lg font-bold text-white">Shield Active</p>
                          <p className="text-xs text-slate-500 font-mono mt-1">{vpnIP}</p>
                       </div>
                    </div>
                 ) : (
                    <div className="flex flex-col items-center gap-4 text-center">
                       <div className="p-4 bg-slate-800 rounded-full border border-slate-700">
                          <Shield className="text-slate-500" size={48} />
                       </div>
                       <div>
                          <p className="text-lg font-bold text-slate-300">Unprotected</p>
                          <p className="text-xs text-slate-600 mt-1">Select an egress node to begin</p>
                       </div>
                    </div>
                 )}
              </div>

              <div className="space-y-4">
                 <div className="flex justify-between items-center p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-3">
                       <Zap size={16} className="text-amber-400" />
                       <span className="text-xs font-medium text-slate-300">Network Latency</span>
                    </div>
                    <span className="text-xs font-mono text-white">{vpnConnected ? '24ms' : '--'}</span>
                 </div>
                 <div className="flex justify-between items-center p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-3">
                       <Activity size={16} className="text-primary" />
                       <span className="text-xs font-medium text-slate-300">Throughput</span>
                    </div>
                    <span className="text-xs font-mono text-white">{vpnConnected ? '850 Mbps' : '--'}</span>
                 </div>
              </div>

              {selectedServer && (
                 <button 
                   onClick={() => handleConnect(selectedServer)}
                   disabled={isConnecting}
                   className={`w-full py-4 rounded-2xl font-bold text-sm transition-all shadow-xl flex items-center justify-center gap-3 ${
                     vpnConnected 
                     ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20' 
                     : 'bg-sky-500 text-slate-950 hover:bg-sky-400'
                   }`}
                 >
                    {isConnecting ? <Loader2 className="animate-spin" /> : vpnConnected ? <ShieldOff size={18} /> : <Zap size={18} />}
                    {isConnecting ? 'Protocol Sync...' : vpnConnected ? 'Collapse Tunnel' : 'Establish Connection'}
                 </button>
              )}
           </div>
        </div>

        {/* Global Node Registry */}
        <div className="lg:col-span-2 space-y-6">
           <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2">
                 <Globe className="text-slate-500" size={18} /> Available Egress Nodes
              </h3>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                 <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Optimized Route
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {servers.map((server) => (
                 <m.div 
                   key={server.id}
                   whileHover={{ y: -2 }}
                   onClick={() => !isConnecting && !vpnConnected && setSelectedServer(server)}
                   className={`p-5 rounded-2xl border transition-all cursor-pointer group flex items-center justify-between ${
                     selectedServer?.id === server.id 
                     ? 'bg-sky-500/10 border-sky-500/30' 
                     : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                   }`}
                 >
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                          <Server size={18} className="text-slate-400 group-hover:text-primary" />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-slate-200">{server.country}</p>
                          <p className="text-[10px] font-mono text-slate-500">{server.name}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{server.latency}ms</p>
                          <div className="w-12 h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                             <div 
                               className={`h-full rounded-full ${server.latency < 40 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                               style={{ width: `${Math.max(10, 100 - server.latency)}%` }}
                             ></div>
                          </div>
                       </div>
                       <ChevronRight size={14} className="text-slate-600" />
                    </div>
                 </m.div>
              ))}
           </div>

           <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex gap-4">
              <AlertTriangle className="text-amber-500 shrink-0" size={20} />
              <p className="text-[11px] text-amber-500/80 leading-relaxed font-medium">
                 <span className="font-bold text-amber-500 block mb-1 uppercase tracking-widest">Protocol Warning</span>
                 Encrypted tunnels may experience minor throughput degradation due to cryptographic overhead. Use low-latency nodes for bandwidth-intensive telemetry.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default VPN;
