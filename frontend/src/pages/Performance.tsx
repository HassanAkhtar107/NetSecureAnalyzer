import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Shield, Globe, Zap, Clock, AlertTriangle } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line
} from 'recharts';

const data = [
  { name: 'Latency (ms)', baseline: 22, firewall: 28, vpn: 54 },
  { name: 'Packet Loss (%)', baseline: 0.1, firewall: 0.2, vpn: 0.8 },
  { name: 'Jitter (ms)', baseline: 2, firewall: 4, vpn: 12 },
];

const throughputData = [
  { name: 'Baseline', value: 940, color: '#10b981' },
  { name: 'Firewall Active', value: 890, color: '#38bdf8' },
  { name: 'VPN Active', value: 650, color: '#f43f5e' },
];

const Performance: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'BASELINE' | 'FIREWALL' | 'VPN'>('BASELINE');

  return (
    <div className="space-y-8 pb-12">
      <header className="flex justify-between items-end">
        <div>
          <h3 className="text-2xl font-bold">Performance Analysis System</h3>
          <p className="text-slate-400">Comparing security impact on network efficiency.</p>
        </div>
        <div className="flex gap-2 p-1 bg-slate-900/50 border border-slate-800 rounded-xl">
          {(['BASELINE', 'FIREWALL', 'VPN'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setActiveMode(mode)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeMode === mode ? 'bg-sky-500 text-slate-950' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Metric Overview */}
        <div className="lg:col-span-2 glass-panel p-8">
          <h4 className="font-bold mb-8 flex items-center gap-2">
            <Activity className="text-sky-400" size={18} />
            Security Overhead Comparison
          </h4>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="baseline" name="Baseline (Normal)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="firewall" name="Firewall Impact" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="vpn" name="VPN Impact" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Throughput Analysis */}
        <div className="glass-panel p-8">
          <h4 className="font-bold mb-8 flex items-center gap-2">
            <Zap className="text-amber-400" size={18} />
            Throughput (Mbps)
          </h4>
          <div className="space-y-8">
            {throughputData.map((item) => (
              <div key={item.name} className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                  <span className="text-slate-400">{item.name}</span>
                  <span style={{ color: item.color }}>{item.value} Mbps</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.value / 1000) * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full"
                    style={{ backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl">
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <AlertTriangle size={14} />
              <p className="text-xs font-bold uppercase">Analysis Note</p>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Enabling the VPN results in a ~31% decrease in total throughput due to encryption overhead and routing distance. Firewall impact remains minimal at ~5%.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 border-emerald-500/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <Clock size={18} />
            </div>
            <h5 className="font-bold">Normal Ops</h5>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">98.2%</p>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Efficiency Index</p>
          </div>
        </div>

        <div className="glass-panel p-6 border-sky-500/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg">
              <Shield size={18} />
            </div>
            <h5 className="font-bold">Firewall Layer</h5>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">92.4%</p>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Efficiency Index</p>
          </div>
        </div>

        <div className="glass-panel p-6 border-rose-500/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
              <Globe size={18} />
            </div>
            <h5 className="font-bold">VPN Layer</h5>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">64.1%</p>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Efficiency Index</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Performance;
