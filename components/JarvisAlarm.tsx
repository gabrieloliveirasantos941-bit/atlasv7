import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, BellOff, X, Activity } from 'lucide-react';
import { getFocoFlowData } from '../services/focoFlowService';
import { auth } from '../firebase';
import { toast } from 'sonner';

interface JarvisAlarmProps {
  userId: string | null;
  activeAlarm: any;
  isRinging: boolean;
  onDismiss: (id: string) => void;
  onStop: () => void;
}

const JarvisAlarm: React.FC<JarvisAlarmProps> = ({ userId, activeAlarm, isRinging, onDismiss, onStop }) => {
  // Listen for Jarvis voice commands to deactivate
  useEffect(() => {
    const handleVoiceDeactivate = (e: any) => {
      if (e.detail?.command === 'desativar_alarme' && isRinging) {
        onDismiss(activeAlarm?.id);
      }
    };
    
    window.addEventListener('jarvis_voice_command', handleVoiceDeactivate as any);
    return () => {
      window.removeEventListener('jarvis_voice_command', handleVoiceDeactivate as any);
    };
  }, [isRinging, activeAlarm, onDismiss]);

  const handleDismiss = () => {
    if (activeAlarm) {
      onDismiss(activeAlarm.id);
    }
  };

  const handleStop = () => {
    onStop();
  };

  return (
    <AnimatePresence>
      {isRinging && activeAlarm && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 50 }}
          className="fixed bottom-24 right-8 z-[9999] w-80 jarvis-glass p-6 rounded-none border-2 border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.4)] overflow-hidden"
        >
          {/* Animated Background Pulse */}
          <div className="absolute inset-0 bg-cyan-400/10 animate-pulse pointer-events-none" />
          
          {/* Scanning Line */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-400 jarvis-scan-line-fast opacity-50" />

          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-cyan-400/20 flex items-center justify-center animate-bounce">
                  <Bell className="text-cyan-400" size={18} />
                </div>
                <div>
                   <h4 className="text-xs font-black tracking-widest text-cyan-400 uppercase font-mono">Alarme Ativo</h4>
                   <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Sistema de Lembretes</p>
                </div>
              </div>
              <button onClick={handleStop} className="text-white/20 hover:text-white transition-colors">
                 <X size={16} />
              </button>
            </div>

            <div className="py-2">
               <h3 className="text-xl font-black text-white jarvis-text-glow leading-tight uppercase italic break-words">
                 {activeAlarm.titulo || activeAlarm.title || "Lembrete sem nome"}
               </h3>
               <div className="flex items-center gap-2 mt-2 opacity-60">
                  <Activity size={12} className="text-cyan-400 animate-pulse" />
                  <span className="text-[10px] font-mono tracking-widest text-white">HORÁRIO: {new Date(activeAlarm.reminderTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
               <button 
                onClick={handleDismiss}
                className="col-span-2 flex items-center justify-center gap-2 bg-cyan-400/20 hover:bg-cyan-400/40 text-cyan-400 border border-cyan-400/50 p-3 rounded-none font-black uppercase tracking-widest text-xs transition-all shadow-[0_0_15px_rgba(34,211,238,0.2)]"
               >
                 <BellOff size={16} />
                 <span>Desativar</span>
               </button>
            </div>
          </div>
          
          {/* Decorative corners */}
          <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-cyan-400" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-cyan-400" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default JarvisAlarm;
