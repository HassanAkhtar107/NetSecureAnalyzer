import React from "react";
import {NavLink, useLocation, useNavigate} from "react-router-dom";
import {
  LayoutDashboard, Monitor, ArrowLeftRight, Shield, Lock, Network, FileText, Settings,
  Bell, Search, Moon, ChevronDown, CheckCircle2, Wifi, HardDrive, Activity, X, LogOut, Download, FileCheck
} from "lucide-react";
import {useNetwork} from "@/context/NetworkContext";
import {motion, AnimatePresence} from "framer-motion";

const AppLayout = ({ user, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    activeConnections, 
    blockedToday, 
    uptime, 
    firewallOn, 
    devices,
    vpnConnected,
    vpnIP 
  } = useNetwork();

  const navItems = [
    { to: "/", icon, label: "Dashboard" },
    { to: "/devices", icon, label: "Devices" },
    { to: "/received", icon, label: "Received Data" },
    { to: "/data-transfer", icon, label: "Data Transfer" },
    { to: "/firewall", icon, label: "Firewall", adminOnly: true },
    { to: "/topology", icon, label: "Topology", adminOnly: true },
    { to: "/vpn", icon, label: "Secure VPN" },
  ];

  return (
    <div className="flex h-screen bg-background font-sans text-foreground">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-border flex flex-col relative z-20 shadow-xl shadow-black/20">
        <div className="p-6 flex items-center gap-3">
          <Shield className="h-7 w-7 text-primary" />
          <span className="text-lg font-bold text-foreground">NetShield</span>
          <span className="text-[10px] font-semibold bg-primary/20 text-primary px-1.5 py-0.5 rounded-md">PRO</span>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.filter(item => !item.adminOnly || user?.user_type === 'ADMIN').map((item) => {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative group ${isActive
                  ? "bg-primary/20 text-white shadow-[0_4px_20px_rgba(56,189,248,0.2)]"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                  }`}
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={`h-5 w-5 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                    <span className="relative z-10">{item.label}</span>
                    {isActive && (
                      <motion.div 
                        layoutId="activeTab"
                        className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className={`h-4 w-4 ${firewallOn ? "text-neon-green" : "text-neon-yellow"}`} />
            <div>
              <p className="text-xs font-medium text-foreground">Network Status</p>
              <p className={`text-[10px] font-medium ${firewallOn ? "text-neon-green" : "text-neon-yellow"}`}>
                {firewallOn ? "Protected ⚡" : "Unprotected ⚠️"}
              </p>
            </div>
          </div>
          <div className="space-y-1.5 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2"><Wifi className="h-3 w-3" /> Uptime: {uptime}</div>
            <div className="flex items-center gap-2"><HardDrive className="h-3 w-3" /> Total Devices: {devices.length}</div>
            <div className="flex items-center gap-2"><Activity className="h-3 w-3" /> Active: {activeConnections}</div>
            <div className="flex items-center gap-2"><X className="h-3 w-3 text-destructive" /> Blocked Today: {blockedToday}</div>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem('isAuthenticated');
              localStorage.removeItem('userType');
              onLogout();
              window.location.href = '/login';
            }}
            className="w-full mt-2 flex items-center gap-3 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#05070a]">
        <header className="h-16 border-b border-border bg-background/50 backdrop-blur-md flex items-center justify-between px-8 relative z-10">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search network nodes..." 
                className="bg-muted/50 border border-transparent focus:border-primary/50 rounded-full py-1.5 pl-10 pr-4 text-xs w-64 transition-all outline-none"
              />
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">Live Monitor</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 pl-3 border-l border-border group cursor-pointer">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold border border-primary/30 group-hover:bg-primary group-hover:text-white transition-all">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">{user?.name}</p>
                <div className="flex items-center gap-1.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{user?.user_type || 'Role'}</p>
                  {(user?.assigned_network_name || user?.user_type === 'ADMIN') && (
                    <span className="text-[9px] bg-slate-800 text-slate-400 px-1 rounded uppercase font-bold">
                      {user?.user_type === 'ADMIN' ? 'Localhost' : user?.assigned_network_name}
                    </span>
                  )}
                </div>
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            
            <div className="flex flex-col items-end border-l border-border pl-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Effective IP</p>
              <p className={`text-xs font-mono leading-none ${vpnConnected ? 'text-sky-400' : 'text-emerald-400'}`}>
                {vpnIP}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <m.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Component children placeholder if needed, but here we use Outlet or pass children */}
            {React.Children.map(window.location.pathname, () => null)} 
            {/* In a real scenario with Routes outside, this component wraps around them via Outlet */}
          </m.div>
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
