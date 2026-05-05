import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Server, Activity, Zap, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { transfersApi, devicesApi } from '../api';

const Transfers: React.FC<{ userType: 'ADMIN' | 'USER' }> = ({ userType }) => {
  const [isTransferring, setIsTransferring] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({ speed: '0 MB/s', latency: '0ms', loss: '0%' });
  const [devices, setDevices] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedDest, setSelectedDest] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const devRes = await devicesApi.list();
        setDevices(devRes.data);
        if (devRes.data.length > 0 && !selectedSource) {
          setSelectedSource(devRes.data[0].id);
          if (devRes.data.length > 1) setSelectedDest(devRes.data[1].id);
        }

        const transRes = await transfersApi.list();
        setTransfers(transRes.data);
      } catch (err) {
        console.error("Failed to fetch transfer data", err);
      }
    };
    fetchData();
  }, []);

  const startTransfer = async () => {
    if (!selectedSource || !selectedDest) return;
    setIsTransferring(true);
    setProgress(0);
    
    try {
      await transfersApi.create({
        sender_device: selectedSource,
        receiver_device: selectedDest,
        simulate: true // Request backend to simulate stats
      });
    } catch (err) {
      console.error("Transfer creation failed", err);
    }
  };

  useEffect(() => {
    if (isTransferring && progress < 100) {
      const timer = setTimeout(() => {
        setProgress(prev => Math.min(prev + Math.random() * 5, 100));
        setStats({
          speed: (Math.random() * 50 + 20).toFixed(1) + ' MB/s',
          latency: (Math.random() * 30 + 10).toFixed(0) + 'ms',
          loss: (Math.random() * 0.5).toFixed(2) + '%'
        });
      }, 200);
      return () => clearTimeout(timer);
    } else if (progress >= 100) {
      setTimeout(() => setIsTransferring(false), 2000);
    }
  }, [isTransferring, progress]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Selection Area */}
        <div className="glass-panel p-8 space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Send size={20} className="text-sky-400" />
            Initiate Data Transfer
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Source Device</label>
              <select 
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sky-500/50"
              >
                {devices.map(d => (
                  <option key={d.id} value={d.id}>{d.name || d.ip_address} ({d.ip_address})</option>
                ))}
              </select>
            </div>

            <div className="flex justify-center py-2">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                <Activity size={16} className="text-slate-500" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Destination Device</label>
              <select 
                value={selectedDest}
                onChange={(e) => setSelectedDest(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sky-500/50"
              >
                {devices.map(d => (
                  <option key={d.id} value={d.id}>{d.name || d.ip_address} ({d.ip_address})</option>
                ))}
              </select>
            </div>
          </div>

          <button 
            onClick={startTransfer}
            disabled={isTransferring}
            className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-3 ${
              isTransferring ? 'bg-slate-800 text-slate-500' : 'bg-sky-500 text-slate-950 hover:bg-sky-400 hover:shadow-lg hover:shadow-sky-500/20'
            }`}
          >
            <Zap size={20} />
            {isTransferring ? 'Transferring Protocols...' : 'Start Secure Transfer'}
          </button>
          
          <p className="text-xs text-center text-slate-500">
            * All transfers are monitored and logged within the current network CIDR.
          </p>
        </div>

        {/* Visualizer Area */}
        <div className="glass-panel p-8 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
          <div className="flex justify-between w-full max-w-md items-center relative z-10">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center pulse-blue">
                <Server className="text-sky-400" size={32} />
              </div>
              <p className="text-xs font-mono text-slate-400">192.168.1.10</p>
            </div>

            <div className="flex-1 h-px bg-slate-800 mx-4 relative overflow-hidden">
              <AnimatePresence>
                {isTransferring && (
                  <motion.div 
                    className="absolute inset-0 flex gap-4"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  >
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-full w-4 bg-sky-400/40 rounded-full blur-sm"></div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center ${
                progress === 100 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/50 border-slate-700'
              }`}>
                {progress === 100 ? <ShieldCheck className="text-emerald-400" size={32} /> : <Server className="text-slate-500" size={32} />}
              </div>
              <p className="text-xs font-mono text-slate-400">192.168.1.20</p>
            </div>
          </div>

          <div className="mt-12 w-full max-w-md space-y-6 relative z-10">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-500">
                <span>Transfer Progress</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-sky-500 to-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-center">
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Speed</p>
                <p className="text-sm font-bold text-sky-400">{stats.speed}</p>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-center">
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Latency</p>
                <p className="text-sm font-bold text-emerald-400">{stats.latency}</p>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-center">
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Loss</p>
                <p className="text-sm font-bold text-rose-400">{stats.loss}</p>
              </div>
            </div>
          </div>
          
          {!isTransferring && progress === 0 && (
            <div className="absolute inset-0 bg-slate-950/20 flex flex-col items-center justify-center pointer-events-none">
              <AlertCircle className="text-slate-700 mb-2" size={48} />
              <p className="text-slate-600 text-sm font-medium">System Idle - Awaiting Protocol Start</p>
            </div>
          )}
        </div>
      </div>

      {/* History Area */}
      <div className="glass-panel p-6">
        <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Clock size={18} className="text-slate-400" />
          Transfer Logs
        </h4>
        <div className="space-y-3">
          {transfers.length > 0 ? transfers.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-4 bg-slate-900/30 rounded-xl border border-slate-800/50">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.sender_ip} → {t.receiver_ip}</p>
                  <p className="text-xs text-slate-500">{t.bandwidth?.toFixed(1) || "???"} Mbps Transfer Logged</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400">{new Date(t.timestamp).toLocaleDateString()}</p>
                <p className="text-xs text-slate-600">{new Date(t.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>
          )) : (
            <div className="flex flex-col items-center justify-center py-10 opacity-50">
               <Clock size={24} className="text-slate-500 mb-2" />
               <p className="text-sm font-bold text-slate-600 uppercase tracking-widest">No transfer logs found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Transfers;
