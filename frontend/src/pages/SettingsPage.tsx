import { Bell, Shield, Globe, Palette, User } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      <div className="grid grid-cols-2 gap-6">
        {[
          { icon: User, title: "Profile", desc: "Manage your account details and preferences" },
          { icon: Shield, title: "Security", desc: "Two-factor authentication, password, sessions" },
          { icon: Bell, title: "Notifications", desc: "Alert preferences and notification channels" },
          { icon: Globe, title: "Network", desc: "DNS, DHCP, and network configuration" },
        ].map((s) => (
          <div key={s.title} className="glass-card-hover p-6 cursor-pointer">
            <s.icon className="h-6 w-6 text-primary mb-3" />
            <h3 className="text-sm font-semibold text-foreground">{s.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
