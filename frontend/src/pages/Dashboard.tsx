import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, ShieldCheck, Server, Globe, ArrowUpRight, ArrowDownRight, 
  Zap, ShieldAlert, Wifi, Lock, Shield, AlertTriangle, RefreshCw,
  Plus, MoreVertical, Smartphone, Monitor, Database, Map, Send, Info, Eye
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { networksApi, vpnApi, attackApi, devicesApi, transfersApi } from '../api';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import Topology from './Topology';

const Dashboard: React.FC<{ userType: 'ADMIN' | 'USER' }> = ({ userType }) => {
  const [networkStats, setNetworkStats] = useState<any>(null);
  const [vpnServers, setVpnServers] = useState<any[]>([]);
  const [activeVpn, setActiveVpn] = useState<any>(null);
  const [isVpnConnected, setIsVpnConnected] = useState(true);
  const [isAttacking, setIsAttacking] = useState(false);
  const [firewallLogs, setFirewallLogs] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [firewallEnabled, setFirewallEnabled] = useState(true);
  const [activeTransfer, setActiveTransfer] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await networksApi.getStats();
        setNetworkStats(statsRes.data);

        const vpnRes = await vpnApi.list();
        setVpnServers(vpnRes.data);
        if (vpnRes.data.length > 0 && !activeVpn) setActiveVpn(vpnRes.data[0]);

        const devRes = await devicesApi.list();
        setDevices(devRes.data);

        const transRes = await transfersApi.list();
        setTransfers(transRes.data);
        if (transRes.data.length > 0) setActiveTransfer(transRes.data[0]);

        if (userType === 'ADMIN') {
          const logsRes = await attackApi.logs();
          setFirewallLogs(logsRes.data);
        }
      } catch (err) {
        console.error("Dashboard fetch error", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [userType]);

  const handleToggleFirewall = async () => {
    if (userType !== 'ADMIN') return;
    const newState = !firewallEnabled;
    setFirewallEnabled(newState);
    try {
      await networksApi.toggleFirewall(newState);
    } catch (err) {
      console.error("Firewall toggle failed", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 🚀 Top Header Section */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Live</span>
          </div>
        </div>
      </div>

      {/* 📊 Stat Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard 
          title="Download" 
          value={networkStats?.total_data_usage ? `${(networkStats.total_data_usage / 1024).toFixed(1)} GB` : "125.6 Mbps"} 
          icon={ArrowDownRight} 
          color="sky" 
          trend="12%" 
          trendUp 
        />
        <StatCard 
          title="Upload" 
          value={networkStats?.active_devices ? `${networkStats.active_devices} Nodes` : "48.7 Mbps"} 
          icon={ArrowUpRight} 
          color="purple" 
          trend="5%" 
          trendUp 
        />
        <StatCard title="Ping" value="23 ms" icon={Activity} color="green" trend="-2ms" trendUp />
        <StatCard title="Jitter" value="6 ms" icon={Zap} color="amber" trend="1ms" trendUp />
        <StatCard 
          title="Packet Loss" 
          value={networkStats?.blocked_devices !== undefined ? `${networkStats.blocked_devices} Blocked` : "0.35%"} 
          icon={ShieldAlert} 
          color="rose" 
          trend="-0.02%" 
          trendUp 
        />
      </div>

      {/* 📉 Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-[#0a0f1d]/50 border border-slate-800/50 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500/50 to-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-sm font-bold">Bandwidth <span className="text-slate-500 font-normal text-[10px] ml-2 tracking-widest uppercase">(Real-time)</span></h3>
            </div>
            <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_8px_#38bdf8]"></div> Download</div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]"></div> Upload</div>
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={Array.from({length: 30}, (_, i) => ({ name: i, download: 80 + Math.random() * 50, upload: 30 + Math.random() * 30 }))}>
                <defs>
                  <linearGradient id="colorDownLarge" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorUpLarge" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.2} />
                <XAxis hide />
                <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }} />
                <Area type="monotone" dataKey="download" stroke="#38bdf8" strokeWidth={3} fill="url(#colorDownLarge)" />
                <Area type="monotone" dataKey="upload" stroke="#a855f7" strokeWidth={3} fill="url(#colorUpLarge)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-[#0a0f1d]/50 border border-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
          <h3 className="text-sm font-bold mb-8">Latency <span className="text-slate-500 font-normal text-[10px] ml-2 tracking-widest uppercase">(Real-time)</span></h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={Array.from({length: 30}, (_, i) => ({ name: i, ping: 20 + Math.random() * 25 }))}>
                <defs>
                  <linearGradient id="colorPingLarge" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.2} />
                <XAxis hide />
                <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                <Area type="monotone" dataKey="ping" stroke="#10b981" strokeWidth={3} fill="url(#colorPingLarge)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 📱 Middle Section (Devices, Transfer, VPN) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Devices Panel */}
        <div className="lg:col-span-3 bg-[#0a0f1d]/50 border border-slate-800/50 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-sm font-bold">Devices</h4>
            <div className="flex gap-2 text-[8px] font-bold uppercase tracking-widest">
               <span className="text-slate-500">Total <span className="text-slate-300">{devices.length}</span></span>
               <span className="text-emerald-400">Active <span className="text-emerald-300">{devices.filter(d => d.status === 'ACTIVE').length}</span></span>
            </div>
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {devices.slice(0, 6).map((device, i) => (
              <div key={device.id} className="flex items-center justify-between p-2 hover:bg-slate-800/30 rounded-xl transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-slate-900 border border-slate-800 ${device.status === 'ACTIVE' ? 'text-sky-400' : 'text-rose-400'}`}>
                    {device.type === 'Smartphone' ? <Smartphone size={14} /> : <Monitor size={14} />}
                  </div>
                  <div>
                    <p className="text-xs font-bold">{device.name || `Node ${device.id}`}</p>
                    <p className="text-[9px] text-slate-500 font-mono">{device.ip_address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <div className={`w-1 h-1 rounded-full ${device.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                   <span className={`text-[8px] font-bold uppercase tracking-widest ${device.status === 'ACTIVE' ? 'text-emerald-400' : 'text-rose-400'}`}>{device.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Transfer Panel (Large Animated) */}
        <div className="lg:col-span-5 bg-[#0a0f1d]/50 border border-slate-800/50 rounded-2xl p-5 backdrop-blur-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-sm font-bold">Data Transfer</h4>
            <button onClick={() => window.location.href='/transfers'} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-sky-500/10 border border-sky-500/20 text-sky-400 px-3 py-1.5 rounded-lg hover:bg-sky-500/20 transition-all">
              <Plus size={12} /> New Transfer
            </button>
          </div>
          
          <div className="flex items-center justify-around py-4">
             <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-sky-500/5 border border-sky-500/20 rounded-2xl flex items-center justify-center text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.1)]">
                   <Monitor size={32} />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold">{activeTransfer?.sender_ip || "Source node"}</p>
                  <p className="text-[8px] text-slate-500 font-mono">ESTABLISHED</p>
                </div>
             </div>

             <div className="flex-1 px-8 relative">
                <div className="h-0.5 bg-slate-800/50 w-full rounded-full"></div>
                <div className="absolute inset-0 flex justify-center items-center overflow-hidden">
                   {[1,2,3,4,5,6,7,8].map(i => (
                     <motion.div 
                       key={i}
                       animate={{ x: [-100, 100], opacity: [0, 1, 1, 0] }}
                       transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                       className="absolute w-1.5 h-1.5 bg-sky-400 rounded-full shadow-[0_0_8px_#38bdf8]"
                     ></motion.div>
                   ))}
                </div>
             </div>

             <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.1)]">
                   <Monitor size={32} />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold">{activeTransfer?.receiver_ip || "Destination node"}</p>
                  <p className="text-[8px] text-slate-500 font-mono">SYNCHRONIZED</p>
                </div>
             </div>
          </div>

          <div className="space-y-4 pt-6">
             <div className="grid grid-cols-5 gap-2 text-center border-t border-slate-800/50 pt-4">
                <div>
                   <p className="text-[8px] text-slate-500 font-bold uppercase mb-1">Bandwidth</p>
                   <p className="text-xs font-bold text-sky-400">{activeTransfer?.bandwidth ? `${activeTransfer.bandwidth.toFixed(1)} Mbps` : "78.6 Mbps"}</p>
                </div>
                <div>
                   <p className="text-[8px] text-slate-500 font-bold uppercase mb-1">Latency</p>
                   <p className="text-xs font-bold text-emerald-400">{activeTransfer?.latency ? `${activeTransfer.latency.toFixed(0)} ms` : "12 ms"}</p>
                </div>
                <div>
                   <p className="text-[8px] text-slate-500 font-bold uppercase mb-1">Throughput</p>
                   <p className="text-xs font-bold text-purple-400">{activeTransfer?.throughput ? `${activeTransfer.throughput.toFixed(1)} Mbps` : "72.4 Mbps"}</p>
                </div>
                <div>
                   <p className="text-[8px] text-slate-500 font-bold uppercase mb-1">Loss</p>
                   <p className="text-xs font-bold text-rose-400">{activeTransfer?.packet_loss ? `${activeTransfer.packet_loss.toFixed(2)}%` : "0.12%"}</p>
                </div>
                <div>
                   <p className="text-[8px] text-slate-500 font-bold uppercase mb-1">ETA</p>
                   <p className="text-xs font-bold text-amber-400 font-mono">00:00:24</p>
                </div>
             </div>
             
             <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[8px] font-bold">
                   <span className="text-slate-400 uppercase tracking-widest">Data Transferring...</span>
                   <span className="text-sky-400 uppercase tracking-widest">68% Complete</span>
                </div>
                <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                   <motion.div 
                     animate={{ width: '68%' }}
                     className="h-full bg-gradient-to-r from-sky-500 to-emerald-500"
                   ></motion.div>
                </div>
             </div>
          </div>
        </div>

        {/* VPN Panel */}
        <div className="lg:col-span-4 bg-[#0a0f1d]/50 border border-slate-800/50 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-sm font-bold flex items-center gap-2"><Globe size={18} className="text-sky-400" /> VPN Status</h4>
            <div className="flex items-center gap-3">
               <button onClick={() => window.location.href='/vpn'} className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${isVpnConnected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                  {isVpnConnected ? 'Active' : 'Offline'}
               </button>
            </div>
          </div>
          
          <div className="space-y-4">
             <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-2xl">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Primary Gateway</p>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-sky-500/5 border border-sky-500/20 rounded-xl flex items-center justify-center text-xl">🇺🇸</div>
                      <div>
                         <p className="text-xs font-bold">United States</p>
                         <p className="text-[9px] text-slate-500">New York, NY</p>
                      </div>
                   </div>
                   <span className="text-[10px] font-mono text-emerald-400">23 ms</span>
                </div>
             </div>
             
             <button 
               onClick={() => window.location.href='/vpn'}
               className="w-full bg-slate-800/50 hover:bg-slate-800 border border-slate-700 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
             >
                Manage VPN Nodes →
             </button>
          </div>
        </div>
      </div>

      {/* 🛡️ Bottom Section (Firewall, Topology, Map) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Firewall Panel */}
        <div className="lg:col-span-4 bg-[#0a0f1d]/50 border border-slate-800/50 rounded-2xl p-5 backdrop-blur-sm">
           <div className="flex justify-between items-center mb-6">
             <h4 className="text-sm font-bold flex items-center gap-2">Firewall <span className={`text-[8px] px-2 py-0.5 rounded-full border ${firewallEnabled ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>{firewallEnabled ? 'ON' : 'OFF'}</span></h4>
             {userType === 'ADMIN' && (
               <div 
                 onClick={handleToggleFirewall}
                 className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors flex ${firewallEnabled ? 'bg-emerald-500/20 border-emerald-500/30 justify-end' : 'bg-slate-800 border-slate-700 justify-start'} border`}
               >
                  <motion.div layout className={`w-3.5 h-3.5 rounded-full ${firewallEnabled ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-slate-500'}`} />
               </div>
             )}
           </div>

           <div className="flex items-center gap-6 mb-8">
              <div className="relative">
                 <div className={`w-20 h-20 border rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(52,211,153,0.1)] ${firewallEnabled ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/5 border-rose-500/20 text-rose-400'}`}>
                    <Shield size={40} />
                 </div>
                 <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center border-4 border-[#0a0f1d] ${firewallEnabled ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                    <ShieldCheck size={12} className="text-white" />
                 </div>
              </div>
              <div className="space-y-4 flex-1">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                       <span className="text-[9px] text-slate-400 font-bold uppercase">Allowed</span>
                    </div>
                    <span className="text-xs font-bold">{networkStats?.total_data_usage ? `${(networkStats.total_data_usage * 0.8 / 1024).toFixed(2)} TB` : "2.45 TB"}</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                       <span className="text-[9px] text-slate-400 font-bold uppercase">Blocked</span>
                    </div>
                    <span className="text-xs font-bold text-rose-400">{networkStats?.total_data_usage ? `${(networkStats.total_data_usage * 0.2 / 1024).toFixed(2)} GB` : "320.45 GB"}</span>
                 </div>
              </div>
           </div>

           <div className="space-y-3 pt-6 border-t border-slate-800/50">
              <div className="flex justify-between items-center text-[10px] mb-2">
                 <p className="text-slate-500 font-bold uppercase tracking-widest">Impact Analysis <span className="text-[8px] font-normal lowercase">(vs last 24h)</span></p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800/50">
                    <p className="text-[8px] text-slate-500 font-bold uppercase mb-1">Latency</p>
                    <p className="text-xs font-bold text-rose-400">+12%</p>
                 </div>
                 <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800/50">
                    <p className="text-[8px] text-slate-500 font-bold uppercase mb-1">Throughput</p>
                    <p className="text-xs font-bold text-rose-400">-8%</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Topology Graph Panel */}
        <div className="lg:col-span-4 bg-[#0a0f1d]/50 border border-slate-800/50 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden h-[340px]">
           <div className="flex justify-between items-center mb-6">
             <h4 className="text-sm font-bold">Network Topology</h4>
             <div className="flex gap-3">
                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> <span className="text-[8px] text-slate-500 font-bold uppercase">Active</span></div>
                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div> <span className="text-[8px] text-slate-500 font-bold uppercase">Blocked</span></div>
             </div>
           </div>
           
           <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
              <Topology />
           </div>

           <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
              <div onClick={() => window.location.href='/topology'} className="p-1.5 bg-slate-800/80 rounded-lg cursor-pointer hover:bg-slate-700 border border-slate-700 transition-all"><Eye size={14} className="text-slate-300" /></div>
           </div>
        </div>

        {/* Recent Events & Connection Map */}
        <div className="lg:col-span-4 flex flex-col gap-6">
           <div className="flex-1 bg-[#0a0f1d]/50 border border-slate-800/50 rounded-2xl p-5 backdrop-blur-sm overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                 <h4 className="text-sm font-bold flex items-center gap-2"><ShieldAlert size={16} className="text-rose-400" /> Recent Firewall Events</h4>
                 <button onClick={() => window.location.href='/firewall'} className="text-[9px] font-bold uppercase text-slate-500 hover:text-slate-300">Detailed View</button>
              </div>
              <div className="space-y-2">
                 {firewallLogs.length > 0 ? firewallLogs.slice(0, 5).map((log, i) => (
                   <div key={log.id} className="flex items-center justify-between p-2 hover:bg-slate-800/20 rounded-lg transition-colors group">
                      <div className="flex items-center gap-2">
                         <div className={`p-1 rounded-md ${log.action === 'BLOCK' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                            {log.action === 'BLOCK' ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
                         </div>
                         <p className={`text-[10px] font-bold ${log.action === 'BLOCK' ? 'text-rose-400' : 'text-emerald-400'}`}>{log.action}</p>
                         <p className="text-[10px] text-slate-300 font-mono">{log.source_ip}</p>
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono group-hover:text-slate-400">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                   </div>
                 )) : (
                    <div className="flex flex-col items-center justify-center py-10 opacity-50">
                       <ShieldCheck size={24} className="text-slate-500 mb-2" />
                       <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">No recent incidents</p>
                    </div>
                 )}
              </div>
           </div>

           <div className="h-[180px] bg-[#0a0f1d]/50 border border-slate-800/50 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden">
              <div className="flex justify-between items-center mb-4 relative z-10">
                 <h4 className="text-sm font-bold">Connected</h4>
                 <span className="text-[10px] font-mono text-slate-500 tracking-tighter">00:02:15</span>
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                 <Map className="w-full h-full p-4" />
              </div>
              <div className="relative z-10 space-y-4">
                 <div className="flex justify-between items-end">
                    <div>
                       <p className="text-[8px] text-slate-500 font-bold uppercase mb-1">Local Identity</p>
                       <p className="text-xs font-mono text-rose-400">{devices[0]?.ip_address || "127.0.0.1"}</p>
                    </div>
                    <div className="flex-1 px-4 mb-1">
                       <div className="h-px bg-gradient-to-r from-rose-500/50 to-emerald-500/50 relative">
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]"></div>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[8px] text-slate-500 font-bold uppercase mb-1">Public Gateway</p>
                       <p className="text-xs font-mono text-emerald-400">198.51.100.24</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* 🚀 Simulation Controls floating button for Admin */}
      {userType === 'ADMIN' && (
        <div className="fixed bottom-8 right-8 z-40 group">
           <div className="absolute bottom-full right-0 mb-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2 pointer-events-none group-hover:pointer-events-auto">
              <button onClick={() => {}} className="bg-[#0f172a] border border-slate-800 text-xs text-slate-400 hover:text-white px-4 py-2 rounded-xl backdrop-blur-xl">Simulate DDoS</button>
              <button onClick={() => {}} className="bg-[#0f172a] border border-slate-800 text-xs text-slate-400 hover:text-white px-4 py-2 rounded-xl backdrop-blur-xl">Port Scan</button>
           </div>
           <button 
             className="w-14 h-14 bg-rose-500 rounded-2xl shadow-[0_0_30px_rgba(244,63,94,0.3)] flex items-center justify-center text-white hover:scale-110 hover:rotate-12 transition-all relative overflow-hidden"
           >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
              <AlertTriangle size={24} className="relative z-10" />
           </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
