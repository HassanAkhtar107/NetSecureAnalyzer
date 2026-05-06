import React from 'react';
import {Settings, User, Bell, Lock, Database, Globe, Sliders} from 'lucide-react';

const Settings = () => {
  const userEmail = localStorage.getItem('userType') === 'ADMIN' ? 'admin@netsecure.com' : 'user@netsecure.com';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <SettingsIcon className="text-sky-400" size={28} />
        <h2 className="text-2xl font-bold">System Configuration</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1 space-y-2">
           {[
             { name: 'Profile', icon, active: true },
             { name: 'Security', icon: Lock },
             { name: 'Notifications', icon: Bell },
             { name: 'Network', icon: Globe },
             { name: 'Data Storage', icon: Database },
             { name: 'Preferences', icon: Sliders },
           ].map((item) => (
             <div 
               key={item.name}
               className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium cursor-pointer transition-all ${
                 item.active ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-[0_0_15px_rgba(56,189,248,0.05)]' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'
               }`}
             >
               <item.icon size={16} />
               {item.name}
             </div>
           ))}
        </div>

        <div className="md:col-span-3 space-y-6">
           <div className="glass-panel p-8 space-y-8">
              <div className="space-y-6">
                 <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500">Account Details</h4>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Full Name</label>
                       <div className="bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-300">
                          {localStorage.getItem('userType') === 'ADMIN' ? 'System Administrator' : 'Network Operator'}
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email Address</label>
                       <div className="bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-300">
                          {userEmail}
                       </div>
                    </div>
                 </div>
              </div>

              <div className="space-y-6 pt-8 border-t border-slate-800/50">
                 <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500">Security Parameters</h4>
                 <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-900/30 rounded-2xl border border-slate-800">
                       <div className="space-y-1">
                          <p className="text-sm font-bold">Two-Factor Authentication</p>
                          <p className="text-[10px] text-slate-500">Add an extra layer of security to your gateway login.</p>
                       </div>
                       <div className="w-10 h-5 bg-emerald-500/20 border border-emerald-500/30 rounded-full p-0.5 flex justify-end">
                          <div className="w-3.5 h-3.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                       </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-900/30 rounded-2xl border border-slate-800">
                       <div className="space-y-1">
                          <p className="text-sm font-bold">Encrypted Session Logs</p>
                          <p className="text-[10px] text-slate-500">Enable end-to-end encryption for all stored network logs.</p>
                       </div>
                       <div className="w-10 h-5 bg-slate-800 border border-slate-700 rounded-full p-0.5 flex justify-start">
                          <div className="w-3.5 h-3.5 bg-slate-500 rounded-full" />
                       </div>
                    </div>
                 </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                 <button className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-all">Cancel</button>
                 <button className="px-8 py-2.5 bg-sky-500 text-slate-950 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-sky-400 transition-all shadow-[0_0_20px_rgba(56,189,248,0.2)]">Save Modifications</button>
              </div>
           </div>

           <div className="glass-panel p-6 border-rose-500/10 bg-rose-500/5">
              <h4 className="text-sm font-bold uppercase tracking-widest text-rose-400 mb-2">Danger Zone</h4>
              <p className="text-xs text-slate-500 mb-4">Deleting your account will permanently wipe all assigned network configurations and devices.</p>
              <button className="px-6 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-rose-500/20 transition-all">Terminate Account</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
