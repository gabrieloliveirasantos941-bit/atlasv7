import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Wallet, 
  Link as LinkIcon, 
  Bell, 
  MessageSquare, 
  FileText, 
  Activity, 
  MoreHorizontal,
  ChevronLeft,
  Plus,
  Clock,
  Settings,
  Sparkles,
  X,
  Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Conversation } from '../../../types';

const AtlasLogo = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7" />
    <path d="M16 19h6" />
    <path d="M19 16v6" />
    <rect x="7" y="9" width="10" height="6" rx="1" />
  </svg>
);

interface SidebarProps {
  conversations?: Conversation[];
  activeConversationId?: string | null;
  activeId?: string | null;
  onSelectConversation?: (id: string) => void;
  onNewConversation?: () => void;
  onNavItemClick?: (id: string) => void;
  onSelectAgent?: (id: string) => void;
  assistantName?: string;
  agents?: any[];
  activeAgentId?: string | null;
  onClose?: () => void;
}

const navItems = [
  { id: 'conversations', emoji: '💬', label: 'Conversas', color: 'blue' },
  { id: 'notifications', emoji: '🔔', label: 'Notificações', color: 'orange' },
  { id: 'agents', emoji: '👥', label: 'Especialistas', color: 'purple' },
  { id: 'media', emoji: '🎵', label: 'Mídia', color: 'blue' },
];

export const Sidebar: React.FC<SidebarProps> = React.memo(({ 
  conversations = [], 
  activeConversationId, 
  activeId = 'conversations',
  onSelectConversation,
  onNewConversation,
  onNavItemClick,
  onSelectAgent,
  assistantName = 'ATLAS',
  agents = [],
  activeAgentId,
  onClose
}) => {
  const getActiveClasses = (id: string, color: string) => {
    if (activeId !== id) return 'text-slate-500 hover:text-slate-200 hover:bg-white/5 border border-transparent';
    
    const colorMap: any = {
      cyan: 'text-[var(--cyan-vibrant)] bg-[var(--cyan-vibrant)]/10 border-[var(--cyan-vibrant)]/30 nav-item-active-cyan shadow-[0_0_15px_rgba(0,242,255,0.1)]',
      purple: 'text-[var(--purple-vibrant)] bg-[var(--purple-vibrant)]/10 border-[var(--purple-vibrant)]/30 nav-item-active-purple shadow-[0_0_15px_rgba(139,92,246,0.1)]',
      green: 'text-[var(--green-vibrant)] bg-[var(--green-vibrant)]/10 border-[var(--green-vibrant)]/30 nav-item-active-green shadow-[0_0_15px_rgba(0,255,157,0.1)]',
      pink: 'text-[var(--pink-vibrant)] bg-[var(--pink-vibrant)]/10 border-[var(--pink-vibrant)]/30 nav-item-active-pink shadow-[0_0_15px_rgba(255,0,127,0.1)]',
      orange: 'text-[var(--orange-vibrant)] bg-[var(--orange-vibrant)]/10 border-[var(--orange-vibrant)]/30 nav-item-active-orange shadow-[0_0_15px_rgba(255,157,0,0.1)]',
      blue: 'text-blue-400 bg-blue-400/10 border-blue-400/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]',
      yellow: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30 shadow-[0_0_15px_rgba(250,204,21,0.1)]',
    };
    
    return colorMap[color] || colorMap.blue;
  };

  const getEmojiGlow = (id: string, color: string) => {
    if (activeId !== id) return '';
    const glowMap: any = {
      cyan: 'drop-shadow-[0_0_10px_rgba(0,242,255,0.8)]',
      purple: 'drop-shadow-[0_0_10px_rgba(139,92,246,0.8)]',
      green: 'drop-shadow-[0_0_10px_rgba(0,255,157,0.8)]',
      pink: 'drop-shadow-[0_0_10px_rgba(255,0,127,0.8)]',
      orange: 'drop-shadow-[0_0_10px_rgba(255,157,0,0.8)]',
      blue: 'drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]',
      yellow: 'drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]',
    };
    return glowMap[color] || '';
  };

  return (
    <aside className={`h-full bg-[#020617]/95 text-[#C7D0E0] font-sans border-r border-white/5 backdrop-blur-3xl flex flex-col items-stretch w-72 max-w-[80vw] relative overflow-hidden transition-all duration-300`}>
      {/* HUD Background Decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(6,182,212,0.05)_0%,transparent_50%)]" />
        <div className="absolute inset-0 grid-bg opacity-5" />
      </div>

      <div className="pt-8 px-8 pb-4 mb-10 flex items-center gap-4 relative z-10">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500" />
          <div className="w-12 h-12 bg-slate-900 border border-white/10 rounded-xl flex items-center justify-center relative">
            <AtlasLogo className="text-cyan-400 w-6 h-6 filter drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="font-black text-2xl tracking-tighter text-white uppercase leading-8">{assistantName}</span>
          <span className="text-[9px] tracking-[0.2em] text-cyan-400/50 uppercase font-bold mt-1">Core OS v5.2</span>
        </div>
        {onClose && (
           <button onClick={onClose} className="p-2 ml-auto text-slate-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
              <X size={18} />
           </button>
        )}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <nav className="px-4 space-y-1.5 mb-8">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavItemClick?.(item.id)}
              className={`flex items-center gap-3 rounded-xl transition-all duration-300 relative group ${getActiveClasses(item.id, item.color)}`}
              style={{
                width: '249.34px',
                height: '46.7188px',
                paddingLeft: '20px',
                paddingRight: '20px',
                paddingTop: '14px',
                paddingBottom: '14px',
                lineHeight: '16.5px',
                fontSize: '11px',
                marginTop: '0px',
                marginLeft: '14px',
              }}
            >
              <span className={`text-lg transition-transform duration-300 group-hover:scale-110 ${getEmojiGlow(item.id, item.color)}`}>{item.emoji}</span>
              <span className="block font-bold text-[10px] tracking-widest uppercase">{item.label}</span>
              {activeId === item.id && (
                <motion.div 
                  layoutId="sidebar-active-pill"
                  className="absolute right-2 w-1 h-3 rounded-full bg-current"
                />
              )}
            </motion.button>
          ))}
        </nav>

        <div className="flex flex-col flex-1 px-4 overflow-hidden">
          <AnimatePresence mode="wait">
            {activeId === 'conversations' ? (
              <motion.div 
                key="conversations"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col h-full overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4 px-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Histórico de Dados</span>
                  <button 
                    onClick={onNewConversation}
                    className="p-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-lg text-cyan-400 transition-all border border-cyan-500/20"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                  {conversations.length === 0 ? (
                    <div className="text-[8px] text-slate-600 text-center py-10 px-4 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20 uppercase tracking-widest leading-loose">
                      Sem registros<br/>disponíveis
                    </div>
                  ) : (
                    conversations
                      .filter(c => !c.isArchived)
                      .sort((a, b) => {
                        const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
                        const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
                        return dateB - dateA;
                      })
                      .map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => onSelectConversation?.(conv.id)}
                          className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] truncate transition-all relative group border ${
                            activeConversationId === conv.id 
                              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                              : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border-transparent'
                          }`}
                        >
                          <div className="truncate pr-4 font-medium tracking-tight">{conv.title || 'Nova Sessão'}</div>
                          {activeConversationId === conv.id && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
                          )}
                        </button>
                      ))
                  )}
                </div>
              </motion.div>
            ) : activeId === 'agents' ? (
              <motion.div 
                key="agents"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col h-full overflow-hidden"
              >
                <div className="flex items-center gap-2 mb-4 px-2">
                  <span className="text-[10px] font-bold text-purple-400/60 uppercase tracking-[0.2em]">Gestores de Núcleo</span>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  <button
                    onClick={() => onSelectAgent?.('default')}
                    className={`w-full text-left px-5 py-4 rounded-2xl text-[10px] transition-all border group relative overflow-hidden ${
                      activeAgentId === 'default' 
                        ? 'bg-purple-600/10 text-purple-400 border-purple-500/30' 
                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border-transparent'
                    }`}
                  >
                    <div className="font-black uppercase tracking-widest mb-1 flex items-center justify-between">
                      Atlas Core
                      {activeAgentId === 'default' && <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_#a855f7]" />}
                    </div>
                    <div className="text-[8px] opacity-40 uppercase font-mono tracking-tighter">Nível de Acesso: Total</div>
                    {activeAgentId === 'default' && (
                        <div className="absolute inset-y-0 left-0 w-1 bg-purple-500" />
                    )}
                  </button>

                  {agents.map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => onSelectAgent?.(agent.id)}
                      className={`w-full text-left px-5 py-4 rounded-2xl text-[10px] transition-all border group relative overflow-hidden ${
                        activeAgentId === agent.id 
                          ? 'bg-blue-600/10 text-blue-400 border-blue-500/30' 
                          : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border-transparent'
                      }`}
                    >
                      <div className="font-black uppercase tracking-widest mb-1 flex items-center justify-between">
                        {agent.name}
                        {activeAgentId === agent.id && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_#3b82f6]" />}
                      </div>
                      <div className="text-[8px] opacity-40 truncate uppercase font-mono tracking-tighter">{agent.role || 'Especialista'}</div>
                      {activeAgentId === agent.id && (
                        <div className="absolute inset-y-0 left-0 w-1 bg-blue-400" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8 border border-dashed border-slate-800 rounded-3xl opacity-30"
                >
                  <Terminal size={24} className="mb-4 text-cyan-400/50" />
                  <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white">Módulo Operacional</span>
                  <span className="text-[7px] uppercase mt-2 font-mono tracking-widest text-cyan-400/60">Canal {activeId} Sincronizado</span>
                </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="px-5 mt-auto pt-6 border-t border-white/5 bg-[#020617]/50">
        <button
          onClick={() => onNavItemClick?.('settings')}
          className={`group w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 relative overflow-hidden mb-2 ${
            activeId === 'settings' 
              ? 'bg-slate-800/80 text-white border border-white/10' 
              : 'text-slate-500 hover:text-slate-200 hover:bg-white/5 border border-transparent'
          }`}
        >
          <Settings size={16} className={`transition-transform duration-500 ${activeId === 'settings' ? 'rotate-90 text-cyan-400' : 'group-hover:rotate-45'}`} />
          <span className="text-[10px] font-black tracking-widest uppercase">Parâmetros</span>
        </button>
      </div>
    </aside>
  );
});
