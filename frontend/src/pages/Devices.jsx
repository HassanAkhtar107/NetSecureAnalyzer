import React, { useState, useEffect } from 'react';
import {motion as m, AnimatePresence} from 'framer-motion';
import {
  Search, Filter, Shield, ShieldOff, Info, UserPlus, Loader2, Plus, X, User, Trash2,
  Network, Server, Activity, Laptop, Smartphone, Globe, Send, Share2, File, Image, Video, FileText, Download
} from 'lucide-react';
import {adminUsersApi, networksApi, devicesApi, transfersApi} from '../api';
import {toast} from 'sonner';

const Devices = ({ userType }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [allDevices, setAllDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sharing Flow State
  const [isSharing, setIsSharing] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [selectedDevice, setSelectedDevice] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('File');
  const [isSending, setIsSending] = useState(false);

  // Admin New User State
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    user_type: 'USER',
    assigned_network: ''
  });

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [userRes, netRes] = await Promise.allSettled([
        adminUsersApi.list(),
        networksApi.list()
      ]);

      if (userRes.status === 'fulfilled' && Array.isArray(userRes.value.data)) {
        setUsers(userRes.value.data);
      } else {
        setUsers([]);
      }

      if (netRes.status === 'fulfilled' && Array.isArray(netRes.value.data)) {
        setNetworks(netRes.value.data);
      } else {
        setNetworks([]);
      }
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllDevices = async () => {
    setLoading(true);
    try {
      const res = await devicesApi.list();
      setAllDevices(res.data || []);
    } catch (err) {
      console.error("Failed to fetch devices", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllNetworks = async () => {
    try {
      const res = await networksApi.list();
      setNetworks(res.data || []);
    } catch (err) { }
  };

  useEffect(() => {
    if (userType === 'ADMIN') {
      fetchAdminData();
    } else {
      fetchAllDevices();
      fetchAllNetworks();
    }
  }, [userType]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await adminUsersApi.create({
        ...newUser,
        assigned_network: newUser.assigned_network || null
      });
      toast.success("User created and network assigned successfully");
      setShowAddUser(false);
      setNewUser({ name: '', email: '', password: '', user_type: 'USER', assigned_network: '' });
      fetchAdminData();
    } catch (err) {
      console.error("Failed to add user", err);
      toast.error("Failed to create user. Ensure email is unique.");
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await adminUsersApi.delete(id);
      toast.success("User deleted successfully");
      fetchAdminData();
    } catch (err) {
      console.error("Delete failed", err);
      toast.error("Failed to delete user");
    }
  };

  const handleSendFile = async () => {
    if (!selectedDevice) {
      toast.error("Please select a destination device");
      return;
    }
    if (!allDevices || allDevices.length === 0) {
      toast.error("No source device detected in your network");
      return;
    }
    setIsSending(true);
    try {
      await transfersApi.create({
        sender_device: allDevices[0].id,
        receiver_device: selectedDevice,
        file_name: `${selectedFileType}_${Math.floor(Math.random() * 1000)}.dat`,
        file_type: selectedFileType.toLowerCase()
      });
      toast.success(`${selectedFileType} sent successfully!`);
      setIsSharing(false);
    } catch (err) {
      toast.error("Transfer failed. Ensure devices are online.");
    } finally {
      setIsSending(false);
    }
  };

  const getDeviceIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'server': return <Server size={18} />;
      case 'smartphone': return <Smartphone size={18} />;
      case 'laptop': return <Laptop size={18} />;
      default: return <Activity size={18} />;
    }
  };

  // --- ADMIN VIEW (USER MANAGEMENT) ---
  if (userType === 'ADMIN') {
    return (
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search users by name or email..."
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-sky-500/50 transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowAddUser(true)}
            className="w-full md:w-auto px-6 py-2.5 bg-sky-500 text-slate-950 rounded-xl text-sm font-bold hover:bg-sky-400 transition-colors flex items-center justify-center gap-2"
          >
            <UserPlus size={16} />
            Provision New User
          </button>
        </div>

        <AP>
          {showAddUser && (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
            >
              <m.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#0a0f1d] border border-slate-800 rounded-3xl p-8 w-full max-md shadow-2xl relative"
              >
                <button
                  onClick={() => setShowAddUser(false)}
                  className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>

                <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                  <div className="p-2 bg-sky-500/10 rounded-lg">
                    <UserPlus className="text-sky-400" size={20} />
                  </div>
                  Create Network User
                </h3>

                <form onSubmit={handleAddUser} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Full Name</label>
                    <input
                      type="text" required
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sky-500/50"
                      placeholder="John Doe"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email Address</label>
                    <input
                      type="email" required
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sky-500/50"
                      placeholder="user@network.com"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Initial Password</label>
                    <input
                      type="password" required
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sky-500/50"
                      placeholder="••••••••"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ password: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">User Role</label>
                      <select
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sky-500/50"
                        value={newUser.user_type}
                        onChange={(e) => setNewUser({ ...newUser, user_type: e.target.value })}
                      >
                        <option value="USER">Standard User</option>
                        <option value="ADMIN">System Admin</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Network Assignment</label>
                      <select
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sky-500/50"
                        value={newUser.assigned_network}
                        onChange={(e) => setNewUser({ ...newUser, assigned_network: e.target.value })}
                      >
                        <option value="">No Network</option>
                        {networks.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-sky-500 text-slate-950 py-4 rounded-xl font-bold text-sm hover:bg-sky-400 transition-all shadow-[0_0_20px_rgba(56,189,248,0.2)] mt-4"
                  >
                    Create and Provision
                  </button>
                </form>
              </m.div>
            </m.div>
          )}
        </AP>

        <div className="glass-panel overflow-hidden border-slate-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/30 text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">User Profile</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Assigned Network</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              <AP mode="popLayout">
                {Array.isArray(users) && users.filter(u =>
                  String(u?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                  String(u?.email || '').toLowerCase().includes(searchTerm.toLowerCase())
                ).map((u) => (
                  <m.tr
                    key={u.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="group hover:bg-slate-800/20 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                          <User className="text-sky-400" size={18} />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{u.name}</p>
                          <p className="text-xs text-slate-500 font-mono">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${u.user_type === 'ADMIN' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                        }`}>
                        {u.user_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <NetworkIcon size={14} className="text-slate-500" />
                        {Array.isArray(networks) && networks.find(n => String(n?.id) === String(u?.assigned_network))?.name || 'None'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-2 hover:bg-rose-500/10 text-rose-400 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </m.tr>
                ))}
              </AP>
            </tbody>
          </table>
        </div>
      </m.div>
    );
  }

  // --- USER VIEW (NETWORK SHARING) ---
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Share2 className="text-sky-400" size={28} />
            Network Sharing
          </h2>
          <p className="text-slate-500 text-sm mt-1">Discover devices and share data instantly across the network.</p>
        </div>
        <button
          onClick={() => setIsSharing(true)}
          className="px-6 py-3 bg-sky-500 text-slate-950 rounded-xl font-bold hover:bg-sky-400 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(56,189,248,0.3)]"
        >
          <Plus size={18} />
          Send New Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allDevices.length > 0 ? allDevices.map((d) => (
          <m.div
            key={d.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-6 space-y-4 hover:border-sky-500/30 transition-all group"
          >
            <div className="flex justify-between items-start">
              <div className="p-3 bg-slate-800 rounded-2xl group-hover:bg-sky-500/5 transition-colors">
                {getDeviceIcon(d.type)}
              </div>
              <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${d.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}>
                {d.status}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-200">{d.name || 'Unidentified Node'}</h4>
              <p className="text-xs font-mono text-slate-500">{d.ip_address}</p>
            </div>

            <div className="pt-4 border-t border-slate-800/50 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              <span className="flex items-center gap-1"><Activity size={12} /> {d.traffic_usage || '0.0'} GB</span>
              <button
                onClick={() => {
                  setSelectedDevice(String(d.id));
                  setIsSharing(true);
                }}
                className="flex items-center gap-1 text-sky-400 hover:text-sky-300 transition-colors"
              >
                <Send size={12} /> Send Data
              </button>
            </div>
          </m.div>
        )) : (
          <div className="col-span-full p-20 text-center glass-panel opacity-50">
            <Laptop size={48} className="mx-auto mb-4" />
            <p className="font-bold uppercase tracking-widest text-xs">No active devices found in your network</p>
          </div>
        )}
      </div>

      {/* SHARING MODAL (SHAREIT STYLE) */}
      <AP>
        {isSharing && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
          >
            <m.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#0a0f1d] border border-slate-800 rounded-3xl p-8 w-full max-w-lg shadow-2xl relative"
            >
              <button
                onClick={() => setIsSharing(false)}
                className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <div className="p-3 bg-sky-500/10 rounded-2xl">
                  <Share2 className="text-sky-400" size={24} />
                </div>
                Secure Data Dispatch
              </h3>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Target Network</label>
                    <select
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-sky-500/50"
                      value={selectedNetwork}
                      onChange={(e) => setSelectedNetwork(e.target.value)}
                    >
                      <option value="">Select Network</option>
                      {networks.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recipient Device</label>
                    <select
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-sky-500/50"
                      value={selectedDevice}
                      onChange={(e) => setSelectedDevice(e.target.value)}
                    >
                      <option value="">Select Device</option>
                      {allDevices.map(d => <option key={d.id} value={d.id}>{d.name || d.ip_address}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Choose Content Category</label>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Photos', icon, color: 'text-pink-400' },
                      { label: 'Videos', icon, color: 'text-purple-400' },
                      { label: 'Files', icon, color: 'text-sky-400' },
                      { label: 'System', icon, color: 'text-slate-400' }
                    ].map((type) => (
                      <button
                        key={type.label}
                        onClick={() => setSelectedFileType(type.label)}
                        className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${selectedFileType === type.label
                          ? 'bg-sky-500/10 border-sky-500/50 shadow-[0_0_15px_rgba(56,189,248,0.15)]'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                          }`}
                      >
                        <type.icon size={20} className={type.color} />
                        <span className="text-[10px] font-bold uppercase tracking-tight">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSendFile}
                  disabled={isSending || !selectedDevice}
                  className="w-full bg-sky-500 text-slate-950 py-4 rounded-2xl font-bold text-sm hover:bg-sky-400 transition-all shadow-[0_0_20px_rgba(56,189,248,0.3)] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                  {isSending ? 'Initiating Secure Tunnel...' : `Transmit Selected ${selectedFileType}`}
                </button>
              </div>
            </m.div>
          </m.div>
        )}
      </AP>
    </div>
  );
};

export default Devices;
