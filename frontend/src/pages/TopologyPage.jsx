import {motion} from "framer-motion";
import {Wifi, Shield, Lock, Server} from "lucide-react";
import {useNetwork} from "@/context/NetworkContext";
import {getDeviceIcon} from "@/lib/deviceIcons";

export default function TopologyPage() {
  const { devices, vpnConnected, firewallOn } = useNetwork();

  const positions = [
    { x: 15, y: 25 }, { x: 75, y: 15 }, { x: 80, y: 70 },
    { x: 15, y: 75 }, { x: 55, y: 85 }, { x: 35, y: 85 }, { x: 85, y: 45 },
  ];

  const displayDevices = devices.slice(0, 7);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Network Topology</h1>
        <div className="flex gap-3 text-xs">
          {[
            { label: "Active", color: "bg-neon-green" },
            { label: "Blocked", color: "bg-destructive" },
            { label: "VPN", color: "bg-neon-purple" },
            { label: "Firewall", color: "bg-neon-orange" },
            { label: "Pending", color: "bg-neon-yellow" },
          ].map(l => (
            <span key={l.label} className="flex items-center gap-1.5 text-muted-foreground">
              <span className={`h-2 w-2 rounded-full ${l.color}`} /> {l.label}
            </span>
          ))}
        </div>
      </div>

      <div className="glass-card p-6 relative" style={{ height: "70vh" }}>
        {/* SVG lines from router to devices */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          {displayDevices.map((d, i) => {
            const pos = positions[i];
            const color = d.status === "active" ? "hsl(142,71%,45%)" : d.status === "blocked" ? "hsl(0,84%,60%)" : "hsl(45,93%,58%)";
            return (
              <line key={d.id} x1="50%" y1="50%" x2={`${pos.x}%`} y2={`${pos.y}%`}
                stroke={color} strokeWidth={2} strokeDasharray={d.status !== "active" ? "6 4" : undefined} opacity={0.4} />
            );
          })}
          {/* Firewall line */}
          {firewallOn && <line x1="50%" y1="50%" x2="65%" y2="38%" stroke="hsl(25,95%,53%)" strokeWidth={2} opacity={0.5} />}
          {/* VPN line */}
          {vpnConnected && (
            <>
              <line x1="65%" y1="38%" x2="90%" y2="20%" stroke="hsl(270,76%,60%)" strokeWidth={2} opacity={0.5} />
            </>
          )}
        </svg>

        {/* Router center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ zIndex: 1 }}>
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}
            className="p-4 rounded-full bg-primary/20 border-2 border-primary shadow-[0_0_25px_hsl(199,89%,48%,0.3)]">
            <Wifi className="h-6 w-6 text-primary" />
          </motion.div>
          <p className="text-[10px] text-muted-foreground text-center mt-1 font-medium">Router</p>
        </div>

        {/* Firewall node */}
        {firewallOn && (
          <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} className="absolute flex flex-col items-center group" style={{ left: "65%", top: "38%", transform: "translate(-50%, -50%)", zIndex: 1 }}>
            <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }}
              className="p-3 rounded-2xl bg-neon-orange/10 border-2 border-neon-orange/40">
              <Shield className="h-5 w-5 text-neon-orange" />
            </motion.div>
            <span className="text-[9px] text-muted-foreground mt-1">Firewall</span>
          </motion.div>
        )}

        {/* VPN node */}
        {vpnConnected && (
          <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
            className="absolute flex flex-col items-center group" style={{ left: "90%", top: "20%", transform: "translate(-50%, -50%)", zIndex: 1 }}>
            <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2.5, repeat: Infinity }}
              className="p-3 rounded-2xl bg-neon-purple/10 border-2 border-neon-purple/40 shadow-[0_0_15px_hsl(270,76%,60%,0.2)]">
              <Lock className="h-5 w-5 text-neon-purple" />
            </motion.div>
            <span className="text-[9px] text-muted-foreground mt-1">VPN Server</span>
          </motion.div>
        )}

        {/* Device nodes */}
        {displayDevices.map((d, i) => {
          const Icon = getDeviceIcon(d.iconType);
          const pos = positions[i];
          const statusColor = d.status === "active" ? "text-neon-green" : d.status === "blocked" ? "text-destructive" : "text-neon-yellow";
          const borderColor = d.status === "active" ? "border-neon-green/30" : d.status === "blocked" ? "border-destructive/40" : "border-neon-yellow/30";
          const bgColor = d.status === "active" ? "bg-neon-green/5" : d.status === "blocked" ? "bg-destructive/10" : "bg-neon-yellow/5";

          return (
            <motion.div key={d.id} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + i * 0.1 }}
              className="absolute flex flex-col items-center group" style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -50%)", zIndex: 1 }}>
              <motion.div
                animate={d.status === "blocked" ? { opacity: [1, 0.4, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                className={`p-3 rounded-2xl border-2 ${borderColor} ${bgColor} cursor-pointer`}>
                <Icon className={`h-5 w-5 ${statusColor}`} />
              </motion.div>
              <span className="text-[9px] text-muted-foreground mt-1 font-medium">{d.name}</span>

              {/* Hover tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                <div className="glass-card p-3 text-[11px] min-w-[160px] shadow-xl">
                  <p className="font-semibold text-foreground">{d.name}</p>
                  <p className="text-muted-foreground font-mono mt-1">{d.ip}</p>
                  <p className="text-muted-foreground">Status: <span className={statusColor}>{d.status}</span></p>
                  <p className="text-muted-foreground">Type: {d.type}</p>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Animated data packets */}
        {displayDevices.filter(d => d.status === "active").map((d, i) => {
          const pos = positions[devices.indexOf(d)] || positions[i];
          return (
            <motion.div key={`packet-${d.id}`} className="absolute h-2 w-2 rounded-full bg-primary shadow-[0_0_6px_hsl(199,89%,48%)]" style={{ zIndex: 2 }}
              animate={{ left: [`50%`, `${pos.x}%`], top: [`50%`, `${pos.y}%`], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 2 + Math.random() * 2, repeat, delay: i * 0.7, ease: "linear" }}
            />
          );
        })}
      </div>
    </div>
  );
}
