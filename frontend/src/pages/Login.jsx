import React, { useState } from 'react';
import {motion as m} from 'framer-motion';
import {Shield, Lock, Mail, ChevronRight, Loader2, Info} from 'lucide-react';
import {useNavigate, Link} from 'react-router-dom';
import {authApi} from '../api';
import {toast} from 'sonner';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await authApi.login({ email, password });
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      
      // Determine user type (In a real app, this would be part of the profile or JWT)
      const role = email.includes('admin') ? 'ADMIN' : 'USER';
      onLogin(role);
      toast.success("Authentication successful. Decrypting dashboard...");
      navigate('/');
    } catch (err) {
      toast.error("Invalid credentials or unauthorized terminal access");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070a] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#1e293b_0%,transparent_50%)] opacity-20"></div>
      
      <m.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-panel p-10 space-y-8 border-slate-800 shadow-2xl">
          <div className="text-center space-y-2">
             <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 mb-6">
                <Shield className="text-primary" size={32} />
             </div>
             <h1 className="text-2xl font-bold tracking-tight text-white">Security Terminal</h1>
             <p className="text-slate-500 text-sm">Enter your credentials to access the node monitor.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Identity (Email)</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input 
                  type="email" required
                  placeholder="admin@netshield.pro"
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-primary/50 outline-none transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Access Token (Password)</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input 
                  type="password" required
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-primary/50 outline-none transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-slate-950 py-4 rounded-2xl font-bold text-sm hover:bg-primary/80 transition-all shadow-[0_0_20px_rgba(56,189,248,0.3)] flex items-center justify-center gap-3"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <ChevronRight size={20} />}
              {isLoading ? 'Decrypting...' : 'Authenticate Access'}
            </button>
          </form>

          <div className="pt-4 text-center">
             <p className="text-xs text-slate-500">
               No node access? <Link to="/signup" className="text-primary hover:underline font-bold">Register Identity</Link>
             </p>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-6 opacity-30 grayscale hover:grayscale-0 transition-all cursor-default">
           <div className="flex items-center gap-2">
              <Shield size={14} /> <span className="text-[10px] font-bold uppercase tracking-widest">TLS 1.3</span>
           </div>
           <div className="flex items-center gap-2">
              <Lock size={14} /> <span className="text-[10px] font-bold uppercase tracking-widest">AES-256</span>
           </div>
        </div>
      </m.div>
    </div>
  );
};

export default Login;
