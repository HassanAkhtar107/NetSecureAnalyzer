import React from 'react';
import { Card } from './ui/card';
import { cn } from '../lib/utils';

const SummaryCard = ({ label, value, icon: Icon, tone }) => {
  const toneMap = {
    primary: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    destructive: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };

  const iconToneMap = {
    primary: "bg-sky-500/20 text-sky-400",
    success: "bg-emerald-500/20 text-emerald-400",
    warning: "bg-amber-500/20 text-amber-400",
    destructive: "bg-rose-500/20 text-rose-400",
  };

  return (
    <Card className={cn(
      "p-4 border shadow-elegant transition-all group flex items-center gap-4",
      toneMap[tone] || "border-slate-800 bg-[#16191f]"
    )}>
      {Icon && (
        <div className={cn(
          "h-10 w-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110",
          iconToneMap[tone] || "bg-slate-800 text-slate-400"
        )}>
          <Icon size={20} />
        </div>
      )}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">
          {label}
        </div>
        <div className="text-xl font-bold tabular-nums text-white">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
      </div>
    </Card>
  );
};

export default SummaryCard;
