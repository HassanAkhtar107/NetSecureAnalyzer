import {Laptop, Monitor, Smartphone, Tv, Server, HelpCircle} from "lucide-react";

const iconMap = {
  laptop: Laptop,
  monitor: Monitor,
  smartphone: Smartphone,
  tv: Tv,
  server: Server,
  unknown: HelpCircle,
};

export function getDeviceIcon(iconType) {
  return iconMap[iconType] || HelpCircle;
}
