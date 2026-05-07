import React, { useState, useEffect } from 'react';

import {Network, Server, Smartphone, Laptop, Activity, Shield, Zap, Globe, Search, Filter, Info, RefreshCcw, X} from 'lucide-react';
import {networksApi, devicesApi} from '../api';

const Topology = () => {
  const [networks, setNetworks] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [inspectingNode, setInspectingNode] = useState(null);
  const [packetData, setPacketData] = useState([]);

  const fetchTopology = async () => {
    setLoading(true);
    try {
      const [netRes, devRes] = await Promise.all([
        networksApi.list(),
        devicesApi.list()
      ]);
      setNetworks(Array.isArray(netRes.data) ? netRes.data : []);
      setDevices(Array.isArray(devRes.data) ? devRes.data : []);
    } catch (err) {
      console.error("Topology fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopology();
  }, []);

  const getDeviceIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'server': return <Server className="text-sky-400" size={20} />;
      case 'smartphone': return <Smartphone className="text-amber-400" size={20} />;
      default: return <Laptop className="text-slate-400" size={20} />;
    }
  };

  const startPacketCapture = (node) => {
    setInspectingNode(node);
    // Generate simulated hex data
    const hex = [];
    for (let i = 0; i < 16; i++) {
      const row = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0'));
      hex.push(row.join(' '));
    }
    setPacketData(hex);
  };

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3 tracking-tight">
            <Network className="text-primary" size={28} />
            Structural Topology
          </h2>
          <p className="text-slate-500 text-sm mt-1">Hierarchical mapping of nodes, gateways, and mesh interfaces.</p>
        </div>
        <button 
          onClick={fetchTopology}
          className="p-2 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors text-slate-400"
        >
          <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex-1 glass-panel p-10 relative overflow-hidden flex flex-col items-center justify-center min-h-[600px] border-slate-800">
         {/* Background Grid */}
         <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:40px_40px] opacity-20"></div>
         
         <div className="relative z-10 w-full max-w-4xl space-y-20">
            {/* Gateway Layer */}
            <div className="flex justify-center">
               <div 
                 className="flex flex-col items-center group cursor-pointer animate-fade-in"
               >
                  <div className="w-24 h-24 rounded-3xl bg-primary/10 border-2 border-primary/30 flex items-center justify-center shadow-[0_0_30px_rgba(56,189,248,0.2)] group-hover:bg-primary/20 transition-all">
                     <Globe size={40} className="text-primary" />
                  </div>
                  <div className="mt-4 text-center">
                     <p className="text-xs font-bold text-white uppercase tracking-widest">Main Gateway</p>
                     <p className="text-[10px] font-mono text-slate-500">192.168.1.1</p>
                  </div>
                  {/* Connection Line */}
                  <div className="w-px h-16 bg-gradient-to-b from-primary/50 to-transparent"></div>
               </div>
            </div>

            {/* Network Clusters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
               {networks.map((net, nIdx) => (
                  <div 
                    key={net.id}
                    className="space-y-12 animate-fade-in"
                  >
                     <div className="flex flex-col items-center group cursor-pointer">
                        <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center group-hover:border-primary/50 transition-all relative">
                           <Activity size={32} className="text-slate-500 group-hover:text-primary transition-colors" />
                           <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0a0f1d] animate-pulse"></div>
                        </div>
                        <div className="mt-4 text-center">
                           <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">{net.name}</p>
                           <p className="text-[10px] font-mono text-slate-500">{net.range_cidr}</p>
                        </div>
                        {/* Downward Lines to Devices */}
                        <div className="w-px h-10 bg-slate-800"></div>
                     </div>

                     <div className="flex flex-wrap justify-center gap-6">
                        {devices.filter(d => d.network === net.id).slice(0, 3).map((device, dIdx) => (
                           <div 
                             key={device.id}
                             className="flex flex-col items-center gap-2 cursor-pointer group hover:translate-y-[-5px] transition-all"
                             onClick={() => setSelectedNode(device)}
                           >
                              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl group-hover:border-slate-600 transition-all">
                                 {getDeviceIcon(device.type)}
                              </div>
                              <p className="text-[9px] font-mono text-slate-600 group-hover:text-slate-400 transition-colors">{device.ip_address ? device.ip_address.split('.').pop() : '?'}</p>
                           </div>
                        ))}
                        {devices.filter(d => d.network === net.id).length > 3 && (
                           <div className="w-10 h-10 rounded-full border border-dashed border-slate-800 flex items-center justify-center text-[10px] text-slate-600">
                              +{devices.filter(d => d.network === net.id).length - 3}
                           </div>
                        )}
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* Node Detail HUD */}
         {selectedNode && (
            <div 
              className="absolute right-8 top-8 w-64 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-2xl z-20 animate-slide-in-right"
            >
               <button 
                 onClick={() => setSelectedNode(null)}
                 className="absolute top-4 right-4 text-slate-500 hover:text-white"
               >
                  <X size={14} />
               </button>
               <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/10 rounded-lg">
                     {getDeviceIcon(selectedNode.type)}
                  </div>
                  <div>
                     <p className="text-xs font-bold text-white uppercase truncate">{selectedNode.name || 'Node Details'}</p>
                     <p className="text-[10px] font-mono text-slate-500">{selectedNode.ip_address}</p>
                  </div>
               </div>
               
               <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold">
                     <span className="text-slate-500">Status</span>
                     <span className="text-emerald-400">Synchronized</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold">
                     <span className="text-slate-500">Traffic</span>
                     <span className="text-slate-300">{selectedNode.traffic_usage || '0.4'} GB</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold">
                     <span className="text-slate-500">Security</span>
                     <span className="text-sky-400">Hardened</span>
                  </div>
               </div>
               
                <button 
                  onClick={() => startPacketCapture(selectedNode)}
                  className="w-full mt-6 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary/20 transition-all"
                >
                   Deep Packet Scan
                </button>
            </div>
         )}

         {/* Packet Inspection Overlay */}
         {inspectingNode && (
           <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-8 animate-fade-in">
             <div className="w-full max-w-4xl bg-[#0a0f1d] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[80%]">
               <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                 <div className="flex items-center gap-4">
                   <div className="p-3 bg-sky-500/10 rounded-2xl">
                     <Search className="text-sky-400" size={24} />
                   </div>
                   <div>
                     <h3 className="text-lg font-bold text-white tracking-tight">Packet Capture Registry</h3>
                     <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Target: {inspectingNode.ip_address} • Interface: eth0 • Live Feed</p>
                   </div>
                 </div>
                 <button onClick={() => setInspectingNode(null)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                   <X size={20} className="text-slate-500" />
                 </button>
               </div>
               
               <div className="flex-1 overflow-auto p-6 font-mono text-[11px] leading-relaxed">
                 <div className="space-y-1">
                   {packetData.map((row, idx) => (
                     <div key={idx} className="flex gap-8 group hover:bg-sky-500/5 transition-colors p-1 rounded">
                       <span className="text-slate-600">{(idx * 16).toString(16).padStart(8, '0')}</span>
                       <span className="text-sky-400/80">{row}</span>
                       <span className="text-slate-400 border-l border-slate-800 pl-8">
                         {row.split(' ').map(h => {
                           const char = String.fromCharCode(parseInt(h, 16));
                           return /[\x20-\x7E]/.test(char) ? char : '.';
                         }).join('')}
                       </span>
                     </div>
                   ))}
                 </div>
               </div>

               <div className="p-6 border-t border-slate-800 bg-slate-900/30 flex justify-between items-center">
                 <div className="flex gap-4">
                   <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[9px] font-bold text-emerald-500 uppercase">TCP Handshake OK</div>
                   <div className="px-3 py-1 bg-sky-500/10 border border-sky-500/20 rounded-lg text-[9px] font-bold text-sky-400 uppercase">Payload Encrypted</div>
                 </div>
                 <div className="flex gap-3">
                   <button onClick={() => startPacketCapture(inspectingNode)} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">Re-scan</button>
                   <button className="px-6 py-2 bg-sky-500 text-slate-950 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-sky-400 transition-all">Export PCAP</button>
                 </div>
               </div>
             </div>
           </div>
         )}
      </div>

      <div className="flex items-center gap-6 p-6 glass-panel border-slate-800/50">
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(56,189,248,0.8)]"></div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Structural Link</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Node</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Anomaly Warning</span>
         </div>
      </div>
    </div>
  );
};

export default Topology;
