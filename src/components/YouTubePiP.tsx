import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Minimize2, Maximize2, GripHorizontal } from 'lucide-react';

interface YouTubePiPProps {
  videoId: string;
  title?: string;
  onClose: () => void;
}

const YouTubePiP: React.FC<YouTubePiPProps> = ({ videoId, title, onClose }) => {
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    console.log(`[ATLAS YT-PLAYER] Core Active: ${videoId}`);
    if (!videoId) {
      console.error("[ATLAS YT-PLAYER] FAILED: Missing VideoID payload");
    }
  }, [videoId]);

  return (
    <AnimatePresence>
      <motion.div
        drag
        dragMomentum={false}
        dragConstraints={{ left: -1000, right: 100, top: -800, bottom: 100 }}
        initial={{ opacity: 0, scale: 0.8, y: 100 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: 0,
          width: isMinimized ? 200 : 400,
          height: isMinimized ? 40 : 255
        }}
        exit={{ opacity: 0, scale: 0.8, y: 100 }}
        style={{ 
          position: 'fixed', 
          bottom: 20, 
          right: 20, 
          zIndex: 9999,
          overflow: 'hidden'
        }}
        className="glass-panel border border-cyan-500/30 rounded-none shadow-2xl flex flex-col"
      >
        {/* Header / Drag Handle */}
        <div className="h-10 bg-slate-900/80 border-b border-white/10 flex items-center justify-between px-3 cursor-move drag-handle group">
          <div className="flex items-center gap-2 overflow-hidden">
            <GripHorizontal className="w-4 h-4 text-cyan-400 opacity-50 group-hover:opacity-100 transition-opacity" />
            <span className="text-[10px] font-mono text-cyan-100 uppercase tracking-widest truncate max-w-[150px]">
              {title || 'ATLAS VISUAL CORE'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-white/10 rounded-none transition-colors"
            >
              {isMinimized ? <Maximize2 className="w-3 h-3 text-cyan-400" /> : <Minimize2 className="w-3 h-3 text-cyan-400" />}
            </button>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-red-500/20 rounded-none transition-colors"
            >
              <X className="w-3 h-3 text-red-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={`relative flex-1 bg-black group ${isMinimized ? 'invisible h-0 pointer-events-none' : 'opacity-100'} transition-all duration-300`}>
          <iframe
            id="youtube-pip-iframe"
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&playsinline=1&enablejsapi=1&modestbranding=1&rel=0`}
            title="ATLAS Media Stream"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full"
          />
          
          {/* Overlay for HUD feel */}
          <div className="absolute inset-0 pointer-events-none border-t border-cyan-500/10 shadow-[inset_0_0_20px_rgba(0,255,255,0.05)]" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default YouTubePiP;
