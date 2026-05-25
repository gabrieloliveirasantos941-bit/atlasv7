import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Cpu, 
  Zap, 
  Search, 
  Code2, 
  Shield, 
  Activity, 
  Globe, 
  User,
  Sparkles,
  Terminal,
  Activity as PulseIcon,
  Plus
} from 'lucide-react';
import { SYSTEM_AGENTS } from '../../constants';
import { CustomAgent } from '../../types';

interface SpecialistSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeAgentId: string;
  onSelectAgent: (id: string) => void;
  customAgents: CustomAgent[];
  onOpenCreateAgent?: () => void;
}

export const SpecialistSidebar: React.FC<SpecialistSidebarProps> = ({
  isOpen,
  onClose,
  activeAgentId,
  onSelectAgent,
  customAgents,
  onOpenCreateAgent
}) => {
  const getAgentIcon = (id: string) => {
    switch(id) {
      case 'default': return <span className="text-xl">🤖</span>;
      case 'social_media': return <span className="text-xl">🌐</span>;
      case 'traffic_manager': return <span className="text-xl">⚡</span>;
      case 'google_ads': return <span className="text-xl">🔍</span>;
      case 'programmer': return <span className="text-xl">💻</span>;
      case 'jarvis': return <span className="text-xl">🛡️</span>;
      case 'camera_assistant': return <span className="text-xl">📸</span>;
      default: return <span className="text-xl">👤</span>;
    }
  };

  const allAgents = [
    ...SYSTEM_AGENTS.map(agent => ({ ...agent, type: 'system' })),
    ...customAgents.map(agent => ({ ...agent, type: 'custom' }))
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250]"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 600, mass: 0.5 }}
            className="fixed right-0 top-0 h-screen w-[85vw] max-w-sm lg:max-w-md bg-slate-950 border-l border-white/10 shadow-2xl z-[300] flex flex-col font-sans"
          >
            {/* Header */}
            <header className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-none text-blue-400">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white tracking-wide">Especialistas</h2>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Núcleo Ativo</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </header>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Active Agent Section */}
              <div>
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">
                  Em Operação
                </h3>
                
                {allAgents.filter(a => a.id === activeAgentId).map(agent => (
                   <div 
                     key={`active-${agent.id}`}
                     className="p-4 rounded-none bg-blue-500/5 border border-blue-500/20"
                   >
                     <div className="flex items-start gap-4">
                       <div className="p-3 bg-blue-500/10 rounded-none text-blue-400">
                         {getAgentIcon(agent.id)}
                       </div>
                       <div className="flex-1">
                          <div className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
                             {(agent as any).emoji || '🤖'} {agent.name}
                          </div>
                          <div className="text-xs text-blue-300/80 font-medium">{agent.id === 'default' ? 'Inteligência Central' : 'Especialista Designado'}</div>
                       </div>
                     </div>
                     <p className="mt-3 text-xs text-slate-400 leading-relaxed">
                       {agent.description}
                     </p>
                   </div>
                ))}
              </div>

              {/* All Specialists Section */}
              <div>
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">
                   Disponíveis
                </h3>
                <div className="space-y-2">
                  {allAgents.filter(a => a.id !== activeAgentId).map((agent, idx) => (
                    <button
                      key={agent.id}
                      onClick={() => {
                        onSelectAgent(agent.id);
                        onClose();
                      }}
                      className="w-full flex items-center gap-4 p-3 rounded-none border border-white/5 bg-slate-900/30 text-left transition-all hover:border-white/10 hover:bg-slate-900/50"
                    >
                      <div className="p-2 bg-slate-800 rounded-none text-slate-400 group-hover:text-blue-400">
                        {getAgentIcon(agent.id)}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-200">
                          {(agent as any).emoji || '👤'} {agent.name}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">
                          {agent.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <footer className="p-6 border-t border-white/10 bg-slate-900/50">
               {onOpenCreateAgent && (
                 <button
                   onClick={() => {
                     onOpenCreateAgent();
                     onClose();
                   }}
                   className="w-full py-3 rounded-none border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 flex items-center justify-center gap-2 text-blue-400 hover:text-blue-300 font-semibold text-sm transition-all"
                 >
                   <Plus size={16} />
                   <span>Adicionar Especialista</span>
                 </button>
               )}
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
