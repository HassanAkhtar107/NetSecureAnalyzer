import React, { useState, useEffect } from 'react';

import {
  Activity, Shield, ShieldOff, Server, Globe, Zap, AlertTriangle, 
  ArrowUpRight, ArrowDownLeft, Lock, Info, ExternalLink, 
  Wifi, HardDrive, Cpu, Database, ChevronRight, Clock, Map, Filter, Search, Send
} from 'lucide-react';
import {AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell} from 'recharts';
import {useNavigate} from 'react-router-dom';
import {useNetwork} from '../context/NetworkContext';
import {networksApi, devicesApi, firewallApi} from '../api';

const Dashboard = ({ userType }) => {
  const navigate = useNavigate();
  const { activeConnections, blockedToday, uptime, firewallOn, devices } = useNetwork();
  
  const [networks, setNetworks] = useState([]);
  const [firewallLogs, setFirewallLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [netRes, fireRes] = await Promise.all([
          networksApi.list(),
          firewallApi.logs()
        ]);
        setNetworks(netRes.data || []);
        if (Array.isArray(fireRes.data)) {
          setFirewallLogs(fireRes.data.slice(0, 5));
        }
      } catch (err) {
        console.error("Dashboard fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Stats Card Component
  const StatCard = ({ icon: Icon, label, value, trend, color }) => (
    <div 
      className="glass-panel p-6 relative overflow-hidden group border-slate-800 hover:translate-y-[-5px] transition-transform"
    >
      <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/5 blur-3xl -mr-12 -mt-12 group-hover:bg-${color}-500/10 transition-colors`}></div>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 bg-${color}-500/10 text-${color}-400 rounded-2xl group-hover:scale-110 transition-transform`}>
          <Icon size={22} />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            <ArrowUpRight size={10} /> {trend}
          </div>
        )}
      </div>
      <div>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Network Command Center
            <span className="text-[10px] font-bold bg-primary/20 text-primary px-2 py-1 rounded-full uppercase tracking-widest border border-primary/30">
              {userType === 'ADMIN' ? 'Localhost Instance' : 'Assigned Network'}
            </span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">Real-time heuristics and threat intelligence monitoring.</p>
        </div>
        <div className="flex gap-3">
           <button className="glass-panel px-4 py-2 text-xs font-bold uppercase tracking-widest hover:border-primary/50 transition-colors flex items-center gap-2">
             <Filter size={14} /> Analysis Range
           </button>
           <button className="bg-primary text-slate-950 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-primary/80 transition-colors">
             Export Telemetry
           </button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Activity} 
          label="Active Connections" 
          value={activeConnections} 
          trend="+12%" 
          color="sky" 
        />
        <StatCard 
          icon={ShieldOff} 
          label="Threats Neutralized" 
          value={blockedToday} 
          trend="+4.3%" 
          color="rose" 
        />
        <StatCard 
          icon={Database} 
          label="Data Throughput" 
          value={`${(Math.random() * 100).toFixed(1)} GB`} 
          trend="+21%" 
          color="emerald" 
        />
        <StatCard 
          icon={Clock} 
          label="System Uptime" 
          value={uptime} 
          color="amber" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Network Traffic Flow */}
        <div className="lg:col-span-2 glass-panel p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold">Traffic Heuristics</h3>
              <p className="text-xs text-slate-500 mt-0.5">Real-time bitstream analysis across network interfaces.</p>
            </div>
            <div className="flex gap-2">
               <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/50 shadow-[0_0_8px_rgba(56,189,248,0.5)]"></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Incoming</span>
               </div>
               <div className="flex items-center gap-1.5 ml-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Outgoing</span>
               </div>
            </div>
          </div>
          
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={Array.from({ length: 30 }, (_, i) => ({ name: i, download: 80 + Math.random() * 50, upload: 30 + Math.random() * 30 }))}>
                <defs>
                  <linearGradient id="colorDownload" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorUpload" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                />
                <Area type="monotone" dataKey="download" stroke="#38bdf8" strokeWidth={3} fillOpacity={1} fill="url(#colorDownload)" />
                <Area type="monotone" dataKey="upload" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorUpload)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active Nodes List */}
        <div className="glass-panel p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">Network Nodes</h3>
            <button 
              onClick={() => navigate('/devices')}
              className="text-xs font-bold text-primary hover:text-sky-400 transition-colors uppercase tracking-widest flex items-center gap-1"
            >
              All Nodes <ChevronRight size={14} />
            </button>
          </div>
          
          <div className="space-y-4 flex-1">
            {devices.slice(0, 5).map((device, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-800/50 hover:border-slate-700 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-primary/10 transition-colors">
                    <Cpu size={16} className="text-slate-400 group-hover:text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200">{device.name || 'Unlabeled Node'}</p>
                    <p className="text-[10px] font-mono text-slate-500">{device.ip_address}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Active</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">84 ms latency</p>
                </div>
              </div>
            ))}
          </div>
          
          <button 
            onClick={() => navigate('/data-transfer')}
            className="w-full mt-6 py-3 bg-slate-900 text-slate-400 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-slate-800 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <Send size={14} /> Initiate Transfer
          </button>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Firewall Logs */}
        <div className="glass-panel p-8">
           <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-rose-500/10 rounded-lg">
                    <Shield size={20} className="text-rose-400" />
                 </div>
                 <h3 className="text-lg font-bold">Firewall Intercepts</h3>
              </div>
              <button 
                onClick={() => userType === 'ADMIN' && navigate('/firewall')}
                className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
              >
                View Security Logs
              </button>
           </div>
           
           <div className="space-y-3">
              {Array.isArray(firewallLogs) && firewallLogs.length > 0 ? firewallLogs.map((log, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-rose-500/[0.03] rounded-xl border border-rose-500/10">
                   <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center">
                         <AlertTriangle size={14} className="text-rose-400" />
                      </div>
                      <div>
                         <p className="text-xs font-bold text-rose-400 uppercase tracking-widest">{log.action || 'BLOCKED'}</p>
                         <p className="text-[10px] font-mono text-slate-500 mt-0.5">Packet dropped from {log.source_ip}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">High Intensity</p>
                      <p className="text-[10px] text-slate-600 font-mono">14:02:55.32</p>
                   </div>
                </div>
              )) : (
                <div className="py-10 text-center opacity-30">
                   <ShieldOff size={32} className="mx-auto mb-2" />
                   <p className="text-[10px] font-bold uppercase tracking-widest">No recent intercepts recorded</p>
                </div>
              )}
           </div>
        </div>

        {/* Global Network Latency Map (Placeholder Visual) */}
        <div className="glass-panel p-8 relative overflow-hidden group">
           <div className="absolute inset-0 bg-primary/[0.02] opacity-50 group-hover:opacity-100 transition-opacity"></div>
           <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-primary/10 rounded-lg">
                    <Globe size={20} className="text-primary" />
                 </div>
                 <h3 className="text-lg font-bold">VPN Ingress Nodes</h3>
              </div>
              
              <div className="flex-1 flex items-center justify-center">
                 <div className="relative w-48 h-48">
                    <div className="absolute inset-0 border-2 border-primary/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
                    <div className="absolute inset-4 border-2 border-primary/10 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                       <Map size={48} className="text-primary opacity-20" />
                    </div>
                    {/* Pulsing Dots */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full shadow-[0_0_15px_rgba(56,189,248,1)]"></div>
                    <div className="absolute bottom-10 left-0 w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,1)]"></div>
                    <div className="absolute top-20 right-0 w-2 h-2 bg-amber-400 rounded-full shadow-[0_0_10px_rgba(251,191,36,1)]"></div>
                 </div>
              </div>
              
              <div className="mt-6 flex justify-around text-center">
                 <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">USA West</p>
                    <p className="text-xs font-bold text-primary">12 ms</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">UK London</p>
                    <p className="text-xs font-bold text-emerald-400">42 ms</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">EU Frankfurt</p>
                    <p className="text-xs font-bold text-amber-400">38 ms</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
