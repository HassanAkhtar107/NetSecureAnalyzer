import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldAlert, ShieldCheck, Filter, Search, Download, Clock } from 'lucide-react';
import { attackApi } from '../api';

const Firewall: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await attackApi.logs();
        setLogs(res.data);
      } catch (err) {
        console.error("Failed to fetch firewall logs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(log => 
    log.source_ip.includes(searchTerm) || 
    log.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Shield className="text-sky-400" size={28} />
            Firewall Intelligence
          </h2>
          <p className="text-slate-500 text-sm mt-1">Real-time monitoring and threat analysis of network traffic.</p>
        </div>
        <div className="flex gap-3">
           <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-all">
              <Download size={14} /> Export Logs
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 flex flex-col items-center justify-center text-center space-y-3">
           <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck size={24} />
           </div>
           <div>
              <p className="text-2xl font-bold">{logs.filter(l => l.action === 'ALLOW').length}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Safe Connections</p>
           </div>
        </div>
        <div className="glass-panel p-6 flex flex-col items-center justify-center text-center space-y-3">
           <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <ShieldAlert size={24} />
           </div>
           <div>
              <p className="text-2xl font-bold text-rose-400">{logs.filter(l => l.action === 'BLOCK' || l.action === 'ATTACK_DETECTED').length}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Blocked Threats</p>
           </div>
        </div>
        <div className="glass-panel p-6 flex flex-col items-center justify-center text-center space-y-3">
           <div className="w-12 h-12 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Clock size={24} />
           </div>
           <div>
              <p className="text-2xl font-bold">99.9%</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Protection Uptime</p>
           </div>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-slate-800/50 flex flex-col md:flex-row gap-4 items-center justify-between">
           <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Search by IP or reason..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-sky-500/50"
              />
           </div>
           <div className="flex gap-2">
              <button className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-500 hover:text-white transition-all"><Filter size={16} /></button>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800/50 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Source IP</th>
                <th className="px-6 py-4">Event Type / Reason</th>
                <th className="px-6 py-4">Impact</th>
                <th className="px-6 py-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-20 text-slate-600 font-bold uppercase tracking-widest">Scanning protocols...</td></tr>
              ) : filteredLogs.length > 0 ? filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/20 transition-colors group">
                  <td className="px-6 py-4">
                    <div className={`flex items-center gap-2 ${log.action === 'BLOCK' || log.action === 'ATTACK_DETECTED' ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {log.action === 'BLOCK' || log.action === 'ATTACK_DETECTED' ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
                      <span className="text-[10px] font-bold uppercase tracking-widest">{log.action}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-slate-300">{log.source_ip}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-400 max-w-xs truncate">{log.reason}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       {log.latency_impact ? <span className="text-[10px] text-rose-400 font-mono">+{log.latency_impact}ms</span> : <span className="text-[10px] text-emerald-400 font-mono">-0.2ms</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[10px] text-slate-500 font-mono">{new Date(log.timestamp).toLocaleString()}</p>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="text-center py-20 text-slate-600 font-bold uppercase tracking-widest">No matching security events</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Firewall;
