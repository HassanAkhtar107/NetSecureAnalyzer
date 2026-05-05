import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Shield, ShieldOff, Info, MoreVertical, Loader2 } from 'lucide-react';
import { devicesApi } from '../api';

interface Device {
  id: number;
  ip: string;
  name: string;
  network: string;
  status: 'active' | 'blocked' | 'pending';
  usage: string;
  lastSeen: string;
}

const Devices: React.FC<{ userType: 'ADMIN' | 'USER' }> = ({ userType }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const res = await devicesApi.list();
      // Transform API data to fit UI if needed
      const transformed = res.data.map((d: any) => ({
        id: d.id,
        ip: d.ip_address,
        name: d.name || `Device ${d.id}`,
        network: d.network_name || 'Assigned Net',
        status: d.status.toLowerCase(),
        usage: `${d.data_usage.toFixed(1)} MB`,
        lastSeen: 'Active'
      }));
      setDevices(transformed);
    } catch (err) {
      console.error("Failed to fetch devices", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDevices();
  }, []);

  const toggleBlock = async (id: number, currentStatus: string) => {
    if (userType !== 'ADMIN') return;
    try {
      if (currentStatus === 'blocked') {
        await devicesApi.unblock(id);
      } else {
        await devicesApi.block(id);
      }
      fetchDevices(); // Refresh list
    } catch (err) {
      console.error("Action failed", err);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search by IP, name or network..."
            className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-sky-500/50 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors">
            <Filter size={16} />
            Filter
          </button>
          {userType === 'ADMIN' && (
            <button className="flex-1 md:flex-none px-4 py-2.5 bg-sky-500 text-slate-950 rounded-xl text-sm font-bold hover:bg-sky-400 transition-colors">
              Add Network
            </button>
          )}
        </div>
      </div>

      <div className="glass-panel overflow-hidden border-slate-800">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/30 text-slate-400 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">Device Info</th>
              <th className="px-6 py-4 font-semibold">Network</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Data Usage</th>
              <th className="px-6 py-4 font-semibold">Last Seen</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            <AnimatePresence mode="popLayout">
              {devices.filter(d => d.ip.includes(searchTerm) || d.name.toLowerCase().includes(searchTerm.toLowerCase())).map((device) => (
                <motion.tr 
                  key={device.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="group hover:bg-slate-800/20 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${device.status === 'active' ? 'bg-emerald-400' : device.status === 'blocked' ? 'bg-rose-500' : 'bg-amber-400'}`}></div>
                      <div>
                        <p className="font-semibold text-sm">{device.name}</p>
                        <p className="text-xs text-slate-500 font-mono">{device.ip}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">{device.network}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${
                      device.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                      device.status === 'blocked' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 
                      'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {device.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{device.usage}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">{device.lastSeen}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors">
                        <Info size={16} />
                      </button>
                      {userType === 'ADMIN' && (
                        <button 
                          onClick={() => toggleBlock(device.id, device.status)}
                          className={`p-2 rounded-lg transition-colors ${device.status === 'blocked' ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-rose-400 hover:bg-rose-500/10'}`}
                        >
                          {device.status === 'blocked' ? <Shield size={16} /> : <ShieldOff size={16} />}
                        </button>
                      )}
                      <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default Devices;
