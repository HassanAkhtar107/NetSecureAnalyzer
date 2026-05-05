import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, User, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LoginProps {
  onLogin: (type: 'ADMIN' | 'USER', token: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple logic for simulation
    const type = email.includes('admin') ? 'ADMIN' : 'USER';
    onLogin(type, 'simulated-token');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-panel p-10 space-y-8">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-sky-500/20 rounded-2xl flex items-center justify-center border border-sky-500/30 mx-auto mb-6 pulse-blue">
              <Shield className="text-sky-400" size={32} />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Access Control</h2>
            <p className="text-slate-400 text-sm">Secure authorization required for network node access.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Identity</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@netsecure.io"
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-sky-500/50 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Authentication Key</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-sky-500/50 transition-all"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-4 bg-sky-500 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-sky-400 transition-all mt-8 group"
            >
              Verify Protocols
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="text-center pt-2">
            <p className="text-slate-400 text-sm">
              New node operator?{' '}
              <Link to="/signup" className="text-sky-400 hover:underline">Register Identity</Link>
            </p>
          </div>

          <div className="pt-6 border-t border-slate-800">
            <p className="text-xs text-center text-slate-500">
              By authenticating, you agree to the network security protocols and monitoring system usage terms.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
