import { Laptop, Monitor, Smartphone, Tv, Server, HelpCircle } from "lucide-react";
import type { Device } from "@/context/NetworkContext";

const iconMap = {
  laptop: Laptop,
  monitor: Monitor,
  smartphone: Smartphone,
  tv: Tv,
  server: Server,
  unknown: HelpCircle,
};

export function getDeviceIcon(iconType: Device["iconType"]) {
  return iconMap[iconType] || HelpCircle;
}
