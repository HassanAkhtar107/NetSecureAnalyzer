import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeftRight, Image as ImageIcon, Search, CheckCircle2, Activity, User as UserIcon, Send, Zap } from 'lucide-react';
import { usersApi, imageTransfersApi } from '../api';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const Transfers = ({ userType }) => {
  const [users, setUsers] = useState([]);
  console.log("users--->", users);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [query, setQuery] = useState('');

  // Selection State
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef(null);

  const fetchData = async () => {
    setLoading(true);

    // 1. Get current user profile
    try {
      const meRes = await usersApi.me();
      setCurrentUser(meRes.data);
    } catch (err) {
      console.error("Profile fetch error:", err);
    }

    // 2. Get all users
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
        const isNotSelf = currentUser ? u.id !== currentUser.id : true;
        const isNotAdmin = u.user_type !== 'ADMIN';
        return isNotSelf && isNotAdmin;
      });
      setUsers(otherUsers);
    } catch (err) {
      console.error("Users list fetch error:", err);
    }

    // 3. Get image transfers
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

  // Effect to re-run filtering when currentUser is set
  useEffect(() => {
    if (currentUser && users.length > 0) {
      const otherUsers = users.filter(u => u.id !== currentUser.id);
      // We don't want to trigger infinite loops, so we only update if it actually changes
      // Actually, it's better to just use currentUserId inside the users filter in fetchData
    }
  }, [currentUser]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendImage = async () => {
    if (!selectedUser) {
      toast.error("Please select a recipient user");
      return;
    }
    if (!selectedImage) {
      toast.error("Please select an image to send");
      return;
    }

    setIsSending(true);
    const formData = new FormData();
    formData.append('receiver', selectedUser);
    formData.append('image', selectedImage);

    try {
      await imageTransfersApi.send(formData);
      toast.success("Image transferred successfully!");
      setSelectedImage(null);
      setPreviewUrl(null);
      setSelectedUser('');
      fetchData();
    } catch (err) {
      toast.error("Transfer failed. Check network or permissions.");
    } finally {
      setIsSending(false);
    }
  };

  const filteredTransfers = useMemo(() => {
    return transfers.filter(t => {
      // 1. Search query filter
      const matchesQuery = !query ||
        t.sender_email.toLowerCase().includes(query.toLowerCase()) ||
        t.receiver_email.toLowerCase().includes(query.toLowerCase());

      if (!matchesQuery) return false;

      // 2. Role-based visibility
      if (userType === 'ADMIN') return true; // Admins see all network traffic

      // 3. User visibility: Only show images they SENT on this screen
      return currentUser && t.sender === currentUser.id;
    });
  }, [transfers, query, userType, currentUser]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Data Transfer</h1>
          <p className="text-sm text-slate-500">Secure image transfers between network nodes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Send Section */}
        <Card className="lg:col-span-1 border-slate-800 bg-gradient-to-br from-[#16191f] to-[#0d1117] p-6 shadow-elegant flex flex-col gap-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2 text-slate-400 uppercase tracking-widest">
              <Zap className="h-4 w-4 text-amber-400" /> New Transfer
            </h3>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Recipient User</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="bg-[#0d1117] border-slate-800">
                  <SelectValue placeholder="Select User" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={String(u.id)}>{u.email} ({u.name || 'No Name'})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Image</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative cursor-pointer aspect-video rounded-xl border-2 border-dashed border-slate-800 hover:border-sky-500/50 hover:bg-sky-500/5 transition-all flex flex-col items-center justify-center gap-3 overflow-hidden"
              >
                {previewUrl ? (
                  <>
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <ImageIcon className="text-white h-8 w-8" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-slate-800 rounded-full text-slate-400 group-hover:text-sky-400 transition-colors">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                    <span className="text-xs text-slate-500 group-hover:text-slate-300">Click to browse images</span>
                  </>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>

            <Button
              onClick={handleSendImage}
              disabled={isSending || !selectedUser || !selectedImage}
              className="w-full h-12 shadow-glow gap-2"
            >
              {isSending ? (
                <Activity className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isSending ? 'Transmitting...' : 'Send Image'}
            </Button>
          </div>
        </Card>

        {/* Transfer History (Recent Sent) */}
        <Card className="lg:col-span-2 border-border bg-gradient-card p-6 shadow-elegant overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold flex items-center gap-2 text-slate-400 uppercase tracking-widest">
              <ArrowLeftRight className="h-4 w-4 text-sky-400" /> Recent Transfers
            </h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search history..."
                className="pl-9 h-9 bg-background/60"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>From/To</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransfers.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded border border-slate-800 overflow-hidden bg-slate-900">
                          <img src={t.image} alt="Transfer" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-sm text-slate-200">IMG_{t.id}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Badge variant="outline" className="text-[9px] py-0 h-4 border-emerald-500/30 text-emerald-500">From</Badge>
                          {t.sender_email}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Badge variant="outline" className="text-[9px] py-0 h-4 border-sky-500/30 text-sky-500">To</Badge>
                          {t.receiver_email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 bg-emerald-500/5">
                        <CheckCircle2 className="mr-1 h-3 w-3" /> {t.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTransfers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center text-sm text-slate-500 italic">No transfer history found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

    </div>
  );
};

export default Transfers;
