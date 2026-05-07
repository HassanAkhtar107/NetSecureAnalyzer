import React, { useState } from 'react';
import { Shield, Lock, Mail, ChevronRight, Loader2, Info } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api';
import { toast } from 'sonner';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await authApi.login({ username: email, password });
      localStorage.setItem('access_token', res.data.token);
      const role = res.data.user?.user_type || (email.includes('admin') ? 'ADMIN' : 'USER');
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

      <div
        className="w-full max-w-md relative z-10 animate-fade-in"
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
              className="w-full bg-emerald-500 text-slate-950 py-4 rounded-2xl font-bold text-sm hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-3 mt-4"
            >
              {isLoading ? 'Processing...' : 'Login'}
            </button>
          </form>

          <div className="pt-4 text-center">
            <p className="text-xs text-slate-500">
              No node access? <Link to="/signup" className="text-emerald-400 hover:underline font-bold">Register Identity</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
