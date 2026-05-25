import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Camera, Monitor, Settings, ExternalLink } from 'lucide-react';

type AtlasState = 'OUVINDO' | 'PROCESSANDO' | 'FALANDO';

interface ATLASInterfaceProps {
  state: AtlasState;
  onSettingsClick?: () => void;
  onMicClick?: () => void;
  onCameraClick?: () => void;
  onScreenClick?: () => void;
  isMicActive?: boolean;
  isCameraActive?: boolean;
  isScreenSharing?: boolean;
}

const ATLASInterface: React.FC<ATLASInterfaceProps> = ({ 
  state, 
  onSettingsClick,
  onMicClick,
  onCameraClick,
  onScreenClick,
  isMicActive,
  isCameraActive,
  isScreenSharing
}) => {
  return (
    <div className="relative w-full h-full bg-[#0a0f1e] flex flex-col items-center justify-center overflow-hidden font-mono">
      <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none" />
      
      {/* Background Watermark */}
      <div className="absolute bottom-6 right-8 opacity-10 pointer-events-none select-none">
        <span className="text-2xl font-black tracking-[0.8em] text-cyan-400/30">ATLAS</span>
      </div>

      {/* Decorative Rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
        <motion.div 
          className="absolute w-[500px] h-[500px] border border-cyan-500/20 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className="absolute w-[400px] h-[400px] border border-cyan-500/10 rounded-full border-dashed"
          animate={{ rotate: -360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Suspended Futuristic Interaction (Speaking) */}
      <AnimatePresence>
        {state === 'FALANDO' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.2, y: -20 }}
            className="absolute top-1/4 z-50 pointer-events-none"
          >
            <div className="relative flex flex-col items-center">
              <motion.div 
                className="w-48 h-48 rounded-full border border-cyan-400/20 shadow-[0_0_30px_rgba(0,234,255,0.1)]"
                animate={{ 
                  rotateX: [70, 75, 70],
                  rotateZ: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                style={{ transformStyle: 'preserve-3d' }}
              />
              <motion.div 
                className="mt-4 px-4 py-1 bg-cyan-400/5 border border-cyan-400/20 backdrop-blur-sm rounded-full"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="text-[8px] tracking-[0.4em] text-cyan-400/60 font-bold uppercase">Neural Link Active</span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="mt-10 flex gap-3 z-10">
        {[
          { icon: Mic, label: 'Voz', onClick: onMicClick, active: isMicActive },
          { icon: Camera, label: 'Câmera', onClick: onCameraClick, active: isCameraActive },
          { icon: Monitor, label: 'Tela', onClick: onScreenClick, active: isScreenSharing },
          { icon: ExternalLink, label: 'Pop-out', onClick: () => window.open(window.location.href, '_blank') },
          { icon: Settings, label: 'Configurações', onClick: onSettingsClick }
        ].map((btn, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.05, backgroundColor: btn.active ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 211, 238, 0.15)' }}
            whileTap={{ scale: 0.95 }}
            onClick={btn.onClick}
            className={`w-10 h-10 rounded-none border flex flex-col items-center justify-center transition-all duration-300 ${
              btn.active 
              ? 'bg-green-500/10 text-green-400 border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.1)]' 
              : 'bg-cyan-900/5 text-cyan-300/80 border-cyan-500/20 backdrop-blur-md'
            }`}
            title={btn.label}
          >
            <btn.icon size={16} />
            <span className="text-[6px] mt-0.5 uppercase tracking-tighter opacity-40">{btn.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default ATLASInterface;
