import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    Mic, 
    MicOff, 
    Camera, 
    CameraOff, 
    Monitor, 
    MonitorOff, 
    Settings,
    Power, 
    Users,
    Menu,
    Layout,
    ExternalLink,
    Bluetooth,
    Headphones
} from 'lucide-react';
import AtlasAvatar from './AtlasAvatar';

interface ImmersiveHUDProps {
    assistantName: string;
    isMicActive: boolean;
    isMicLoading?: boolean;
    isCameraActive: boolean;
    isScreenSharing: boolean;
    isThinking: boolean;
    isSpeaking: boolean;
    onMicToggle: () => void;
    onCameraToggle: () => void;
    onScreenToggle: () => void;
    onSettingsClick: () => void;
    onExit: () => void;
    lastAssistantMessage?: string;
    audioAnalyserRef?: React.RefObject<AnalyserNode | null>;
    inputAudioAnalyserRef?: React.RefObject<AnalyserNode | null>;
    onCardShowToggle?: () => void;
    onMenuClick?: () => void;
    onMediaNucleusToggle?: () => void;
    activeAgentName?: string;
    activeAgentId?: string;
    isMicPermissionDenied?: boolean;
    onNotificationsClick?: () => void;
    unreadNotifications?: boolean;
    onFocoFlowClick?: () => void;
    messages?: any[];
    videoRef?: React.RefObject<HTMLVideoElement | null>;
    onBluetoothConnect?: () => void;
    onRealBluetoothConnect?: () => void;
}

const Scanlines: React.FC<{ isResting: boolean }> = ({ isResting }) => (
    <div className="absolute inset-0 pointer-events-none z-[99]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_2px,3px_100%] pointer-events-none" />
        {!isResting && (
            <motion.div 
                className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-20 w-full"
                animate={{ top: ['-20%', '120%'] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear", type: "tween" }}
            />
        )}
    </div>
);

const AudioPulse: React.FC<{ analyserRef: React.RefObject<AnalyserNode | null> }> = ({ analyserRef }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!analyserRef.current || !canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const analyser = analyserRef.current;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        let animationFrame: number;

        const draw = () => {
            animationFrame = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const barWidth = (canvas.width / 16);
            let x = 0;

            for(let i = 0; i < 16; i++) {
                const barHeight = (dataArray[i * 4] / 255) * canvas.height;
                ctx.fillStyle = i % 2 === 0 ? 'rgba(34, 211, 238, 0.4)' : 'rgba(34, 211, 238, 0.2)';
                ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
                x += barWidth;
            }
        };

        draw();
        return () => cancelAnimationFrame(animationFrame);
    }, [analyserRef]);

    return <canvas ref={canvasRef} width={60} height={20} className="opacity-60" />;
};

const ImmersiveHUD: React.FC<ImmersiveHUDProps> = React.memo(({
    assistantName,
    isMicActive,
    isMicLoading,
    isCameraActive,
    isScreenSharing,
    isThinking,
    isSpeaking,
    onMicToggle,
    onCameraToggle,
    onScreenToggle,
    onSettingsClick,
    onExit,
    lastAssistantMessage,
    audioAnalyserRef,
    inputAudioAnalyserRef,
    onCardShowToggle,
    onMenuClick,
    activeAgentName,
    activeAgentId,
    isMicPermissionDenied,
    onNotificationsClick,
    unreadNotifications,
    onMediaNucleusToggle,
    onFocoFlowClick,
    messages,
    videoRef,
    onBluetoothConnect,
    onRealBluetoothConnect
}) => {
    const [fps, setFps] = useState(60);
    const [latency, setLatency] = useState(12);
    const [userIsActive, setUserIsActive] = useState(true);

    // Track user active states to optimize FPS and particles
    useEffect(() => {
        // If there's active speaking/thinking or streaming, bypass power saving
        if (isThinking || isSpeaking || isMicActive || isCameraActive || isScreenSharing) {
            setUserIsActive(true);
            return;
        }

        let timeoutId: NodeJS.Timeout;

        const handleActivity = () => {
            setUserIsActive(true);
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setUserIsActive(false);
            }, 10000); // 10 seconds of user inactivity
        };

        // Reset timer
        timeoutId = setTimeout(() => {
            setUserIsActive(false);
        }, 10000);

        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('click', handleActivity);
        window.addEventListener('touchstart', handleActivity);

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('click', handleActivity);
            window.removeEventListener('touchstart', handleActivity);
        };
    }, [isThinking, isSpeaking, isMicActive, isCameraActive, isScreenSharing]);

    const isRestMode = !isThinking && !isSpeaking && !isMicActive && !isCameraActive && !isScreenSharing && !userIsActive;

    // Simulate Network Latency based on connection and activity
    useEffect(() => {
        if (isRestMode) {
            setLatency(12); // Steady static standby level
            return;
        }

        const latencyTimer = setInterval(() => {
            const baseLatency = (isThinking || isSpeaking) ? 45 : 12;
            const jitter = Math.floor(Math.random() * 15) - 5;
            setLatency(Math.max(8, baseLatency + jitter));
        }, 2000);
        return () => clearInterval(latencyTimer);
    }, [isThinking, isSpeaking, isRestMode]);

    // Real FPS Counter - Optimized to skip running requestAnimationFrame when in RestMode
    useEffect(() => {
        if (isRestMode) {
            setFps(30); // Constant low-power target representation when resting
            return;
        }

        let frameCount = 0;
        let lastTime = performance.now();
        let animationFrameId: number;

        const measureFPS = () => {
            const now = performance.now();
            frameCount++;
            if (now - lastTime >= 1000) {
                setFps(Math.round((frameCount * 1000) / (now - lastTime)));
                frameCount = 0;
                lastTime = now;
            }
            animationFrameId = requestAnimationFrame(measureFPS);
        };

        animationFrameId = requestAnimationFrame(measureFPS);
        return () => cancelAnimationFrame(animationFrameId);
    }, [isRestMode]);

    const recentLogs = messages
        ? messages.slice(-3).reverse().map((m, i) => ({
            id: m.id || i,
            label: m.role === 'user' ? 'USER_INPUT' : (m.role === 'model' || m.role === 'assistant' ? 'ATLAS_RESPONSE' : 'SYS_LOG'),
            text: m.text?.substring(0, 20) || 'DATA_PROCESSED'
        }))
        : [];

    return (
        <div id="hud-container" className="fixed inset-0 z-[100] bg-[#00050a] overflow-hidden select-none">
            <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.1)_0%,transparent_80%)]" />
            </div>
            <Scanlines isResting={isRestMode} />
            
            {/* Top Bar: Clean & Minimal */}
            <div className="absolute top-0 left-0 right-0 h-16 pointer-events-none px-6 flex items-center justify-between z-30">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-cyan-400/50 font-black tracking-widest uppercase">Protocolo Atlas</span>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-mono text-cyan-400 font-bold tracking-widest">
                                {isRestMode ? 'MODO REPOUSO' : 'CONECTADO'}
                            </span>
                            {isRestMode && (
                                <span className="text-[9px] text-cyan-400/50 bg-cyan-400/10 px-1.5 py-0.5 rounded-none font-mono font-bold animate-pulse">
                                    CPU SAVER
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={onExit}
                        className="pointer-events-auto p-2 hover:bg-red-500/20 rounded-none transition-colors group"
                    >
                        <Power size={20} className="text-red-500/60 group-hover:text-red-500 group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                    </button>
                </div>
            </div>

            {/* Center Label: Active Agent */}
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none">
                <motion.div 
                    key={activeAgentName}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: isRestMode ? 0.6 : 1, y: 0 }}
                    className="flex items-center gap-3 px-6 py-2 rounded-none glass-morphism border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                >
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-none bg-cyan-400 shadow-[0_0_8px_#22d3ee] ${isRestMode ? 'opacity-30' : 'animate-pulse'}`} />
                        <span className="text-[10px] font-bold tracking-[0.2em] text-cyan-400/80 uppercase">ATLAS_CORE active</span>
                    </div>
                    <div className="w-[1px] h-3 bg-white/10" />
                    <span className="text-xs font-medium tracking-wide text-white/90">
                        {assistantName} {activeAgentName && activeAgentName !== 'Assistente Padrão' ? `| ${activeAgentName}` : ''}
                    </span>
                </motion.div>
                <div className="text-[7px] text-cyan-400/30 tracking-[0.8em] font-black uppercase mt-1">SISTEMA DINÂMICO DE GESTÃO</div>
            </div>

            {/* Real-time Environmental Sensors (Left Sidebar style layout) */}
            <div className="absolute top-24 left-6 pointer-events-none z-30 flex flex-col gap-4">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: isRestMode ? 0.3 : 1, x: 0 }}
                    className="flex flex-col gap-1"
                >
                    <span className="text-[8px] text-cyan-400/50 font-black tracking-widest uppercase">Sensores Ambientais</span>
                    <div className="flex flex-col gap-2 p-3 glass-morphism border border-cyan-500/20 bg-black/40 w-48">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-white/50 font-mono">HORA LOCAL</span>
                            <span className="text-[10px] text-cyan-400 font-mono">{new Date().toLocaleTimeString('pt-BR')}</span>
                        </div>
                        <div className="w-full h-[1px] bg-cyan-500/10" />
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-white/50 font-mono">STATUS DO USUÁRIO</span>
                            <span className="text-[10px] font-mono font-bold" style={{ color: userIsActive ? '#22d3ee' : '#ef4444' }}>
                                {userIsActive ? 'FOCADO' : 'AUSENTE'}
                            </span>
                        </div>
                        <div className="w-full h-[1px] bg-cyan-500/10" />
                        <div className="flex flex-col gap-1">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-white/50 font-mono">PRODUTIVIDADE SESSÃO</span>
                                <span className="text-[10px] text-green-400 font-mono font-bold animate-pulse">ALTA</span>
                            </div>
                            <div className="w-full bg-white/10 h-1 mt-1 rounded-none overflow-hidden">
                                <motion.div 
                                    className="bg-green-400 h-full w-[80%]" 
                                    animate={{ width: userIsActive ? ['80%', '82%', '80%'] : '60%' }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>
                
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: isRestMode ? 0.3 : 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col gap-1 mt-4"
                >
                    <span className="text-[8px] text-cyan-400/50 font-black tracking-widest uppercase">Observador Neural</span>
                    <div className="flex flex-col gap-2 p-3 glass-morphism border border-cyan-500/20 bg-black/40 w-48">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-white/50 font-mono">SINK TEMPO REAL</span>
                            <span className="text-[10px] text-cyan-400 font-mono animate-pulse">ATIVO</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-white/50 font-mono">PADRÃO DETECTADO</span>
                            <span className="text-[10px] text-cyan-400 font-mono">TRABALHO CONTÍNUO</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* End Environment Sensors */}
            <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none" />
            
            {/* Real-time Video Stream Preview (Integrated into the HUD) */}
            <AnimatePresence>
                {(isScreenSharing || isCameraActive) && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="absolute bottom-32 right-10 z-40 w-80 h-48 rounded-none overflow-hidden glass-morphism border border-cyan-500/20 shadow-2xl pointer-events-none"
                    >
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            muted 
                            className="w-full h-full object-cover opacity-80 mix-blend-screen"
                        />
                        <div className="absolute top-2 left-2 flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-[8px] font-mono font-bold text-white/70 uppercase">
                                {isScreenSharing ? 'SCREEN_FEED' : 'CAMERA_FEED'} LIVE
                            </span>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Background Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none">
                <span className="text-[30vw] font-black tracking-tighter text-white select-none">ATLAS</span>
            </div>

            {/* Dynamic Background Glow */}
            <AnimatePresence>
                {(isThinking || isSpeaking) && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[-1]"
                        style={{
                            background: isSpeaking 
                               ? 'radial-gradient(circle at center, rgba(0, 242, 255, 0.15) 0%, transparent 70%)'
                                : 'radial-gradient(circle at center, rgba(139, 92, 246, 0.1) 0%, transparent 70%)'
                        }}
                    />
                )}
            </AnimatePresence>



             {/* Avatar Interface */}
             <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                 <AtlasAvatar 
                     isThinking={isThinking} 
                     isSpeaking={isSpeaking}
                     isSleeping={isRestMode || !isMicActive}
                     audioAnalyserRef={audioAnalyserRef}
                     activeAgentId={activeAgentId}
                 />
             </div>

            {/* Bottom Center: Controls */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-auto z-50">
                <div className="relative flex flex-col items-center">
                    <div className="flex items-center justify-center gap-3 glass-morphism p-3 rounded-none border border-white/10 backdrop-blur-3xl shadow-2xl" style={{ height: '70.1493px' }}>
                        <div className="relative">
                            {isMicActive && (
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 pointer-events-none">
                                    <AudioPulse analyserRef={inputAudioAnalyserRef as any} />
                                </div>
                            )}
                            <ActionButton 
                                icon={isMicActive ? <Mic size={20} /> : <MicOff size={20} />} 
                                label={isMicPermissionDenied ? "BLOQUEADO" : (isMicLoading ? "LIGANDO..." : (isMicActive ? "ATIVO" : "MUDO"))} 
                                active={isMicActive}
                                onClick={onMicToggle}
                                disabled={isMicLoading}
                                color={isMicActive ? 'cyan' : 'gray'}
                            />
                        </div>
                        <ActionButton 
                            icon={isCameraActive ? <Camera size={20} /> : <CameraOff size={20} />} 
                            label={isCameraActive ? "ON" : "OFF"} 
                            active={isCameraActive}
                            onClick={onCameraToggle}
                            color={isCameraActive ? 'cyan' : 'gray'}
                        />
                        <ActionButton 
                            icon={isScreenSharing ? <Monitor size={20} /> : <MonitorOff size={20} />} 
                            label={isScreenSharing ? "COMP." : "TELA"} 
                            active={isScreenSharing}
                            onClick={onScreenToggle}
                            color={isScreenSharing ? 'cyan' : 'gray'}
                        />
                        <ActionButton 
                            icon={<Headphones size={20} />} 
                            label="ÁUDIO OUT" 
                            onClick={onBluetoothConnect || (() => {})}
                        />
                        <ActionButton 
                            icon={<Bluetooth size={20} />} 
                            label="BLUETOOTH" 
                            onClick={onRealBluetoothConnect || (() => {})}
                        />
                        <div className="w-[1px] h-8 bg-white/10 mx-1" />
                        <ActionButton 
                            icon={<Settings size={20} />} 
                            label="AJUSTES" 
                            onClick={onSettingsClick}
                        />
                        <ActionButton 
                            icon={<Layout size={20} />} 
                            label="FOCO" 
                            onClick={onFocoFlowClick || (() => {})}
                        />
                        <ActionButton 
                            icon={<Users size={20} />} 
                            label="NÚCLEO" 
                            onClick={onCardShowToggle || (() => {})}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
});

const ActionButton: React.FC<{ 
    icon: React.ReactNode; 
    label: string; 
    active?: boolean; 
    onClick: () => void; 
    disabled?: boolean;
    color?: 'cyan' | 'gray' | 'red';
}> = ({ icon, label, active, onClick, disabled, color = 'cyan' }) => (
    <button 
        className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-none transition-all duration-300 relative group
            ${active ? (color === 'cyan' ? 'text-cyan-400 bg-cyan-400/10' : 'text-white bg-white/10') : 'text-white/40 hover:text-white/70 hover:bg-white/5'}
            ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
    >
        <div className={`transition-transform duration-300 group-hover:scale-110 ${active ? 'filter drop-shadow-[0_0_8px_currentColor]' : ''}`}>
            {icon}
        </div>
        <span className="text-[7px] font-black tracking-widest uppercase">{label}</span>
        {active && (
            <motion.div 
                layoutId="active-indicator"
                className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-none ${color === 'cyan' ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-white shadow-[0_0_8px_white]'}`}
            />
        )}
    </button>
);

export default ImmersiveHUD;
