import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db, doc, setDoc, auth, signOut, updateDoc } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    Settings as SettingsIcon, 
    Palette, 
    Zap, 
    User as UserIcon, 
    Shield, 
    Bell, 
    Puzzle, 
    Info,
    PanelLeftClose,
    Check,
    AlertCircle,
    CreditCard,
    Cpu,
    LogOut
} from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    assistantCustomName: string;
    setAssistantCustomName: (val: string) => void;
    userPreferredName: string;
    setUserPreferredName: (val: string) => void;
    theme: string;
    setTheme?: (val: string) => void;
    onApplyTheme?: (theme: string | undefined, customColor: string | undefined) => void;
    onOpenFocoFlow?: () => void;
    tempColor?: string;
    setTempColor?: (val: string) => void;
    setCustomThemeColor?: (val: string) => void;
    onOpenArchived?: () => void;
    customThemes?: any[];
    setCustomThemes?: (themes: any[]) => void;
    activeCustomThemeId?: string | null;
    setActiveCustomThemeId?: (id: string | null) => void;
    customBackground?: string;
    setCustomBackground?: (bg: string) => void;
    bgOpacity?: number;
    setBgOpacity?: (op: number) => void;
    isJarvisMode?: boolean;
    setIsJarvisMode?: (val: boolean) => void;
    isLowLatency?: boolean;
    setIsLowLatency?: (val: boolean) => void;
    isElevatedThinking?: boolean;
    setIsElevatedThinking?: (val: boolean) => void;
    onBluetoothConnect?: () => void;
    onRealBluetoothConnect?: () => void;
    availableAudioOutputs?: MediaDeviceInfo[];
    onSelectAudioOutput?: (deviceId: string, label: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    user,
    assistantCustomName,
    setAssistantCustomName,
    userPreferredName,
    setUserPreferredName,
    theme,
    setTheme,
    onApplyTheme,
    onOpenFocoFlow,
    onBluetoothConnect,
    onRealBluetoothConnect,
    availableAudioOutputs,
    onSelectAudioOutput,
}) => {
    const [activeTab, setActiveTab] = useState<'geral' | 'foco' | 'seguranca' | 'notificacoes' | 'sobre' | 'perfil'>('geral');

    
    // Additional settings state
    const [autoStart, setAutoStart] = useState(false);
    const [dataCollection, setDataCollection] = useState(false);
    const [localAssistantName, setLocalAssistantName] = useState(assistantCustomName);
    const [localUserName, setLocalUserName] = useState(userPreferredName);

    const [localTheme, setLocalTheme] = useState(theme || 'dark');
    const [alarmSound, setAlarmSound] = useState('som1');

    // Load additional settings from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('atlasSettings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                if (settings.alarmSound) setAlarmSound(settings.alarmSound);
                if (settings.autoStart !== undefined) setAutoStart(settings.autoStart);
                if (settings.dataCollection !== undefined) setDataCollection(settings.dataCollection);
            } catch (e) {
                console.error("Error loading atlasSettings:", e);
            }
        }
    }, [isOpen]);

    // Sync local names with props
    useEffect(() => {
        setLocalAssistantName(assistantCustomName);
    }, [assistantCustomName]);

    useEffect(() => {
        setLocalUserName(userPreferredName);
    }, [userPreferredName]);

    if (!isOpen) return null;

    const handleSave = async () => {
        const settings = {
            assistantName: localAssistantName,
            userName: localUserName,
            alarmSound,
            theme: localTheme,
            autoStart,
            dataCollection
        };

        // Save to localStorage
        localStorage.setItem("atlasSettings", JSON.stringify(settings));

        // Sync with App state and Firestore if applicable
        setAssistantCustomName(localAssistantName);
        setUserPreferredName(localUserName);
        if (setTheme) setTheme(localTheme);
        if (onApplyTheme) onApplyTheme(localTheme, undefined);

        try {
            await setDoc(doc(db, 'users', user.uid), {
                assistantCustomName: localAssistantName,
                userPreferredName: localUserName,
                theme: localTheme,
                alarmSound,
                autoStart,
                dataCollection
            }, { merge: true });
            
            onClose();
        } catch (err) {
            console.error("Error saving settings to firestore:", err);
            onClose();
        }
    };

    const previewSound = (soundName: string = alarmSound) => {
        let soundFile = '';
        switch(soundName) {
            case "som1": soundFile = "alarm1.mp3"; break;
            case "som2": soundFile = "alarm2.mp3"; break;
            case "som3": soundFile = "alarm3.mp3"; break;
            case "som4": soundFile = "alarm4.mp3"; break;
            case "som5": soundFile = "alarm5.mp3"; break;
            case "som6": soundFile = "alarm6.mp3"; break;
            default: soundFile = "alarm1.mp3";
        }
        
        const audioPath = `/sounds/${soundFile}`;
        
        try {
            const audio = new Audio(audioPath);
            audio.play().catch(e => {
                console.warn(`[ATLAS] Falha ao reproduzir: ${audioPath}. Verifique se o arquivo existe em /public/sounds/`, e);
            });
        } catch (e) {
            console.error("Error creating audio object:", e);
        }
    };

    const sidebarItems = [
        { id: 'geral', label: 'GERAL', sub: 'Informações básicas', icon: UserIcon },
        { id: 'foco', label: 'FOCOFLOW', sub: 'Automação e produtividade', icon: Zap },
        { id: 'seguranca', label: 'SEGURANÇA', sub: 'Privacidade e acesso', icon: Shield },
        { id: 'notificacoes', label: 'NOTIFICAÇÕES', sub: 'Alertas e preferências', icon: Bell },
        { id: 'sobre', label: 'SOBRE', sub: 'Informações do sistema', icon: Info },
        { id: 'perfil', label: 'PERFIL', sub: 'Status de assinatura', icon: CreditCard },
    ];

    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-hidden" onClick={onClose}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="bg-[#050811] rounded-none w-full max-w-[1000px] h-[85vh] max-h-[720px] shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5 flex flex-col md:flex-row overflow-hidden relative" 
                onClick={e => e.stopPropagation()}
            >
                {/* Sidebar */}
                <div className="w-full md:w-[280px] bg-[#070b15] p-6 flex flex-col border-r border-white/5">
                    <div className="flex items-center gap-3 mb-8 px-2">
                        <div className="w-8 h-8 rounded-none bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                            <SettingsIcon className="text-cyan-400" size={18} />
                        </div>
                        <h2 className="text-lg font-black tracking-tight text-white">CONFIGURAÇÕES</h2>
                    </div>

                    <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
                        {sidebarItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id as any)}
                                className={`w-full group relative flex items-center gap-4 p-4 rounded-none transition-all duration-300 ${
                                    activeTab === item.id 
                                    ? 'bg-[#0a1228] border-l-4 border-cyan-400 shadow-[0_4px_20px_rgba(0,180,216,0.1)]' 
                                    : 'hover:bg-white/5 border-l-4 border-transparent'
                                }`}
                            >
                                <item.icon 
                                    size={20} 
                                    className={`${activeTab === item.id ? 'text-cyan-400' : 'text-white/40 group-hover:text-white/70'}`}
                                />
                                <div className="text-left">
                                    <div className={`text-xs font-black tracking-widest leading-none mb-1 ${activeTab === item.id ? 'text-white' : 'text-white/60 group-hover:text-white/90'}`}>
                                        {item.label}
                                    </div>
                                    <div className="text-[10px] text-white/30 font-medium whitespace-nowrap">
                                        {item.sub}
                                    </div>
                                </div>
                                {activeTab === item.id && (
                                    <div className="absolute right-4 w-1 h-3 rounded-full bg-cyan-400" />
                                )}
                            </button>
                        ))}
                    </div>

                    <button 
                        onClick={onClose}
                        className="mt-8 px-4 py-4 flex items-center gap-4 text-white/60 hover:text-white hover:bg-white/5 rounded-none transition-all font-black text-xs uppercase tracking-widest border border-white/5 group"
                    >
                        <PanelLeftClose size={18} className="group-hover:translate-x-1 transition-transform" />
                        FECHAR
                    </button>
                </div>

                {/* Content Container */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#050811]">
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-10">
                        <AnimatePresence mode="wait">
                            {activeTab === 'geral' && (
                                <motion.div
                                    key="geral"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-12"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-none bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.1)]">
                                            <UserIcon size={32} className="text-cyan-400" />
                                        </div>
                                        <div>
                                            <h1 className="text-3xl font-black text-white leading-none uppercase tracking-tighter">NÚCLEO GERAL</h1>
                                            <p className="text-sm text-white/40 mt-1 font-medium italic">Parâmetros de identidade e sincronização do sistema.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        {/* IDENTIDADE */}
                                        <section className="bg-white/[0.02] backdrop-blur-md rounded-none border border-white/5 p-10 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                                                <UserIcon size={120} className="text-white" />
                                            </div>
                                            
                                            <div className="relative z-10 space-y-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 rounded-none bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                                                        <Zap size={16} className="text-cyan-400" />
                                                    </div>
                                                    <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">MATRIZ DE IDENTIDADE</h3>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-black text-cyan-400/50 uppercase tracking-widest px-1">Designação do Assistente</label>
                                                        <input 
                                                            type="text"
                                                            value={localAssistantName}
                                                            onChange={e => setLocalAssistantName(e.target.value)}
                                                            className="w-full bg-black/40 border border-white/10 rounded-none px-6 py-5 text-white text-sm focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 transition-all placeholder:text-white/10 font-bold"
                                                            placeholder="Atlas"
                                                        />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-black text-cyan-400/50 uppercase tracking-widest px-1">Seu Nome Preferencial</label>
                                                        <input 
                                                            type="text"
                                                            value={localUserName}
                                                            onChange={e => setLocalUserName(e.target.value)}
                                                            className="w-full bg-black/40 border border-white/10 rounded-none px-6 py-5 text-white text-sm focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 transition-all placeholder:text-white/10 font-bold"
                                                            placeholder="Operador"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </section>


                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* Preferências de Sistema */}
                                            <section className="bg-white/[0.02] backdrop-blur-md rounded-none border border-white/5 p-10 flex flex-col justify-between">
                                                <div className="space-y-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                                            <SettingsIcon size={16} className="text-indigo-400" />
                                                        </div>
                                                        <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">PREFERÊNCIAS</h3>
                                                    </div>

                                                    <div className="space-y-6">
                                                         <div className="flex items-center justify-between group cursor-pointer" onClick={() => setAutoStart(!autoStart)}>
                                                             <div className="space-y-1">
                                                                 <h4 className="text-xs font-black text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight">AUTO-INICIALIZAÇÃO</h4>
                                                                 <p className="text-[10px] text-white/30 font-medium">Boot automático ao login.</p>
                                                             </div>
                                                             <div className={`w-12 h-6 rounded-full transition-all p-1 flex items-center ${autoStart ? 'bg-cyan-500' : 'bg-white/5'}`}>
                                                                 <div className={`w-4 h-4 rounded-full bg-white transition-all transform ${autoStart ? 'translate-x-6' : 'translate-x-0'}`} />
                                                             </div>
                                                         </div>

                                                         <div className="flex items-center justify-between group cursor-pointer" onClick={() => setDataCollection(!dataCollection)}>
                                                             <div className="space-y-1">
                                                                 <h4 className="text-xs font-black text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight">COLETA DE TELEMETRIA</h4>
                                                                 <p className="text-[10px] text-white/30 font-medium">Melhore a rede neural.</p>
                                                             </div>
                                                             <div className={`w-12 h-6 rounded-full transition-all p-1 flex items-center ${dataCollection ? 'bg-cyan-500' : 'bg-white/5'}`}>
                                                                 <div className={`w-4 h-4 rounded-full bg-white transition-all transform ${dataCollection ? 'translate-x-6' : 'translate-x-0'}`} />
                                                             </div>
                                                         </div>

                                                         {onBluetoothConnect && (
                                                             <div className="flex items-center justify-between group">
                                                                 <div className="space-y-1 pr-4">
                                                                     <h4 className="text-xs font-black text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight flex items-center gap-2">
                                                                         <span className="text-blue-400">●</span> SAÍDA DE ÁUDIO (FONE/CAIXAS)
                                                                     </h4>
                                                                     <p className="text-[10px] text-white/30 font-medium">Selecione para onde enviar o áudio do assistente.</p>
                                                                 </div>
                                                                 {availableAudioOutputs && availableAudioOutputs.length > 0 ? (
                                                                     <select 
                                                                        onChange={(e) => {
                                                                            const selected = availableAudioOutputs.find(d => d.deviceId === e.target.value);
                                                                            if (selected && onSelectAudioOutput) onSelectAudioOutput(selected.deviceId, selected.label);
                                                                        }}
                                                                        className="bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold rounded-none p-2 focus:outline-none"
                                                                     >
                                                                        <option value="">Selecione...</option>
                                                                        {availableAudioOutputs.map(d => (
                                                                            <option key={d.deviceId} value={d.deviceId}>{d.label || "Dispositivo"}</option>
                                                                        ))}
                                                                     </select>
                                                                 ) : (
                                                                     <button onClick={onBluetoothConnect} className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold rounded-none hover:bg-blue-500/20 transition-colors whitespace-nowrap">
                                                                         MUDAR SAÍDA
                                                                     </button>
                                                                 )}
                                                             </div>
                                                         )}

                                                         {onRealBluetoothConnect && (
                                                             <div className="flex items-center justify-between group">
                                                                 <div className="space-y-1 pr-4">
                                                                     <h4 className="text-xs font-black text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight flex items-center gap-2">
                                                                         <span className="text-blue-400">●</span> PAREAMENTO BLUETOOTH
                                                                     </h4>
                                                                     <p className="text-[10px] text-white/30 font-medium">Parear com dispositivos Bluetooth (BLE).</p>
                                                                 </div>
                                                                 <button onClick={onRealBluetoothConnect} className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold rounded-none hover:bg-blue-500/20 transition-colors whitespace-nowrap">
                                                                     PAREAR
                                                                 </button>
                                                             </div>
                                                         )}
                                                     </div>
                                                </div>
                                            </section>

                                            {/* Meta Dados da Conta */}
                                            <section className="bg-white/[0.02] backdrop-blur-md rounded-none border border-white/5 p-10 space-y-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                                        <Shield size={16} className="text-purple-400" />
                                                    </div>
                                                    <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">TERMINAL DE CONTA</h3>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="group">
                                                       <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1 block px-1 group-hover:text-cyan-400/50 transition-colors">ENDEREÇO_REDE</label>
                                                       <div className="bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white/50 text-[11px] font-mono truncate group-hover:border-white/10 transition-colors">
                                                           {user.email}
                                                       </div>
                                                    </div>
                                                    <div className="group">
                                                       <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1 block px-1 group-hover:text-cyan-400/50 transition-colors">CRYPTO_ID</label>
                                                       <div className="bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white/50 text-[11px] font-mono truncate group-hover:border-white/10 transition-colors">
                                                           {user.uid}
                                                       </div>
                                                    </div>
                                                </div>
                                            </section>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 justify-center text-white/10 animate-pulse pt-4">
                                        <div className="h-px w-20 bg-gradient-to-r from-transparent to-white/10" />
                                        <Cpu size={14} />
                                        <div className="h-px w-20 bg-gradient-to-l from-transparent to-white/10" />
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'notificacoes' && (
                                <motion.div
                                    key="notificacoes"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-10"
                                >
                                    <div>
                                        <h1 className="text-2xl font-black text-white mb-1 uppercase tracking-tight">STATUS DO ATLAS</h1>
                                        <p className="text-sm text-white/40 font-medium">Monitoramento de avisos, erros e status do sistema.</p>
                                    </div>

                                    <section className="bg-[#0a0f1e]/40 rounded-3xl border border-white/5 p-8 space-y-6">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                                                <Bell size={16} className="text-cyan-400" />
                                            </div>
                                            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">ALINHAMENTO DO SISTEMA</h3>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4">
                                                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                                <div>
                                                    <h4 className="text-sm font-bold text-white">Atlas Online</h4>
                                                    <p className="text-xs text-white/40">Conectado ao servidor principal.</p>
                                                </div>
                                            </div>
                                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4">
                                                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                                <div>
                                                    <h4 className="text-sm font-bold text-white">Firestore Sincronizado</h4>
                                                    <p className="text-xs text-white/40">Dados de usuário atualizados.</p>
                                                </div>
                                            </div>
                                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4">
                                                <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                                                <div>
                                                    <h4 className="text-sm font-bold text-white">IA (Gemini)</h4>
                                                    <p className="text-xs text-white/40">Recursos de processamento ativos.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                </motion.div>
                            )}

                             {activeTab === 'sobre' && (
                                <motion.div
                                    key="sobre"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-10 pb-10"
                                >
                                    <div>
                                        <h1 className="text-2xl font-black text-white mb-1 uppercase tracking-tight">SOBRE O ATLAS</h1>
                                        <p className="text-sm text-white/40 font-medium">Documentação oficial e funcionamento do ecossistema.</p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-6">
                                        <section className="bg-[#0a0f1e]/40 rounded-3xl border border-white/5 p-6 hover:border-cyan-400/30 transition-all group">
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 group-hover:scale-110 transition-transform">
                                                    <Zap size={20} className="text-cyan-400" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="text-sm font-black text-white uppercase tracking-wider">O QUE É O ATLAS?</h3>
                                                    <p className="text-xs text-white/50 leading-relaxed font-medium">
                                                        É um ecossistema de IA de próxima geração, projetado para ser seu assistente pessoal completo, unindo produtividade e automação sob uma interface futurista.
                                                    </p>
                                                </div>
                                            </div>
                                        </section>

                                        <section className="bg-[#0a0f1e]/40 rounded-3xl border border-white/5 p-6 hover:border-indigo-400/30 transition-all group">
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform">
                                                    <Puzzle size={20} className="text-indigo-400" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="text-sm font-black text-white uppercase tracking-wider">INTELIGÊNCIA ARTIFICIAL</h3>
                                                    <p className="text-xs text-white/50 leading-relaxed font-medium">
                                                        Processamos linguagem natural para entender intenções complexas, gerando respostas precisas, códigos e insights acionáveis em tempo real.
                                                    </p>
                                                </div>
                                            </div>
                                        </section>

                                        <section className="bg-[#0a0f1e]/40 rounded-3xl border border-white/5 p-6 hover:border-blue-400/30 transition-all group">
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                                                    <PanelLeftClose size={20} className="text-blue-400" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="text-sm font-black text-white uppercase tracking-wider">VISÃO DA TELA</h3>
                                                    <p className="text-xs text-white/50 leading-relaxed font-medium">
                                                        Graças à tecnologia multimodal, o Atlas "vê" sua tela para ajudar com códigos, bugs ou documentos, oferecendo suporte contextual imediato.
                                                    </p>
                                                </div>
                                            </div>
                                        </section>

                                        <section className="bg-[#0a0f1e]/40 rounded-3xl border border-white/5 p-6 hover:border-purple-400/30 transition-all group">
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform">
                                                    <Bell size={20} className="text-purple-400" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="text-sm font-black text-white uppercase tracking-wider">MEMÓRIA DE CONVERSAS</h3>
                                                    <p className="text-xs text-white/50 leading-relaxed font-medium">
                                                        Utilizamos a "continuidade neural" para lembrar de preferências e temas discutidos anteriormente, mantendo o contexto de seus projetos ativos.
                                                    </p>
                                                </div>
                                            </div>
                                        </section>

                                        <section className="bg-[#0a0f1e]/40 rounded-3xl border border-white/5 p-6 hover:border-orange-400/30 transition-all group">
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 group-hover:scale-110 transition-transform">
                                                    <Zap size={20} className="text-orange-400" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="text-sm font-black text-white uppercase tracking-wider">CONTROLE POR VOZ</h3>
                                                    <p className="text-xs text-white/50 leading-relaxed font-medium">
                                                        Interações fluidas através do Gemini Live. Você pode conversar de forma natural, interromper e dar comandos de voz sem atrasos perceptíveis.
                                                    </p>
                                                </div>
                                            </div>
                                        </section>

                                        <section className="bg-[#0a0f1e]/40 rounded-3xl border border-white/5 p-6 hover:border-green-400/30 transition-all group">
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20 group-hover:scale-110 transition-transform">
                                                    <AlertCircle size={20} className="text-green-400" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="text-sm font-black text-white uppercase tracking-wider">INTEGRAÇÃO COM GEMINI</h3>
                                                    <p className="text-xs text-white/50 leading-relaxed font-medium">
                                                        Alinhado nativamente com a API do Google Gemini, garantindo os modelos de IA mais rápidos e inteligentes disponíveis globalmente.
                                                    </p>
                                                </div>
                                            </div>
                                        </section>

                                        <section className="bg-[#0a0f1e]/40 rounded-3xl border border-white/5 p-6 hover:border-yellow-400/30 transition-all group">
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 group-hover:scale-110 transition-transform">
                                                    <Zap size={20} className="text-yellow-400" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="text-sm font-black text-white uppercase tracking-wider">AUTOMAÇÃO DE TAREFAS</h3>
                                                    <p className="text-xs text-white/50 leading-relaxed font-medium">
                                                        Gerenciamos suas finanças, tarefas e links através do sistema FocoFlow, executando ações automáticas via prompts de comando.
                                                    </p>
                                                </div>
                                            </div>
                                        </section>

                                        <section className="bg-[#0a0f1e]/40 rounded-3xl border border-white/5 p-6 hover:border-red-400/30 transition-all group">
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 group-hover:scale-110 transition-transform">
                                                    <Shield size={20} className="text-red-400" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="text-sm font-black text-white uppercase tracking-wider">SEGURANÇA E PRIVACIDADE</h3>
                                                    <p className="text-xs text-white/50 leading-relaxed font-medium">
                                                        Dados protegidos por criptografia de ponta no Firestore. Sua visão e voz só são acessadas com permissão explícita.
                                                    </p>
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'foco' && (
                                <motion.div
                                    key="foco"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-10"
                                >
                                    <div>
                                        <h1 className="text-2xl font-black text-white mb-1 uppercase tracking-tight">FOCOFLOW</h1>
                                        <p className="text-sm text-white/40 font-medium">Configure seu ecossistema de produtividade e automação.</p>
                                    </div>

                                    <section className="bg-[#0a0f1e]/40 rounded-3xl border border-white/5 p-8 space-y-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
                                                <Zap size={28} className="text-cyan-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-white uppercase tracking-wider">PAINEL ATLAS FOCOFLOW</h3>
                                                <p className="text-xs text-white/40 font-medium">Acesse a central completa de finanças, tarefas e monitoramento.</p>
                                            </div>
                                        </div>

                                        <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                                            <p className="text-sm text-white/60 leading-relaxed font-medium">
                                                O FocoFlow é o motor de execução do Atlas. Através dele, você pode gerenciar toda a sua vida digital e financeira em um só lugar, com suporte total de IA.
                                            </p>
                                            
                                            <button 
                                                onClick={() => onOpenFocoFlow?.()}
                                                className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-xs uppercase tracking-[0.2em] shadow-[0_4px_20px_rgba(0,180,216,0.3)] transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                                            >
                                                ABRIR PAINEL FOCOFLOW
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                                <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1">FINANÇAS</h4>
                                                <p className="text-[10px] text-white/30 font-medium">Gestão avançada de fluxo de caixa e contas.</p>
                                            </div>
                                            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                                <h4 className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-1">TAREFAS</h4>
                                                <p className="text-[10px] text-white/30 font-medium">Projetos, lembretes e automação TODO.</p>
                                            </div>
                                        </div>
                                    </section>
                                </motion.div>
                            )}

                            {activeTab === 'perfil' && (
                                <motion.div
                                    key="perfil"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-10"
                                >
                                    <div>
                                        <h1 className="text-2xl font-black text-white mb-1 uppercase tracking-tight">PERFIL DE USUÁRIO</h1>
                                        <p className="text-sm text-white/40 font-medium">Gerencie sua assinatura e plano.</p>
                                    </div>

                                    <section className="bg-[#0a0f1e]/40 rounded-3xl border border-white/5 p-8 space-y-6">
                                        <div className="flex items-center gap-3 mb-2 border-b border-white/5 pb-6">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                                <CreditCard size={16} className="text-emerald-400" />
                                            </div>
                                            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">STATUS DE ASSINATURA</h3>
                                        </div>

                                        <div className="space-y-4 pt-2">
                                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                                                <span className="text-sm text-white/60">Plano Atual</span>
                                                <span className="text-sm font-bold text-white uppercase tracking-wider">Premium</span>
                                            </div>
                                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                                                <span className="text-sm text-white/60">Status</span>
                                                <span className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Ativo</span>
                                            </div>
                                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                                                <span className="text-sm text-white/60">Próxima Cobrança</span>
                                                <span className="text-sm font-bold text-white uppercase tracking-wider">22/05/2026</span>
                                            </div>
                                        </div>
                                    </section>

                                    
                                    <button 
                                        onClick={async () => {
                                            await signOut(auth);
                                            onClose();
                                        }}
                                        className="w-full py-4 flex items-center justify-center gap-2 text-red-400 hover:text-white hover:bg-red-950/30 rounded-xl border border-red-900/30 transition-all font-black text-xs uppercase tracking-widest mt-6"
                                    >

                                        <LogOut size={16} />
                                        SAIR DA CONTA
                                    </button>
                                </motion.div>
                            )}

                            {activeTab !== 'geral' && activeTab !== 'foco' && activeTab !== 'notificacoes' && activeTab !== 'sobre' && activeTab !== 'perfil' && (
                                <motion.div
                                    key="fallback"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="h-full flex flex-col items-center justify-center text-center space-y-4"
                                >
                                    <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center mb-4">
                                        {React.createElement(sidebarItems.find(i => i.id === activeTab)?.icon || AlertCircle, { size: 32, className: "text-cyan-400 opacity-50" })}
                                    </div>
                                    <h2 className="text-xl font-black text-white uppercase tracking-widest">{sidebarItems.find(i => i.id === activeTab)?.label}</h2>
                                    <p className="text-white/30 text-sm max-w-sm font-medium">Esta seção está sendo aprimorada e estará disponível em breve com novas funcionalidades exclusivas.</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Modal Footer */}
                    <div className="px-10 py-8 border-t border-white/5 flex items-center justify-end gap-4 bg-[#070b15]/50">
                        <button 
                            onClick={onClose}
                            className="px-8 py-3 rounded-none border border-white/10 text-white font-black text-xs uppercase tracking-widest hover:bg-white/5 transition-all text-center min-w-[140px]"
                        >
                            CANCELAR
                        </button>
                        <button 
                            onClick={handleSave}
                            className="px-8 py-3 rounded-none bg-cyan-400 hover:bg-cyan-500 text-black font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all min-w-[200px] shadow-[0_4px_15px_rgba(34,211,238,0.3)] transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Check size={18} strokeWidth={3} />
                            SALVAR ALTERAÇÕES
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default SettingsModal;
