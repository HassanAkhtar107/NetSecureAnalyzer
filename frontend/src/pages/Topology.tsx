import React, { useMemo, useState, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { motion } from 'framer-motion';
import { devicesApi, networksApi } from '../api';

const Topology: React.FC = () => {
  const [devices, setDevices] = useState<any[]>([]);
  const [networks, setNetworks] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [devRes, netRes] = await Promise.all([
          devicesApi.list(),
          networksApi.list()
        ]);
        setDevices(devRes.data);
        setNetworks(netRes.data);
      } catch (err) {
        console.error("Topology data fetch error", err);
      }
    };
    fetchData();
  }, []);

  const data = useMemo(() => {
    const nodes: any[] = [
      { id: 'CENTRAL_ROUTER', name: 'Core Router', group: 'router', val: 15 },
      { id: 'FIREWALL', name: 'Main Firewall', group: 'firewall', val: 12 },
      { id: 'VPN_GATEWAY', name: 'VPN Gateway', group: 'vpn', val: 10 },
    ];

    const links: any[] = [
      { source: 'CENTRAL_ROUTER', target: 'FIREWALL' },
      { source: 'FIREWALL', target: 'VPN_GATEWAY' },
    ];

    // Add Networks
    networks.forEach(net => {
      nodes.push({ id: `NET_${net.id}`, name: net.name, group: 'network', val: 8 });
      links.push({ source: 'CENTRAL_ROUTER', target: `NET_${net.id}` });

      // Add Devices for this network
      const netDevices = devices.filter(d => d.network === net.id);
      netDevices.forEach(dev => {
        nodes.push({ 
          id: `DEV_${dev.id}`, 
          name: dev.name || dev.ip_address, 
          group: 'device', 
          status: dev.status,
          val: 5 
        });
        links.push({ source: `NET_${net.id}`, target: `DEV_${dev.id}` });
      });
    });

    return { nodes, links };
  }, [devices, networks]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-panel p-2 h-[calc(100vh-140px)] relative overflow-hidden"
    >
      <div className="absolute top-8 left-8 z-10 pointer-events-none">
        <h3 className="text-2xl font-bold">Network Topology</h3>
        <p className="text-sm text-slate-400">Structural visualization of nodes and logical segments.</p>
        
        <div className="mt-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Active Device</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Blocked Node</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.5)]"></div>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">VPN Tunnel</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full border-2 border-slate-500"></div>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Network Hub</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 right-8 z-10">
        <div className="glass-panel p-4 bg-slate-900/80">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <p className="text-xs font-bold uppercase text-emerald-400">System Healthy</p>
          </div>
          <p className="text-[10px] text-slate-500">Auto-optimization active</p>
        </div>
      </div>

      <ForceGraph2D
        graphData={data}
        nodeLabel={(node: any) => `${node.name} ${node.status ? `(${node.status})` : ''}`}
        nodeRelSize={1}
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.005}
        linkColor={() => 'rgba(148, 163, 184, 0.1)'}
        backgroundColor="transparent"
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const label = node.name;
          const fontSize = 12/globalScale;
          
          // Draw Glow
          const color = node.group === 'router' ? '#94a3b8' :
                        node.group === 'firewall' ? '#f43f5e' :
                        node.group === 'vpn' ? '#38bdf8' :
                        node.group === 'network' ? '#475569' :
                        node.status === 'ACTIVE' ? '#34d399' : 
                        node.status === 'BLOCKED' ? '#f43f5e' : '#fbbf24';

          ctx.shadowColor = color;
          ctx.shadowBlur = 15;
          
          // Draw circle
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
          ctx.fillStyle = node.group === 'router' ? '#1e293b' : color;
          ctx.fill();
          
          ctx.shadowBlur = 0; // Reset shadow for text
          
          if (globalScale > 1.2) {
            ctx.font = `${fontSize}px Outfit`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.fillText(label, node.x, node.y + node.val + 10);
          }
        }}
      />
    </motion.div>
  );
};

export default Topology;
