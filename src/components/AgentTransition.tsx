import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, Zap, Code2, Globe, Shield, Sparkles, User, BadgeCheck } from 'lucide-react';

interface AgentTransitionProps {
  isVisible: boolean;
  agentName: string;
  agentId: string;
  emoji?: string;
}

export const AgentTransition: React.FC<AgentTransitionProps> = ({ isVisible, agentName, agentId, emoji }) => {
  const getAgentIcon = () => {
    if (emoji) return <span className="text-6xl">{emoji}</span>;
    
    switch (agentId) {
      case 'default': return <Cpu className="w-16 h-16 text-cyan-400" />;
      case 'social_media': return <Globe className="w-16 h-16 text-pink-400" />;
      case 'traffic_manager': return <Zap className="w-16 h-16 text-emerald-400" />;
      case 'google_ads': return <Zap className="w-16 h-16 text-amber-400" />;
      case 'programmer': return <Code2 className="w-16 h-16 text-blue-400" />;
      case 'jarvis': return <Shield className="w-16 h-16 text-indigo-400" />;
      default: return <User className="w-16 h-16 text-slate-400" />;
    }
  };

  const getAgentColorClass = () => {
    switch (agentId) {
      case 'default': return 'text-cyan-400 border-cyan-400/30 bg-cyan-400/5';
      case 'social_media': return 'text-pink-400 border-pink-400/30 bg-pink-400/5';
      case 'traffic_manager': return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5';
      case 'google_ads': return 'text-amber-400 border-amber-400/30 bg-amber-400/5';
      case 'programmer': return 'text-blue-400 border-blue-400/30 bg-blue-400/5';
      case 'jarvis': return 'text-indigo-400 border-indigo-400/30 bg-indigo-400/5';
      default: return 'text-slate-400 border-slate-400/30 bg-slate-400/5';
    }
  };

  const colorClass = getAgentColorClass();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none"
        >
          {/* Background Flash */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0] }}
            className="absolute inset-0 bg-white"
            transition={{ duration: 0.5 }}
          />

          {/* Centered Content */}
          <div className="relative flex flex-col items-center">
            {/* Geometric Rings */}
            <motion.div 
                className={`absolute w-96 h-96 border-4 rounded-full ${colorClass.split(' ')[1]}`}
                initial={{ scale: 0.5, opacity: 0, rotate: 0 }}
                animate={{ scale: 1.5, opacity: 0, rotate: 180 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
            />
            <motion.div 
                className={`absolute w-80 h-80 border-2 rounded-full border-dashed ${colorClass.split(' ')[1]}`}
                initial={{ scale: 0.5, opacity: 0, rotate: 0 }}
                animate={{ scale: 1.2, opacity: 0, rotate: -180 }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
            />

            {/* Icon Container */}
            <motion.div
              initial={{ scale: 0, rotate: -45, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ type: "spring", damping: 15, stiffness: 100 }}
              className={`w-32 h-32 flex items-center justify-center border-4 ${colorClass} shadow-[0_0_50px_rgba(34,211,238,0.2)] backdrop-blur-xl relative z-20`}
            >
                <div className="absolute inset-2 border border-current opacity-20" />
                {getAgentIcon()}
                
                {/* HUD Decorations inside box */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-current" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-current" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-current" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-current" />
            </motion.div>

            {/* Agent Info */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 flex flex-col items-center gap-2"
            >
              <div className="flex items-center gap-3">
                <BadgeCheck className={`w-5 h-5 ${colorClass.split(' ')[0]}`} />
                <h2 className="text-4xl font-black text-white tracking-[0.2em] uppercase text-center drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                  {agentName}
                </h2>
              </div>
              <div className="h-[2px] w-48 bg-gradient-to-r from-transparent via-current to-transparent opacity-50 overflow-hidden relative">
                 <motion.div 
                    className="absolute inset-0 bg-white"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                 />
              </div>
              <span className="text-[10px] font-black tracking-[0.5em] text-cyan-400 animate-pulse mt-2">SINCRO_NIZAÇÃO DE PROTOCOLO ATIVA</span>
            </motion.div>

            {/* Binary/Status Decoration */}
            <div className="absolute -left-40 top-0 text-[8px] font-mono text-cyan-400/20 flex flex-col gap-1 whitespace-nowrap">
                {Array.from({length: 8}).map((_, i) => (
                    <div key={i}>ID: {Math.random().toString(16).slice(2, 10).toUpperCase()} - STATUS: OK</div>
                ))}
            </div>
            <div className="absolute -right-40 bottom-0 text-[8px] font-mono text-cyan-400/20 flex flex-col gap-1 text-right whitespace-nowrap">
                {Array.from({length: 8}).map((_, i) => (
                    <div key={i}>MOD_V7.{i}: LOADED_SUCCESS</div>
                ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
