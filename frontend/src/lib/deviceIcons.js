import {Laptop, Monitor, Smartphone, Tv, Server, HelpCircle} from "lucide-react";
import type { Device } from "@/context/NetworkContext";

const iconMap = {
  laptop,
  monitor,
  smartphone,
  tv,
  server,
  unknown,
};

export function getDeviceIcon(iconType: Device["iconType"]) {
  return iconMap[iconType] || HelpCircle;
}
