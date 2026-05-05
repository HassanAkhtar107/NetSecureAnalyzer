import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

// ---------- Types ----------
export type DeviceStatus = "active" | "blocked" | "pending";
export interface Device {
  id: string;
  name: string;
  ip: string;
  mac: string;
  iconType: "laptop" | "monitor" | "smartphone" | "tv" | "server" | "unknown";
  status: DeviceStatus;
  type: string;
  lastSeen: string;
}

export interface FirewallRule {
  id: string;
  type: "allow" | "block";
  target: string;
  hits: number;
  active: boolean;
}

export interface Transfer {
  id: string;
  fromDeviceId: string;
  toDeviceId: string;
  fileName: string;
  totalSize: number; // bytes
  transferred: number; // bytes
  status: "transferring" | "completed" | "failed" | "paused";
  bandwidth: number;
  latency: number;
  throughput: number;
  packetLoss: number;
  startedAt: number;
}

export interface TransferHistory {
  id: string;
  fromName: string;
  toName: string;
  size: string;
  speed: string;
  status: "completed" | "failed";
  time: string;
}

export interface FirewallEvent {
  id: string;
  type: "blocked" | "allowed";
  ip: string;
  time: string;
  timestamp: number;
}

export interface VPNServer {
  id: number;
  country: string;
  city: string;
  flag: string;
  ping: number;
  load: number;
}

export interface ChartPoint {
  time: string;
  download: number;
  upload: number;
  latency: number;
}

export interface NetworkStats {
  download: number;
  upload: number;
  ping: number;
  jitter: number;
  packetLoss: number;
}

// ---------- Context type ----------
interface NetworkContextType {
  // Devices
  devices: Device[];
  addDevice: (name: string, ip: string, type: string) => void;
  removeDevice: (id: string) => void;
  blockDevice: (id: string) => void;
  unblockDevice: (id: string) => void;
  approveDevice: (id: string) => void;
  denyDevice: (id: string) => void;

  // Firewall
  firewallOn: boolean;
  toggleFirewall: () => void;
  firewallRules: FirewallRule[];
  addFirewallRule: (type: "allow" | "block", target: string) => void;
  removeFirewallRule: (id: string) => void;
  toggleFirewallRule: (id: string) => void;
  firewallEvents: FirewallEvent[];
  allowedTraffic: number;
  blockedTraffic: number;

  // Transfers
  activeTransfer: Transfer | null;
  transferHistory: TransferHistory[];
  startTransfer: (fromId: string, toId: string, fileName: string, sizeMB: number) => void;
  cancelTransfer: () => void;

  // VPN
  vpnConnected: boolean;
  toggleVPN: () => void;
  vpnServers: VPNServer[];
  selectedServerId: number;
  selectServer: (id: number) => void;
  vpnProtocol: number;
  setVpnProtocol: (i: number) => void;
  originalIP: string;
  vpnIP: string;

  // Live stats
  stats: NetworkStats;
  chartData: ChartPoint[];

  // Uptime
  uptime: string;
  blockedToday: number;
}

const NetworkContext = createContext<NetworkContextType | null>(null);

export function useNetwork() {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error("useNetwork must be inside NetworkProvider");
  return ctx;
}

// ---------- Helpers ----------
let _id = 100;
function uid() { return `id-${_id++}`; }

function randomIP() {
  return `192.168.1.${Math.floor(Math.random() * 200) + 10}`;
}
function randomMAC() {
  return Array.from({ length: 6 }, () =>
    Math.floor(Math.random() * 256).toString(16).padStart(2, "0").toUpperCase()
  ).join(":");
}
function formatBytes(b: number) {
  if (b >= 1e9) return `${(b / 1e9).toFixed(2)} GB`;
  if (b >= 1e6) return `${(b / 1e6).toFixed(1)} MB`;
  return `${(b / 1e3).toFixed(0)} KB`;
}
function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

// ---------- Provider ----------
export function NetworkProvider({ children }: { children: React.ReactNode }) {
  // ---- Devices ----
  const [devices, setDevices] = useState<Device[]>([
    { id: "d1", name: "My Laptop", ip: "192.168.1.2", mac: "AA:BB:CC:DD:EE:01", iconType: "laptop", status: "active", type: "Laptop", lastSeen: "Now" },
    { id: "d2", name: "Office PC", ip: "192.168.1.3", mac: "AA:BB:CC:DD:EE:02", iconType: "monitor", status: "active", type: "Desktop", lastSeen: "Now" },
    { id: "d3", name: "Smartphone", ip: "192.168.1.4", mac: "AA:BB:CC:DD:EE:03", iconType: "smartphone", status: "active", type: "Mobile", lastSeen: "Now" },
    { id: "d4", name: "Smart TV", ip: "192.168.1.5", mac: "AA:BB:CC:DD:EE:04", iconType: "tv", status: "blocked", type: "IoT", lastSeen: "2h ago" },
    { id: "d5", name: "Unknown Device", ip: "192.168.1.15", mac: "AA:BB:CC:DD:EE:05", iconType: "unknown", status: "pending", type: "Unknown", lastSeen: "5m ago" },
    { id: "d6", name: "Guest Phone", ip: "192.168.1.20", mac: "AA:BB:CC:DD:EE:06", iconType: "smartphone", status: "pending", type: "Mobile", lastSeen: "1m ago" },
    { id: "d7", name: "NAS Server", ip: "192.168.1.30", mac: "AA:BB:CC:DD:EE:07", iconType: "server", status: "active", type: "Server", lastSeen: "Now" },
  ]);

  const addDevice = useCallback((name: string, ip: string, type: string) => {
    const iconMap: Record<string, Device["iconType"]> = { Laptop: "laptop", Desktop: "monitor", Mobile: "smartphone", IoT: "tv", Server: "server" };
    setDevices(prev => [...prev, {
      id: uid(), name, ip: ip || randomIP(), mac: randomMAC(),
      iconType: iconMap[type] || "unknown", status: "active", type, lastSeen: "Now",
    }]);
  }, []);

  const removeDevice = useCallback((id: string) => setDevices(prev => prev.filter(d => d.id !== id)), []);

  const blockDevice = useCallback((id: string) => {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, status: "blocked" as const } : d));
    // Auto-add firewall rule
    const dev = devices.find(d => d.id === id);
    if (dev) {
      setFirewallRules(prev => {
        if (prev.some(r => r.target === dev.ip && r.type === "block")) return prev;
        return [...prev, { id: uid(), type: "block", target: dev.ip, hits: 0, active: true }];
      });
      addFirewallEvent("blocked", dev.ip);
    }
  }, [devices]);

  const unblockDevice = useCallback((id: string) => {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, status: "active" as const, lastSeen: "Now" } : d));
    const dev = devices.find(d => d.id === id);
    if (dev) addFirewallEvent("allowed", dev.ip);
  }, [devices]);

  const approveDevice = useCallback((id: string) => {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, status: "active" as const, lastSeen: "Now" } : d));
  }, []);

  const denyDevice = useCallback((id: string) => {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, status: "blocked" as const } : d));
    const dev = devices.find(d => d.id === id);
    if (dev) {
      setFirewallRules(prev => [...prev, { id: uid(), type: "block", target: dev.ip, hits: 0, active: true }]);
      addFirewallEvent("blocked", dev.ip);
    }
  }, [devices]);

  // ---- Firewall ----
  const [firewallOn, setFirewallOn] = useState(true);
  const [firewallRules, setFirewallRules] = useState<FirewallRule[]>([
    { id: "r1", type: "block", target: "192.168.1.15", hits: 342, active: true },
    { id: "r2", type: "allow", target: "192.168.1.0/24", hits: 1200, active: true },
    { id: "r3", type: "block", target: "10.0.0.0/8", hits: 213, active: true },
    { id: "r4", type: "allow", target: "All Outgoing", hits: 3500, active: true },
  ]);
  const [firewallEvents, setFirewallEvents] = useState<FirewallEvent[]>([
    { id: "fe1", type: "blocked", ip: "192.168.1.15", time: "2s ago", timestamp: Date.now() - 2000 },
    { id: "fe2", type: "blocked", ip: "10.0.0.8", time: "10s ago", timestamp: Date.now() - 10000 },
    { id: "fe3", type: "allowed", ip: "192.168.1.5", time: "15s ago", timestamp: Date.now() - 15000 },
    { id: "fe4", type: "blocked", ip: "192.168.1.30", time: "20s ago", timestamp: Date.now() - 20000 },
    { id: "fe5", type: "allowed", ip: "192.168.1.3", time: "25s ago", timestamp: Date.now() - 25000 },
  ]);
  const [allowedTraffic, setAllowedTraffic] = useState(2450);
  const [blockedTraffic, setBlockedTraffic] = useState(320.45);
  const [blockedToday, setBlockedToday] = useState(34);

  const toggleFirewall = useCallback(() => setFirewallOn(p => !p), []);

  const addFirewallRule = useCallback((type: "allow" | "block", target: string) => {
    setFirewallRules(prev => [...prev, { id: uid(), type, target, hits: 0, active: true }]);
  }, []);

  const removeFirewallRule = useCallback((id: string) => {
    setFirewallRules(prev => prev.filter(r => r.id !== id));
  }, []);

  const toggleFirewallRule = useCallback((id: string) => {
    setFirewallRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  }, []);

  const addFirewallEvent = useCallback((type: "blocked" | "allowed", ip: string) => {
    const now = Date.now();
    setFirewallEvents(prev => [{ id: uid(), type, ip, time: "just now", timestamp: now }, ...prev.slice(0, 19)]);
    if (type === "blocked") setBlockedToday(p => p + 1);
  }, []);

  // ---- Transfers ----
  const [activeTransfer, setActiveTransfer] = useState<Transfer | null>(null);
  const [transferHistory, setTransferHistory] = useState<TransferHistory[]>([
    { id: "th1", fromName: "My Laptop", toName: "Office PC", size: "1.82 GB", speed: "78.6 Mbps", status: "completed", time: "5m ago" },
    { id: "th2", fromName: "Smartphone", toName: "My Laptop", size: "450 MB", speed: "45.2 Mbps", status: "completed", time: "15m ago" },
    { id: "th3", fromName: "Office PC", toName: "Smart TV", size: "2.1 GB", speed: "0 Mbps", status: "failed", time: "1h ago" },
  ]);

  const startTransfer = useCallback((fromId: string, toId: string, fileName: string, sizeMB: number) => {
    // Check if target is blocked
    const toDevice = devices.find(d => d.id === toId);
    if (toDevice?.status === "blocked") {
      // Fail immediately
      const fromDevice = devices.find(d => d.id === fromId);
      setTransferHistory(prev => [{
        id: uid(), fromName: fromDevice?.name || "Unknown", toName: toDevice.name,
        size: `${sizeMB} MB`, speed: "0 Mbps", status: "failed", time: "just now",
      }, ...prev]);
      return;
    }
    setActiveTransfer({
      id: uid(), fromDeviceId: fromId, toDeviceId: toId, fileName,
      totalSize: sizeMB * 1e6, transferred: 0, status: "transferring",
      bandwidth: 60 + Math.random() * 40, latency: 8 + Math.random() * 15,
      throughput: 55 + Math.random() * 30, packetLoss: Math.random() * 0.5,
      startedAt: Date.now(),
    });
  }, [devices]);

  const cancelTransfer = useCallback(() => {
    if (activeTransfer) {
      const fromDev = devices.find(d => d.id === activeTransfer.fromDeviceId);
      const toDev = devices.find(d => d.id === activeTransfer.toDeviceId);
      setTransferHistory(prev => [{
        id: uid(), fromName: fromDev?.name || "Unknown", toName: toDev?.name || "Unknown",
        size: formatBytes(activeTransfer.totalSize), speed: `${activeTransfer.bandwidth.toFixed(1)} Mbps`,
        status: "failed", time: "just now",
      }, ...prev]);
    }
    setActiveTransfer(null);
  }, [activeTransfer, devices]);

  // ---- VPN ----
  const [vpnConnected, setVpnConnected] = useState(true);
  const [vpnServers] = useState<VPNServer[]>([
    { id: 0, country: "USA", city: "New York", flag: "🇺🇸", ping: 23, load: 45 },
    { id: 1, country: "Germany", city: "Frankfurt", flag: "🇩🇪", ping: 48, load: 62 },
    { id: 2, country: "Japan", city: "Tokyo", flag: "🇯🇵", ping: 55, load: 38 },
    { id: 3, country: "UK", city: "London", flag: "🇬🇧", ping: 35, load: 71 },
    { id: 4, country: "Singapore", city: "Singapore", flag: "🇸🇬", ping: 62, load: 55 },
  ]);
  const [selectedServerId, setSelectedServerId] = useState(0);
  const [vpnProtocol, setVpnProtocol] = useState(0);
  const [originalIP] = useState("103.86.131.5");
  const [vpnIP, setVpnIP] = useState("198.51.100.24");

  const toggleVPN = useCallback(() => setVpnConnected(p => !p), []);
  const selectServer = useCallback((id: number) => {
    setSelectedServerId(id);
    // Generate new VPN IP when server changes
    setVpnIP(`${Math.floor(Math.random() * 200) + 10}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`);
  }, []);

  // ---- Live stats ----
  const [stats, setStats] = useState<NetworkStats>({
    download: 125.6, upload: 48.7, ping: 23, jitter: 6, packetLoss: 0.35,
  });

  const [chartData, setChartData] = useState<ChartPoint[]>(() =>
    Array.from({ length: 20 }, (_, i) => ({
      time: `${String(Math.floor(i * 5 / 60)).padStart(2, "0")}:${String((i * 5) % 60).padStart(2, "0")}`,
      download: 60 + Math.random() * 90,
      upload: 20 + Math.random() * 50,
      latency: 15 + Math.random() * 80,
    }))
  );

  const chartCounter = useRef(100);

  // ---- Uptime ----
  const [startTime] = useState(Date.now() - 12 * 24 * 3600000 - 4 * 3600000 - 32 * 60000);
  const [uptime, setUptime] = useState("12d 4h 32m");

  // ---- Real-time simulation ----
  useEffect(() => {
    const interval = setInterval(() => {
      // Update stats with slight variations
      setStats(prev => ({
        download: Math.max(10, prev.download + (Math.random() - 0.5) * 15),
        upload: Math.max(5, prev.upload + (Math.random() - 0.5) * 8),
        ping: Math.max(5, prev.ping + (Math.random() - 0.5) * 6),
        jitter: Math.max(1, prev.jitter + (Math.random() - 0.5) * 3),
        packetLoss: Math.max(0, Math.min(5, prev.packetLoss + (Math.random() - 0.5) * 0.3)),
      }));

      // Update chart
      chartCounter.current++;
      const t = chartCounter.current * 5;
      setChartData(prev => {
        const next = [...prev.slice(1)];
        next.push({
          time: `${String(Math.floor(t / 60) % 60).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`,
          download: 60 + Math.random() * 90,
          upload: 20 + Math.random() * 50,
          latency: 15 + Math.random() * 80,
        });
        return next;
      });

      // Update firewall counters
      if (firewallOn) {
        setAllowedTraffic(p => p + Math.random() * 0.05);
        setBlockedTraffic(p => p + Math.random() * 0.01);

        // Random firewall events
        if (Math.random() < 0.3) {
          const isBlocked = Math.random() < 0.6;
          addFirewallEvent(isBlocked ? "blocked" : "allowed", randomIP());
          // Increment rule hits
          setFirewallRules(prev => {
            const activeRules = prev.filter(r => r.active);
            if (activeRules.length === 0) return prev;
            const randomRule = activeRules[Math.floor(Math.random() * activeRules.length)];
            return prev.map(r => r.id === randomRule.id ? { ...r, hits: r.hits + 1 } : r);
          });
        }
      }

      // Update firewall event times
      setFirewallEvents(prev => prev.map(e => ({ ...e, time: timeAgo(e.timestamp) })));

      // Progress active transfer
      setActiveTransfer(prev => {
        if (!prev || prev.status !== "transferring") return prev;
        const speed = prev.bandwidth * 1e6 / 8; // bytes per second
        const newTransferred = Math.min(prev.transferred + speed * 2, prev.totalSize);
        if (newTransferred >= prev.totalSize) {
          // Transfer complete
          return { ...prev, transferred: prev.totalSize, status: "completed" as const };
        }
        return {
          ...prev,
          transferred: newTransferred,
          bandwidth: Math.max(20, prev.bandwidth + (Math.random() - 0.5) * 10),
          throughput: Math.max(15, prev.throughput + (Math.random() - 0.5) * 8),
          latency: Math.max(3, prev.latency + (Math.random() - 0.5) * 4),
          packetLoss: Math.max(0, Math.min(2, prev.packetLoss + (Math.random() - 0.5) * 0.2)),
        };
      });

      // Update uptime
      const elapsed = Date.now() - startTime;
      const d = Math.floor(elapsed / 86400000);
      const h = Math.floor((elapsed % 86400000) / 3600000);
      const m = Math.floor((elapsed % 3600000) / 60000);
      setUptime(`${d}d ${h}h ${m}m`);
    }, 2000);

    return () => clearInterval(interval);
  }, [firewallOn, startTime, addFirewallEvent]);

  // Move completed transfer to history
  useEffect(() => {
    if (activeTransfer?.status === "completed") {
      const fromDev = devices.find(d => d.id === activeTransfer.fromDeviceId);
      const toDev = devices.find(d => d.id === activeTransfer.toDeviceId);
      const timer = setTimeout(() => {
        setTransferHistory(prev => [{
          id: uid(), fromName: fromDev?.name || "Unknown", toName: toDev?.name || "Unknown",
          size: formatBytes(activeTransfer.totalSize), speed: `${activeTransfer.bandwidth.toFixed(1)} Mbps`,
          status: "completed", time: "just now",
        }, ...prev]);
        setActiveTransfer(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [activeTransfer?.status, activeTransfer, devices]);

  return (
    <NetworkContext.Provider value={{
      devices, addDevice, removeDevice, blockDevice, unblockDevice, approveDevice, denyDevice,
      firewallOn, toggleFirewall, firewallRules, addFirewallRule, removeFirewallRule, toggleFirewallRule,
      firewallEvents, allowedTraffic, blockedTraffic,
      activeTransfer, transferHistory, startTransfer, cancelTransfer,
      vpnConnected, toggleVPN, vpnServers, selectedServerId, selectServer,
      vpnProtocol, setVpnProtocol, originalIP, vpnIP,
      stats, chartData, uptime, blockedToday,
    }}>
      {children}
    </NetworkContext.Provider>
  );
}
