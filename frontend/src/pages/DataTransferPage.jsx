import {useState} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {Plus, History, X, ArrowRight, AlertTriangle} from "lucide-react";
import {AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer} from "recharts";
import {useNetwork} from "@/context/NetworkContext";
import {getDeviceIcon} from "@/lib/deviceIcons";

export default function DataTransferPage() {
  const { devices, activeTransfer, transferHistory, startTransfer, cancelTransfer, chartData } = useNetwork();
  const [showModal, setShowModal] = useState(false);
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [fileName, setFileName] = useState("");
  const [sizeMB, setSizeMB] = useState(500);

  const activeDevices = devices.filter(d => d.status !== "pending");

  const handleStart = () => {
    if (!fromId || !toId || fromId === toId || !fileName.trim()) return;
    startTransfer(fromId, toId, fileName.trim(), sizeMB);
    setShowModal(false); setFileName(""); setSizeMB(500);
  };

  const fromDevice = activeTransfer ? devices.find(d => d.id === activeTransfer.fromDeviceId) : null;
  const toDevice = activeTransfer ? devices.find(d => d.id === activeTransfer.toDeviceId) : null;
  const FromIcon = fromDevice ? getDeviceIcon(fromDevice.iconType) : null;
  const ToIcon = toDevice ? getDeviceIcon(toDevice.iconType) : null;
  const progress = activeTransfer ? (activeTransfer.transferred / activeTransfer.totalSize) * 100 : 0;
  const transferredStr = activeTransfer ? (activeTransfer.transferred >= 1e9 ? `${(activeTransfer.transferred / 1e9).toFixed(2)} GB` : `${(activeTransfer.transferred / 1e6).toFixed(1)} MB`) : "";
  const totalStr = activeTransfer ? (activeTransfer.totalSize >= 1e9 ? `${(activeTransfer.totalSize / 1e9).toFixed(2)} GB` : `${(activeTransfer.totalSize / 1e6).toFixed(0)} MB`) : "";

  // ETA calc
  const eta = activeTransfer && activeTransfer.status === "transferring"
    ? (() => {
        const remaining = activeTransfer.totalSize - activeTransfer.transferred;
        const speed = (activeTransfer.bandwidth * 1e6) / 8;
        const secs = Math.ceil(remaining / speed);
        const m = Math.floor(secs / 60); const s = secs % 60;
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
      })()
    : "00:00";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Data Transfer</h1>
        <button onClick={() => setShowModal(true)} disabled={!!activeTransfer && activeTransfer.status === "transferring"} className="flex items-center gap-2 bg-primary/15 text-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/25 transition-colors disabled:opacity-50">
          <Plus className="h-4 w-4" /> New Transfer
        </button>
      </div>

      {/* Active Transfer */}
      {activeTransfer && (
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-foreground">
              Active Transfer
              {activeTransfer.status === "completed" && <span className="ml-2 text-neon-green text-xs">✓ Completed</span>}
            </h3>
            {activeTransfer.status === "transferring" && (
              <button onClick={cancelTransfer} className="text-xs text-destructive hover:underline">Cancel</button>
            )}
          </div>

          <div className="flex items-center justify-center gap-8 py-6">
            <div className="flex flex-col items-center gap-2">
              <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }} className="p-4 rounded-2xl bg-primary/15 border border-primary/30">
                {FromIcon && <FromIcon className="h-10 w-10 text-primary" />}
              </motion.div>
              <span className="text-sm font-medium text-foreground">{fromDevice?.name}</span>
              <span className="text-[10px] text-muted-foreground font-mono">{fromDevice?.ip}</span>
            </div>

            <div className="flex-1 max-w-md relative">
              <div className="h-1 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-neon-green rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
              {activeTransfer.status === "transferring" && [0, 1, 2, 3, 4].map(i => (
                <motion.div key={i} className="absolute top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary shadow-[0_0_6px_hsl(199,89%,48%)]"
                  animate={{ left: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 2, repeat, delay: i * 0.4, ease: "linear" }}
                />
              ))}
            </div>

            <div className="flex flex-col items-center gap-2">
              <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat, delay: 0.5 }} className="p-4 rounded-2xl bg-neon-green/15 border border-neon-green/30">
                {ToIcon && <ToIcon className="h-10 w-10 text-neon-green" />}
              </motion.div>
              <span className="text-sm font-medium text-foreground">{toDevice?.name}</span>
              <span className="text-[10px] text-muted-foreground font-mono">{toDevice?.ip}</span>
            </div>
          </div>

          <div className="grid grid-cols-6 gap-4 text-center border-t border-border pt-4">
            {[
              { label: "Bandwidth", value: activeTransfer.bandwidth.toFixed(1), unit: "Mbps", color: "text-primary" },
              { label: "Latency", value: activeTransfer.latency.toFixed(0), unit: "ms", color: "text-neon-green" },
              { label: "Throughput", value: activeTransfer.throughput.toFixed(1), unit: "Mbps", color: "text-neon-yellow" },
              { label: "Ping", value: (activeTransfer.latency * 0.8).toFixed(0), unit: "ms", color: "text-neon-blue" },
              { label: "Packet Loss", value: activeTransfer.packetLoss.toFixed(2), unit: "%", color: "text-destructive" },
              { label: "ETA", value: eta, unit: "", color: "text-neon-purple" },
            ].map(s => (
              <div key={s.label}><p className="text-[10px] text-muted-foreground">{s.label}</p><p className={`text-lg font-bold ${s.color}`}>{s.value}<span className="text-xs font-normal text-muted-foreground"> {s.unit}</span></p></div>
            ))}
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Transferring: {activeTransfer.fileName}</span>
              <span>{transferredStr} / {totalStr} ({Math.round(progress)}%)</span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${activeTransfer.status === "completed" ? "bg-neon-green" : "bg-gradient-to-r from-primary via-neon-green to-primary"}`} style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      )}

      {!activeTransfer && (
        <div className="glass-card p-10 text-center">
          <ArrowRight className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No active transfer. Click "New Transfer" to start one.</p>
        </div>
      )}

      {/* Real-time chart */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Network Speed (Real-time)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="bwGrad2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(199,89%,48%)" stopOpacity={0.3} /><stop offset="100%" stopColor="hsl(199,89%,48%)" stopOpacity={0} /></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,33%,16%)" />
            <XAxis dataKey="time" tick={{ fill: "hsl(215,20%,55%)", fontSize: 10 }} axisLine={false} />
            <YAxis tick={{ fill: "hsl(215,20%,55%)", fontSize: 10 }} axisLine={false} />
            <Tooltip contentStyle={{ background: "hsl(222,47%,8%)", border: "1px solid hsl(217,33%,20%)", borderRadius: 8, fontSize: 12 }} />
            <Area type="monotone" dataKey="download" stroke="hsl(199,89%,48%)" fill="url(#bwGrad2)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="upload" stroke="hsl(142,71%,45%)" fill="transparent" strokeWidth={2} strokeDasharray="5 5" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* History */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><History className="h-4 w-4" /> Transfer History</h3>
        {transferHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No transfer history yet.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/30"><tr className="text-xs text-muted-foreground">
                <th className="text-left px-4 py-3">From</th><th className="text-left px-4 py-3">To</th>
                <th className="text-left px-4 py-3">Size</th><th className="text-left px-4 py-3">Speed</th>
                <th className="text-left px-4 py-3">Status</th><th className="text-left px-4 py-3">Time</th>
              </tr></thead>
              <tbody>
                {transferHistory.map(t => (
                  <tr key={t.id} className="border-t border-border hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 text-foreground">{t.fromName}</td>
                    <td className="px-4 py-3 text-foreground">{t.toName}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono">{t.size}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono">{t.speed}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${t.status === "completed" ? "bg-neon-green/15 text-neon-green" : "bg-destructive/15 text-destructive"}`}>{t.status}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{t.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Transfer Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="glass-card p-6 w-[28rem] shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-foreground">New Transfer</h3>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-secondary rounded"><X className="h-4 w-4 text-muted-foreground" /></button>
              </div>
              {/* Blocked device warning */}
              {toId && devices.find(d => d.id === toId)?.status === "blocked" && (
                <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs">
                  <AlertTriangle className="h-4 w-4" /> Target device is blocked by firewall. Transfer will fail.
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">From Device *</label>
                  <select value={fromId} onChange={e => setFromId(e.target.value)} className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50">
                    <option value="">Select source...</option>
                    {activeDevices.map(d => <option key={d.id} value={d.id}>{d.name} ({d.ip})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">To Device *</label>
                  <select value={toId} onChange={e => setToId(e.target.value)} className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50">
                    <option value="">Select destination...</option>
                    {activeDevices.filter(d => d.id !== fromId).map(d => <option key={d.id} value={d.id}>{d.name} ({d.ip}) {d.status === "blocked" ? "⛔" : ""}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">File Name *</label>
                  <input value={fileName} onChange={e => setFileName(e.target.value)} placeholder="e.g. project_backup.zip" className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Size (MB): {sizeMB}</label>
                  <input type="range" min={10} max={5000} step={10} value={sizeMB} onChange={e => setSizeMB(Number(e.target.value))} className="w-full accent-primary" />
                  <div className="flex justify-between text-[10px] text-muted-foreground"><span>10 MB</span><span>5 GB</span></div>
                </div>
                <button onClick={handleStart} disabled={!fromId || !toId || fromId === toId || !fileName.trim()} className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  Start Transfer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
