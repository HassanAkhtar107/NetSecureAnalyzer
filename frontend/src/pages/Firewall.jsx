import React, { useState, useEffect } from 'react';
import {motion as m, AnimatePresence} from 'framer-motion';
import {
  Shield, ShieldOff, AlertTriangle, Activity, Lock, Globe, 
  Search, Filter, ChevronDown, CheckCircle2, XCircle, Clock, 
  Zap, Info, ExternalLink, ArrowRight, Save, Trash2, Plus
} from 'lucide-react';
import {firewallApi} from '../api';
import {toast} from 'sonner';

const Firewall = () => {
  const [logs, setLogs] = useState([]);
  const [isProtectionActive, setIsProtectionActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    try {
      const res = await firewallApi.logs();
      if (Array.isArray(res.data)) {
        setLogs(res.data);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error("Firewall logs error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  const toggleProtection = async () => {
    try {
      const res = await firewallApi.toggle();
      setIsProtectionActive(res.data.is_active);
      toast.success(`Packet Filtering ${res.data.is_active ? 'Activated' : 'Suspended'}`);
    } catch (err) {
      toast.error("Security core communication failure");
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3 tracking-tight">
            <Shield className="text-rose-400" size={28} />
            Deep Packet Inspection Core
          </h2>
          <p className="text-slate-500 text-sm mt-1">Real-time heuristics and threat neutralization engine.</p>
        </div>
        <button 
          onClick={toggleProtection}
          className={`px-8 py-3 rounded-2xl font-bold text-sm transition-all shadow-xl flex items-center gap-3 ${
            isProtectionActive 
            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20' 
            : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
          }`}
        >
          {isProtectionActive ? <ShieldOff size={18} /> : <Shield size={18} />}
          {isProtectionActive ? 'Suspend Protection' : 'Activate Defense'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         {/* Live Metrics */}
         <div className="lg:col-span-1 space-y-4">
            <div className="glass-panel p-6 border-slate-800">
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                     <Activity size={18} className="text-emerald-400" />
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Inspection Rate</span>
               </div>
               <h3 className="text-2xl font-bold">482 <span className="text-xs font-normal text-slate-500">pkt/sec</span></h3>
            </div>
            <div className="glass-panel p-6 border-slate-800">
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                     <AlertTriangle size={18} className="text-amber-400" />
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Heuristic Alerts</span>
               </div>
               <h3 className="text-2xl font-bold">14 <span className="text-xs font-normal text-slate-500">last hour</span></h3>
            </div>
            <div className="glass-panel p-6 border-rose-500/20 bg-rose-500/[0.02]">
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-rose-500/10 rounded-lg">
                     <Lock size={18} className="text-rose-400" />
                  </div>
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">Nodes Blocked</span>
               </div>
               <h3 className="text-2xl font-bold text-rose-400">3</h3>
            </div>
         </div>

         {/* Intercept Logs */}
         <div className="lg:col-span-3 glass-panel p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
               <h3 className="text-lg font-bold">Heuristic Event Log</h3>
               <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                  <input 
                    type="text" 
                    placeholder="Search source IP..."
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs focus:border-rose-500/30 outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
            </div>

            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-4">
                        <th className="px-4 py-3">Timestamp</th>
                        <th className="px-4 py-3">Source Interface</th>
                        <th className="px-4 py-3">Classification</th>
                        <th className="px-4 py-3 text-right">Action Taken</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                     {logs.filter(l => l.source_ip.includes(searchTerm)).map((log, idx) => (
                        <m.tr 
                          key={idx}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="group hover:bg-slate-800/20"
                        >
                           <td className="px-4 py-4 text-[10px] font-mono text-slate-500">
                              {new Date(log.timestamp).toLocaleTimeString()}
                           </td>
                           <td className="px-4 py-4">
                              <p className="text-xs font-bold text-slate-200">{log.source_ip}</p>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">{log.reason || 'Anomalous traffic pattern detected'}</p>
                           </td>
                           <td className="px-4 py-4">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                                log.action === 'BLOCK' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                              }`}>
                                 {log.action === 'BLOCK' ? 'Malicious' : 'Permitted'}
                              </span>
                           </td>
                           <td className="px-4 py-4 text-right">
                              <div className="flex items-center justify-end gap-2 text-slate-400">
                                 {log.action === 'BLOCK' ? <XCircle size={14} className="text-rose-500" /> : <CheckCircle2 size={14} className="text-emerald-500" />}
                                 <span className="text-[10px] font-bold uppercase">{log.action === 'BLOCK' ? 'Dropped' : 'Forwarded'}</span>
                              </div>
                           </td>
                        </m.tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Firewall;
