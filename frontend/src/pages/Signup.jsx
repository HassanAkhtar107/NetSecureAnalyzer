import React, { useState } from 'react';
import {motion as m} from 'framer-motion';
import {Shield, User, Mail, Lock, ChevronRight, Loader2} from 'lucide-react';
import {useNavigate, Link} from 'react-router-dom';
import {authApi} from '../api';
import {toast} from 'sonner';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authApi.signup(formData);
      toast.success("Identity provisioned successfully. Please login.");
      navigate('/login');
    } catch (err) {
      toast.error("Registration failed. Data collision in security database.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070a] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#1e293b_0%,transparent_50%)] opacity-20"></div>
      
      <m.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-panel p-10 space-y-8 border-slate-800 shadow-2xl">
          <div className="text-center space-y-2">
             <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 mb-6">
                <User className="text-emerald-400" size={32} />
             </div>
             <h1 className="text-2xl font-bold tracking-tight text-white">Identity Provisioning</h1>
             <p className="text-slate-500 text-sm">Register your profile in the security network.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input 
                  type="text" required
                  placeholder="Network Operator"
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-emerald-500/50 outline-none transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Identity (Email)</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input 
                  type="email" required
                  placeholder="operator@netshield.pro"
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-emerald-500/50 outline-none transition-all"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Access Token (Password)</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input 
                  type="password" required
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-emerald-500/50 outline-none transition-all"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-500 text-slate-950 py-4 rounded-2xl font-bold text-sm hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-3 mt-4"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <ChevronRight size={20} />}
              {isLoading ? 'Processing...' : 'Provision Identity'}
            </button>
          </form>

          <div className="pt-2 text-center">
             <p className="text-xs text-slate-500">
               Already provisioned? <Link to="/login" className="text-emerald-400 hover:underline font-bold">Authenticate Login</Link>
             </p>
          </div>
        </div>
      </m.div>
    </div>
  );
};

export default Signup;
