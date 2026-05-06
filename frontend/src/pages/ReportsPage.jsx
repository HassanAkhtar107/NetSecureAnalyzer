import {FileText, Download, Calendar} from "lucide-react";

const reports = [
  { name: "Weekly Network Report", date: "Apr 28, 2024", size: "2.4 MB", type: "PDF" },
  { name: "Firewall Activity Log", date: "Apr 27, 2024", size: "1.1 MB", type: "CSV" },
  { name: "VPN Usage Summary", date: "Apr 25, 2024", size: "890 KB", type: "PDF" },
  { name: "Device Inventory", date: "Apr 24, 2024", size: "560 KB", type: "CSV" },
  { name: "Bandwidth Analysis", date: "Apr 22, 2024", size: "3.2 MB", type: "PDF" },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Reports</h1>
      <div className="glass-card p-5">
        <div className="space-y-2">
          {reports.map((r, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-lg hover:bg-secondary/30 transition-colors">
              <div className="flex items-center gap-4">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">{r.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {r.date} · {r.size} · {r.type}
                  </p>
                </div>
              </div>
              <button className="flex items-center gap-1 text-xs text-primary hover:underline">
                <Download className="h-3 w-3" /> Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
