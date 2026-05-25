import React, { useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Camera, Monitor, Settings as SettingsIcon } from 'lucide-react';

interface ImmersiveModeProps {
    isOpen: boolean;
    onClose: () => void;
    audioAnalyserRef: React.RefObject<AnalyserNode | null>;
    inputAudioAnalyserRef: React.RefObject<AnalyserNode | null>;
    isThinking: boolean;
    assistantName: string;
    onCommand: (cmd: string) => void;
    lastAssistantMessage?: string;
    isMicActive?: boolean;
    isCameraActive?: boolean;
    isScreenSharing?: boolean;
}

const ImmersiveMode: React.FC<ImmersiveModeProps> = ({
    isOpen,
    onClose,
    onCommand,
    isMicActive,
    isCameraActive,
    isScreenSharing,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);

    // Close on ESC
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Particles state for stars
    const particles = useMemo(() => {
        const p = [];
        for (let i = 0; i < 200; i++) {
            p.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                size: Math.random() * 1.5 + 0.2,
                speedY: (Math.random() - 0.5) * 0.2,
                opacity: Math.random() * 0.5 + 0.1,
            });
        }
        return p;
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const animate = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            // Deep dark space blue background
            const gradient = ctx.createRadialGradient(
                canvas.width / 2, canvas.height / 2, 0,
                canvas.width / 2, canvas.height / 2, canvas.width
            );
            gradient.addColorStop(0, '#050b14');
            gradient.addColorStop(1, '#010205');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw star particles
            particles.forEach(p => {
                p.y += p.speedY;

                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                // Twinkle effect
                const currentOpacity = p.opacity + Math.sin(Date.now() * 0.001 * p.speedY * 10) * 0.2;
                ctx.globalAlpha = Math.max(0.1, Math.min(0.8, currentOpacity));
                ctx.fill();
            });
            ctx.globalAlpha = 1.0;

            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [particles]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="fixed inset-0 z-[200] overflow-hidden flex flex-col items-center justify-end pb-24 font-sans"
            >
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

                {/* Subtle light reflection on the bottom */}
                <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-[#0ea5e9]/5 to-transparent pointer-events-none" />
                
                {/* Horizontal light line */}
                <div className="absolute bottom-24 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#0ea5e9]/50 to-transparent pointer-events-none" />
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-1/2 h-4 bg-[#0ea5e9]/20 blur-[20px] pointer-events-none" />

                {/* Controls */}
                <div className="relative z-10 flex items-center justify-center gap-4 pointer-events-auto mb-[-12px]">
                    <CommandButton 
                        icon={<Mic size={28} strokeWidth={1.5} />} 
                        onClick={() => onCommand('voice')} 
                        active={isMicActive} 
                        label="VOZ" 
                    />
                    <CommandButton 
                        icon={<Camera size={28} strokeWidth={1.5} />} 
                        onClick={() => onCommand('camera')} 
                        active={isCameraActive}
                        label="CÂMERA" 
                    />
                    <CommandButton 
                        icon={<Monitor size={28} strokeWidth={1.5} />} 
                        onClick={() => onCommand('screen')} 
                        active={isScreenSharing}
                        label="TELA" 
                    />
                    <CommandButton 
                        icon={<SettingsIcon size={28} strokeWidth={1.5} />} 
                        onClick={() => onCommand('settings')} 
                        label="CONFIGURAÇÕES" 
                    />
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

const CommandButton: React.FC<{ icon: React.ReactNode; onClick: () => void; active?: boolean; label: string }> = ({ icon, onClick, active, label }) => (
    <motion.button 
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`flex flex-col items-center justify-center gap-3 w-40 h-24 rounded-none transition-all duration-500 backdrop-blur-md border border-white/10 ${
            active 
            ? 'bg-[#0ea5e9]/10 border-[#0ea5e9]/50 shadow-[0_0_20px_rgba(14,165,233,0.3)] text-[#0ea5e9]' 
            : 'bg-black/20 hover:bg-[#0ea5e9]/5 hover:border-[#0ea5e9]/40 hover:shadow-[0_0_15px_rgba(14,165,233,0.2)] text-[#0ea5e9] hover:text-[#38bdf8]'
        }`}
    >
        <div className={`transition-all duration-500 ${active ? 'drop-shadow-[0_0_8px_rgba(14,165,233,0.8)]' : ''}`}>
            {icon}
        </div>
        <span className="text-[10px] uppercase tracking-[0.15em] font-medium text-white/90">
            {label}
        </span>
    </motion.button>
);

export default ImmersiveMode;

