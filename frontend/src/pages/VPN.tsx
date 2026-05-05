import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Shield, ShieldOff, CheckCircle, AlertCircle, MapPin, Activity, Zap, Lock } from 'lucide-react';
import { vpnStatusApi } from '../api';

const countries = [
  { name: 'USA', flag: '🇺🇸', ip: '192.168.1.1' },
  { name: 'Germany', flag: '🇩🇪', ip: '185.10.10.1' },
  { name: 'UK', flag: '🇬🇧', ip: '51.20.20.1' },
  { name: 'Singapore', flag: '🇸🇬', ip: '103.30.30.1' },
];

const VPN: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [simulatedIp, setSimulatedIp] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await vpnStatusApi.getStatus();
      setIsActive(res.data.is_active);
      setSelectedCountry(res.data.selected_country);
      setSimulatedIp(res.data.simulated_ip);
    } catch (err) {
      console.error("Failed to fetch VPN status", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    if (isActive) {
      try {
        const res = await vpnStatusApi.disconnect();
        setIsActive(false);
        setSimulatedIp(null);
      } catch (err) {
        console.error("Disconnect failed", err);
      }
    } else {
      if (!selectedCountry) {
        // Just local toggle to show warning if user tries to connect without country
        // but typically we want them to select first. 
        // For now, let's just toggle the UI state or keep it OFF until country selected?
        // The prompt says: If ON and no country -> Show warning.
        setIsActive(true);
      } else {
        try {
          const res = await vpnStatusApi.connect(selectedCountry);
          setIsActive(true);
          setSimulatedIp(res.data.simulated_ip);
        } catch (err) {
          console.error("Connect failed", err);
        }
      }
    }
  };

  const handleSelectCountry = async (country: string) => {
    setSelectedCountry(country);
    if (isActive) {
      try {
        const res = await vpnStatusApi.selectCountry(country);
        setSimulatedIp(res.data.simulated_ip);
      } catch (err) {
        console.error("Country selection failed", err);
      }
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col items-center justify-center space-y-6 pt-10">
        <motion.div
          animate={{
            scale: isActive ? [1, 1.05, 1] : 1,
            rotate: isActive ? 360 : 0
          }}
          transition={{
            duration: isActive ? 20 : 0.5,
            repeat: isActive ? Infinity : 0,
            ease: "linear"
          }}
          className={`w-32 h-32 rounded-full border-4 flex items-center justify-center relative ${isActive ? 'border-sky-500 shadow-[0_0_50px_rgba(56,189,248,0.2)] bg-sky-500/5' : 'border-slate-800 bg-slate-900/50'
            }`}
        >
          <Globe size={48} className={isActive ? 'text-sky-400' : 'text-slate-600'} />
          {isActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-[#020617]"
            >
              <CheckCircle size={16} className="text-white" />
            </motion.div>
          )}
        </motion.div>

        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">
            VPN is {isActive ? <span className="text-emerald-400">ON</span> : <span className="text-rose-400">OFF</span>}
          </h2>
          <p className="text-slate-400 text-sm">
            {isActive
              ? (selectedCountry ? `Connected to ${selectedCountry}` : 'Connected (No country selected)')
              : 'Disconnected from secure gateway'}
          </p>
        </div>

        <button
          onClick={handleToggle}
          className={`px-12 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform active:scale-95 flex items-center gap-3 ${isActive
              ? 'bg-rose-500 text-white shadow-[0_0_30px_rgba(244,63,94,0.3)] hover:bg-rose-600'
              : 'bg-emerald-500 text-slate-950 shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:bg-emerald-400'
            }`}
        >
          {isActive ? <ShieldOff size={24} /> : <Shield size={24} />}
          {isActive ? 'Disconnect VPN' : 'Connect VPN'}
        </button>
      </div>

      <AnimatePresence>
        {isActive && !selectedCountry && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-center gap-3 text-rose-400"
          >
            <AlertCircle size={20} />
            <span className="text-sm font-bold uppercase tracking-widest">Please select a country to establish connection</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
        <div className="glass-panel p-6 space-y-6">
          <h4 className="font-bold text-sm uppercase tracking-widest text-slate-500">Select Gateway Location</h4>
          <div className="grid grid-cols-2 gap-3">
            {countries.map((c) => (
              <button
                key={c.name}
                onClick={() => handleSelectCountry(c.name)}
                className={`p-4 rounded-xl border text-left transition-all duration-200 group relative overflow-hidden ${selectedCountry === c.name
                    ? 'bg-sky-500/10 border-sky-500/30 text-sky-400 ring-1 ring-sky-500/20'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
              >
                <div className="flex flex-col gap-3 relative z-10">
                  <span className="text-2xl">{c.flag}</span>
                  <span className="font-bold text-sm tracking-tight">{c.name}</span>
                </div>
                {selectedCountry === c.name && (
                  <motion.div
                    layoutId="activeGlow"
                    className="absolute top-0 right-0 w-12 h-12 bg-sky-500/5 rounded-full -mr-6 -mt-6 blur-xl"
                  ></motion.div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-panel p-6 flex flex-col justify-between">
          <h4 className="font-bold text-sm uppercase tracking-widest text-slate-500">Session Information</h4>

          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity size={18} className="text-slate-500" />
                <span className="text-sm text-slate-400">Connection Status</span>
              </div>
              <span className={`text-sm font-bold ${isActive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isActive ? 'CONNECTED' : 'DISCONNECTED'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin size={18} className="text-slate-500" />
                <span className="text-sm text-slate-400">Selected Location</span>
              </div>
              <span className="text-sm font-bold text-slate-200">
                {selectedCountry || 'None'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap size={18} className="text-slate-500" />
                <span className="text-sm text-slate-400">Simulated IP Address</span>
              </div>
              <span className="text-sm font-mono font-bold text-sky-400">
                {isActive && simulatedIp ? simulatedIp : '---.---.---.---'}
              </span>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/50">
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              <Lock size={12} />
              Secure 256-bit AES Encryption Active
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VPN;
