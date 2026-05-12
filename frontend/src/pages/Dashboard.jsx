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
import { networksApi, devicesApi, firewallApi, userDevicesApi } from '../api';

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

  // Simulated metrics generator
  const generateMetric = () => ({
    timestamp: new Date().toLocaleTimeString(),
    download: 150 + Math.random() * 50,
    upload: 80 + Math.random() * 20,
    ping: 12 + Math.random() * 5,
    jitter: 2 + Math.random() * 3,
    packetLoss: Math.random() * 0.5
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dRes, eRes, udRes] = await Promise.all([
          devicesApi.list(),
          firewallApi.logs(),
          userDevicesApi.list()
        ]);

        // Find current device for SecurityFlow
        const fingerprint = localStorage.getItem('device_fingerprint');
        const myDev = udRes.data.find(d => d.device_id === fingerprint);
        setCurrentDevice(myDev);

        // Combine devices and user devices for the list
        const allDevs = [
          ...(Array.isArray(dRes.data) ? dRes.data : []),
          ...(Array.isArray(udRes.data) ? udRes.data.map(ud => ({
            id: `ud_${ud.id}`,
            name: ud.device_name || ud.user_email,
            ip: ud.ip_address,
            status: ud.is_blocked ? 'Blocked' : (ud.vpn_status ? 'VPN Active' : 'Active'),
            type: 'Laptop' // Default icon
          })) : [])
        ];

        setDevices(allDevs);

        if (Array.isArray(eRes.data)) {
          setEvents(eRes.data.slice(0, 10));
        }
      } catch (err) {
        console.error("Dashboard fetch error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const poll = setInterval(fetchData, 10000);

    // Initial metrics
    setMetrics(Array.from({ length: 20 }, generateMetric));

    // Polling simulation for charts
    const interval = setInterval(() => {
      setMetrics(prev => [...prev.slice(-19), generateMetric()]);
    }, 3000);

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
        <div className="lg:col-span-1 bg-[#16191f] border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-white">Managed Devices</h3>
            <button onClick={() => navigate('/devices')} className="text-xs font-bold text-blue-500 hover:underline">View All</button>
          </div>
          <div className="p-2">
            {devices.slice(0, 5).map((device, idx) => (
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
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${device.status === 'Active' ? "bg-blue-500/10 text-blue-500" :
                    device.status === 'Blocked' ? "bg-red-500/10 text-red-500" :
                      "bg-orange-500/10 text-orange-500"
                    }`}>
                    {device.status || 'Pending'}
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
        <div className="lg:col-span-1 bg-[#16191f] border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-white">Recent Firewall Events</h3>
            <Activity className="w-4 h-4 text-slate-500" />
          </div>
          <div className="p-2">
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
        <div className="lg:col-span-1 bg-[#16191f] border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <h3 className="font-bold mb-1 text-white">Impact Analysis</h3>
          <p className="text-xs text-slate-500 mb-6 font-medium">How firewall rules affect throughput.</p>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Throughput Impact</span>
                <span className="text-xs font-bold text-red-500">-8%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-red-500" style={{ width: '85%', transition: 'width 1s ease-in-out' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Latency Overhead</span>
                <span className="text-xs font-bold text-blue-500">+12%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: '60%', transition: 'width 1s ease-in-out' }} />
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-slate-800/30 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300">Active Rules</span>
              <span className="text-xs font-bold text-white">142</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Last updated</span>
              <span className="text-[10px] font-bold text-slate-600 uppercase">2 mins ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
