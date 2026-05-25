import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

const MonitoringPanel: React.FC = () => {
  const [stats, setStats] = useState({
    cpu: 24,
    neuralLink: 92,
    memory: 45,
    sync: 98,
    latency: 15
  });

  useEffect(() => {
    // Try to get some real-ish data
    const updateStats = () => {
      setStats(prev => {
        // Simulated CPU based on hardware concurrency if available
        const coreCount = navigator.hardwareConcurrency || 4;
        const baseCpu = (1 / coreCount) * 100;
        
        // Simulated Memory if available
        let memUsage = prev.memory;
        if ((performance as any).memory) {
            const mem = (performance as any).memory;
            memUsage = (mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100;
        }

        return {
          cpu: Math.min(100, Math.max(5, baseCpu + (Math.random() * 20 - 10))),
          neuralLink: Math.min(100, Math.max(80, prev.neuralLink + (Math.random() * 2 - 1))),
          memory: Math.min(100, Math.max(10, memUsage + (Math.random() * 4 - 2))),
          sync: Math.min(100, Math.max(95, prev.sync + (Math.random() * 1 - 0.5))),
          latency: Math.min(100, Math.max(5, prev.latency + (Math.random() * 6 - 3)))
        };
      });
    };

    const interval = setInterval(updateStats, 1500);
    return () => clearInterval(interval);
  }, []);

  const StatBar = ({ label, value, color = "bg-[var(--accent-primary)]" }: { label: string, value: number, color?: string }) => (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">{label}</span>
        <span className="text-[10px] font-black text-[var(--accent-primary)]">{Math.round(value)}%</span>
      </div>
      <div className="h-1.5 w-full bg-[var(--bg-primary)]/50 rounded-full overflow-hidden border border-[var(--border-color)]">
        <motion.div 
          className={`h-full ${color} shadow-[0_0_10px_var(--accent-glow)]`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );

  return (
    <div className="bg-[var(--bg-secondary)] backdrop-blur-xl border border-[var(--border-color)] rounded-none p-8 shadow-2xl font-mono">
      <h3 className="text-[var(--accent-primary)] text-sm font-black tracking-[0.3em] uppercase mb-10 flex items-center gap-3">
        <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-pulse shadow-[0_0_8px_var(--accent-glow)]"></div>
        Monitoramento
      </h3>

      <div className="space-y-2">
        <StatBar label="CPU" value={stats.cpu} />
        <StatBar label="Neural Link" value={stats.neuralLink} />
        <StatBar label="Memory" value={stats.memory} />
        <StatBar label="Sync" value={stats.sync} />
      </div>

      <div className="mt-10 pt-6 border-t border-[var(--border-color)] space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>
          <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Criptografia Ativa</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full shadow-[0_0_5px_var(--accent-glow)]"></div>
          <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
            Latência: <span className="text-[var(--accent-primary)]">{Math.round(stats.latency)}ms</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default MonitoringPanel;
