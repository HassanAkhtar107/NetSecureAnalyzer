import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Plus, XCircle, CheckCircle2, TrendingUp, TrendingDown, X } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useNetwork } from "@/context/NetworkContext";

const impactData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  latency: 15 + Math.random() * 30 + (i > 12 && i < 18 ? 20 : 0),
  throughput: 90 - Math.random() * 20 - (i > 12 && i < 18 ? 15 : 0),
}));

export default function FirewallPage() {
  const { firewallOn, toggleFirewall, firewallRules, addFirewallRule, removeFirewallRule, toggleFirewallRule, allowedTraffic, blockedTraffic } = useNetwork();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newType, setNewType] = useState<"allow" | "block">("block");
  const [newTarget, setNewTarget] = useState("");

  const handleAddRule = () => {
    if (!newTarget.trim()) return;
    addFirewallRule(newType, newTarget.trim());
    setNewTarget(""); setShowAddModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-foreground">Firewall</h1>
          <button onClick={toggleFirewall} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${firewallOn ? "bg-neon-green/15 text-neon-green shadow-[0_0_15px_hsl(142,71%,45%,0.2)]" : "bg-destructive/15 text-destructive"}`}>
            <Shield className="h-4 w-4" /> {firewallOn ? "ON" : "OFF"}
            <div className={`w-10 h-5 rounded-full relative ${firewallOn ? "bg-neon-green/30" : "bg-destructive/30"}`}>
              <motion.div className={`absolute top-0.5 h-4 w-4 rounded-full ${firewallOn ? "bg-neon-green" : "bg-destructive"}`} animate={{ left: firewallOn ? 22 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
            </div>
          </button>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-primary/15 text-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/25 transition-colors">
          <Plus className="h-4 w-4" /> Add Rule
        </button>
      </div>

      {/* Counters */}
      <div className="grid grid-cols-2 gap-6">
        <div className="glass-card p-6 flex items-center gap-6">
          <div className="p-4 rounded-2xl bg-neon-green/10"><CheckCircle2 className="h-8 w-8 text-neon-green" /></div>
          <div>
            <p className="text-sm text-muted-foreground">Allowed Traffic</p>
            <p className="text-3xl font-bold text-neon-green">{allowedTraffic.toFixed(2)} <span className="text-sm font-normal">TB</span></p>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-6">
          <div className="p-4 rounded-2xl bg-destructive/10"><XCircle className="h-8 w-8 text-destructive" /></div>
          <div>
            <p className="text-sm text-muted-foreground">Blocked Traffic</p>
            <p className="text-3xl font-bold text-destructive">{blockedTraffic.toFixed(2)} <span className="text-sm font-normal">GB</span></p>
          </div>
        </div>
      </div>

      {/* Rules */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Firewall Rules ({firewallRules.length})</h3>
        <div className="space-y-2">
          <AnimatePresence>
            {firewallRules.map(r => (
              <motion.div key={r.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }}
                className={`flex items-center justify-between p-4 rounded-lg border transition-all ${r.active ? "border-border bg-secondary/20" : "border-border/50 bg-secondary/5 opacity-60"}`}>
                <div className="flex items-center gap-4">
                  {r.type === "allow" ? <CheckCircle2 className="h-5 w-5 text-neon-green" /> : <XCircle className="h-5 w-5 text-destructive" />}
                  <div>
                    <p className="text-sm font-medium text-foreground">{r.type === "allow" ? "Allow" : "Block"} — {r.target}</p>
                    <p className="text-xs text-muted-foreground">{r.hits.toLocaleString()} hits</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleFirewallRule(r.id)} className={`text-xs px-3 py-1 rounded-lg ${r.active ? "bg-neon-green/15 text-neon-green" : "bg-secondary text-muted-foreground"}`}>{r.active ? "Active" : "Disabled"}</button>
                  <button onClick={() => removeFirewallRule(r.id)} className="text-xs text-destructive hover:text-destructive/80">Remove</button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Impact */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Impact Analysis (Last 24h)</h3>
          <div className="flex gap-4">
            <span className="flex items-center gap-1 text-xs text-neon-yellow"><TrendingUp className="h-3 w-3" /> Latency +12%</span>
            <span className="flex items-center gap-1 text-xs text-destructive"><TrendingDown className="h-3 w-3" /> Throughput -8%</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={impactData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,33%,16%)" />
            <XAxis dataKey="hour" tick={{ fill: "hsl(215,20%,55%)", fontSize: 10 }} axisLine={false} />
            <YAxis tick={{ fill: "hsl(215,20%,55%)", fontSize: 10 }} axisLine={false} />
            <Tooltip contentStyle={{ background: "hsl(222,47%,8%)", border: "1px solid hsl(217,33%,20%)", borderRadius: 8, fontSize: 12 }} />
            <Area type="monotone" dataKey="latency" stroke="hsl(45,93%,58%)" fill="transparent" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="throughput" stroke="hsl(199,89%,48%)" fill="transparent" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Add Rule Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="glass-card p-6 w-96 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-foreground">Add Firewall Rule</h3>
                <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-secondary rounded"><X className="h-4 w-4 text-muted-foreground" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Rule Type</label>
                  <div className="flex gap-2">
                    <button onClick={() => setNewType("block")} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${newType === "block" ? "bg-destructive/15 text-destructive border border-destructive/30" : "bg-secondary text-muted-foreground"}`}>Block</button>
                    <button onClick={() => setNewType("allow")} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${newType === "allow" ? "bg-neon-green/15 text-neon-green border border-neon-green/30" : "bg-secondary text-muted-foreground"}`}>Allow</button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Target (IP / subnet / label) *</label>
                  <input value={newTarget} onChange={e => setNewTarget(e.target.value)} placeholder="e.g. 192.168.1.100 or 10.0.0.0/8" className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
                </div>
                <button onClick={handleAddRule} disabled={!newTarget.trim()} className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Add Rule</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
