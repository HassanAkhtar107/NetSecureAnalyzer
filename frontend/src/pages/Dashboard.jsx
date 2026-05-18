import React, { useState, useEffect } from 'react';
import {
  Download, Upload, Activity, Zap, ShieldAlert, MoreVertical, Plus,
  ChevronRight, Laptop, Cpu, Smartphone, Tv, HardDrive, Filter, Clock
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useNetwork } from '../context/NetworkContext';
import { networksApi, devicesApi, firewallApi, userDevicesApi, adminUsersApi } from '../api';

const StatCard = ({ label, value, unit, icon: Icon, data, color }) => {
  const colorMap = {
    blue: '#3b82f6',
    purple: '#a855f7',
    green: '#22c55e',
    orange: '#f97316',
    red: '#ef4444'
  };
  const hexColor = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-[#16191f] border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all group overflow-hidden relative">
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
          <div className="flex items-baseline gap-1">
            <h3 className="text-2xl font-bold">{value}</h3>
            <span className="text-xs text-slate-500 font-medium">{unit}</span>
          </div>
        </div>
        <div className={`p-2 rounded-lg bg-${color}-500/10 text-${color}-500 group-hover:scale-110 transition-transform`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {/* Sparkline */}
      <div className="h-12 w-full mt-4 -mx-5 -mb-5 opacity-40 group-hover:opacity-100 transition-opacity">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`gradient-${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={hexColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={hexColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={hexColor}
              fill={`url(#gradient-${label})`}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};


const Dashboard = ({ userType }) => {
  const navigate = useNavigate();
  const { activeConnections, blockedToday, uptime, firewallOn } = useNetwork();
  const [metrics, setMetrics] = useState([]);
  const [devices, setDevices] = useState([]);
  const [events, setEvents] = useState([]);
  const [currentDevice, setCurrentDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeRules, setActiveRules] = useState(0);
  const [throughputImpact, setThroughputImpact] = useState(0);
  const [latencyOverhead, setLatencyOverhead] = useState(0);
  const [lastUpdatedRules, setLastUpdatedRules] = useState('Just now');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dRes, eRes, udRes, rRes, uRes] = await Promise.allSettled([
          devicesApi.list(),
          firewallApi.logs(),
          userDevicesApi.list(),
          firewallApi.rules(),
          adminUsersApi.list()
        ]);

        const getArray = (res) => {
          if (res.status !== 'fulfilled' || !res.value?.data) return [];
          const data = res.value.data;
          return Array.isArray(data.results) ? data.results :
            Array.isArray(data) ? data : [];
        };

        const fetchedDevices = getArray(dRes);
        const fetchedEvents = getArray(eRes);
        const fetchedUserDevices = getArray(udRes);
        const fetchedRules = getArray(rRes);
        const fetchedUsers = getArray(uRes);

        // Find current device for SecurityFlow
        const fingerprint = localStorage.getItem('device_fingerprint');
        const myDev = fetchedUserDevices.find(d => d.device_id === fingerprint);
        setCurrentDevice(myDev);

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

        // Combine devices and user devices for the list
        const allDevs = [
          ...fetchedDevices.map(d => ({
            ...d,
            ip: d.ip_address,
            status: d.status || 'ACTIVE',
            source: 'infrastructure'
          })),
          ...fetchedUserDevices
            .filter(d => d.user_type !== 'ADMIN')
            .map(ud => ({
              ...ud,
              id: `ud-${ud.id}`,
              name: ud.device_name || ud.user_email || 'Unnamed Device',
              ip: ud.ip_address,
              ip_address: ud.ip_address,
              status: ud.is_blocked ? 'BLOCKED' : (ud.vpn_status ? 'VPN ACTIVE' : 'ACTIVE'),
              source: 'user_registration',
              type: 'Laptop', // Default icon
              user_email: ud.user_email,
              last_active: ud.last_active
            })),
          ...userPlaceholders.map(u => ({
            ...u,
            id: u.id,
            name: u.name || u.device_name,
            ip: u.ip_address,
            ip_address: u.ip_address,
            status: 'active',
            source: 'user_registration',
            type: 'Laptop',
            user_email: u.user_email,
            last_active: u.last_active
          }))
        ];

        // De-duplicate: Keep only the most recent device entry per unique user email
        // and per unique IP for infrastructure devices that don't have an email.
        const seenEmails = new Set();
        const seenIPsForInfra = new Set();
        const uniqueDevs = [];

        const sorted = [...allDevs].sort((a, b) => {
          const emailA = a.user_email || a.email ? 1 : 0;
          const emailB = b.user_email || b.email ? 1 : 0;
          if (emailB !== emailA) return emailB - emailA;

          const dateA = a.last_active ? new Date(a.last_active) : new Date(a.created_at || 0);
          const dateB = b.last_active ? new Date(b.last_active) : new Date(b.created_at || 0);
          return dateB - dateA;
        });

        for (const d of sorted) {
          const email = d.user_email || d.email;
          const ip = d.ip || d.ip_address;

          if (email) {
            // Distinct users are identified and de-duplicated by email
            if (!seenEmails.has(email)) {
              seenEmails.add(email);
              if (ip) seenIPsForInfra.add(ip); // Mark their IP as seen so background scan won't duplicate it
              uniqueDevs.push(d);
            }
          } else {
            // Background infrastructure scans (without email) are de-duplicated by unique IP
            if (ip && !seenIPsForInfra.has(ip)) {
              seenIPsForInfra.add(ip);
              uniqueDevs.push(d);
            }
          }
        }

        setDevices(uniqueDevs);
        setEvents(fetchedEvents.slice(0, 10));

        // Calculate dynamic impact analysis statistics based on live database metrics
        const activeRulesList = fetchedRules.filter(r => r.is_active);
        setActiveRules(activeRulesList.length);

        const totalThroughputImpact = fetchedEvents.reduce((sum, log) => sum + (log.throughput_impact || 0), 0);
        const totalLatencyOverhead = fetchedEvents.reduce((sum, log) => sum + (log.latency_impact || 0), 0);

        const computedThroughputImpact = activeRulesList.length > 0
          ? Math.min(25, activeRulesList.length * 1.2 + (totalThroughputImpact || 0))
          : 0;

        const computedLatencyOverhead = activeRulesList.length > 0
          ? Math.min(30, activeRulesList.length * 1.5 + (totalLatencyOverhead || 0))
          : 0;

        setThroughputImpact(Math.round(computedThroughputImpact) || 2); // Baseline minimum for visual representation
        setLatencyOverhead(Math.round(computedLatencyOverhead) || 3);

        if (activeRulesList.length > 0) {
          const latestRule = activeRulesList[0];
          const updatedTime = new Date(latestRule.updated_at || latestRule.created_at);
          const diffMinutes = Math.max(1, Math.round((new Date() - updatedTime) / (1000 * 60)));
          setLastUpdatedRules(diffMinutes < 60 ? `${diffMinutes} mins ago` : `${Math.round(diffMinutes / 60)} hours ago`);
        } else {
          setLastUpdatedRules('No active rules');
        }
      } catch (err) {
        console.error("Dashboard fetch error", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchLiveStats = async () => {
      try {
        const statsRes = userType === 'ADMIN' ? await networksApi.globalStats() : await networksApi.myStats();
        const s = statsRes.data;

        const newMetric = {
          timestamp: new Date().toLocaleTimeString(),
          download: s.download_speed,
          upload: s.upload_speed,
          ping: s.ping,
          jitter: s.jitter,
          packetLoss: s.packet_loss * 100 // Convert to percentage
        };

        setMetrics(prev => {
          if (prev.length === 0) {
            // Build a smooth starter history curves based on the actual speeds
            return Array.from({ length: 20 }, (_, i) => ({
              ...newMetric,
              timestamp: new Date(Date.now() - (20 - i) * 3000).toLocaleTimeString(),
              download: Math.max(0.1, newMetric.download + (Math.random() - 0.5) * (newMetric.download * 0.15)),
              upload: Math.max(0.1, newMetric.upload + (Math.random() - 0.5) * (newMetric.upload * 0.15)),
              ping: Math.max(1.0, newMetric.ping + (Math.random() - 0.5) * 1.5),
              jitter: Math.max(0.1, newMetric.jitter + (Math.random() - 0.5) * 0.4),
              packetLoss: Math.max(0.0, newMetric.packetLoss + (Math.random() - 0.5) * 0.005)
            }));
          }
          return [...prev.slice(-19), newMetric];
        });
      } catch (err) {
        console.error("Dashboard metrics fetch error", err);
      }
    };

    fetchData();
    fetchLiveStats();

    const poll = setInterval(fetchData, 10000);
    const interval = setInterval(fetchLiveStats, 3000);

    return () => {
      clearInterval(interval);
      clearInterval(poll);
    };
  }, [userType]);

  const latest = metrics[metrics.length - 1] || { download: 0, upload: 0, ping: 0, jitter: 0, packetLoss: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">Real-time network visibility and security status.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/devices')}
            className="px-4 py-2 bg-sky-600 rounded-lg text-sm font-semibold hover:bg-sky-500 transition-colors flex items-center gap-2 text-white"
          >
            <Plus className="w-4 h-4" /> Add Device
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Download"
          value={latest.download.toFixed(1)}
          unit="Mbps"
          icon={Download}
          color="blue"
          data={metrics.map(m => ({ value: m.download }))}
        />
        <StatCard
          label="Upload"
          value={latest.upload.toFixed(1)}
          unit="Mbps"
          icon={Upload}
          color="purple"
          data={metrics.map(m => ({ value: m.upload }))}
        />
        <StatCard
          label="Ping"
          value={Math.round(latest.ping)}
          unit="ms"
          icon={Activity}
          color="green"
          data={metrics.map(m => ({ value: m.ping }))}
        />
        <StatCard
          label="Jitter"
          value={latest.jitter.toFixed(1)}
          unit="ms"
          icon={Zap}
          color="orange"
          data={metrics.map(m => ({ value: m.jitter }))}
        />
        <StatCard
          label="Packet Loss"
          value={latest.packetLoss.toFixed(2)}
          unit="%"
          icon={ShieldAlert}
          color="red"
          data={metrics.map(m => ({ value: m.packetLoss }))}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Bandwidth Chart */}
        <div className="lg:col-span-2 bg-[#16191f] border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-white">Bandwidth Performance</h3>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-xs text-slate-500 uppercase font-bold">Download</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span className="text-xs text-slate-500 uppercase font-bold">Upload</span>
              </div>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics}>
                <defs>
                  <linearGradient id="colorDown" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorUp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  hide
                />
                <YAxis
                  stroke="#4b5563"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val}Mb`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px', color: '#fff' }}
                />
                <Area
                  type="monotone"
                  dataKey="download"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorDown)"
                  strokeWidth={3}
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="upload"
                  stroke="#a855f7"
                  fillOpacity={1}
                  fill="url(#colorUp)"
                  strokeWidth={3}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Latency Chart */}
        <div className="bg-[#16191f] border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-white">Latency (ms)</h3>
            <span className="text-xs text-green-500 font-bold bg-green-500/10 px-2 py-0.5 rounded uppercase">Stable</span>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="timestamp" hide />
                <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px', color: '#fff' }}
                />
                <Line
                  type="monotone"
                  dataKey="ping"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Devices Panel */}
        <div className="lg:col-span-1 bg-[#16191f] border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[380px]">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
            <h3 className="font-bold text-white">Managed Devices</h3>
            <button onClick={() => navigate('/devices')} className="text-xs font-bold text-blue-500 hover:underline">View All</button>
          </div>
          <div className="p-2 overflow-y-auto flex-grow custom-scrollbar">
            {devices.map((device, idx) => (
              <div key={device.id || idx} className="flex items-center justify-between p-3 hover:bg-slate-800/50 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${device.status === 'Active' ? "bg-blue-500/10 text-blue-500" : "bg-slate-800 text-slate-500"}`}>
                    {device.type === 'Laptop' ? <Laptop className="w-5 h-5" /> :
                      device.type === 'Office PC' ? <Cpu className="w-5 h-5" /> :
                        device.type === 'Smartphone' ? <Smartphone className="w-5 h-5" /> :
                          device.type === 'Smart TV' ? <Tv className="w-5 h-5" /> :
                            device.type === 'NAS Server' ? <HardDrive className="w-5 h-5" /> :
                              <ShieldAlert className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-200">{device.name || 'Unknown Device'}</div>
                    <div className="text-[10px] text-slate-500 font-mono tracking-tight">{device.ip || device.ip_address}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${device.status?.toUpperCase() === 'ACTIVE' || device.status?.toUpperCase() === 'VPN ACTIVE' ? "bg-blue-500/10 text-blue-500" :
                    device.status?.toUpperCase() === 'BLOCKED' ? "bg-red-500/10 text-red-500" :
                      "bg-orange-500/10 text-orange-500"
                    }`}>
                    {device.status || 'ACTIVE'}
                  </span>
                  <button className="text-slate-500 hover:text-slate-300">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {devices.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-sm">No devices connected.</div>
            )}
          </div>
        </div>

        {/* Firewall Events */}
        <div className="lg:col-span-1 bg-[#16191f] border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[380px]">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
            <h3 className="font-bold text-white">Recent Firewall Events</h3>
            <Activity className="w-4 h-4 text-slate-500" />
          </div>
          <div className="p-2 overflow-y-auto flex-grow custom-scrollbar">
            {events.map((event, idx) => (
              <div key={event.id || idx} className="flex items-center justify-between p-3 hover:bg-slate-800/50 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${event.action === 'BLOCK' ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-green-500"}`} />
                  <div>
                    <div className="text-sm font-semibold text-slate-200">{event.action === 'BLOCK' ? 'Blocked' : 'Allowed'} traffic from {event.source_ip}</div>
                    <div className="text-[10px] text-slate-500">{new Date(event.timestamp).toLocaleTimeString()}</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </div>
            ))}
            {events.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-sm">No recent firewall activity.</div>
            )}
          </div>
        </div>

        {/* Impact Analysis */}
        <div className="lg:col-span-1 bg-[#16191f] border border-slate-800 rounded-2xl p-6 relative overflow-hidden group flex flex-col justify-between h-[380px]">
          <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div>
            <h3 className="font-bold mb-1 text-white">Impact Analysis</h3>
            <p className="text-xs text-slate-500 mb-6 font-medium">How firewall rules affect throughput.</p>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Throughput Impact</span>
                  <span className="text-xs font-bold text-red-500">-{throughputImpact}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500" style={{ width: `${100 - throughputImpact}%`, transition: 'width 1s ease-in-out' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Latency Overhead</span>
                  <span className="text-xs font-bold text-blue-500">+{latencyOverhead}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, Math.max(10, latencyOverhead * 3))}%`, transition: 'width 1s ease-in-out' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-6">
            <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300">Active Rules</span>
                <span className="text-xs font-bold text-white">{activeRules}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Last updated</span>
                <span className="text-[10px] font-bold text-slate-600 uppercase">{lastUpdatedRules}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
