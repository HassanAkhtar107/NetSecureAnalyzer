import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Plus, Ban, CheckCircle2, Trash2, MoreVertical, X, ArrowUpDown, Filter,
  Download, Upload, ShieldOff, Shield, Laptop, Smartphone, Cpu, Tv, HardDrive,
  Activity, Globe, UserPlus, User, Network, Server, Info, Clock, AlertTriangle, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adminUsersApi, networksApi, userDevicesApi } from '../api';
import { toast } from 'sonner';
import { formatDistanceToNow, isValid } from 'date-fns';
import { cn } from '../lib/utils';
import SummaryCard from '../components/SummaryCard';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

const DeviceIcon = ({ type, className }) => {
  const map = {
    laptop: Laptop,
    smartphone: Smartphone,
    'office pc': Cpu,
    'smart tv': Tv,
    'nas server': HardDrive,
    server: Server,
  };
  const Icon = map[type?.toLowerCase()] || Activity;
  return <Icon className={className} />;
};

const typeLabels = {
  laptop: "Laptop",
  smartphone: "Smartphone",
  "office pc": "Workstation",
  "smart tv": "Smart TV",
  "nas server": "Storage Node",
  server: "Backend Server",
};

const Devices = ({ userType }) => {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [networks, setNetworks] = useState([]);
  const [deviceToRemove, setDeviceToRemove] = useState(null);

  const fetchData = async () => {
    try {
      const [nRes, udRes, uRes] = await Promise.allSettled([
        networksApi.list(),
        userDevicesApi.list(),
        adminUsersApi.list()
      ]);

      const safeArr = (res) => {
        if (res.status !== 'fulfilled' || !res.value?.data) return [];
        return Array.isArray(res.value.data.results) ? res.value.data.results :
          Array.isArray(res.value.data) ? res.value.data : [];
      };
      let fetchedUserDevices = safeArr(udRes);
      let fetchedUsers = safeArr(uRes);

      // Build map of existing user devices by email to prevent double registration
      const userDeviceMap = new Map();
      for (const ud of fetchedUserDevices) {
        if (ud.user_email) {
          userDeviceMap.set(ud.user_email.toLowerCase(), ud);
        }
      }

      // Generate placeholders for users in User table who don't have a device registered
      const userPlaceholders = [];
      for (const u of fetchedUsers) {
        if (u.user_type !== 'ADMIN' && u.email) {
          const emailKey = u.email.toLowerCase();
          if (!userDeviceMap.has(emailKey)) {
            userPlaceholders.push({
              id: `u-placeholder-${u.id}`,
              device_name: u.name || u.email,
              user_email: u.email,
              ip_address: '0.0.0.0',
              vpn_status: false,
              is_blocked: false,
              last_active: null,
              created_at: null
            });
          }
        }
      }

      // Combine devices, marking user-registered ones and placeholders
      const combined = [
        ...fetchedUserDevices
          .filter(d => d.user_type !== 'ADMIN')
          .map(d => ({
            ...d,
            id: `ud-${d.id}`,
            name: d.device_name || d.user_email || 'Unnamed Device',
            status: d.is_blocked ? (d.vpn_status ? 'VPN BYPASS' : 'BLOCKED') : (d.vpn_status ? 'VPN ACTIVE' : 'ACTIVE'),
            source: 'user_registration',
          })),
        ...userPlaceholders.map(u => ({
          ...u,
          id: u.id,
          name: u.name || u.device_name,
          ip: u.ip_address,
          ip_address: u.ip_address,
          status: 'ACTIVE',
          source: 'user_registration',
        }))
      ];

      // De-duplicate: Keep only the most recent device entry per unique user email
      // and per unique IP for infrastructure devices that don't have an email.
      const seenEmails = new Set();
      const seenIPsForInfra = new Set();
      const uniqueCombined = [];

      const sorted = [...combined].sort((a, b) => {
        const emailA = a.user_email || a.email ? 1 : 0;
        const emailB = b.user_email || b.email ? 1 : 0;
        if (emailB !== emailA) return emailB - emailA;

        const dateA = a.last_active ? new Date(a.last_active) : new Date(a.created_at || 0);
        const dateB = b.last_active ? new Date(b.last_active) : new Date(b.created_at || 0);
        return dateB - dateA;
      });

      for (const d of sorted) {
        const email = d.user_email || d.email;
        const ip = d.ip_address || d.ip;

        if (email) {
          // Distinct users are identified and de-duplicated by email
          if (!seenEmails.has(email)) {
            seenEmails.add(email);
            if (ip) seenIPsForInfra.add(ip); // Mark their IP as seen so background scan won't duplicate it
            uniqueCombined.push(d);
          }
        } else {
          // Background infrastructure scans (without email) are de-duplicated by unique IP
          if (ip && !seenIPsForInfra.has(ip)) {
            seenIPsForInfra.add(ip);
            uniqueCombined.push(d);
          }
        }
      }

      setDevices(uniqueCombined);
      setNetworks(safeArr(nRes));
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Polling every 5 seconds
    return () => clearInterval(interval);
  }, [userType]);

  useEffect(() => {
    if (selectedDevice) {
      const updated = devices.find(d => d.id === selectedDevice.id);
      if (updated) {
        setSelectedDevice(updated);
      }
    }
  }, [devices, selectedDevice]);

  const counts = useMemo(() => {
    return {
      total: devices.length,
      active: devices.filter(d => d.status === 'ACTIVE' || d.status === 'VPN ACTIVE' || d.status === 'VPN BYPASS').length,
      blocked: devices.filter(d => d.status === 'BLOCKED').length
    };
  }, [devices]);

  const filteredDevices = useMemo(() => {
    return devices.filter(d => {
      const q = query.toLowerCase();
      const matchesQuery = !q || (d.name?.toLowerCase().includes(q) || d.ip_address?.includes(q));
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && (d.status?.toUpperCase() === 'ACTIVE' || d.status?.toUpperCase() === 'VPN ACTIVE' || d.status?.toUpperCase() === 'VPN BYPASS')) ||
        (statusFilter === 'blocked' && d.status?.toUpperCase() === 'BLOCKED');
      const matchesType = typeFilter === 'all' || d.type?.toLowerCase() === typeFilter.toLowerCase();
      return matchesQuery && matchesStatus && matchesType;
    });
  }, [devices, query, statusFilter, typeFilter]);

  const handleBlock = async (device) => {
    try {
      const id = device.id.replace('ud-', '');
      await userDevicesApi.block(id);
      toast.success("Access restricted");
      fetchData();
    } catch (err) { toast.error("Action failed"); }
  };

  const handleUnblock = async (device) => {
    try {
      const id = device.id.replace('ud-', '');
      await userDevicesApi.unblock(id);
      toast.success("Access restored");
      fetchData();
    } catch (err) { toast.error("Action failed"); }
  };

  const handleRemove = async (device) => {
    try {
      const id = String(device.id).replace('ud-', '');
      if (id.startsWith('u-placeholder-')) {
        const userId = id.replace('u-placeholder-', '');
        await adminUsersApi.delete(userId);
        toast.success("User removed from system");
      } else {
        await userDevicesApi.delete(id);
        toast.success("User and registered device removed");
      }
      fetchData();
    } catch (err) {
      console.error("Removal failed:", err);
      const errMsg = err.response?.data?.detail || err.response?.data?.error || err.message;
      toast.error("Removal failed: " + errMsg);
    }
  };

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Devices</h1>
            <p className="text-sm text-slate-500">Manage every node on your network: search, filter, block, and inspect.</p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard label="Total" value={counts.total} tone="primary" />
          <SummaryCard label="Active" value={counts.active} tone="success" />
          <SummaryCard label="Blocked" value={counts.blocked} tone="destructive" />
        </div>

        {/* Main Content Area */}
        <Card className="overflow-hidden border-slate-800 bg-[#16191f] shadow-xl">
          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <Input
                placeholder="Search by name, IP, or MAC..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter size={16} className="text-slate-500" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-[#0d1117]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* List */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#0d1117]/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-800">
                  <th className="px-6 py-3">Device</th>
                  <th className="px-6 py-3">email</th>
                  <th className="px-6 py-3">Address</th>
                  <th className="px-6 py-3">VPN Status</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredDevices.map(d => (
                  <tr
                    key={d.id}
                    onClick={() => setSelectedDevice(d)}
                    className="cursor-pointer hover:bg-slate-800/20 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#0d1117] flex items-center justify-center border border-slate-800 group-hover:border-sky-500/30 transition-colors">
                          <DeviceIcon type={d.type} className="w-4 h-4 text-slate-400 group-hover:text-sky-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-200 truncate">{d.name || d.ip_address}</p>
                          <p className="text-[10px] text-slate-500">{typeLabels[d.type?.toLowerCase()] || d.type || 'Generic Node'} · {d.network_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-mono text-slate-400">{d.user_email || 'Unknown'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-mono text-slate-300">{d.ip_address}</span>
                        {d.vpn_status && d.original_ip && d.original_ip !== d.ip_address && (
                          <span className="text-[10px] font-mono text-slate-500">
                            Real: {d.original_ip}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {d.vpn_status ? (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold uppercase tracking-tighter">
                          <Globe className="mr-1 h-3 w-3 inline-block animate-pulse" />
                          VPN ON
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-800 text-slate-500 border-slate-700/50 font-bold uppercase tracking-tighter">
                          VPN Off
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        className={cn(
                          "font-bold uppercase tracking-tighter",
                          d.status === 'BLOCKED' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                            d.status === 'VPN BYPASS' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                              d.status === 'VPN ACTIVE' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                "bg-sky-500/10 text-sky-400 border-sky-500/20"
                        )}
                      >
                        <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${d.status === 'BLOCKED' ? 'bg-rose-500' :
                          d.status === 'VPN BYPASS' ? 'bg-amber-500 animate-pulse' :
                            d.status === 'VPN ACTIVE' ? 'bg-emerald-400 animate-pulse' :
                              'bg-sky-500'
                          }`} />
                        {d.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-200">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">

                          {d.status !== 'BLOCKED' && d.status !== 'VPN BYPASS' ? (
                            <DropdownMenuItem onClick={() => handleBlock(d)}>
                              <ShieldOff className="mr-2 h-4 w-4 text-rose-500" /> Block Access
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleUnblock(d)}>
                              <Shield className="mr-2 h-4 w-4 text-emerald-500" /> Unblock Access
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setDeviceToRemove(d)} className="text-rose-500 focus:text-rose-400">
                            <Trash2 className="mr-2 h-4 w-4" /> Remove Device
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {filteredDevices.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 text-sm italic">
                      No devices match your current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Premium Confirm Delete Modal */}
      {deviceToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-300">
          <div
            className="w-full max-w-md bg-[#16191f] border border-slate-800 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-500 mb-4">
              <AlertTriangle size={24} className="animate-bounce" />
              <h3 className="text-lg font-bold text-white">Confirm Deletion</h3>
            </div>

            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Are you absolutely sure you want to remove <span className="font-bold text-slate-200">{deviceToRemove.name || deviceToRemove.ip_address}</span>?
              <br />
              <span className="text-xs text-rose-400/80 font-semibold mt-2 block">
                ⚠️ Warning: This action is permanent and will completely delete this user and all their network data/sessions from the system database.
              </span>
            </p>

            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setDeviceToRemove(null)}
                className="text-slate-400 hover:text-white hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  const dev = deviceToRemove;
                  setDeviceToRemove(null);
                  await handleRemove(dev);
                }}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold"
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Devices;
//git