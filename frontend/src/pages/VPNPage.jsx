import {motion} from "framer-motion";
import {Shield, Lock, ArrowRight} from "lucide-react";
import {useNetwork} from "@/context/NetworkContext";

const protocols = [
  { name: "WireGuard", speed: 92, latency: 23, security: "High" },
  { name: "OpenVPN", speed: 78, latency: 35, security: "Very High" },
  { name: "IPSec", speed: 85, latency: 28, security: "High" },
];

export default function VPNPage() {
  const { vpnConnected, toggleVPN, vpnServers, selectedServerId, selectServer, vpnProtocol, setVpnProtocol, originalIP, vpnIP } = useNetwork();
  const server = vpnServers[selectedServerId];
  const protocol = protocols[vpnProtocol];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">VPN</h1>
        <button onClick={toggleVPN} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${vpnConnected ? "bg-neon-green/15 text-neon-green shadow-[0_0_20px_hsl(142,71%,45%,0.2)]" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>
          <Shield className="h-4 w-4" /> {vpnConnected ? "Connected" : "Disconnected"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="glass-card p-5 col-span-1">
          <h3 className="text-sm font-semibold text-foreground mb-4">Select Server</h3>
          <div className="space-y-2">
            {vpnServers.map(s => (
              <button key={s.id} onClick={() => selectServer(s.id)} className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${selectedServerId === s.id ? "bg-primary/15 border border-primary/30 shadow-[0_0_10px_hsl(199,89%,48%,0.1)]" : "hover:bg-secondary/50"}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{s.flag}</span>
                  <div className="text-left"><p className="text-sm font-medium text-foreground">{s.country}</p><p className="text-[10px] text-muted-foreground">{s.city}</p></div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-mono font-bold ${s.ping < 30 ? "text-neon-green" : s.ping < 50 ? "text-neon-yellow" : "text-neon-orange"}`}>{s.ping} ms</p>
                  <p className="text-[10px] text-muted-foreground">Load: {s.load}%</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-2 space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold text-foreground">Connection Status</h3>
              {vpnConnected && <span className="text-sm font-mono text-neon-green flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-neon-green animate-blink-live" /> Connected</span>}
            </div>
            <div className="flex items-center justify-center gap-6 py-6">
              <div className="text-center p-4 rounded-xl bg-secondary/50">
                <p className="text-[10px] text-muted-foreground mb-1">Original IP</p>
                <p className="text-lg font-mono font-bold text-neon-orange">{originalIP}</p>
                <p className="text-[10px] text-muted-foreground">ISP: Local Provider</p>
              </div>
              <motion.div animate={vpnConnected ? { x: [0, 5, 0] } : {}} transition={{ duration: 1.5, repeat: Infinity }}>
                <ArrowRight className="h-6 w-6 text-primary" />
              </motion.div>
              <div className={`text-center p-4 rounded-xl ${vpnConnected ? "bg-neon-green/5 border border-neon-green/20" : "bg-secondary/50"}`}>
                <p className="text-[10px] text-muted-foreground mb-1">VPN IP</p>
                <p className={`text-lg font-mono font-bold ${vpnConnected ? "text-neon-green" : "text-muted-foreground"}`}>{vpnConnected ? vpnIP : "—"}</p>
                <p className="text-[10px] text-muted-foreground">{vpnConnected ? `${server.city}, ${server.country}` : "Not connected"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mt-4">
              <div>
                <h4 className="text-xs text-muted-foreground mb-3">Speed Comparison</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1"><span className="text-muted-foreground">Before VPN</span><span className="text-foreground font-mono">125 Mbps</span></div>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden"><motion.div className="h-full bg-primary rounded-full" initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 1 }} /></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1"><span className="text-muted-foreground">After VPN</span><span className="text-foreground font-mono">{vpnConnected ? Math.round(125 * protocol.speed / 100) : "—"} Mbps</span></div>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden"><motion.div className="h-full bg-neon-orange rounded-full" initial={{ width: 0 }} animate={{ width: vpnConnected ? `${protocol.speed}%` : "0%" }} transition={{ duration: 1, delay: 0.3 }} /></div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-xs text-muted-foreground mb-3">Latency Comparison</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1"><span className="text-muted-foreground">Before VPN</span><span className="text-foreground font-mono">12 ms</span></div>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden"><motion.div className="h-full bg-primary rounded-full" initial={{ width: 0 }} animate={{ width: "20%" }} transition={{ duration: 1 }} /></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1"><span className="text-muted-foreground">After VPN</span><span className="text-foreground font-mono">{vpnConnected ? server.ping : "—"} ms</span></div>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden"><motion.div className="h-full bg-neon-orange rounded-full" initial={{ width: 0 }} animate={{ width: vpnConnected ? `${Math.min(server.ping, 100)}%` : "0%" }} transition={{ duration: 1, delay: 0.3 }} /></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">VPN Protocol</h3>
            <div className="grid grid-cols-3 gap-3">
              {protocols.map((p, i) => (
                <button key={p.name} onClick={() => setVpnProtocol(i)} className={`p-4 rounded-xl text-left transition-all ${vpnProtocol === i ? "bg-primary/15 border border-primary/30" : "bg-secondary/30 border border-border hover:bg-secondary/50"}`}>
                  <Lock className={`h-5 w-5 mb-2 ${vpnProtocol === i ? "text-primary" : "text-muted-foreground"}`} />
                  <p className="text-sm font-semibold text-foreground">{p.name}</p>
                  <div className="mt-2 space-y-1 text-[10px] text-muted-foreground">
                    <p>Speed: <span className="text-foreground">{p.speed}%</span></p>
                    <p>Latency: <span className="text-foreground">+{p.latency}ms</span></p>
                    <p>Security: <span className="text-neon-green">{p.security}</span></p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
