import React from 'react';
import { motion } from 'framer-motion';
import { Shield, LayoutDashboard, Share2, Server, ShieldAlert, LogOut, Settings, Send, Globe, Activity, RefreshCw, Search } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  userType: 'ADMIN' | 'USER';
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, userType, onLogout }) => {
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Devices', icon: Server, path: '/devices' },
    { name: 'Data Transfer', icon: Send, path: '/transfers' },
    { name: 'Firewall', icon: Shield, path: '/firewall' },
    { name: 'VPN', icon: Globe, path: '/vpn' },
    { name: 'Topology', icon: Share2, path: '/topology' },
    { name: 'Reports', icon: Activity, path: '/performance' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  const filteredItems = menuItems.filter(item => !item.adminOnly || userType === 'ADMIN');

  return (
    <div className="flex h-screen bg-[#020617] text-slate-100 overflow-hidden font-['Outfit']">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        className="w-64 bg-[#0a0f1d] border-r border-slate-800/50 flex flex-col relative z-20"
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center border border-sky-500/20">
            <Shield className="text-sky-400" size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">NetShield <span className="text-[10px] text-sky-500 font-black uppercase">Pro</span></h1>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {filteredItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${location.pathname === item.path
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-[0_0_15px_rgba(56,189,248,0.1)]'
                : 'text-slate-400 hover:bg-slate-800/30 hover:text-slate-200'
                }`}
            >
              <item.icon size={18} className={location.pathname === item.path ? 'text-sky-400' : 'group-hover:text-slate-200'} />
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* Network Status sidebar widget */}
        <div className="px-4 mb-6">
          <div className="bg-[#0f172a]/50 border border-slate-800/50 rounded-2xl p-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Protected</span>
                </div>
                <Share2 size={14} className="text-slate-500" />
              </div>
              <div className="flex justify-center mb-4">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 border-2 border-sky-500/20 rounded-full"></div>
                  <div className="absolute inset-2 border border-sky-500/10 rounded-full"></div>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-t-2 border-sky-400 rounded-full"
                  ></motion.div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Globe size={24} className="text-sky-400/50" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500 font-bold uppercase">Uptime</span>
                  <span className="text-slate-300 font-mono">12d 4h 32m</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500 font-bold uppercase">Connections</span>
                  <span className="text-slate-300 font-mono">23 Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800/50">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 transition-all group"
          >
            <LogOut size={18} className="group-hover:text-rose-400" />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Top Header Navbar */}
        <header className="h-16 border-b border-slate-800/50 bg-[#0a0f1d]/50 backdrop-blur-md flex items-center justify-between px-8 relative z-10">
          <div className="flex items-center gap-8 flex-1">
            <div className="relative w-96 hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                placeholder="Search network protocols, IPs or logs..."
                className="w-full bg-slate-900/50 border border-slate-800/50 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-none focus:border-sky-500/30 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-slate-400">
              <button className="hover:text-white transition-colors"><RefreshCw size={18} /></button>
              <div className="relative">
                <button className="hover:text-white transition-colors"><ShieldAlert size={18} /></button>
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 text-[8px] font-bold text-white rounded-full flex items-center justify-center border-2 border-[#0a0f1d]">3</span>
              </div>
              <button className="hover:text-white transition-colors"><Settings size={18} /></button>
            </div>

            <div className="h-8 w-px bg-slate-800/50"></div>

            <div className="flex items-center gap-3 pl-2">
              <div className="text-right">
                <p className="text-xs font-bold leading-none">Muhammad Hassan</p>
                <p className="text-[10px] text-sky-500 font-bold uppercase tracking-widest mt-1">Super {userType}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 p-0.5 shadow-lg shadow-sky-500/10">
                <div className="w-full h-full rounded-[10px] bg-[#0a0f1d] flex items-center justify-center font-bold text-xs">
                  MH
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-8 scroll-smooth">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
