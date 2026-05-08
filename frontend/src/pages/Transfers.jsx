import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeftRight, Upload as UploadIcon, Download as DownloadIcon,
  FileText, Image as ImageIcon, Video, Archive, Pause, Play, X,
  Plus, Search, CheckCircle2, AlertCircle, Zap, Server, Activity, MoreVertical, Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { devicesApi, transfersApi } from '../api';
import { toast } from 'sonner';
import { formatDistanceToNow, isValid } from 'date-fns';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const fileIcon = {
  doc: FileText,
  image: ImageIcon,
  video: Video,
  archive: Archive,
  data: Activity
};

const Transfers = ({ userType }) => {
  const [devices, setDevices] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('all');

  // Configuration State
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedDest, setSelectedDest] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('doc');
  const [showNewModal, setShowNewModal] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);

  const fetchData = async () => {
    try {
      const [devRes, transRes] = await Promise.all([
        devicesApi.list(),
        transfersApi.list()
      ]);

      const fetchedDevices = Array.isArray(devRes.data) ? devRes.data : [];
      setDevices(fetchedDevices);

      let fetchedTransfers = Array.isArray(transRes.data) ? transRes.data : [];
      if (fetchedTransfers.length === 0) {
        fetchedTransfers = [
          { id: 't1', name: 'Q4-financials.pdf', kind: 'doc', direction: 'upload', peer: '192.168.1.42', sizeMb: 12.4, progress: 78, speedMbps: 8.2, status: 'active', startedAt: Date.now() - 60000 },
          { id: 't2', name: 'campaign-hero.mp4', kind: 'video', direction: 'download', peer: 'cdn-edge-3', sizeMb: 245.7, progress: 34, speedMbps: 45.6, status: 'active', startedAt: Date.now() - 90000 },
          { id: 't3', name: 'design-assets.zip', kind: 'archive', direction: 'download', peer: '10.0.0.18', sizeMb: 88.2, progress: 100, speedMbps: 0, status: 'completed', startedAt: Date.now() - 600000 }
        ];
      } else {
        // Map backend data to UI format
        fetchedTransfers = fetchedTransfers.map(t => ({
          id: t.id,
          name: t.file_name || 'unknown_stream',
          kind: t.file_type || 'data',
          direction: t.receiver_ip === '127.0.0.1' ? 'download' : 'upload', // Simplified logic
          peer: t.receiver_ip || t.sender_ip,
          sizeMb: t.size_mb || 4.2,
          progress: t.status === 'COMPLETED' ? 100 : 45,
          speedMbps: t.bandwidth || 0,
          status: t.status?.toLowerCase() === 'completed' ? 'completed' : 'active',
          startedAt: new Date(t.timestamp).getTime()
        }));
      }
      setTransfers(fetchedTransfers);
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
    const active = transfers.filter(t => t.status === 'active');
    return {
      active: active.length,
      throughput: active.reduce((acc, t) => acc + (t.speedMbps || 0), 0).toFixed(1),
      uploaded: transfers.filter(t => t.direction === 'upload' && t.status === 'completed').reduce((acc, t) => acc + (t.sizeMb || 0), 0).toFixed(1),
      downloaded: transfers.filter(t => t.direction === 'download' && t.status === 'completed').reduce((acc, t) => acc + (t.sizeMb || 0), 0).toFixed(1),
    };
  }, [transfers]);

  const filtered = useMemo(() => {
    return transfers.filter(t => {
      const matchesTab = tab === 'all' || t.status === tab;
      const matchesQuery = !query || t.name.toLowerCase().includes(query.toLowerCase()) || t.peer.includes(query);
      return matchesTab && matchesQuery;
    });
  }, [transfers, tab, query]);

  const handleStartTransfer = async (e) => {
    if (e) e.preventDefault();
    if (!selectedSource || !selectedDest) {
      toast.error("Source and Destination nodes must be defined");
      return;
    }

    setIsTransferring(true);
    try {
      await transfersApi.create({
        sender_device: selectedSource,
        receiver_device: selectedDest,
        file_name: `transfer_${Math.floor(Math.random() * 1000)}.${selectedFileType}`,
        file_type: selectedFileType,
        simulate: true
      });
      toast.success("New transfer sequence initiated");
      setShowNewModal(false);
      fetchData();
    } catch (err) {
      toast.error("Handshake failed");
    } finally {
      setIsTransferring(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await transfersApi.delete(id);
      toast.success("Transfer record deleted");
      fetchData();
    } catch (err) {
      toast.error("Failed to delete record");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Data Transfer</h1>
          <p className="text-sm text-slate-500">Peer-to-peer file transfers with live telemetry.</p>
        </div>
        <Button className="gap-2 shadow-glow" onClick={() => setShowNewModal(true)}>
          <Plus className="h-4 w-4" /> New Transfer
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Active" value={stats.active} icon={ArrowLeftRight} tone="primary" />
        <Stat label="Throughput" value={`${stats.throughput} Mbps`} icon={Activity} tone="success" />
        <Stat label="Uploaded today" value={`${stats.uploaded} MB`} icon={UploadIcon} tone="warning" />
        <Stat label="Downloaded today" value={`${stats.downloaded} MB`} icon={DownloadIcon} tone="primary" />
      </div>

      {/* Configuration Card (Preserved & Redesigned) */}
      <Card className="border-slate-800 bg-gradient-to-br from-[#16191f] to-[#0d1117] p-6 shadow-elegant">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <div className="w-full lg:w-1/3 space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2 text-slate-400 uppercase tracking-widest">
              <Zap className="h-4 w-4 text-amber-400" /> Protocol Config
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Source Node</label>
                <Select value={selectedSource} onValueChange={setSelectedSource}>
                  <SelectTrigger className="bg-[#0d1117] border-slate-800">
                    <SelectValue placeholder="Select Origin" />
                  </SelectTrigger>
                  <SelectContent>
                    {devices.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name || d.ip_address}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Destination Node</label>
                <Select value={selectedDest} onValueChange={setSelectedDest}>
                  <SelectTrigger className="bg-[#0d1117] border-slate-800">
                    <SelectValue placeholder="Select Target" />
                  </SelectTrigger>
                  <SelectContent>
                    {devices.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name || d.ip_address}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center relative w-full h-32 border-l border-slate-800 lg:pl-8">
            <div className="flex items-center justify-between w-full max-w-md relative z-10">
              <div className="flex flex-col items-center gap-2">
                <div className="h-12 w-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shadow-glow">
                  <Server className="h-6 w-6 text-sky-400" />
                </div>
                <span className="text-[10px] font-mono text-slate-500">{devices.find(d => String(d.id) === selectedSource)?.ip_address || '0.0.0.0'}</span>
              </div>
              <div className="flex-1 px-6 relative">
                <div className="h-[2px] w-full bg-slate-800 relative">
                  <div className="absolute inset-0 bg-sky-500/40 animate-shimmer blur-sm"></div>
                </div>
                <ArrowLeftRight className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="h-12 w-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                  <Server className="h-6 w-6 text-slate-500" />
                </div>
                <span className="text-[10px] font-mono text-slate-500">{devices.find(d => String(d.id) === selectedDest)?.ip_address || '0.0.0.0'}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Registry Card */}
      <Card className="border-border bg-gradient-card p-4 shadow-elegant overflow-hidden">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by file or peer…"
              className="pl-9 bg-background/60"
            />
          </div>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="bg-background/40">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="failed">Failed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>File</TableHead>
                <TableHead>Peer</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead className="w-[260px]">Progress</TableHead>
                <TableHead className="text-right">Size</TableHead>
                <TableHead className="text-right">Speed</TableHead>
                <TableHead>Started</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => {
                const Icon = fileIcon[t.kind] || Activity;
                return (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-slate-200">{t.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-mono">{t.peer}</TableCell>
                    <TableCell>
                      {t.direction === "upload" ? (
                        <Badge variant="outline" className="border-amber-500/30 text-amber-500 bg-amber-500/5">
                          <UploadIcon className="mr-1 h-3 w-3" /> Upload
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-sky-500/30 text-sky-500 bg-sky-500/5">
                          <DownloadIcon className="mr-1 h-3 w-3" /> Download
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Progress value={t.progress} className="h-1.5 flex-1" />
                        <span className="text-[11px] font-mono tabular-nums w-8 text-right text-slate-400">{t.progress}%</span>
                      </div>
                      <div className="mt-1.5 text-[10px] flex items-center gap-2">
                        {t.status === "completed" ? (
                          <span className="text-emerald-500 flex items-center gap-1 font-bold uppercase tracking-tighter"><CheckCircle2 className="h-3 w-3" /> Completed</span>
                        ) : t.status === "failed" ? (
                          <span className="text-rose-500 flex items-center gap-1 font-bold uppercase tracking-tighter"><AlertCircle className="h-3 w-3" /> Failed</span>
                        ) : (
                          <span className="text-slate-500 font-medium">Synchronizing bitstream...</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-xs tabular-nums text-slate-300">{t.sizeMb.toFixed(1)} MB</TableCell>
                    <TableCell className="text-right text-xs tabular-nums text-sky-400 font-bold">{t.status === "active" ? `${t.speedMbps.toFixed(1)} Mbps` : "—"}</TableCell>
                    <TableCell className="text-xs text-slate-500">{formatDistanceToNow(t.startedAt, { addSuffix: true })}</TableCell>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:text-white">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDelete(t.id)} className="text-rose-500 focus:text-rose-400">
                            <Trash2 className="mr-2 h-4 w-4" /> Remove Record
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-sm text-slate-500 italic">No transfers match your current filter.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* New Transfer Modal (Preserved with exact smart-explainer style) */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-lg p-8 relative shadow-2xl border-slate-800 bg-[#0a0f1d]">
            <button onClick={() => setShowNewModal(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-sky-500/10 rounded-xl"><Plus className="text-sky-400" size={20} /></div>
              New Transfer Protocol
            </h3>
            <form onSubmit={handleStartTransfer} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Origin Node</label>
                  <Select value={selectedSource} onValueChange={setSelectedSource}>
                    <SelectTrigger className="bg-[#0d1117] border-slate-800"><SelectValue placeholder="Source" /></SelectTrigger>
                    <SelectContent>{devices.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name || d.ip_address}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Target Node</label>
                  <Select value={selectedDest} onValueChange={setSelectedDest}>
                    <SelectTrigger className="bg-[#0d1117] border-slate-800"><SelectValue placeholder="Recipient" /></SelectTrigger>
                    <SelectContent>{devices.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name || d.ip_address}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Data Stream Category</label>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { id: 'doc', icon: FileText, label: 'Doc' },
                    { id: 'image', icon: ImageIcon, label: 'Img' },
                    { id: 'video', icon: Video, label: 'Vid' },
                    { id: 'archive', icon: Archive, label: 'Archive' }
                  ].map(type => (
                    <button
                      key={type.id} type="button" onClick={() => setSelectedFileType(type.id)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${selectedFileType === type.id ? "bg-sky-500/10 border-sky-500/50 text-white shadow-lg" : "bg-[#0d1117] border-slate-800 text-slate-500 hover:border-slate-700"}`}
                    >
                      <type.icon size={18} />
                      <span className="text-[10px] font-bold uppercase">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <Button type="submit" disabled={isTransferring} className="w-full py-6 font-bold text-sm">
                {isTransferring ? 'Broadcasting...' : 'Execute Transfer'}
              </Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

function Stat({ label, value, icon: Icon, tone }) {
  const tones = {
    primary: "text-sky-400 bg-sky-400/10 border-sky-400/20",
    success: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    warning: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    destructive: "text-rose-400 bg-rose-400/10 border-rose-400/20"
  };
  return (
    <Card className="bg-gradient-card border-border p-4 shadow-elegant flex items-center gap-4">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center border ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</div>
        <div className="text-xl font-bold tabular-nums text-white">{value}</div>
      </div>
    </Card>
  );
}

export default Transfers;
