import React, { useState, useEffect } from 'react';
import { Download, FileCheck, User as UserIcon, Clock, Loader2, ArrowLeftRight } from 'lucide-react';
import { imageTransfersApi, usersApi } from '../api';
import { formatDistanceToNow } from 'date-fns';
import { Card } from '../components/ui/card';

const Received = ({ userType }) => {
  const [receivedImages, setReceivedImages] = useState([]);
  const [allTransfers, setAllTransfers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [userRes, imagesRes] = await Promise.all([
        usersApi.me(),
        imageTransfersApi.list()
      ]);
      const userData = userRes.data;
      setCurrentUser(userData);
      const rawData = imagesRes.data;
      const dataArray = Array.isArray(rawData) ? rawData : (rawData?.results || []);
      // Store all for admin surveillance
      setAllTransfers(dataArray);

      // Filter images where current user is receiver
      const received = dataArray.filter(img => img.receiver === userData.id);
      setReceivedImages(received);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
            <Download className="text-emerald-400" size={28} />
            Received Images
          </h2>
          <p className="text-slate-500 text-sm mt-1">Images shared with you by other network users.</p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors shadow-elegant"
        >
          <Clock size={18} className="text-slate-400" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-50">
            <Loader2 className="animate-spin mb-4 text-emerald-500" />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Scanning incoming nodes...</p>
          </div>
        ) : receivedImages.length > 0 ? (
          receivedImages.map((file) => (
            <div
              key={file.id}
              className="glass-panel p-0 space-y-0 hover:border-emerald-500/30 transition-all group relative overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col shadow-elegant"
            >
              <div className="aspect-video w-full relative overflow-hidden bg-slate-900/50">
                <img src={file.image} alt="Received" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute top-3 right-3">
                  <div className="px-2 py-1 bg-[#0d1117]/80 backdrop-blur-md text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-bold uppercase tracking-widest shadow-glow-sm">
                    Verified
                  </div>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-row justify-between">
                <div>
                  <h4 className="font-bold text-slate-200 truncate group-hover:text-emerald-400 transition-colors">IMAGE_{file.id}.JPG</h4>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 font-medium">
                    <UserIcon size={10} className="text-sky-400" />
                    <span className="text-slate-500 mr-1 uppercase font-bold tracking-tighter">From:</span>
                    {file.sender_email}
                  </div>
                </div>
                <a
                  href={file.image}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <Download size={14} /> Open
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center glass-panel opacity-50 border-dashed animate-in fade-in duration-700">
            <FileCheck size={48} className="mx-auto mb-4 text-slate-600" />
            <p className="font-bold uppercase tracking-widest text-xs text-slate-400">No images received</p>
            <p className="text-[10px] mt-2 text-slate-600">Ready to receive secure visual bitstreams...</p>
          </div>
        )}
      </div>

      {userType === 'ADMIN' && (
        <Card className="border-slate-800 bg-[#16191f] overflow-hidden animate-in slide-in-from-bottom-4 duration-500 shadow-elegant mt-12">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-500/5 to-transparent">
            <div>
              <h3 className="font-bold text-white flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-blue-400" />
                Network-Wide Image Transfers (Surveillance)
              </h3>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">Real-time surveillance of user-to-user data flow</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/30">
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">Sender</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">Data</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">Recipient</th>
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
                        <div className="w-10 h-10 rounded border border-slate-700/50 overflow-hidden bg-slate-900/50 shadow-inner group-hover:border-blue-500/30 transition-colors">
                          <img src={t.image} alt="Data Stream" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-300">{t.receiver_email}</td>
                      <td className="px-6 py-4 text-right text-[10px] text-slate-500 font-mono">
                        {new Date(t.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-10 text-center text-slate-600 text-xs italic">
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
