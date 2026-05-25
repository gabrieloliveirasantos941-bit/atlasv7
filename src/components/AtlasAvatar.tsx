import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface AtlasAvatarProps {
  isSpeaking: boolean;
  isThinking: boolean;
  assistantName?: string;
  isSleeping?: boolean;
  audioAnalyserRef?: React.RefObject<AnalyserNode | null>;
  activeAgentId?: string;
}

export const AtlasAvatar: React.FC<AtlasAvatarProps> = ({ 
  isSpeaking, 
  isThinking, 
  isSleeping = false,
  audioAnalyserRef,
  assistantName = "ATLAS",
  activeAgentId = 'default'
}) => {
  const [audioLevel, setAudioLevel] = React.useState(0);
  
  React.useEffect(() => {
    if (!audioAnalyserRef?.current || !isSpeaking) {
      setAudioLevel(0);
      return;
    }
    
    const analyser = audioAnalyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let animationId: number;
    
    const update = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setAudioLevel(average / 128); // Normalize 0-2
      animationId = requestAnimationFrame(update);
    };
    
    update();
    return () => cancelAnimationFrame(animationId);
  }, [audioAnalyserRef, isSpeaking]);

  return (
    <motion.div 
      key={activeAgentId}
      className={`relative flex items-center justify-center w-80 h-80 ${isSleeping ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        scale: isSleeping ? 0.9 : 1,
      }}
      transition={{ duration: 1 }}
    >
      {/* 1. Deep Atmospheric Glow (Jarvis core energy) */}
      <motion.div
        className="absolute w-72 h-72 rounded-full bg-cyan-500/10 blur-[90px]"
        animate={{
          scale: isSpeaking ? [1, 1.25, 1] : [1, 1.05, 1],
          opacity: isSpeaking ? [0.4, 0.7, 0.4] : [0.15, 0.3, 0.15],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

       {/* 2. Celestial Orbit Rings (Minimal & Clean) */}
       <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
         {[...Array(3)].map((_, i) => (
           <motion.div
             key={`ring-${i}`}
             className="absolute border border-cyan-400/10 rounded-full"
             style={{
               width: `${70 + i * 15}%`,
               height: `${70 + i * 15}%`,
               borderStyle: i === 1 ? 'dashed' : 'solid',
               borderWidth: '1px',
             }}
             animate={{ 
               rotate: i % 2 === 0 ? 360 : -360,
               scale: isSpeaking ? [1, 1.05, 1] : 1
             }}
             transition={{ 
               rotate: { duration: 30 + i * 15, repeat: Infinity, ease: "linear" },
               scale: { duration: 0.5, repeat: Infinity }
             }}
           />
         ))}
         {/* Futuristic Data Ring */}
         <motion.div
           className="absolute w-[95%] h-[95%] opacity-20"
           animate={{ rotate: 360 }}
           transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
         >
           <svg viewBox="0 0 100 100" className="w-full h-full">
             <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 4" className="text-cyan-400" />
             <path d="M50 2 A48 48 0 0 1 98 50" fill="none" stroke="currentColor" strokeWidth="1" className="text-cyan-500" />
             <path d="M50 98 A48 48 0 0 1 2 50" fill="none" stroke="currentColor" strokeWidth="1" className="text-cyan-500" />
           </svg>
         </motion.div>
       </div>

      {/* 3. Realistic Artificial Intelligence Core */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        
        {/* Core Avatar Layer */}
        <motion.div 
          className="relative flex items-center justify-center w-52 h-52 rounded-full border-[2px] border-cyan-500/30 shadow-[0_0_50px_rgba(34,211,238,0.3)] overflow-hidden"
          animate={{
            scale: isSpeaking ? [1, 1.05 + audioLevel * 0.15, 1] : (isThinking ? [1, 1.02, 1] : 1),
            boxShadow: isSpeaking 
              ? [`0 0 40px rgba(34,211,238,0.4)`, `0 0 80px rgba(34,211,238,0.7)`, `0 0 40px rgba(34,211,238,0.4)`]
               : (isThinking ? [`0 0 40px rgba(139, 92, 246, 0.3)`, `0 0 60px rgba(139, 92, 246, 0.6)`, `0 0 40px rgba(139, 92, 246, 0.3)`] : `0 0 30px rgba(34,211,238,0.2)`)
          }}
          transition={{
            scale: { duration: isSpeaking ? 0.15 : 2, repeat: Infinity, ease: "easeInOut" },
            boxShadow: { duration: isSpeaking ? 0.15 : (isThinking ? 1.5 : 3), repeat: Infinity, ease: "easeInOut" }
          }}
        >
            {/* Energy Pulse Waves (Radiating out) */}
            <AnimatePresence>
              {isSpeaking && (
                <motion.div 
                  className="absolute inset-0 rounded-full border border-cyan-400/60"
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
                />
              )}
            </AnimatePresence>

            {/* Futuristic AI Core Image */}
            <motion.img 
              src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=800&auto=format&fit=crop" 
              alt="ATLAS Core"
              referrerPolicy="no-referrer"
              className={`w-full h-full object-cover transition-all duration-700 mix-blend-screen opacity-90 ${isSleeping ? 'opacity-30 grayscale blur-[4px]' : ''}`}
              animate={{
                scale: isSpeaking ? [1, 1.1, 1] : 1,
                rotate: isThinking ? [0, 5, -5, 0] : 0
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            
            {/* Cybernetic Grid Overlay */}
            <div className="absolute inset-0 bg-cyan-700/20 mix-blend-color pointer-events-none" />

            {/* Inner Energy Liquid Overlay */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-tr from-cyan-600/30 via-cyan-400/20 to-transparent mix-blend-screen pointer-events-none"
              animate={{
                rotate: isSpeaking ? [0, 360] : [0, 180, 0],
                opacity: isSpeaking ? [0.4, 0.8, 0.4] : 0.4
              }}
              transition={{
                rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                opacity: { duration: isSpeaking ? 0.2 : 2, repeat: Infinity, ease: "easeInOut" }
              }}
            />
            
            {/* Scanline Effect */}
            <motion.div
              className="absolute inset-0 w-full h-[5px] bg-cyan-400/40 blur-[2px] pointer-events-none"
              animate={{ top: ['0%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />

            {/* Audio Reactive Inner Glow */}
            {isSpeaking && (
              <div 
                className="absolute inset-0 bg-cyan-400 mix-blend-screen rounded-full blur-[15px] pointer-events-none"
                style={{ opacity: audioLevel * 0.8 }}
              />
            )}
         </motion.div>
      </div>

      {/* Floating Synaptic Particles (Subtle environment) */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(isThinking ? 24 : 12)].map((_, i) => (
          <motion.div
            key={`part-${i}`}
            className={`absolute rounded-full ${isThinking ? 'bg-purple-400/60 w-[3px] h-[3px]' : 'bg-cyan-300/40 w-[2px] h-[2px]'}`}
            initial={{ 
                rotate: i * (360 / (isThinking ? 24 : 12)), 
                x: 130 + (i % 3) * 20, 
                opacity: 0.1 
            }}
            animate={{ 
                rotate: (i * (360 / (isThinking ? 24 : 12))) + (isThinking ? 720 : 360),
                opacity: isSpeaking || isThinking ? [0.1, 0.6, 0.1] : 0.1,
                scale: isThinking ? [1, 1.5, 1] : 1,
                x: isThinking ? [130, 160, 130] : (130 + (i % 3) * 20)
            }}
            transition={{ 
                rotate: { duration: (isThinking ? 5 : 15) + i, repeat: Infinity, ease: "linear" },
                opacity: { duration: isThinking ? 1 : 2, repeat: Infinity },
                scale: { duration: 1, repeat: Infinity, delay: i * 0.1 },
                x: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          />
        ))}
        {isThinking && [...Array(6)].map((_, i) => (
          <motion.div
            key={`link-${i}`}
            className="absolute top-1/2 left-1/2 h-[1px] bg-gradient-to-r from-transparent via-purple-400/40 to-transparent origin-left"
            style={{ width: '140px', rotate: `${i * 60}deg` }}
            animate={{ 
              opacity: [0, 0.4, 0],
              scaleX: [0.8, 1.2, 0.8]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              delay: i * 0.3,
              ease: "easeInOut" 
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default AtlasAvatar;
