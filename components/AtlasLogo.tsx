import React from 'react';

interface AtlasLogoProps {
  className?: string;
}

const AtlasLogo: React.FC<AtlasLogoProps> = ({ className = "" }) => (
  <div className={`flex flex-col items-center justify-center ${className}`}>
    <div className="text-6xl font-light tracking-[0.4em] uppercase text-white neon-text">
      ATLAS<span className="text-[var(--accent-primary)] font-bold">IA</span>
    </div>
    <div className="mt-4 h-[1px] w-48 bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent opacity-40" />
    <div className="mt-2 text-[10px] tracking-[0.6em] text-white/40 uppercase font-bold font-mono">+ Consciência Digital</div>
  </div>
);

export default AtlasLogo;
