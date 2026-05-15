import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Plus, Ban, CheckCircle2, Trash2, MoreVertical, X, ArrowUpDown, Filter,
  Download, Upload, ShieldOff, Shield, Laptop, Smartphone, Cpu, Tv, HardDrive,
  Activity, Globe, UserPlus, User, Network, Server, Info, Clock, AlertTriangle, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adminUsersApi, networksApi, devicesApi, transfersApi, userDevicesApi } from '../api';
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

  const fetchData = async () => {
    try {
      const [dRes, nRes, udRes] = await Promise.allSettled([
        devicesApi.list(),
        networksApi.list(),
        userDevicesApi.list()
      ]);

      const safeArr = (res) => {
        if (res.status !== 'fulfilled' || !res.value?.data) return [];
        return Array.isArray(res.value.data.results) ? res.value.data.results :
          Array.isArray(res.value.data) ? res.value.data : [];
      };
      let fetchedDevices = safeArr(dRes);
      let fetchedUserDevices = safeArr(udRes);

      // Combine devices, marking user-registered ones
      const combined = [
        ...fetchedDevices.map(d => ({ ...d, source: 'infrastructure' })),
        ...fetchedUserDevices
          .filter(d => d.user_type !== 'ADMIN')
          .map(d => ({
            ...d,
            id: `ud-${d.id}`,
            name: d.device_name || d.user_email || 'Unnamed Device',
            status: d.is_blocked ? 'BLOCKED' : (d.vpn_status ? 'VPN ACTIVE' : 'ACTIVE'),
            source: 'user_registration',
            is_approved: !d.is_blocked
          }))
      ];

      setDevices(combined);
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

  const counts = useMemo(() => {
    return {
      total: devices.length,
      active: devices.filter(d => d.status === 'ACTIVE' || d.status === 'VPN ACTIVE').length,
      pending: devices.filter(d => d.status === 'PENDING').length,
      blocked: devices.filter(d => d.status === 'BLOCKED').length
    };
  }, [devices]);

  const filteredDevices = useMemo(() => {
    return devices.filter(d => {
      const q = query.toLowerCase();
      const matchesQuery = !q || (d.name?.toLowerCase().includes(q) || d.ip_address?.includes(q));
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && (d.status === 'ACTIVE' || d.is_approved)) ||
        (statusFilter === 'pending' && !d.is_approved) ||
        (statusFilter === 'blocked' && d.status === 'BLOCKED');
      const matchesType = typeFilter === 'all' || d.type?.toLowerCase() === typeFilter.toLowerCase();
      return matchesQuery && matchesStatus && matchesType;
    });
  }, [devices, query, statusFilter, typeFilter]);

  const handleApprove = async (id) => {
    try {
      await devicesApi.approve(id);
      toast.success("Device approved");
      fetchData();
    } catch (err) { toast.error("Action failed"); }
  };

  const handleBlock = async (device) => {
    try {
      if (device.source === 'user_registration') {
        const id = device.id.replace('ud-', '');
        await userDevicesApi.block(id);
      } else {
        await devicesApi.block(device.id);
      }
      toast.success("Access restricted");
      fetchData();
    } catch (err) { toast.error("Action failed"); }
  };

  const handleUnblock = async (device) => {
    try {
      if (device.source === 'user_registration') {
        const id = device.id.replace('ud-', '');
        await userDevicesApi.unblock(id);
      } else {
        await devicesApi.unblock(device.id);
      }
      toast.success("Access restored");
      fetchData();
    } catch (err) { toast.error("Action failed"); }
  };

  const handleRemove = async (device) => {
    try {
      if (device.source === 'user_registration') {
        const id = device.id.replace('ud-', '');
        await userDevicesApi.delete(id);
        toast.success("External device record removed");
      } else {
        await devicesApi.delete(device.id);
        toast.success("Infrastructure node removed");
      }
      fetchData();
    } catch (err) { toast.error("Removal failed"); }
  };

  return (
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
        <SummaryCard label="Pending" value={counts.pending} tone="warning" />
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px] bg-[#0d1117]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(typeLabels).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
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
                    <p className="text-xs font-mono text-slate-400">{d.ip_address}</p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      className={cn(
                        "font-bold uppercase tracking-tighter",
                        d.status === 'BLOCKED' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                          d.status === 'VPN ACTIVE' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                            "bg-sky-500/10 text-sky-400 border-sky-500/20"
                      )}
                    >
                      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${d.status === 'BLOCKED' ? 'bg-rose-500' :
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
                        {!d.is_approved && (
                          <DropdownMenuItem onClick={() => handleApprove(d.id)}>
                            <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Approve
                          </DropdownMenuItem>
                        )}
                        {d.status !== 'BLOCKED' ? (
                          <DropdownMenuItem onClick={() => handleBlock(d)}>
                            <ShieldOff className="mr-2 h-4 w-4 text-rose-500" /> Block Access
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleUnblock(d)}>
                            <Shield className="mr-2 h-4 w-4 text-emerald-500" /> Unblock Access
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleRemove(d)} className="text-rose-500 focus:text-rose-400">
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
  );
};

export default Devices;
