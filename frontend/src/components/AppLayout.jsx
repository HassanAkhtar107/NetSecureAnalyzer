import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Monitor, ArrowLeftRight, LogOut, Download, Menu, ShieldCheck, User, PanelLeft } from "lucide-react";
import { useNetwork } from "../context/NetworkContext";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";

const AppLayout = ({ user, onLogout, children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const {
    activeConnections,
    blockedToday,
    uptime,
    devices,
    vpnConnected,
    vpnIP
  } = useNetwork();

  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard", adminOnly: true },
    { to: "/devices", icon: Monitor, label: "Devices", adminOnly: true },
    { to: "/data-transfer", icon: ArrowLeftRight, label: "Data Transfer" },
    { to: "/received", icon: Download, label: "Received Data" },
  ];

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userType');
    localStorage.removeItem('access_token');
    onLogout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-[#020617] font-sans text-slate-200 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-[#0a0f1d] border-r border-slate-800 flex flex-col transition-all duration-300 ease-in-out relative z-30 shadow-2xl",
          collapsed ? "w-20" : "w-64"
        )}
      >
        {/* Sidebar Header */}
        <div className="h-16 border-b border-slate-800 flex items-center px-4 shrink-0 overflow-hidden">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 shadow-lg shadow-sky-500/20">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            {!collapsed && (
              <div className="flex flex-col leading-tight animate-in fade-in slide-in-from-left-2 duration-300">
                <span className="text-sm font-bold tracking-tight text-white">NetSecure</span>
                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Analyzer</span>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {!collapsed && (
            <p className="px-3 text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] mb-2">Modules</p>
          )}
          {navItems.filter(item => !item.adminOnly || user?.user_type === 'ADMIN').map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative",
                isActive
                  ? "bg-sky-500/10 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-800/50 hover:text-slate-200"
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn(
                    "h-5 w-5 shrink-0 transition-colors",
                    isActive ? "text-sky-400" : "text-slate-500 group-hover:text-slate-300"
                  )} />
                  {!collapsed && (
                    <span className="truncate animate-in fade-in slide-in-from-left-1 duration-300">{item.label}</span>
                  )}
                  {isActive && !collapsed && (
                    <div className="absolute right-0 w-1 h-5 bg-sky-500 rounded-l-full" />
                  )}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl border border-slate-800">
                      {item.label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 space-y-4 shrink-0">
          {!collapsed ? (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Protected</span>
                </div>
                <span className="text-[10px] text-slate-500">{uptime}</span>
              </div>

              <div className="grid grid-cols-3 gap-1">
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-1.5 text-center">
                  <div className="text-[10px] font-bold text-white">{devices.length}</div>
                  <div className="text-[8px] uppercase text-slate-500">Nodes</div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-1.5 text-center">
                  <div className="text-[10px] font-bold text-sky-400">{activeConnections}</div>
                  <div className="text-[8px] uppercase text-slate-500">Active</div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-1.5 text-center">
                  <div className="text-[10px] font-bold text-rose-400">{blockedToday}</div>
                  <div className="text-[8px] uppercase text-slate-500">Block</div>
                </div>
              </div>

              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 transition-colors gap-3 px-3"
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-slate-500 hover:text-rose-400"
              >
                <LogOut size={20} />
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-800 bg-[#0a0f1d]/50 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 z-20">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="text-slate-400 hover:text-white"
            >
              {collapsed ? <Menu size={20} /> : <PanelLeft size={20} />}
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 pl-2">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-xs font-bold text-white leading-none mb-2">{user?.name ? user?.name : user?.email || ''}</span>
                <Badge variant="success" className="h-4 px-1.5 text-[9px] font-bold uppercase tracking-widest border-emerald-500/20">
                  {user?.user_type === 'ADMIN' ? 'Admin' : 'User'}
                </Badge>
              </div>
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-600 flex items-center justify-center text-slate-200 shadow-inner">
                <User size={18} />
              </div>
            </div>

            <div className="hidden md:flex flex-col items-end border-l border-slate-800 pl-4 ml-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Effective IP</p>
              <p className={cn(
                "text-xs font-mono leading-none tracking-tighter",
                vpnConnected ? "text-sky-400" : "text-emerald-400"
              )}>
                {vpnIP || '-'}
              </p>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 overflow-y-auto bg-[#05070a] custom-scrollbar">
          <div className="max-w-[1600px] mx-auto p-8 animate-in fade-in duration-700">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
