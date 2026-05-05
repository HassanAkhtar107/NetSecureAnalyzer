import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color: 'sky' | 'green' | 'amber' | 'rose' | 'indigo' | 'purple';
  trend?: string;
  trendUp?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, trend, trendUp }) => {
  const colorMap = {
    sky: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20', chart: '#38bdf8' },
    green: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', chart: '#10b981' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', chart: '#f59e0b' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', chart: '#f43f5e' },
    indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20', chart: '#6366f1' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', chart: '#a855f7' },
  };

  const style = colorMap[color];
  const data = Array.from({ length: 15 }, (_, i) => ({ value: 20 + Math.random() * 60 }));

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-[#0a0f1d]/60 border border-slate-800/50 p-4 rounded-2xl relative overflow-hidden group backdrop-blur-sm"
    >
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2 rounded-xl border ${style.border} ${style.bg} ${style.text}`}>
            <Icon size={18} />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-[10px] font-bold ${trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trendUp ? '+' : ''}{trend}
            </div>
          )}
        </div>
        
        <div>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">{title}</p>
          <p className="text-xl font-bold text-slate-100">{value}</p>
        </div>

        <div className="mt-4 h-12 w-full opacity-60 group-hover:opacity-100 transition-opacity">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={style.chart} 
                fill={style.chart} 
                fillOpacity={0.05} 
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;
