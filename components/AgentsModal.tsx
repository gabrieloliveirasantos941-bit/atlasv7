import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CustomAgent } from '../types';
import { SYSTEM_AGENTS } from '../constants';
import { 
  X, 
  Plus, 
  CheckCircle2, 
  MessageSquare, 
  BarChart3, 
  Search, 
  Code2, 
  User, 
  Cpu, 
  Zap, 
  Shield, 
  Globe, 
  Layout, 
  Settings2,
  Trash2,
  Edit3,
  ChevronRight,
  Activity
} from 'lucide-react';

type Agent = string;

interface AgentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivate: (agent: Agent) => void;
  onDeactivate: () => void;
  activeAgent: Agent;
  customAgents: CustomAgent[];
  onCreateAgent: (name: string, description: string, instruction: string) => void;
  onUpdateAgent: (id: string, name: string, description: string, instruction: string) => void;
  onDeleteAgent: (id: string) => void;
}

const AgentsModal: React.FC<AgentsModalProps> = ({ 
  isOpen, 
  onClose, 
  onActivate, 
  onDeactivate, 
  activeAgent, 
  customAgents, 
  onCreateAgent, 
  onUpdateAgent, 
  onDeleteAgent
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [instruction, setInstruction] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setEditingId(null);
      setName('');
      setDescription('');
      setInstruction('');
      setIsFormOpen(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setInstruction('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (agent: CustomAgent) => {
    setEditingId(agent.id);
    setName(agent.name);
    setDescription(agent.description);
    setInstruction(agent.systemInstruction);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && description && instruction) {
      if (editingId) {
        onUpdateAgent(editingId, name, description, instruction);
      } else {
        onCreateAgent(name, description, instruction);
      }
      setIsFormOpen(false);
      setEditingId(null);
      setName('');
      setDescription('');
      setInstruction('');
    }
  };

  const getAgentIcon = (id: string) => {
    switch(id) {
      case 'default': return <Cpu className="w-6 h-6" />;
      case 'social_media': return <Globe className="w-6 h-6" />;
      case 'traffic_manager': return <Zap className="w-6 h-6" />;
      case 'google_ads': return <Search className="w-6 h-6" />;
      case 'programmer': return <Code2 className="w-6 h-6" />;
      default: return <User className="w-6 h-6" />;
    }
  };

  const getAgentColor = (id: string) => {
    switch(id) {
      case 'default': return 'cyan';
      case 'social_media': return 'purple';
      case 'traffic_manager': return 'blue';
      case 'google_ads': return 'sky';
      case 'programmer': return 'emerald';
      default: return 'cyan';
    }
  };

  const getAgentStyles = (id: string, isActive: boolean) => {
    const color = getAgentColor(id);
    
    const styles = {
      cyan: {
        bg: isActive ? 'bg-cyan-500/10' : 'bg-white/[0.02]',
        border: isActive ? 'border-cyan-500/50' : 'border-white/5',
        iconBg: isActive ? 'bg-cyan-500/20' : 'bg-white/5',
        iconText: isActive ? 'text-cyan-400' : 'text-white/40',
        button: isActive ? 'bg-white/5 text-white/20' : 'bg-white/5 hover:bg-cyan-500 hover:text-black border-white/10 hover:border-cyan-500',
        statusBg: 'bg-cyan-500/20',
        statusBorder: 'border-cyan-500/30',
        statusText: 'text-cyan-500'
      },
      purple: {
        bg: isActive ? 'bg-purple-500/10' : 'bg-white/[0.02]',
        border: isActive ? 'border-purple-500/50' : 'border-white/5',
        iconBg: isActive ? 'bg-purple-500/20' : 'bg-white/5',
        iconText: isActive ? 'text-purple-400' : 'text-white/40',
        button: isActive ? 'bg-white/5 text-white/20' : 'bg-white/5 hover:bg-purple-500 hover:text-black border-white/10 hover:border-purple-500',
        statusBg: 'bg-purple-500/20',
        statusBorder: 'border-purple-500/30',
        statusText: 'text-purple-500'
      },
      blue: {
        bg: isActive ? 'bg-blue-500/10' : 'bg-white/[0.02]',
        border: isActive ? 'border-blue-500/50' : 'border-white/5',
        iconBg: isActive ? 'bg-blue-500/20' : 'bg-white/5',
        iconText: isActive ? 'text-blue-400' : 'text-white/40',
        button: isActive ? 'bg-white/5 text-white/20' : 'bg-white/5 hover:bg-blue-500 hover:text-black border-white/10 hover:border-blue-500',
        statusBg: 'bg-blue-500/20',
        statusBorder: 'border-blue-500/30',
        statusText: 'text-blue-500'
      },
      sky: {
        bg: isActive ? 'bg-sky-500/10' : 'bg-white/[0.02]',
        border: isActive ? 'border-sky-500/50' : 'border-white/5',
        iconBg: isActive ? 'bg-sky-500/20' : 'bg-white/5',
        iconText: isActive ? 'text-sky-400' : 'text-white/40',
        button: isActive ? 'bg-white/5 text-white/20' : 'bg-white/5 hover:bg-sky-500 hover:text-black border-white/10 hover:border-sky-500',
        statusBg: 'bg-sky-500/20',
        statusBorder: 'border-sky-500/30',
        statusText: 'text-sky-500'
      },
      emerald: {
        bg: isActive ? 'bg-emerald-500/10' : 'bg-white/[0.02]',
        border: isActive ? 'border-emerald-500/50' : 'border-white/5',
        iconBg: isActive ? 'bg-emerald-500/20' : 'bg-white/5',
        iconText: isActive ? 'text-emerald-400' : 'text-white/40',
        button: isActive ? 'bg-white/5 text-white/20' : 'bg-white/5 hover:bg-emerald-500 hover:text-black border-white/10 hover:border-emerald-500',
        statusBg: 'bg-emerald-500/20',
        statusBorder: 'border-emerald-500/30',
        statusText: 'text-emerald-500'
      }
    };

    return styles[color as keyof typeof styles] || styles.cyan;
  };

  const containerVariants: any = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.2,
        ease: "easeOut",
        staggerChildren: 0.02
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.98,
      transition: { duration: 0.15 }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-8" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
      />
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="bg-[#050505] rounded-[2rem] shadow-[0_0_100px_rgba(0,234,255,0.1)] overflow-hidden text-white border border-white/10 max-w-7xl w-full max-h-[90vh] flex flex-col relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00eaff] to-transparent opacity-50"></div>
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        
        {/* Header */}
        <div className="flex justify-between items-center p-8 md:px-12 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-none bg-[#00eaff]/10 border border-[#00eaff]/20 flex items-center justify-center">
              <Cpu className="text-[#00eaff] w-6 h-6" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight font-sans">Núcleo de Especialistas</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-mono text-white/40 uppercase tracking-widest">Sistemas Operacionais ATLAS v4.0</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-12 h-12 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
          >
            <X size={24} className="text-white/50 group-hover:text-white transition-colors" />
          </button>
        </div>
        
        <div className="p-8 md:p-12 overflow-y-auto flex-1 custom-scrollbar">
          <AnimatePresence mode="wait">
            {isFormOpen ? (
              <motion.div 
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-3xl mx-auto"
              >
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setIsFormOpen(false)} 
                      className="w-10 h-10 rounded-none flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                    >
                      <ChevronRight className="rotate-180 w-5 h-5 text-[#00eaff]" />
                    </button>
                    <h3 className="text-2xl font-bold">{editingId ? 'Reconfigurar Agente' : 'Codificar Novo Agente'}</h3>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-xs font-mono text-white/40 uppercase tracking-widest ml-1">Identificação do Agente</label>
                      <input 
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        placeholder="Ex: Analista de Risco"
                        className="w-full p-4 rounded-none bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:border-[#00eaff] focus:ring-1 focus:ring-[#00eaff]/50 transition-all"
                        required 
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-mono text-white/40 uppercase tracking-widest ml-1">Breve Descritivo</label>
                      <input 
                        type="text" 
                        value={description} 
                        onChange={e => setDescription(e.target.value)} 
                        placeholder="Ex: Especialista em análise de mercado."
                        className="w-full p-4 rounded-none bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:border-[#00eaff] focus:ring-1 focus:ring-[#00eaff]/50 transition-all"
                        required 
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-mono text-white/40 uppercase tracking-widest ml-1">Matriz de Instruções (Prompt)</label>
                    <textarea 
                      value={instruction} 
                      onChange={e => setInstruction(e.target.value)} 
                      placeholder="Defina a lógica comportamental e base de conhecimento deste agente..."
                      className="w-full p-6 h-64 rounded-none bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:border-[#00eaff] focus:ring-1 focus:ring-[#00eaff]/50 transition-all resize-none font-mono text-sm leading-relaxed"
                      required 
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="w-full py-5 bg-[#00eaff] text-black font-black uppercase tracking-widest rounded-none hover:bg-[#00eaff]/90 transition-all shadow-[0_0_30px_rgba(0,234,255,0.2)] active:scale-[0.98]"
                  >
                    {editingId ? 'Atualizar Matriz' : 'Inicializar Agente'}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div 
                key="grid"
                initial="hidden"
                animate="visible"
                className="space-y-16"
              >
                {/* System Agents Section */}
                <section>
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div>
                      <h3 className="text-sm font-mono text-[#00eaff] uppercase tracking-[0.3em] mb-2">Módulos de Sistema</h3>
                      <p className="text-white/40 text-sm max-w-lg">Especialistas pré-configurados com algoritmos avançados para tarefas específicas de alta complexidade.</p>
                    </div>
                    <button 
                      onClick={handleOpenCreate} 
                      className="flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-none transition-all border border-white/10 text-xs font-black uppercase tracking-widest group"
                    >
                      <Plus size={16} className="text-[#00eaff] group-hover:scale-125 transition-transform" />
                      <span>Novo Agente</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                    {SYSTEM_AGENTS.map((agent, index) => {
                      const isActive = activeAgent === agent.id;
                      const styles = getAgentStyles(agent.id, isActive);
                      
                      return (
                        <motion.div 
                          key={agent.id}
                          variants={itemVariants}
                          className={`group relative p-8 rounded-[2rem] border transition-all duration-500 flex flex-col h-full ${styles.bg} ${styles.border} ${isActive ? 'shadow-[0_0_40px_rgba(0,234,255,0.1)]' : 'hover:border-white/20 hover:bg-white/[0.04]'}`}
                        >
                          {/* Status Indicator */}
                          <div className="absolute top-6 right-6 flex items-center gap-2">
                            {isActive && (
                              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${styles.statusBg} border ${styles.statusBorder}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${styles.statusText.replace('text-', 'bg-')} animate-pulse`}></div>
                                <span className={`text-[10px] font-mono ${styles.statusText} uppercase tracking-tighter`}>Active</span>
                              </div>
                            )}
                            <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">AG-{String(index + 1).padStart(2, '0')}</span>
                          </div>

                          {/* Icon & Title */}
                          <div className="mb-8">
                            <div className={`w-14 h-14 rounded-none flex items-center justify-center mb-6 transition-all duration-500 ${styles.iconBg} ${styles.iconText} ${!isActive ? 'group-hover:text-white group-hover:bg-white/10' : ''}`}>
                              {getAgentIcon(agent.id)}
                            </div>
                            <h4 className={`text-xl font-bold leading-tight group-hover:${styles.iconText} transition-colors`}>{agent.name}</h4>
                          </div>

                          <p className="text-sm text-white/40 mb-10 line-clamp-4 leading-relaxed group-hover:text-white/60 transition-colors">
                            {agent.description}
                          </p>

                          <div className="mt-auto">
                            <button
                              onClick={() => agent.id === 'default' ? onDeactivate() : onActivate(agent.id as Agent)}
                              disabled={isActive}
                              className={`w-full py-4 rounded-none text-xs font-black uppercase tracking-widest transition-all ${styles.button} ${!isActive ? 'shadow-lg' : 'cursor-default'}`}
                            >
                              {isActive ? 'Em Execução' : 'Inicializar'}
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </section>

                {/* Custom Agents Section */}
                {customAgents && customAgents.length > 0 && (
                  <section>
                    <div className="flex items-center gap-6 mb-10">
                      <h3 className="text-sm font-mono text-purple-400 uppercase tracking-[0.3em] whitespace-nowrap">Agentes de Usuário</h3>
                      <div className="h-px bg-white/5 w-full"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                      {customAgents.map((agent, index) => {
                        const isActive = activeAgent === agent.id;
                        const styles = getAgentStyles('custom', isActive);
                        
                        return (
                          <motion.div 
                            key={agent.id}
                            variants={itemVariants}
                            className={`group relative p-8 rounded-[2rem] border transition-all duration-500 flex flex-col h-full ${styles.bg} ${styles.border} ${isActive ? 'shadow-[0_0_40px_rgba(167,139,250,0.1)]' : 'hover:border-white/20 hover:bg-white/[0.04]'}`}
                          >
                            {/* Actions */}
                            <div className="absolute top-6 right-6 flex items-center gap-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleOpenEdit(agent); }} 
                                className="w-8 h-8 rounded-none flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-white/40 hover:text-[#00eaff] transition-all"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); onDeleteAgent(agent.id); }} 
                                className="w-8 h-8 rounded-none flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-white/40 hover:text-red-500 transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>

                            {/* Icon & Title */}
                            <div className="mb-8">
                              <div className={`w-14 h-14 rounded-none flex items-center justify-center mb-6 transition-all duration-500 ${styles.iconBg} ${styles.iconText} ${!isActive ? 'group-hover:text-white group-hover:bg-white/10' : ''}`}>
                                <User className="w-6 h-6" />
                              </div>
                              <h4 className={`text-xl font-bold leading-tight group-hover:${styles.iconText} transition-colors pr-16`}>{agent.name}</h4>
                            </div>

                            <p className="text-sm text-white/40 mb-10 line-clamp-4 leading-relaxed group-hover:text-white/60 transition-colors">
                              {agent.description}
                            </p>

                            <div className="mt-auto">
                              <button
                                onClick={() => onActivate(agent.id as Agent)}
                                disabled={isActive}
                                className={`w-full py-4 rounded-none text-xs font-black uppercase tracking-widest transition-all ${styles.button} ${!isActive ? 'shadow-lg' : 'cursor-default'}`}
                              >
                                {isActive ? 'Em Execução' : 'Inicializar'}
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </section>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Status Bar */}
        <div className="px-12 py-4 bg-white/[0.02] border-t border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-[#00eaff]" />
              <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Core Status: Optimal</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-emerald-500" />
              <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Security: Encrypted</span>
            </div>
          </div>
          <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">
            Neural Link Established // {new Date().toLocaleTimeString()}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AgentsModal;
