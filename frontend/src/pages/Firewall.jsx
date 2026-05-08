import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, ShieldAlert, ShieldCheck, Plus, Search, Trash2, Ban, 
  CheckCircle2, Activity, X, AlertCircle
} from 'lucide-react';
import { firewallApi } from '../api';
import { toast } from 'sonner';
import { formatDistanceToNow, isValid } from 'date-fns';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '../components/ui/table';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '../components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from '../components/ui/dialog';
import SummaryCard from '../components/SummaryCard';

const Firewall = ({ userType }) => {
  const [rules, setRules] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({
    name: '',
    action: 'ALLOW',
    direction: 'IN',
    protocol: 'TCP',
    source: 'any',
    destination: 'any',
    port: '',
    enabled: true
  });

  const fetchData = async () => {
    try {
      const [rulesRes, logsRes] = await Promise.all([
        firewallApi.rules(),
        firewallApi.logs()
      ]);
      
      let fetchedRules = Array.isArray(rulesRes.data) ? rulesRes.data : [];
      let fetchedLogs = Array.isArray(logsRes.data) ? logsRes.data : [];

      if (fetchedRules.length === 0) {
        fetchedRules = [
          { id: "r1", name: "Allow HTTPS", action: "ALLOW", direction: "OUT", protocol: "TCP", source: "any", destination: "any", port: "443", enabled: true, hits: 18420 },
          { id: "r2", name: "Allow DNS", action: "ALLOW", direction: "OUT", protocol: "UDP", source: "any", destination: "any", port: "53", enabled: true, hits: 9821 },
          { id: "r3", name: "Block SMB Inbound", action: "DENY", direction: "IN", protocol: "TCP", source: "any", destination: "any", port: "445", enabled: true, hits: 312 },
          { id: "r4", name: "Block Telnet", action: "DENY", direction: "IN", protocol: "TCP", source: "any", destination: "any", port: "23", enabled: true, hits: 88 },
          { id: "r5", name: "Allow LAN ICMP", action: "ALLOW", direction: "IN", protocol: "ICMP", source: "192.168.0.0/16", destination: "any", port: "*", enabled: true, hits: 4520 },
        ];
      }

      if (fetchedLogs.length === 0) {
        fetchedLogs = [
          { id: "e1", timestamp: new Date(Date.now() - 5000).toISOString(), sender_ip: "203.45.91.22", port: 445, protocol: "TCP", action: "DENY", reason: "Port scan", ruleName: "Block SMB Inbound" },
          { id: "e2", timestamp: new Date(Date.now() - 15000).toISOString(), sender_ip: "192.168.1.42", port: 443, protocol: "TCP", action: "ALLOW", reason: "HTTPS Traffic", ruleName: "Allow HTTPS" },
          { id: "e3", timestamp: new Date(Date.now() - 30000).toISOString(), sender_ip: "172.16.0.5", port: 53, protocol: "UDP", action: "ALLOW", reason: "DNS query", ruleName: "Allow DNS" },
        ];
      }

      setRules(fetchedRules);
      setEvents(fetchedLogs);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const allowed = events.filter((e) => e.action === "ALLOW").length;
    const denied = events.filter((e) => e.action === "DENY").length;
    return {
      total: rules.length,
      enabled: rules.filter((r) => r.enabled).length,
      allowed,
      denied,
    };
  }, [rules, events]);

  const filteredRules = useMemo(() => {
    return rules.filter((r) => {
      if (actionFilter !== "all" && r.action !== actionFilter) return false;
      if (query && !`${r.name} ${r.source} ${r.destination} ${r.port}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [rules, query, actionFilter]);

  const handleToggleRule = async (id) => {
    try {
      await firewallApi.toggleRule(id);
      toast.success("Rule toggled");
      fetchData();
    } catch (err) { toast.error("Action failed"); }
  };

  const handleRemoveRule = async (id) => {
    try {
      await firewallApi.deleteRule(id);
      toast.success("Rule removed");
      fetchData();
    } catch (err) { toast.error("Removal failed"); }
  };

  const handleAddRule = async () => {
    if (!draft.name.trim()) return toast.error("Name is required");
    try {
      await firewallApi.createRule(draft);
      toast.success("Rule added");
      setOpen(false);
      setDraft({ name: "", action: "ALLOW", direction: "IN", protocol: "TCP", source: "any", destination: "any", port: "", enabled: true });
      fetchData();
    } catch (err) { toast.error("Addition failed"); }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Firewall</h1>
          <p className="text-sm text-slate-500">Manage ALLOW / DENY rules and monitor real-time traffic decisions.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-glow">
              <Plus className="h-4 w-4" /> New Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-[#0a0f1d] border-slate-800">
            <DialogHeader>
              <DialogTitle>Create firewall rule</DialogTitle>
              <DialogDescription>Define matching criteria and the action to take.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid gap-1.5">
                <Label>Name</Label>
                <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Block bad actor" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Action</Label>
                  <Select value={draft.action} onValueChange={(v) => setDraft({ ...draft, action: v })}>
                    <SelectTrigger className="bg-[#0d1117]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALLOW">ALLOW</SelectItem>
                      <SelectItem value="DENY">DENY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Direction</Label>
                  <Select value={draft.direction} onValueChange={(v) => setDraft({ ...draft, direction: v })}>
                    <SelectTrigger className="bg-[#0d1117]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IN">Inbound</SelectItem>
                      <SelectItem value="OUT">Outbound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Protocol</Label>
                  <Select value={draft.protocol} onValueChange={(v) => setDraft({ ...draft, protocol: v })}>
                    <SelectTrigger className="bg-[#0d1117]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TCP">TCP</SelectItem>
                      <SelectItem value="UDP">UDP</SelectItem>
                      <SelectItem value="ICMP">ICMP</SelectItem>
                      <SelectItem value="ANY">ANY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Port</Label>
                  <Input value={draft.port} onChange={(e) => setDraft({ ...draft, port: e.target.value })} placeholder="443 or *" />
                </div>
                <div className="grid gap-1.5">
                  <Label>Source</Label>
                  <Input value={draft.source} onChange={(e) => setDraft({ ...draft, source: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Destination</Label>
                  <Input value={draft.destination} onChange={(e) => setDraft({ ...draft, destination: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={draft.enabled} onCheckedChange={(v) => setDraft({ ...draft, enabled: v })} />
                <Label>Enable immediately</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleAddRule}>Create rule</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryCard label="Total rules" value={stats.total} icon={Shield} tone="primary" />
        <SummaryCard label="Enabled" value={stats.enabled} icon={CheckCircle2} tone="success" />
        <SummaryCard label="Allowed (1m)" value={stats.allowed} icon={ShieldCheck} tone="success" />
        <SummaryCard label="Denied (1m)" value={stats.denied} icon={ShieldAlert} tone="destructive" />
      </div>

      <Tabs defaultValue="rules">
        <TabsList className="bg-[#0d1117] border border-slate-800">
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="events">Live Events</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="mt-4">
          <Card className="bg-gradient-card border-border p-4 shadow-elegant overflow-hidden">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search rules…" className="pl-8 bg-background/40" />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[140px] bg-background/40"><SelectValue placeholder="All actions" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  <SelectItem value="ALLOW">ALLOW</SelectItem>
                  <SelectItem value="DENY">DENY</SelectItem>
                </SelectContent>
              </Select>
              {(query || actionFilter !== "all") && (
                <Button variant="ghost" size="sm" onClick={() => { setQuery(""); setActionFilter("all"); }}>
                  <X className="mr-1 h-3 w-3" /> Clear
                </Button>
              )}
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Name</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Dir</TableHead>
                    <TableHead>Proto</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Dest</TableHead>
                    <TableHead>Port</TableHead>
                    <TableHead className="text-right">Hits</TableHead>
                    <TableHead>Enabled</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRules.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium text-slate-200">{r.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={r.action === "ALLOW" ? "border-emerald-500/40 text-emerald-500 bg-emerald-500/5" : "border-rose-500/40 text-rose-500 bg-rose-500/5"}>
                          {r.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[10px] uppercase font-bold text-slate-500">{r.direction}</TableCell>
                      <TableCell className="text-xs text-slate-400 font-mono">{r.protocol}</TableCell>
                      <TableCell className="text-xs text-slate-400 font-mono">{r.source}</TableCell>
                      <TableCell className="text-xs text-slate-400 font-mono">{r.destination}</TableCell>
                      <TableCell className="text-xs text-slate-400 font-mono">{r.port}</TableCell>
                      <TableCell className="text-right tabular-nums text-sky-400 font-bold">{r.hits?.toLocaleString() || 0}</TableCell>
                      <TableCell>
                        <Switch checked={r.enabled} onCheckedChange={() => handleToggleRule(r.id)} />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveRule(r.id)} className="h-8 w-8 text-slate-600 hover:text-rose-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredRules.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="py-10 text-center text-sm text-slate-500 italic">No rules match your filters.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="mt-4">
          <Card className="bg-gradient-card border-border p-4 shadow-elegant overflow-hidden">
            <div className="mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-sky-500" />
              <h3 className="text-sm font-semibold text-white">Live decisions</h3>
              <Badge variant="outline" className="animate-pulse bg-sky-500/5 text-sky-400 border-sky-500/20 text-[9px]">streaming</Badge>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>When</TableHead>
                    <TableHead>Source IP</TableHead>
                    <TableHead>Port</TableHead>
                    <TableHead>Proto</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Rule</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-xs text-slate-500">{isValid(new Date(e.timestamp)) ? formatDistanceToNow(new Date(e.timestamp), { addSuffix: true }) : '---'}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-300">{e.sender_ip || e.ip}</TableCell>
                      <TableCell className="tabular-nums text-xs text-slate-400">{e.port}</TableCell>
                      <TableCell className="text-xs text-slate-500 uppercase">{e.protocol}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={e.action === "ALLOW" ? "border-emerald-500/40 text-emerald-500 bg-emerald-500/5" : "border-rose-500/40 text-rose-500 bg-rose-500/5"}>
                          {e.action === "ALLOW" ? <ShieldCheck className="mr-1.5 h-3 w-3" /> : <Ban className="mr-1.5 h-3 w-3" />}
                          {e.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-400">{e.ruleName || '---'}</TableCell>
                      <TableCell className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{e.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Firewall;
