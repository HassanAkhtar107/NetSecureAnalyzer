import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Clock, Wifi, XCircle, MoreVertical, Trash2, X } from "lucide-react";
import { useNetwork } from "@/context/NetworkContext";
import { getDeviceIcon } from "@/lib/deviceIcons";

const statusConfig = {
  active: { label: "Active", icon: Wifi, color: "text-neon-green", bg: "bg-neon-green/10" },
  blocked: { label: "Blocked", icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
  pending: { label: "Pending", icon: Clock, color: "text-neon-yellow", bg: "bg-neon-yellow/10" },
};

export default function DevicesPage() {
  const { devices, addDevice, removeDevice, blockDevice, unblockDevice, approveDevice, denyDevice } = useNetwork();
  const [filter, setFilter] = useState<"all" | "active" | "blocked" | "pending">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIP, setNewIP] = useState("");
  const [newType, setNewType] = useState("Laptop");

  const filtered = devices.filter(d => {
    if (filter !== "all" && d.status !== filter) return false;
    if (searchTerm && !d.name.toLowerCase().includes(searchTerm.toLowerCase()) && !d.ip.includes(searchTerm)) return false;
    return true;
  });

  const counts = {
    all: devices.length,
    active: devices.filter(d => d.status === "active").length,
    blocked: devices.filter(d => d.status === "blocked").length,
    pending: devices.filter(d => d.status === "pending").length,
  };

  const handleAddDevice = () => {
    if (!newName.trim()) return;
    addDevice(newName.trim(), newIP.trim(), newType);
    setNewName(""); setNewIP(""); setNewType("Laptop"); setShowAddModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Devices</h1>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-primary/15 text-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/25 transition-colors">
          <Plus className="h-4 w-4" /> Add Device
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "active", "blocked", "pending"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary"}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)} <span className="ml-1 text-xs">({counts[f]})</span>
          </button>
        ))}
        <div className="flex-1" />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search devices..." className="pl-9 pr-4 py-2 bg-secondary/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 w-56" />
        </div>
      </div>

      {/* Pending Requests */}
      {devices.some(d => d.status === "pending") && (filter === "all" || filter === "pending") && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-neon-yellow mb-3 flex items-center gap-2"><Clock className="h-4 w-4" /> Pending Join Requests</h3>
          <div className="space-y-2">
            {devices.filter(d => d.status === "pending").map(d => {
              const Icon = getDeviceIcon(d.iconType);
              return (
                <motion.div key={d.id} layout className="flex items-center justify-between p-3 rounded-lg bg-neon-yellow/5 border border-neon-yellow/20">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-neon-yellow" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{d.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{d.ip} · {d.mac}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => approveDevice(d.id)} className="px-3 py-1.5 text-xs bg-neon-green/15 text-neon-green rounded-lg hover:bg-neon-green/25 transition-colors">Approve</button>
                    <button onClick={() => denyDevice(d.id)} className="px-3 py-1.5 text-xs bg-destructive/15 text-destructive rounded-lg hover:bg-destructive/25 transition-colors">Deny</button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Device Grid */}
      <div className="grid grid-cols-3 gap-4">
        <AnimatePresence>
          {filtered.map((d, i) => {
            const cfg = statusConfig[d.status];
            const Icon = getDeviceIcon(d.iconType);
            return (
              <motion.div key={d.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.03 }}
                className={`glass-card-hover p-5 ${d.status === "blocked" ? "border-destructive/30" : ""}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-3 rounded-xl ${cfg.bg}`}><Icon className={`h-6 w-6 ${cfg.color}`} /></div>
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                      <cfg.icon className="h-3 w-3" /> {cfg.label}
                    </span>
                    <button onClick={() => removeDevice(d.id)} className="p-1 hover:bg-destructive/15 rounded transition-colors"><Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" /></button>
                  </div>
                </div>
                <h4 className="text-sm font-semibold text-foreground">{d.name}</h4>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{d.ip}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">MAC: {d.mac}</p>
                <p className="text-[10px] text-muted-foreground">Type: {d.type} · Last: {d.lastSeen}</p>
                {d.status !== "pending" && (
                  <button
                    onClick={() => d.status === "blocked" ? unblockDevice(d.id) : blockDevice(d.id)}
                    className={`w-full mt-3 text-xs py-1.5 rounded-lg transition-colors ${d.status === "blocked" ? "bg-neon-green/15 text-neon-green hover:bg-neon-green/25" : "bg-destructive/15 text-destructive hover:bg-destructive/25"}`}
                  >
                    {d.status === "blocked" ? "Unblock" : "Block"}
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Add Device Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="glass-card p-6 w-96 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-foreground">Add Device</h3>
                <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-secondary rounded"><X className="h-4 w-4 text-muted-foreground" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Device Name *</label>
                  <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. My Tablet" className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">IP Address (auto if empty)</label>
                  <input value={newIP} onChange={e => setNewIP(e.target.value)} placeholder="192.168.1.x" className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Device Type</label>
                  <select value={newType} onChange={e => setNewType(e.target.value)} className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50">
                    {["Laptop", "Desktop", "Mobile", "IoT", "Server", "Unknown"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <button onClick={handleAddDevice} disabled={!newName.trim()} className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  Add Device
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
