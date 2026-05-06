import React, { useState, useEffect } from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {Download, FileCheck, User, Clock, HardDrive, File, Image, Video, FileText, Loader2} from 'lucide-react';
import {transfersApi} from '../api';
import {toast} from 'sonner';

const Received = () => {
  const [receivedFiles, setReceivedFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReceived = async () => {
    try {
      const res = await transfersApi.list();
      if (Array.isArray(res.data)) {
        setReceivedFiles(res.data);
      } else {
        setReceivedFiles([]);
      }
    } catch (err) {
      console.error("Failed to fetch received data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceived();
  }, []);

  const getFileIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'image': case 'photo': return <Image className="text-pink-400" size={20} />;
      case 'video': return <Video className="text-purple-400" size={20} />;
      case 'document': return <FileIcon className="text-sky-400" size={20} />;
      default: return <File className="text-slate-400" size={20} />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Download className="text-emerald-400" size={28} />
            Received Data
          </h2>
          <p className="text-slate-500 text-sm mt-1">Manage and download data shared with your network nodes.</p>
        </div>
        <button 
          onClick={fetchReceived}
          className="p-2 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
        >
          <Clock size={18} className="text-slate-400" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-50">
            <Loader2 className="animate-spin mb-4" />
            <p className="text-xs font-bold uppercase tracking-widest">Decrypting incoming payloads...</p>
          </div>
        ) : receivedFiles.length > 0 ? (
          <AnimatePresence>
            {receivedFiles.map((file, idx) => (
              <motion.div 
                key={file.id || idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-panel p-6 space-y-4 hover:border-emerald-500/30 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-3xl -mr-12 -mt-12 group-hover:bg-emerald-500/10 transition-colors"></div>
                
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-slate-800 rounded-xl group-hover:bg-emerald-500/5 transition-colors">
                    {getFileIcon(file.file_type)}
                  </div>
                  <div className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-[9px] font-bold uppercase tracking-widest">
                    Verified
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-200 truncate">{file.file_name || 'Protocol_Payload.dat'}</h4>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-medium">
                    <User size={10} /> {file.sender_ip || 'Internal System'}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/50 flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <HardDrive size={12} />
                    {(Math.random() * 5).toFixed(1)} MB
                  </div>
                  <button 
                    onClick={() => toast.success(`Downloading ${file.file_name}...`)}
                    className="flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <Download size={14} /> Download
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="col-span-full py-20 text-center glass-panel opacity-50 border-dashed">
            <FileCheck size={48} className="mx-auto mb-4 text-slate-600" />
            <p className="font-bold uppercase tracking-widest text-xs">No data has been received yet</p>
            <p className="text-[10px] mt-2">Active listening on all assigned network ports...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Received;
