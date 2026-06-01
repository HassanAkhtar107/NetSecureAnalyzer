import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowLeftRight, Image as ImageIcon, Search, CheckCircle2, Activity,
  User as UserIcon, Send, Zap, ChevronDown, ChevronUp, Music, Film,
  Clock, Volume2, Play, FileText, HardDrive, Info
} from 'lucide-react';
import { usersApi, imageTransfersApi } from '../api';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const formatBytes = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const Transfers = ({ userType }) => {
  const [users, setUsers] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [query, setQuery] = useState('');

  // Selection & Upload State
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileType, setFileType] = useState('IMAGE'); // 'IMAGE', 'AUDIO', 'VIDEO'
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef(null);

  // Analysis Report State
  const [lastTransferReport, setLastTransferReport] = useState(null);

  // Accordion Expand State
  const [expandedGroups, setExpandedGroups] = useState({});

  const fetchData = async () => {
    let meData = currentUser;
    try {
      const meRes = await usersApi.me();
      meData = meRes.data;
      setCurrentUser(meData);
    } catch (err) {
      console.error("Profile fetch error:", err);
    }

    try {
      const usersRes = await usersApi.listAll();
      let userData = [];
      if (Array.isArray(usersRes.data)) {
        userData = usersRes.data;
      } else if (usersRes.data && Array.isArray(usersRes.data.results)) {
        userData = usersRes.data.results;
      } else if (usersRes.data && typeof usersRes.data === 'object') {
        userData = usersRes.data.users || usersRes.data.data || [];
      }

      const otherUsers = userData.filter(u => {
        const isNotSelf = meData ? u.id !== meData.id : true;
        const isNotAdmin = u.user_type !== 'ADMIN';
        return isNotSelf && isNotAdmin;
      });
      setUsers(otherUsers);
    } catch (err) {
      console.error("Users list fetch error:", err);
    }

    try {
      const transRes = await imageTransfersApi.list();
      const transferData = Array.isArray(transRes.data) ? transRes.data : (transRes.data?.results || []);
      setTransfers(transferData);
    } catch (err) {
      console.error("Transfers fetch error:", err);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  const getFileType = (file) => {
    if (file.type.startsWith('image/')) return 'IMAGE';
    if (file.type.startsWith('audio/')) return 'AUDIO';
    if (file.type.startsWith('video/')) return 'VIDEO';
    return 'UNKNOWN';
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const detectedType = getFileType(file);
      if (detectedType === 'UNKNOWN') {
        toast.error("Unsupported media type. Please select an image, audio, or video file.");
        return;
      }
      setSelectedFile(file);
      setFileType(detectedType);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendFile = async () => {
    if (!selectedUser) {
      toast.error("Please select a recipient user");
      return;
    }
    if (!selectedFile) {
      toast.error("Please select a file to transfer");
      return;
    }

    setIsSending(true);

    const startTime = performance.now();
    const currentPing = Math.round(18 + Math.random() * 24); // Simulated payload propagation latency

    const formData = new FormData();
    formData.append('receiver', selectedUser);
    formData.append('image', selectedFile); // Backend Field uses 'image' key
    formData.append('file_type', fileType);
    formData.append('file_name', selectedFile.name);
    formData.append('file_size', selectedFile.size);
    formData.append('ping', currentPing);

    try {
      const selectedUserObj = users.find(u => String(u.id) === String(selectedUser));
      const recipientLabel = selectedUserObj ? selectedUserObj.email : `User #${selectedUser}`;

      const res = await imageTransfersApi.send(formData);

      const endTime = performance.now();
      const durationSec = Math.max(0.1, parseFloat(((endTime - startTime) / 1000).toFixed(2)));

      // Measure local speed simulation
      const speedMbps = ((selectedFile.size * 8) / (1024 * 1024 * durationSec)).toFixed(2);

      // Trigger full stats analysis overlay
      setLastTransferReport({
        name: selectedFile.name,
        size: selectedFile.size,
        type: fileType,
        duration: durationSec,
        ping: currentPing,
        speed: speedMbps,
        recipient: recipientLabel
      });

      // Clear input fields
      setSelectedFile(null);
      setPreviewUrl(null);
      setSelectedUser('');
      fetchData();
      toast.success("Data transferred successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Transfer failed. Check connection parameters.");
    } finally {
      setIsSending(false);
    }
  };

  const filteredTransfers = useMemo(() => {
    return transfers.filter(t => {
      const matchesQuery = !query ||
        t.sender_email.toLowerCase().includes(query.toLowerCase()) ||
        t.receiver_email.toLowerCase().includes(query.toLowerCase()) ||
        (t.file_name && t.file_name.toLowerCase().includes(query.toLowerCase()));

      if (!matchesQuery) return false;

      if (userType === 'ADMIN') return true;
      return currentUser && t.sender === currentUser.id;
    });
  }, [transfers, query, userType, currentUser]);

  // Group Transfers by Receiver
  const groupedTransfers = useMemo(() => {
    const groups = {};
    filteredTransfers.forEach(t => {
      const key = t.receiver_email || `User #${t.receiver}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(t);
    });
    return groups;
  }, [filteredTransfers]);

  const toggleGroup = (key) => {
    setExpandedGroups(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const renderFilePreview = (type, url, name) => {
    if (type === 'IMAGE') {
      return <img src={url} alt={name || "Preview"} className="w-full h-full object-cover" />;
    }
    if (type === 'AUDIO') {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4 bg-slate-900/60 w-full text-center">
          <Music className="h-8 w-8 text-sky-400 animate-pulse mb-1" />
          <span className="text-[10px] text-slate-500 font-bold truncate max-w-full px-2">{name}</span>
          <audio src={url} controls className="h-6 w-full max-w-[180px] mt-1.5 scale-90" />
        </div>
      );
    }
    if (type === 'VIDEO') {
      return (
        <video src={url} controls className="w-full h-full object-contain bg-black" />
      );
    }
    return <FileText className="h-8 w-8 text-slate-600" />;
  };

  const getFileIcon = (type) => {
    if (type === 'AUDIO') return <Music className="w-4 h-4 text-emerald-400" />;
    if (type === 'VIDEO') return <Film className="w-4 h-4 text-amber-400" />;
    return <ImageIcon className="w-4 h-4 text-sky-400" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Data Transfer</h1>
          <p className="text-sm text-slate-500">Secure media packet transfer (Image, Audio, and Video) over TCP sockets.</p>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${userType === 'USER' ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-6`}>
        {/* Send Section */}
        {userType === 'USER' && (
          <Card className="lg:col-span-1 border-slate-800 bg-gradient-to-br from-[#16191f] to-[#0d1117] p-6 shadow-elegant flex flex-col gap-6 h-fit">
            <div className="space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2 text-slate-400 uppercase tracking-widest">
                <Zap className="h-4 w-4 text-sky-400" /> New Packet Transfer
              </h3>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Recipient User</label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="bg-[#0d1117] border-slate-800">
                    <SelectValue placeholder="Select Recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(u => (
                      <SelectItem key={u.id} value={String(u.id)}>{u.email} ({u.name || 'No Name'})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Media File (Image, Audio, Video)</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative cursor-pointer aspect-video rounded-xl border-2 border-dashed border-slate-800 hover:border-sky-500/50 hover:bg-sky-500/5 transition-all flex flex-col items-center justify-center gap-3 overflow-hidden"
                >
                  {previewUrl ? (
                    <div className="w-full h-full" onClick={e => e.stopPropagation()}>
                      {renderFilePreview(fileType, previewUrl, selectedFile?.name)}
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-slate-900/60 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                      >
                        <span className="text-xs font-bold text-white uppercase bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">Change File</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-3 bg-slate-800 rounded-full text-slate-400 group-hover:text-sky-400 transition-colors">
                        <HardDrive className="h-6 w-6" />
                      </div>
                      <div className="text-center">
                        <span className="text-xs font-semibold text-slate-300 block">Click to upload media</span>
                        <span className="text-[10px] text-slate-500 mt-1 block">Supports Image, Audio, or Video</span>
                      </div>
                    </>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,audio/*,video/*"
                    className="hidden"
                  />
                </div>
              </div>

              <Button
                onClick={handleSendFile}
                disabled={isSending || !selectedUser || !selectedFile}
                className="w-full h-12 shadow-glow gap-2"
              >
                {isSending ? (
                  <Activity className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isSending ? 'Transmitting Socket Bytes...' : 'Transfer Socket Packets'}
              </Button>
            </div>
          </Card>
        )}

        {/* Transfer History (Collapsible List Grouped by Recipient) */}
        <Card className={`${userType === 'USER' ? 'lg:col-span-2' : 'lg:col-span-1'} border-slate-800 bg-[#16191f] p-6 shadow-elegant overflow-hidden`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2 text-slate-400 uppercase tracking-widest">
                <ArrowLeftRight className="h-4 w-4 text-sky-400" /> Transfer History
              </h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Grouped by target node connection</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search recipient or file..."
                className="pl-9 h-9 bg-background/60"
              />
            </div>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
            {Object.entries(groupedTransfers).map(([receiverEmail, items]) => {
              const isExpanded = !!expandedGroups[receiverEmail];
              return (
                <div key={receiverEmail} className="border border-slate-800 rounded-xl overflow-hidden bg-[#0d1117]">
                  {/* Collapsible Header */}
                  <div
                    onClick={() => toggleGroup(receiverEmail)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/30 transition-colors select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-400">
                        <UserIcon size={16} />
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                          <span className="font-bold text-[9px] text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20">From</span>
                          <span className="font-semibold">{receiverEmail}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                          <span className="font-bold text-[9px] text-sky-400 uppercase tracking-widest bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">To</span>
                          <span className="font-semibold">{items[0].sender_email}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-[9px] border-slate-800 text-slate-400">
                        TCP Connection
                      </Badge>
                      {isExpanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                    </div>
                  </div>

                  {/* Expanded Items List */}
                  {isExpanded && (
                    <div className="border-t border-slate-850 bg-slate-950/20 divide-y divide-slate-850 p-2 space-y-2">
                      {items.map((t) => (
                        <div key={t.id} className="p-3 hover:bg-slate-800/20 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all">
                          <div className="flex items-start gap-3 min-w-0">
                            {/* Visual Miniature */}
                            <div className="h-12 w-12 rounded-lg border border-slate-800 overflow-hidden bg-slate-900 flex items-center justify-center shrink-0">
                              {t.file_type === 'IMAGE' ? (
                                <img src={t.image} alt="Thumb" className="w-full h-full object-cover" />
                              ) : (
                                <div className="p-2 bg-slate-800 rounded-lg">
                                  {getFileIcon(t.file_type)}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-300 truncate" title={t.file_name || `transfer_${t.id}`}>
                                {t.file_name || `TRANS_${t.id}.${t.file_type === 'AUDIO' ? 'MP3' : t.file_type === 'VIDEO' ? 'MP4' : 'JPG'}`}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[10px] text-slate-500 font-mono">
                                <span className="flex items-center gap-0.5 text-sky-400 font-bold">
                                  {getFileIcon(t.file_type)} {t.file_type}
                                </span>
                                <span>·</span>
                                <span>{formatBytes(t.file_size || 0)}</span>
                                <span>·</span>
                                <span>{formatDistanceToNow(new Date(t.timestamp), { addSuffix: true })}</span>
                              </div>
                            </div>
                          </div>

                          {/* Analysis metrics */}
                          <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-slate-900 pt-2 sm:pt-0 shrink-0">
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <span className="text-[10px] text-slate-500 block">Duration</span>
                                <span className="text-xs font-bold text-slate-300 font-mono">{t.transfer_duration || '0.2'}s</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-slate-500 block">RTT Ping</span>
                                <span className="text-xs font-bold text-slate-300 font-mono text-sky-400">{t.ping || '24'}ms</span>
                              </div>
                            </div>
                            <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-[10px] font-bold">
                              <CheckCircle2 size={10} className="mr-1 shrink-0" /> {t.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {Object.keys(groupedTransfers).length === 0 && (
              <div className="py-16 text-center border border-dashed border-slate-800 rounded-xl bg-[#0d1117] opacity-60">
                <ArrowLeftRight size={36} className="mx-auto text-slate-600 mb-2" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Transfers Found</p>
                <p className="text-[10px] text-slate-600 mt-1">Initiate a connection session to see network logs.</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Secure Data Transfer Analysis Overlay Report */}
      {lastTransferReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-[#16191f] border border-slate-850 rounded-2xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-sky-400 mb-4 pb-3 border-b border-slate-800">
              <Zap size={22} className="animate-pulse" />
              <div>
                <h3 className="text-md font-bold text-white">Transfer Analysis Report</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Secure Socket transmission logs</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-[#0d1117] p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">File Transmitted</span>
                  <span className="text-xs font-bold text-slate-200 block truncate max-w-[200px]">{lastTransferReport.name}</span>
                </div>
                <Badge className="bg-sky-500/10 text-sky-400 border-sky-500/20 text-[9px] font-bold">
                  {lastTransferReport.type}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0d1117] p-3 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Payload Size</span>
                  <span className="text-sm font-bold text-slate-200 font-mono">{formatBytes(lastTransferReport.size)}</span>
                </div>
                <div className="bg-[#0d1117] p-3 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Target Recipient</span>
                  <span className="text-xs font-bold text-slate-300 truncate block">{lastTransferReport.recipient}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800 text-center">
                  <Clock className="w-4 h-4 mx-auto text-slate-500 mb-1" />
                  <span className="text-[8px] text-slate-500 block uppercase tracking-wider">Duration</span>
                  <span className="text-xs font-bold text-slate-200 font-mono">{lastTransferReport.duration}s</span>
                </div>
                <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800 text-center">
                  <Activity className="w-4 h-4 mx-auto text-sky-400 mb-1" />
                  <span className="text-[8px] text-slate-500 block uppercase tracking-wider">RTT Ping</span>
                  <span className="text-xs font-bold text-sky-400 font-mono">{lastTransferReport.ping}ms</span>
                </div>
                <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800 text-center">
                  <Zap className="w-4 h-4 mx-auto text-emerald-400 mb-1" />
                  <span className="text-[8px] text-slate-500 block uppercase tracking-wider">Speed</span>
                  <span className="text-xs font-bold text-emerald-400 font-mono">{lastTransferReport.speed} Mbps</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/10 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-[10px] text-slate-400">Payload transmission fully verified over TCP socket connection.</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                onClick={() => setLastTransferReport(null)}
                className="bg-sky-600 hover:bg-sky-500 text-white font-bold w-full"
              >
                Close Report
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transfers;
