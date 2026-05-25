/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    X, 
    Layout, 
    Link,
    Bell,
    Database,
    Shield,
    Activity,
    BarChart3,
    Sparkles,
    Settings,
    Brain,
    Maximize2,
    Minimize2
} from 'lucide-react';
import { FinanceDashboard } from './FinanceDashboard';
import { FocoFlowTabContent } from './FocoFlowTabContent';
import { AdvancedReports } from '../components/AdvancedReports';
import { AIAssistant } from './AIAssistant';
import { 
    getFinancialSummary, 
    getFocoFlowData, 
    toggleReminderCompleted 
} from '../services/focoFlowService';

interface FocoFlowDashboardProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    onSelectConversation?: (id: string) => void;
    historySize?: number;
    isSessionActive?: boolean;
    lastSummary?: string;
    initialTab?: any;
}

const TAB_EMOJIS: Record<string, string> = {
    ai_assistant: '🧠',
    tasks: '📝',
    advanced_reports: '📊',
    finances: '💰',
    financial_goals: '🎯',
    links: '🔗',
    reminders: '🔔',
    notes: '🗒️',
    network_logs: '🌐',
    core_diagnostic: '⚙️',
    database_admin: '🗄️',
    settings: '🔧'
};

// Visual themes corresponding to different workstation console desks
export const TAB_THEMES: Record<string, {
    primary: string;
    primaryRgb: string;
    glow: string;
    overlay: string;
}> = {
    ai_assistant: {
        primary: '#A855F7', // Electric Purple
        primaryRgb: '168, 85, 247',
        glow: 'rgba(168, 85, 247, 0.4)',
        overlay: 'rgba(168, 85, 247, 0.05)'
    },
    tasks: {
        primary: '#6366F1', // Indigo Focus
        primaryRgb: '99, 102, 241',
        glow: 'rgba(99, 102, 241, 0.4)',
        overlay: 'rgba(99, 102, 241, 0.05)'
    },
    advanced_reports: {
        primary: '#4ADE80', // Neon Green
        primaryRgb: '74, 222, 128',
        glow: 'rgba(74, 222, 128, 0.4)',
        overlay: 'rgba(74, 222, 128, 0.05)'
    },
    finances: {
        primary: '#22D3EE', // Bright Cyan
        primaryRgb: '34, 211, 238',
        glow: 'rgba(34, 211, 238, 0.4)',
        overlay: 'rgba(34, 211, 238, 0.05)'
    },
    financial_goals: {
        primary: '#FB923C', // Atomic Orange
        primaryRgb: '251, 146, 60',
        glow: 'rgba(251, 146, 60, 0.4)',
        overlay: 'rgba(251, 146, 60, 0.05)'
    },
    links: {
        primary: '#60A5FA', // Sky Blue
        primaryRgb: '96, 165, 250',
        glow: 'rgba(96, 165, 250, 0.4)',
        overlay: 'rgba(96, 165, 250, 0.05)'
    },
    reminders: {
        primary: '#2DD4BF', // Teal/Emerald
        primaryRgb: '45, 212, 191',
        glow: 'rgba(45, 212, 191, 0.4)',
        overlay: 'rgba(45, 212, 191, 0.05)'
    },
    notes: {
        primary: '#FB7185', // Rose/Coral
        primaryRgb: '251, 113, 133',
        glow: 'rgba(251, 113, 133, 0.4)',
        overlay: 'rgba(251, 113, 133, 0.05)'
    },
    network_logs: {
        primary: '#94A3B8', // Cyber Silver
        primaryRgb: '148, 163, 184',
        glow: 'rgba(148, 163, 184, 0.4)',
        overlay: 'rgba(148, 163, 184, 0.05)'
    },
    core_diagnostic: {
        primary: '#FACC15', // Caution Yellow
        primaryRgb: '250, 204, 21',
        glow: 'rgba(250, 204, 21, 0.4)',
        overlay: 'rgba(250, 204, 21, 0.05)'
    },
    database_admin: {
        primary: '#3B82F6', // Vibrant Blue
        primaryRgb: '59, 130, 246',
        glow: 'rgba(59, 130, 246, 0.4)',
        overlay: 'rgba(59, 130, 246, 0.05)'
    }
};

const NavItem = ({ 
    active, 
    label, 
    onClick,
    tabKey
}: { 
    active: boolean, 
    label: string, 
    onClick: () => void,
    tabKey: string
}) => {
    const theme = TAB_THEMES[tabKey] || TAB_THEMES.tasks;
    const emoji = TAB_EMOJIS[tabKey] || '🔹';
    return (
        <button 
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-5 py-3.5 text-[11px] tracking-wider uppercase transition-all duration-300 relative group rounded-[14px] mb-1.5 border font-semibold cursor-pointer
                ${active 
                    ? `text-white bg-white/5 border-white/10 shadow-lg` 
                    : 'text-slate-400 border-transparent hover:bg-white/[0.03] hover:text-white'
                }
            `}
            style={{
                borderColor: active ? theme.primary : undefined,
                color: active ? '#ffffff' : undefined,
                boxShadow: active ? `inset 0 0 10px ${theme.overlay}, 0 4px 20px -5px ${theme.glow}` : undefined
            }}
        >
            <div 
                className={`relative z-10 transition-all duration-300 ${active ? 'scale-110 opacity-100' : 'opacity-40 group-hover:opacity-70 group-hover:scale-105'}`}
                style={{ color: active ? theme.primary : undefined }}
            >
                {emoji}
            </div>
            <span className="relative z-10 text-left flex-1 font-medium">
                {label}
            </span>
            {active && (
                <motion.div 
                    layoutId="active-nav-indicator"
                    className="absolute right-3 w-2 h-2 rounded-full" 
                    style={{ 
                        backgroundColor: theme.primary,
                        boxShadow: `0 0 15px ${theme.primary}`
                    }} 
                />
            )}
        </button>
    );
};

const AudioVisualizer = ({ activeColor }: { activeColor: string }) => {
    return (
        <div className="flex items-end h-[14px] gap-[2px] px-2 opacity-50">
            {[...Array(8)].map((_, i) => (
                <motion.div 
                    key={i}
                    animate={{ height: ['20%', `${Math.random() * 80 + 20}%`, '20%'] }}
                    transition={{ duration: 0.5 + Math.random() * 0.5, repeat: Infinity, ease: "easeInOut" }}
                    className="w-0.5 rounded-t-full"
                    style={{ backgroundColor: activeColor }}
                />
            ))}
        </div>
    );
};

const FocoFlowDashboard: React.FC<FocoFlowDashboardProps> = ({ 
    isOpen, 
    onClose, 
    userId,
    initialTab = 'tasks'
}) => {
    const [activeTab, setActiveTab2] = useState(initialTab);
    const [timeStr, setTimeStr] = useState('');
    const [financeSummary, setFinanceSummary] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [alarmReminder, setAlarmReminder] = useState<any>(null);
    const [lastNotifiedId, setLastNotifiedId] = useState<string | null>(null);
    const [isMaximized, setIsMaximized] = useState(true);

    useEffect(() => {
        const handleStopAlarm = () => setAlarmReminder(null);
        const handleTestAlarm = () => playAlarmSound(true);
        window.addEventListener('stop_active_alarm', handleStopAlarm);
        window.addEventListener('test_alarm_sound', handleTestAlarm);
        return () => {
            window.removeEventListener('stop_active_alarm', handleStopAlarm);
            window.removeEventListener('test_alarm_sound', handleTestAlarm);
        };
    }, []);

    // Audio context for alarm
    const playAlarmSound = (isTest = false) => {
        try {
            const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContextClass();
            
            const playTone = (freq: number, start: number, duration: number, type: OscillatorType = 'square') => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                
                osc.type = type;
                osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
                
                // Add frequency sweep for more cyber feel
                osc.frequency.exponentialRampToValueAtTime(freq * 0.5, ctx.currentTime + start + duration);

                gain.gain.setValueAtTime(0, ctx.currentTime + start);
                gain.gain.linearRampToValueAtTime(isTest ? 0.05 : 0.15, ctx.currentTime + start + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.start(ctx.currentTime + start);
                osc.stop(ctx.currentTime + start + duration);
            };

            // High-tech alerting sequence
            if (isTest) {
                playTone(1200, 0, 0.1, 'sine');
                playTone(1800, 0.15, 0.1, 'sine');
            } else {
                playTone(880, 0, 0.2, 'square');
                playTone(440, 0.2, 0.1, 'sawtooth');
                playTone(880, 0.4, 0.2, 'square');
                playTone(440, 0.6, 0.1, 'sawtooth');
            }
        } catch (e) {
            console.error('Audio error:', e);
        }
    };

    useEffect(() => {
        if (alarmReminder) {
            playAlarmSound();
            const interval = setInterval(playAlarmSound, 2000);
            return () => clearInterval(interval);
        }
    }, [alarmReminder]);
    
    const activeTheme = TAB_THEMES[activeTab] || TAB_THEMES.tasks;

    const setActiveTab = (tab: string) => {
        setActiveTab2(tab);
    };

    useEffect(() => {
        if (isOpen && initialTab) setActiveTab(initialTab);
    }, [isOpen, initialTab]);

    const loadFinanceData = () => {
        getFinancialSummary(userId).then(summary => {
            setFinanceSummary(summary);
        });
        getFocoFlowData(userId, 'transacoes_financeiras_focoflow', 10).then(data => {
            setTransactions(data);
        });
    };

    useEffect(() => {
        if (isOpen && activeTab === 'finances') {
            loadFinanceData();
        }
    }, [isOpen, activeTab, userId]);

    useEffect(() => {
        const handleUpdate = () => {
            if (activeTab === 'finances') {
                loadFinanceData();
            }
        };
        window.addEventListener('focoflow_data_updated', handleUpdate);
        return () => window.removeEventListener('focoflow_data_updated', handleUpdate);
    }, [activeTab]);

    useEffect(() => {
        const handleSwitchTab = (e: any) => {
            if (e.detail?.tab) {
                setActiveTab(e.detail.tab);
            }
        };
        window.addEventListener('focoflow_switch_tab', handleSwitchTab as any);
        return () => window.removeEventListener('focoflow_switch_tab', handleSwitchTab as any);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setTimeStr(timeString);

            // Alarm Check Logic
            const currentDateTimeStr = now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
            const currentShortTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const currentDate = now.toISOString().split('T')[0];

            getFocoFlowData(userId, 'reminders').then(reminders => {
                const pending = reminders.find(r => {
                    if (r.completed || r.id === lastNotifiedId) return false;
                    const rDate = new Date(r.datetime);
                    const rDateStr = rDate.toISOString().split('T')[0];
                    const rTimeStr = rDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    
                    return rDateStr === currentDate && rTimeStr === currentShortTime;
                });

                if (pending && pending.id !== lastNotifiedId) {
                    setAlarmReminder(pending);
                    setLastNotifiedId(pending.id);
                }
            });

        }, 1000);
        return () => clearInterval(timer);
    }, [userId, lastNotifiedId]);

    return (
        <>
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[240] flex justify-end font-sans bg-transparent text-slate-200 overflow-hidden pointer-events-none">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isMaximized ? 0.95 : 0.4 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black z-0 pointer-events-auto"
                    />
                    
                    {/* Panel Container */}
                    <motion.div 
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        style={{ willChange: 'transform' }}
                        transition={{ 
                            duration: 0.6,
                            ease: [0.16, 1, 0.3, 1]
                        }}
                        className={`relative z-10 h-full flex font-sans bg-[#050507] text-slate-200 shadow-2xl overflow-hidden pointer-events-auto rounded-none ${
                            isMaximized 
                            ? 'w-full border-none' 
                            : 'w-full sm:w-[500px] md:w-[600px] lg:w-[750px] xl:w-[900px] border-l border-white/10'
                        }`}
                    >
                        {/* Subtle Gradient Background */}
                        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                            <div 
                                className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[120px] opacity-20 transition-all duration-1000"
                                style={{ background: activeTheme.primary }}
                            />
                            <div 
                                className="absolute bottom-0 left-0 w-[400px] h-[400px] opacity-10 rounded-full blur-[100px] transition-all duration-1000"
                                style={{ background: activeTheme.primary }}
                            />
                            <div className="absolute inset-0 opacity-[0.03]" 
                                 style={{
                                     backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.15) 1px, transparent 0)`,
                                     backgroundSize: '32px 32px'
                                 }} 
                            />
                        </div>

                        {/* Sidebar Navigation */}
                        <motion.div 
                            initial={{ x: 10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            className="w-64 border-r border-white/5 bg-black/40 backdrop-blur-3xl flex flex-col relative z-20"
                        >
                            <div className="p-6 pb-4">
                                <div className="flex items-center gap-4 mb-8 group cursor-default">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse" />
                                        <div className="relative w-12 h-12 rounded-lg bg-gradient-to-br from-white/15 to-white/5 border border-white/20 flex items-center justify-center shadow-2xl backdrop-blur-md transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 group-hover:border-white/40 overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-transparent to-purple-500/10 rounded-lg" />
                                            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                                            <Sparkles className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <h1 className="text-xl font-display font-black tracking-tighter text-white leading-none">
                                            FOCO<span className="text-indigo-400">CORE</span>
                                        </h1>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[9px] text-slate-500 font-bold tracking-[0.2em] uppercase">Core OS v5.2</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Operational Core Link */}
                                <div className="mx-1 mb-6 p-4 rounded-none bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-between group/core cursor-default">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-none bg-indigo-500/20 flex items-center justify-center">
                                            <Brain className="w-4 h-4 text-indigo-400 group-hover/core:scale-110 transition-transform" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">Atlas Core</span>
                                            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Sincronizado</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <div className="w-1 h-3 bg-indigo-500/40 rounded-full animate-[bounce_1s_infinite_0ms]" />
                                        <div className="w-1 h-3 bg-indigo-500/40 rounded-full animate-[bounce_1s_infinite_200ms]" />
                                        <div className="w-1 h-3 bg-indigo-500/40 rounded-full animate-[bounce_1s_infinite_400ms]" />
                                    </div>
                                </div>

                                <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500/60 mb-4 px-1">
                                    Painel Operacional
                                </div>
                            </div>

                <div className="flex-1 px-4 overflow-y-auto custom-scrollbar">
                    <NavItem active={activeTab === 'ai_assistant'} label="Núcleo da Memória" onClick={() => setActiveTab('ai_assistant')} tabKey="ai_assistant" />
                    <NavItem active={activeTab === 'tasks'} label="Fluxo de Tarefas" onClick={() => setActiveTab('tasks')} tabKey="tasks" />
                    <NavItem active={activeTab === 'advanced_reports'} label="Relatórios Pro" onClick={() => setActiveTab('advanced_reports')} tabKey="advanced_reports" />
                    <NavItem active={activeTab === 'finances'} label="Centro Financeiro" onClick={() => setActiveTab('finances')} tabKey="finances" />
                    <NavItem active={activeTab === 'financial_goals'} label="Metas Financeiras" onClick={() => setActiveTab('financial_goals')} tabKey="financial_goals" />
                    <NavItem active={activeTab === 'links'} label="Links Rápidos" onClick={() => setActiveTab('links')} tabKey="links" />
                    <NavItem active={activeTab === 'reminders'} label="Lembretes" onClick={() => setActiveTab('reminders')} tabKey="reminders" />
                    <NavItem active={activeTab === 'notes'} label="Bloco de Notas" onClick={() => setActiveTab('notes')} tabKey="notes" />
                    
                    <div className="mt-8 mb-4 px-4 text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">
                        Sistema & Admin
                    </div>
                    
                    <NavItem active={activeTab === 'network_logs'} label="Logs de Rede" onClick={() => setActiveTab('network_logs')} tabKey="network_logs" />
                    <NavItem active={activeTab === 'core_diagnostic'} label="Diagnóstico" onClick={() => setActiveTab('core_diagnostic')} tabKey="core_diagnostic" />
                    <NavItem active={activeTab === 'database_admin'} label="Banco de Dados" onClick={() => setActiveTab('database_admin')} tabKey="database_admin" />
                </div>

                <div className="p-6 border-t border-white/5 bg-black/20 text-center">
                    <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                        <span>Status Sistema</span>
                        <span className="text-emerald-500 flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" /> Operando
                        </span>
                    </div>
                </div>
            </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            className="flex-1 flex flex-col relative z-10 overflow-hidden"
                        >
                {/* Modern Header */}
                <header className="h-20 border-b border-white/5 px-10 flex items-center justify-between bg-black/20 backdrop-blur-xl">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <h2 className="text-sm font-display font-medium text-white tracking-wide uppercase">
                                {activeTab.replace('_', ' ')}
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-slate-500 font-medium">ESTAÇÃO // QUANTUM-01</span>
                                <span className="text-[10px] text-slate-600">•</span>
                                <span className="text-[11px] font-mono text-slate-400 font-semibold">{timeStr}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-4 border-l border-white/10 pl-6 h-10">
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Integridade</span>
                                <span className="text-[11px] text-white font-semibold">Criptografada</span>
                            </div>
                            <Shield className="w-4 h-4 text-slate-400" />
                        </div>

                        <AudioVisualizer activeColor={activeTheme.primary} />

                        <button 
                            onClick={onClose} 
                            className="w-10 h-10 rounded-[14px] bg-white/5 border border-white/10 hover:bg-rose-500/10 hover:border-rose-500/40 hover:text-rose-500 flex items-center justify-center transition-all cursor-pointer text-slate-400"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                <main className="flex-1 relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={activeTab} 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                            className="absolute inset-0 overflow-hidden"
                        >
                            <div className="w-full h-full bg-slate-950/40 backdrop-blur-md rounded-none border border-white/5 shadow-2xl overflow-hidden relative group flex flex-col">
                                {/* Subtle internal border glow */}
                                <div 
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"
                                    style={{
                                        boxShadow: `inset 0 0 40px ${activeTheme.overlay}`
                                    }}
                                />
                                
                                <div className="flex-1 p-6 md:p-10 overflow-auto custom-scrollbar">
                                    {activeTab === 'ai_assistant' && <AIAssistant userId={userId} theme={activeTheme} />}
                                    {activeTab === 'finances' && (
                                        <FinanceDashboard 
                                            summary={financeSummary} 
                                            transactions={transactions} 
                                            onDeleteTransaction={(id) => setTransactions(prev => prev.filter(t => t.id !== id))}
                                            theme={activeTheme}
                                        />
                                    )}
                                    {activeTab === 'advanced_reports' && <AdvancedReports userId={userId} theme={activeTheme} />}
                                    {['tasks', 'financial_goals', 'links', 'reminders', 'notes', 'network_logs', 'core_diagnostic', 'database_admin'].includes(activeTab) && (
                                        <FocoFlowTabContent userId={userId} activeTab={activeTab} theme={activeTheme} />
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </main>
            </motion.div>
        </motion.div>
    </div>
)}
</AnimatePresence>

        {/* Global Alarm Modal - Active even when Dashboard is hidden */}
        <AnimatePresence>
            {alarmReminder && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl pointer-events-auto"
                >
                    <motion.div 
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="bg-[#0a0a0c] border-2 border-emerald-500/30 p-10 rounded-none shadow-[0_0_100px_rgba(16,185,129,0.1)] max-w-md w-full flex flex-col items-center text-center relative overflow-hidden"
                    >
                        <div className="absolute inset-0 opacity-5 pointer-events-none">
                            <div className="absolute inset-0 animate-pulse bg-emerald-500" />
                        </div>
                        
                        <div className="w-20 h-20 rounded-none bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-8 animate-bounce">
                            <Bell className="w-8 h-8 text-emerald-500" />
                        </div>

                        <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-emerald-500/60 mb-2">ALERTA OPERACIONAL</span>
                        <h3 className="text-2xl font-display font-bold text-white mb-4 tracking-tight uppercase leading-tight font-mono">{alarmReminder.title}</h3>
                        <p className="text-slate-400 text-[11px] mb-8 leading-relaxed font-medium uppercase tracking-wider">MARCO TEMPORAL ATINGIDO. O ATLAS REQUER PROCESSAMENTO DESTE LEMBRETE.</p>

                        <div className="flex flex-col gap-2 w-full">
                            <button 
                                onClick={() => setAlarmReminder(null)}
                                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-none transition-all cursor-pointer shadow-xl font-mono"
                            >
                                INTERROMPER ALERTA
                            </button>
                            <button 
                                onClick={() => {
                                    toggleReminderCompleted(alarmReminder.id);
                                    setAlarmReminder(null);
                                }}
                                className="w-full py-3 border border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-500/70 hover:text-emerald-500 font-bold uppercase tracking-[0.2em] text-[9px] rounded-none transition-all cursor-pointer font-mono"
                            >
                                MARCAR COMO CONCLUÍDO
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
        </>
    );
};


export default FocoFlowDashboard;
