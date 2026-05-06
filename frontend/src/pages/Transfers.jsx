import React, { useState, useEffect } from 'react';
import {motion as m} from 'framer-motion';
import {Send, Server, Activity, Zap, Clock, ShieldCheck, AlertCircle} from 'lucide-react';
import {devicesApi, transfersApi} from '../api';
import {toast} from 'sonner';

const Transfers = ({ userType }) => {
  const [devices, setDevices] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedDest, setSelectedDest] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const devRes = await devicesApi.list();
        if (Array.isArray(devRes.data)) {
          setDevices(devRes.data);
          if (devRes.data.length > 0) {
            if (!selectedSource) setSelectedSource(String(devRes.data[0].id));
            if (devRes.data.length > 1 && !selectedDest) setSelectedDest(String(devRes.data[1].id));
          }
        }

        const transRes = await transfersApi.list();
        setTransfers(transRes.data);
      } catch (err) {
        console.error("Failed to fetch transfer data", err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const startTransfer = async () => {
    if (!selectedSource || !selectedDest) return;
    setIsTransferring(true);
    setProgress(0);
    
    try {
      await transfersApi.create({
        sender_device: selectedSource,
        receiver_device: selectedDest,
        bandwidth: 50.0 + Math.random() * 50,
        latency: 10 + Math.random() * 20,
        throughput: 40 + Math.random() * 30
      });

      const timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(timer);
            setIsTransferring(false);
            toast.success("Packet transfer sequence completed successfully");
            return 100;
          }
          return prev + 5;
        });
      }, 100);
    } catch (err) {
      toast.error("Transfer protocol handshake failed");
      setIsTransferring(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3 tracking-tight">
            <Send className="text-primary" size={28} />
            Data Transfer Protocol
          </h2>
          <p className="text-slate-500 text-sm mt-1">Initiate and monitor high-speed bitstream transfers between network nodes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="glass-panel p-8 space-y-6 lg:col-span-1">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Zap className="text-amber-400" size={18} /> Configuration
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Source Node</label>
              <select 
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-primary/50 outline-none"
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
              >
                {devices.map(d => <option key={d.id} value={d.id}>{d.name || d.ip_address} ({d.ip_address})</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Destination Node</label>
              <select 
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-primary/50 outline-none"
                value={selectedDest}
                onChange={(e) => setSelectedDest(e.target.value)}
              >
                {devices.map(d => <option key={d.id} value={d.id}>{d.name || d.ip_address} ({d.ip_address})</option>)}
              </select>
            </div>

            <div className="pt-4">
              <button 
                onClick={startTransfer}
                disabled={isTransferring || !selectedSource || !selectedDest}
                className="w-full bg-primary text-slate-950 py-4 rounded-xl font-bold text-sm hover:bg-primary/80 transition-all shadow-[0_0_20px_rgba(56,189,248,0.2)] disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isTransferring ? <Activity className="animate-pulse" /> : <Send size={18} />}
                {isTransferring ? "Broadcasting..." : "Initiate Tunnel"}
              </button>
            </div>
          </div>

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
              <p className="text-xs font-mono text-slate-400">
                {devices.find(d => String(d?.id) === String(selectedSource))?.ip_address || 'Source Node'}
              </p>
            </div>

            <div className="flex-1 h-px bg-slate-800 mx-4 relative overflow-hidden">
                {isTransferring && (
                  <m.div 
                    className="absolute inset-0 flex gap-4"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ repeat, duration: 1.5, ease: "linear" }}
                  >
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-full w-4 bg-sky-400/40 rounded-full blur-sm"></div>
                    ))}
                  </m.div>
                )}
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl bg-slate-900 border transition-all duration-500 flex items-center justify-center ${progress === 100 ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800'}`}>
                {progress === 100 ? <ShieldCheck className="text-emerald-400" size={32} /> : <Server className="text-slate-500" size={32} />}
              </div>
              <p className="text-xs font-mono text-slate-400">
                {devices.find(d => String(d?.id) === String(selectedDest))?.ip_address || 'Destination Node'}
              </p>
            </div>
          </div>

          <div className="mt-12 w-full max-w-sm space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <span>Transfer Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800/50">
               <m.div 
                 className="h-full bg-primary"
                 initial={{ width: 0 }}
                 animate={{ width: `${progress}%` }}
               />
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel p-8">
        <h4 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Clock className="text-slate-500" size={18} /> Transfer Registry
        </h4>
        <div className="space-y-3">
          {Array.isArray(transfers) && transfers.length > 0 ? transfers.map((t) => (
            t && (
              <div key={t.id} className="flex items-center justify-between p-4 bg-slate-900/30 rounded-xl border border-slate-800/50">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.sender_ip || '0.0.0.0'} → {t.receiver_ip || '0.0.0.0'}</p>
                    <p className="text-xs text-slate-500">
                      {t.bandwidth?.toFixed(1) || "0.0"} Mbps | 
                      {userType === 'ADMIN' && t.created_by_name ? ` Started by ${t.created_by_name}` : " Network Transfer"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400">
                    {t.timestamp ? new Date(t.timestamp).toLocaleDateString() : 'Unknown Date'}
                  </p>
                  <p className="text-xs text-slate-600">
                    {t.timestamp ? new Date(t.timestamp).toLocaleTimeString() : '---'}
                  </p>
                </div>
              </div>
            )
          )) : (
            <div className="flex flex-col items-center justify-center py-10 opacity-50">
               <Clock size={24} className="text-slate-500 mb-2" />
               <p className="text-xs font-bold uppercase tracking-widest">No previous protocols in registry</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Transfers;
