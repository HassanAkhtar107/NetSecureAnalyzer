import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Monitor, ArrowLeftRight, Shield, Lock, Network, FileText, Settings,
  Bell, Search, Moon, ChevronDown, CheckCircle2, Wifi, HardDrive, Activity, X
} from "lucide-react";
import { useNetwork } from "@/context/NetworkContext";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/devices", icon: Monitor, label: "Devices" },
  { to: "/data-transfer", icon: ArrowLeftRight, label: "Data Transfer" },
  { to: "/firewall", icon: Shield, label: "Firewall" },
  { to: "/vpn", icon: Lock, label: "VPN" },
  { to: "/topology", icon: Network, label: "Topology" },
  { to: "/reports", icon: FileText, label: "Reports" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { devices, uptime, blockedToday, firewallOn } = useNetwork();
  const activeConnections = devices.filter(d => d.status === "active").length;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="w-56 flex-shrink-0 border-r border-border bg-sidebar flex flex-col">
        <div className="px-5 py-5 flex items-center gap-2">
          <Shield className="h-7 w-7 text-primary" />
          <span className="text-lg font-bold text-foreground">NetShield</span>
          <span className="text-[10px] font-semibold bg-primary/20 text-primary px-1.5 py-0.5 rounded-md">PRO</span>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary/15 text-primary neon-glow"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                }`}
              >
                <item.icon className="h-4.5 w-4.5" />
                {item.label}
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
          <p className="text-[10px] text-muted-foreground/50 text-center">© 2024 NetShield PRO</p>
        </div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-card/40 backdrop-blur-md flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input placeholder="Search anything..." className="pl-9 pr-4 py-2 bg-secondary/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 w-64" />
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-secondary rounded-lg transition-colors"><Moon className="h-4 w-4 text-muted-foreground" /></button>
            <button className="p-2 hover:bg-secondary rounded-lg transition-colors relative">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-border">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">A</div>
              <div>
                <p className="text-xs font-medium text-foreground">Admin</p>
                <p className="text-[10px] text-muted-foreground">Super Admin</p>
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6 scrollbar-thin">{children}</main>
      </div>
    </div>
  );
}
