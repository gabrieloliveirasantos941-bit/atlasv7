import React from 'react';
import { motion } from 'motion/react';

type AtlasState = 'OUVINDO' | 'PROCESSANDO' | 'FALANDO';

interface ATLASStatusProps {
  state: AtlasState;
}

const ATLASStatus: React.FC<ATLASStatusProps> = ({ state }) => {
  return (
    <motion.div 
      className="text-cyan-400 text-sm tracking-[0.2em] z-10 font-mono"
      key={state}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {state}
    </motion.div>
  );
};

export default ATLASStatus;
