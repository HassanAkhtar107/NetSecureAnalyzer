import {
  Download, Upload, Activity, Zap, AlertTriangle,
  Shield, Plus, Wifi, XCircle, CheckCircle2, MoreVertical
} from "lucide-react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from "recharts";
import { motion } from "framer-motion";
import AnimatedCounter from "@/components/AnimatedCounter";
import LiveIndicator from "@/components/LiveIndicator";
import { useNetwork } from "@/context/NetworkContext";
import { getDeviceIcon } from "@/lib/deviceIcons";

export default function DashboardPage() {
  const {
    stats, chartData, devices, firewallOn, firewallRules, firewallEvents,
    vpnConnected, toggleVPN, vpnServers, selectedServerId, selectServer,
    activeTransfer, allowedTraffic, blockedTraffic, vpnIP, originalIP,
  } = useNetwork();

  const statCards = [
    { label: "Download", value: stats.download, suffix: " Mbps", decimals: 1, icon: Download, color: "text-primary" },
    { label: "Upload", value: stats.upload, suffix: " Mbps", decimals: 1, icon: Upload, color: "text-neon-green" },
    { label: "Ping", value: stats.ping, suffix: " ms", decimals: 0, icon: Activity, color: "text-neon-blue" },
    { label: "Jitter", value: stats.jitter, suffix: " ms", decimals: 0, icon: Zap, color: "text-neon-yellow" },
    { label: "Packet Loss", value: stats.packetLoss, suffix: "%", decimals: 2, icon: AlertTriangle, color: "text-neon-red" },
  ];

  const topDevices = devices.slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <LiveIndicator />
      </div>

      <div className="flex gap-6">
        <div className="flex-1 space-y-6 min-w-0">
          {/* Stats */}
          <div className="grid grid-cols-5 gap-4">
            {statCards.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-4 flex items-center gap-3">
                <div className={`p-2.5 rounded-xl bg-secondary/80 ${s.color}`}><s.icon className="h-5 w-5" /></div>
                <div>
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold text-foreground">
                    <AnimatedCounter value={s.value} decimals={s.decimals} />
                    <span className="text-xs font-normal text-muted-foreground">{s.suffix}</span>
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-6">
            <div className="glass-card p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-foreground">Bandwidth <span className="text-muted-foreground font-normal">(Real-time)</span></h3>
                <div className="flex gap-3 text-[10px]">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> Download</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-neon-green" /> Upload</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="dlGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(199,89%,48%)" stopOpacity={0.3} /><stop offset="100%" stopColor="hsl(199,89%,48%)" stopOpacity={0} /></linearGradient>
                    <linearGradient id="ulGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(142,71%,45%)" stopOpacity={0.3} /><stop offset="100%" stopColor="hsl(142,71%,45%)" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,33%,16%)" />
                  <XAxis dataKey="time" tick={{ fill: "hsl(215,20%,55%)", fontSize: 10 }} axisLine={false} />
                  <YAxis tick={{ fill: "hsl(215,20%,55%)", fontSize: 10 }} axisLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(222,47%,8%)", border: "1px solid hsl(217,33%,20%)", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="download" stroke="hsl(199,89%,48%)" fill="url(#dlGrad)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="upload" stroke="hsl(142,71%,45%)" fill="url(#ulGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="glass-card p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-foreground">Latency <span className="text-muted-foreground font-normal">(Real-time)</span></h3>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="latGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(270,76%,60%)" stopOpacity={0.3} /><stop offset="100%" stopColor="hsl(270,76%,60%)" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,33%,16%)" />
                  <XAxis dataKey="time" tick={{ fill: "hsl(215,20%,55%)", fontSize: 10 }} axisLine={false} />
                  <YAxis tick={{ fill: "hsl(215,20%,55%)", fontSize: 10 }} axisLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(222,47%,8%)", border: "1px solid hsl(217,33%,20%)", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="latency" stroke="hsl(270,76%,60%)" fill="url(#latGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Devices + Data Transfer */}
          <div className="grid grid-cols-2 gap-6">
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-1">Devices</h3>
              <div className="flex gap-4 text-[11px] mb-4">
                <span>Total <strong className="text-foreground">{devices.length}</strong></span>
                <span>Active <strong className="text-neon-green">{devices.filter(d => d.status === "active").length}</strong></span>
                <span>Blocked <strong className="text-destructive">{devices.filter(d => d.status === "blocked").length}</strong></span>
                <span>Pending <strong className="text-neon-yellow">{devices.filter(d => d.status === "pending").length}</strong></span>
              </div>
              <div className="space-y-2">
                {topDevices.map((d, i) => {
                  const Icon = getDeviceIcon(d.iconType);
                  return (
                    <motion.div key={d.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-secondary/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs font-medium text-foreground">{d.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{d.ip}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {d.status === "active" ? (
                          <span className="flex items-center gap-1 text-[10px] text-neon-green"><Wifi className="h-3 w-3" /> Active</span>
                        ) : d.status === "blocked" ? (
                          <span className="flex items-center gap-1 text-[10px] text-destructive"><XCircle className="h-3 w-3" /> Blocked</span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] text-neon-yellow">Pending</span>
                        )}
                        <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Data Transfer summary */}
            <div className="glass-card p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-foreground">Data Transfer</h3>
              </div>
              {activeTransfer ? (
                <>
                  <div className="flex items-center justify-center gap-4 py-4">
                    <div className="flex flex-col items-center gap-1">
                      <div className="p-3 rounded-xl bg-secondary/80"><Download className="h-5 w-5 text-primary" /></div>
                      <span className="text-[10px] text-muted-foreground">{devices.find(d => d.id === activeTransfer.fromDeviceId)?.name}</span>
                    </div>
                    <div className="flex-1 relative h-1 bg-secondary rounded-full overflow-hidden">
                      <motion.div className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-neon-green rounded-full" style={{ width: `${(activeTransfer.transferred / activeTransfer.totalSize) * 100}%` }} />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="p-3 rounded-xl bg-secondary/80"><Upload className="h-5 w-5 text-neon-green" /></div>
                      <span className="text-[10px] text-muted-foreground">{devices.find(d => d.id === activeTransfer.toDeviceId)?.name}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div><p className="text-[10px] text-muted-foreground">Bandwidth</p><p className="text-sm font-bold text-primary">{activeTransfer.bandwidth.toFixed(1)}<span className="text-[10px] font-normal text-muted-foreground"> Mbps</span></p></div>
                    <div><p className="text-[10px] text-muted-foreground">Latency</p><p className="text-sm font-bold text-neon-green">{activeTransfer.latency.toFixed(0)}<span className="text-[10px] font-normal text-muted-foreground"> ms</span></p></div>
                    <div><p className="text-[10px] text-muted-foreground">Throughput</p><p className="text-sm font-bold text-neon-yellow">{activeTransfer.throughput.toFixed(1)}<span className="text-[10px] font-normal text-muted-foreground"> Mbps</span></p></div>
                    <div><p className="text-[10px] text-muted-foreground">Loss</p><p className="text-sm font-bold text-destructive">{activeTransfer.packetLoss.toFixed(2)}<span className="text-[10px] font-normal text-muted-foreground">%</span></p></div>
                  </div>
                  <div className="mt-3">
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary via-neon-green to-primary rounded-full transition-all duration-500" style={{ width: `${(activeTransfer.transferred / activeTransfer.totalSize) * 100}%` }} />
                    </div>
                    <p className="text-right text-[10px] text-muted-foreground mt-1">{Math.round((activeTransfer.transferred / activeTransfer.totalSize) * 100)}%</p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Activity className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-xs">No active transfer</p>
                </div>
              )}
            </div>
          </div>

          {/* Firewall + Topology */}
          <div className="grid grid-cols-2 gap-6">
            <div className="glass-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-sm font-semibold text-foreground">Firewall</h3>
                <span className={`text-[10px] font-semibold ${firewallOn ? "text-neon-green" : "text-destructive"}`}>{firewallOn ? "ON" : "OFF"}</span>
              </div>
              <div className="flex gap-6">
                <div className="flex flex-col items-center gap-2">
                  <Shield className={`h-12 w-12 ${firewallOn ? "text-neon-green" : "text-muted-foreground"}`} />
                  <div className="text-center"><p className="text-[10px] text-muted-foreground">Allowed</p><p className="text-lg font-bold text-neon-green">{allowedTraffic.toFixed(2)} <span className="text-xs">TB</span></p></div>
                  <div className="text-center"><p className="text-[10px] text-muted-foreground">Blocked</p><p className="text-lg font-bold text-destructive">{blockedTraffic.toFixed(2)} <span className="text-xs">GB</span></p></div>
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-medium text-muted-foreground mb-2">Top Rules</h4>
                  <div className="space-y-2">
                    {firewallRules.slice(0, 4).map(r => (
                      <div key={r.id} className="flex items-center justify-between text-[11px]">
                        <span className={r.type === "block" ? "text-destructive" : "text-neon-green"}>● {r.type === "block" ? "Block" : "Allow"} {r.target}</span>
                        <span className="text-muted-foreground">{r.hits >= 1000 ? `${(r.hits / 1000).toFixed(1)}K` : r.hits}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Network Topology</h3>
              <div className="relative h-52">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }} className="p-3 rounded-full bg-primary/20 border-2 border-primary shadow-[0_0_20px_hsl(199,89%,48%,0.3)]">
                    <Wifi className="h-5 w-5 text-primary" />
                  </motion.div>
                  <p className="text-[9px] text-muted-foreground text-center mt-1">Router</p>
                </div>
                {devices.slice(0, 5).map((d, i) => {
                  const Icon = getDeviceIcon(d.iconType);
                  const positions = [{ x: "10%", y: "20%" }, { x: "70%", y: "10%" }, { x: "80%", y: "70%" }, { x: "10%", y: "75%" }, { x: "65%", y: "85%" }];
                  const pos = positions[i];
                  return (
                    <motion.div key={d.id} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.1 }} className="absolute flex flex-col items-center" style={{ left: pos.x, top: pos.y }}>
                      <div className={`p-2 rounded-lg bg-secondary/80 ${d.status === "active" ? "text-neon-green" : d.status === "blocked" ? "text-destructive" : "text-neon-yellow"}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-[8px] text-muted-foreground mt-0.5">{d.name}</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-72 space-y-6 flex-shrink-0">
          {/* VPN */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /><span className="text-sm font-semibold text-foreground">VPN</span></div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold ${vpnConnected ? "text-neon-green" : "text-muted-foreground"}`}>{vpnConnected ? "ON" : "OFF"}</span>
                <button onClick={toggleVPN} className={`w-10 h-5 rounded-full relative transition-colors ${vpnConnected ? "bg-neon-green/30" : "bg-secondary"}`}>
                  <motion.div className={`absolute top-0.5 h-4 w-4 rounded-full ${vpnConnected ? "bg-neon-green shadow-[0_0_8px_hsl(142,71%,45%)]" : "bg-muted-foreground"}`} animate={{ left: vpnConnected ? 22 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                </button>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mb-3">Select Server</p>
            <div className="space-y-1.5">
              {vpnServers.map(s => (
                <button key={s.id} onClick={() => selectServer(s.id)} className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs transition-all ${selectedServerId === s.id ? "bg-primary/15 border border-primary/30" : "hover:bg-secondary/50"}`}>
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{s.flag}</span>
                    <div className="text-left"><p className="font-medium text-foreground">{s.country}</p><p className="text-[10px] text-muted-foreground">{s.city}</p></div>
                  </div>
                  <span className={`font-mono font-bold ${s.ping < 30 ? "text-neon-green" : s.ping < 50 ? "text-neon-yellow" : "text-neon-orange"}`}>{s.ping} ms</span>
                </button>
              ))}
            </div>
          </div>

          {/* Firewall Events */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-destructive mb-3 flex items-center gap-2"><Shield className="h-4 w-4" /> Recent Firewall Events</h3>
            <div className="space-y-2">
              {firewallEvents.slice(0, 5).map((e) => (
                <motion.div key={e.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    {e.type === "blocked" ? <XCircle className="h-3 w-3 text-destructive" /> : <CheckCircle2 className="h-3 w-3 text-neon-green" />}
                    <span className={e.type === "blocked" ? "text-destructive" : "text-neon-green"}>{e.type === "blocked" ? "Blocked" : "Allowed"}</span>
                    <span className="text-muted-foreground font-mono">{e.ip}</span>
                  </div>
                  <span className="text-muted-foreground">{e.time}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* VPN Status */}
          {vpnConnected && (
            <div className="glass-card p-5">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[11px] text-muted-foreground">Connected</span>
                <span className="text-sm font-mono font-bold text-neon-green animate-blink-live">●</span>
              </div>
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="text-center"><p className="text-[10px] text-muted-foreground">IP Before</p><p className="text-xs font-mono font-bold text-neon-orange">{originalIP}</p></div>
                <span className="text-muted-foreground">→</span>
                <div className="text-center"><p className="text-[10px] text-muted-foreground">IP After</p><p className="text-xs font-mono font-bold text-neon-green">{vpnIP}</p></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
