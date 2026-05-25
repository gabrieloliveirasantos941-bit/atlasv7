import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, RefreshCw, ChevronLeft, ChevronRight, Globe, Maximize2, Minimize2 } from 'lucide-react';

interface BrowserPiPProps {
    url: string;
    isVisible: boolean;
    onClose: () => void;
    title?: string;
}

const BrowserPiP: React.FC<BrowserPiPProps> = ({ url, isVisible, onClose, title }) => {
    const [isMaximized, setIsMaximized] = React.useState(false);
    const [iframeUrl, setIframeUrl] = React.useState(url);

    React.useEffect(() => {
        setIframeUrl(url);
    }, [url]);

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className={`fixed z-[300] bg-[#050507] border border-white/10 shadow-2xl overflow-hidden flex flex-col ${
                        isMaximized 
                        ? 'inset-4 rounded-2xl' 
                        : 'bottom-6 right-6 w-[600px] h-[400px] rounded-xl'
                    }`}
                >
                    {/* Toolbar */}
                    <div className="h-12 border-b border-white/5 bg-white/5 flex items-center px-4 justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 mr-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40" />
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/40" />
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 group">
                                <ChevronLeft className="w-4 h-4 cursor-not-allowed opacity-30" />
                                <ChevronRight className="w-4 h-4 cursor-not-allowed opacity-30" />
                                <RefreshCw 
                                    className="w-3.5 h-3.5 cursor-pointer hover:text-white transition-colors ml-1" 
                                    onClick={() => {
                                        const current = iframeUrl;
                                        setIframeUrl('');
                                        setTimeout(() => setIframeUrl(current), 10);
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex-1 max-w-md bg-black/40 border border-white/5 rounded-lg py-1 px-3 flex items-center gap-2 overflow-hidden">
                            <Globe className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="text-[10px] text-slate-400 font-mono truncate lowercase tracking-tight">
                                {iframeUrl || 'about:blank'}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => window.open(iframeUrl, '_blank')}
                                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all"
                                title="Abrir em nova aba"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => setIsMaximized(!isMaximized)}
                                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all"
                            >
                                {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                            </button>
                            <button 
                                onClick={onClose}
                                className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-slate-400 transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 bg-[#050507] relative flex flex-col">
                        {/* Status / Alert Bar */}
                        <div className={`px-4 py-2 flex items-center justify-between gap-4 border-b border-white/5 ${
                            iframeUrl.includes('google.com') || iframeUrl.includes('youtube.com') || iframeUrl.includes('github.com')
                            ? 'bg-amber-500/20 border-amber-500/30' 
                            : 'bg-emerald-500/5'
                        }`}>
                            <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                                    iframeUrl.includes('google.com') || iframeUrl.includes('youtube.com') || iframeUrl.includes('github.com')
                                    ? 'bg-amber-500' 
                                    : 'bg-emerald-500'
                                }`} />
                                <span className="text-[9px] text-white/80 font-bold uppercase tracking-widest">
                                    {iframeUrl.includes('google.com') || iframeUrl.includes('youtube.com') || iframeUrl.includes('github.com')
                                        ? "PROTEÇÃO DE PRIVACIDADE DETECTADA" 
                                        : "MODO DE NAVEGAÇÃO SEGURO"}
                                </span>
                            </div>
                            
                            <button 
                                onClick={() => window.open(iframeUrl, '_blank')}
                                className="text-[9px] bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-sm border border-white/10 transition-all font-black uppercase tracking-widest cursor-pointer"
                            >
                                ABRIR EM NOVA ABA
                            </button>
                        </div>

                        <div className="flex-1 bg-white relative">
                            <iframe 
                                src={iframeUrl}
                                className="w-full h-full border-none"
                                title={title || "Integrated Browser"}
                                referrerPolicy="no-referrer"
                            />
                            
                            {/* Detailed explanation for blocked sites */}
                            {(iframeUrl.includes('google.com') || iframeUrl.includes('youtube.com') || iframeUrl.includes('github.com')) && (
                                <div className="absolute inset-0 bg-[#08080a] flex flex-col items-center justify-center p-8 text-center">
                                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-8 rotate-3 border border-white/10">
                                        <Globe className="w-8 h-8 text-white/40" />
                                    </div>
                                    <h4 className="text-white font-bold text-lg mb-3 tracking-tight">O Servidor Impediu a Conexão</h4>
                                    <p className="text-slate-400 text-xs max-w-[280px] leading-relaxed mb-10">
                                        Por questões de segurança, domínios como <b>{new URL(iframeUrl).hostname}</b> protegem o acesso externo via Quadros (Frames).
                                    </p>
                                    <button 
                                        onClick={() => window.open(iframeUrl, '_blank')}
                                        className="w-full max-w-[240px] py-4 bg-white text-black font-black text-xs uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-xl shadow-white/5"
                                    >
                                        VER SITE AGORA
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col gap-2 pointer-events-none opacity-40">
                            <div className="px-3 py-1.5 bg-black/80 backdrop-blur-md rounded-full text-[10px] font-mono text-emerald-400 border border-emerald-500/20 uppercase tracking-[0.3em]">
                                ATLAS SECURE BROWSER
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default BrowserPiP;
