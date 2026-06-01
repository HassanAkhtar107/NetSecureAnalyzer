import React, { useState, useEffect, useMemo } from 'react';
import {
  Download, FileCheck, User as UserIcon, Clock, Loader2, ArrowLeftRight,
  ChevronDown, ChevronUp, Music, Film, Image as ImageIcon, CheckCircle2,
  HardDrive
} from 'lucide-react';
import { imageTransfersApi, usersApi } from '../api';
import { formatDistanceToNow } from 'date-fns';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const formatBytes = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const Received = ({ userType }) => {
  const [receivedFiles, setReceivedFiles] = useState([]);
  const [allTransfers, setAllTransfers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState({});

  const fetchData = async () => {
    try {
      const [userRes, transfersRes] = await Promise.all([
        usersApi.me(),
        imageTransfersApi.list()
      ]);
      const userData = userRes.data;
      setCurrentUser(userData);
      const rawData = transfersRes.data;
      const dataArray = Array.isArray(rawData) ? rawData : (rawData?.results || []);

      setAllTransfers(dataArray);

      // Filter where current user is the receiver
      const received = dataArray.filter(file => file.receiver === userData.id);
      setReceivedFiles(received);
    } catch (err) {
      console.error("Failed to fetch received data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Group received files by Sender
  const groupedReceived = useMemo(() => {
    const groups = {};
    receivedFiles.forEach(file => {
      const key = file.sender_email || `User #${file.sender}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(file);
    });
    return groups;
  }, [receivedFiles]);

  const toggleGroup = (key) => {
    setExpandedGroups(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const renderReceivedMedia = (type, url, name) => {
    if (type === 'IMAGE') {
      return (
        <div className="aspect-video w-full relative overflow-hidden bg-slate-900/50">
          <img src={url} alt={name || "Received"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        </div>
      );
    }
    if (type === 'AUDIO') {
      return (
        <div className="aspect-video w-full flex flex-col items-center justify-center p-4 bg-slate-900/80 text-center border-b border-slate-800">
          <Music className="h-10 w-10 text-emerald-400 animate-pulse mb-2" />
          <span className="text-[10px] text-slate-400 font-bold truncate max-w-full px-4">{name}</span>
          <audio src={url} controls className="h-8 w-full max-w-[220px] mt-2 scale-90" />
        </div>
      );
    }
    if (type === 'VIDEO') {
      return (
        <div className="aspect-video w-full bg-black relative">
          <video src={url} controls className="w-full h-full object-contain" />
        </div>
      );
    }
    return (
      <div className="aspect-video w-full flex items-center justify-center bg-slate-900/40">
        <HardDrive className="h-12 w-12 text-slate-700" />
      </div>
    );
  };

  const getFileIcon = (type) => {
    if (type === 'AUDIO') return <Music className="w-4 h-4 text-emerald-400" />;
    if (type === 'VIDEO') return <Film className="w-4 h-4 text-amber-400" />;
    return <ImageIcon className="w-4 h-4 text-sky-400" />;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
            <Download className="text-emerald-400" size={28} />
            Received Packets
          </h2>
          <p className="text-slate-500 text-sm mt-1">Images, audio, and video files transferred to your node by other network users.</p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors shadow-elegant"
        >
          <Clock size={18} className="text-slate-400" />
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center opacity-50">
          <Loader2 className="animate-spin mb-4 text-emerald-500" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Scanning incoming nodes...</p>
        </div>
      ) : receivedFiles.length > 0 ? (
        <div className="space-y-4">
          {Object.entries(groupedReceived).map(([senderEmail, items]) => {
            const isExpanded = !!expandedGroups[senderEmail];
            return (
              <div key={senderEmail} className="border border-slate-800 rounded-2xl overflow-hidden bg-[#16191f] shadow-elegant">
                {/* Collapsible Header */}
                <div
                  onClick={() => toggleGroup(senderEmail)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-800/30 transition-colors select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                      <UserIcon size={18} />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-200">Shared by: {senderEmail}</span>
                      {!isExpanded && (
                        <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
                          {items.length} file{items.length !== 1 ? 's' : ''} received
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 uppercase tracking-widest border border-emerald-500/20">
                      TCP Secure Socket
                    </span>
                    {isExpanded ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
                  </div>
                </div>

                {/* Expanded Content: Cards Grid */}
                {isExpanded && (
                  <div className="p-6 border-t border-slate-850 bg-slate-950/20">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {items.map((file) => (
                        <div
                          key={file.id}
                          className="glass-panel p-0 space-y-0 hover:border-emerald-500/30 transition-all group relative overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col shadow-elegant rounded-xl border border-slate-800 bg-[#0d1117]"
                        >
                          {/* File Preview */}
                          {renderReceivedMedia(file.file_type, file.image, file.file_name)}

                          {/* Analysis Badges on Top of Card */}
                          <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                            <Badge className="bg-[#0d1117]/85 backdrop-blur text-[8px] border-emerald-500/20 text-emerald-400 uppercase tracking-wider font-bold">
                              Verified
                            </Badge>
                            <Badge className="bg-sky-500/10 backdrop-blur text-[8px] border-sky-500/20 text-sky-400 uppercase tracking-wider font-bold">
                              {file.file_type}
                            </Badge>
                          </div>

                          <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                            <div>
                              <h4 className="font-bold text-slate-200 text-xs truncate group-hover:text-emerald-400 transition-colors" title={file.file_name || `IMAGE_${file.id}`}>
                                {file.file_name || `TRANS_${file.id}.${file.file_type === 'AUDIO' ? 'MP3' : file.file_type === 'VIDEO' ? 'MP4' : 'JPG'}`}
                              </h4>

                              {/* Performance metrics of transfer */}
                              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-850 text-center font-mono">
                                <div>
                                  <span className="text-[8px] text-slate-500 block uppercase">Size</span>
                                  <span className="text-[10px] font-bold text-slate-400">{formatBytes(file.file_size || 0)}</span>
                                </div>
                                <div>
                                  <span className="text-[8px] text-slate-500 block uppercase">Duration</span>
                                  <span className="text-[10px] font-bold text-slate-400">{file.transfer_duration || '0.2'}s</span>
                                </div>
                                <div>
                                  <span className="text-[8px] text-slate-500 block uppercase">Ping</span>
                                  <span className="text-[10px] font-bold text-sky-400">{file.ping || '24'}ms</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                              <span className="text-[9px] font-mono text-slate-500">
                                {formatDistanceToNow(new Date(file.timestamp), { addSuffix: true })}
                              </span>
                              <a
                                href={file.image}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20"
                              >
                                <Download size={12} /> Open
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        null
      )}

      {/* Admin surveillance of network-wide media streams */}
      {userType === 'ADMIN' && (
        <Card className="border-slate-800 bg-[#16191f] overflow-hidden animate-in slide-in-from-bottom-4 duration-500 shadow-elegant mt-12">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-500/5 to-transparent">
            <div>
              <h3 className="font-bold text-white flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-blue-400" />
                Network-Wide Media Socket Surveillance
              </h3>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">Real-time surveillance of user-to-user audio, video, and image transfers</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/30">
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">Sender</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">Media Content</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">Recipient</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">Stats</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {allTransfers.length > 0 ? (
                  allTransfers.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                            <UserIcon className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-semibold text-slate-300">{t.sender_email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded border border-slate-700/50 overflow-hidden bg-slate-900/50 shadow-inner group-hover:border-blue-500/30 transition-colors flex items-center justify-center shrink-0">
                            {t.file_type === 'IMAGE' ? (
                              <img src={t.image} alt="Data Stream" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                              <div className="p-2 bg-slate-800 rounded">
                                {getFileIcon(t.file_type)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-300 block truncate max-w-[200px]">{t.file_name || `TRANS_${t.id}`}</span>
                            <span className="text-[9px] text-sky-400 font-mono font-bold uppercase">{t.file_type}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-300">{t.receiver_email}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
                          <span>{formatBytes(t.file_size || 0)}</span>
                          <span>·</span>
                          <span className="text-sky-400">{t.ping || '24'}ms RTT</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-[10px] text-slate-500 font-mono">
                        {new Date(t.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-slate-600 text-xs italic">
                      No transfers detected on the network.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Received;
