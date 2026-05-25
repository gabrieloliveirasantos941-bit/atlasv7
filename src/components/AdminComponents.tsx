import React, { useState, useEffect } from 'react';
import { Shield, Cpu, Database, Save } from 'lucide-react';

interface ThemeProps {
    theme: {
        primary: string;
        primaryRgb: string;
        glow: string;
        overlay: string;
    }
}

export const NetworkLogsView = ({ theme }: ThemeProps) => {
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        const handleUpdate = (e: any) => {
            const key = e.detail?.key?.replace('focoflow_', '') || 'system';
            const log = `[${new Date().toLocaleTimeString()}] UPDATE: ${key.toUpperCase()} sincronizado via LocalStore`;
            setLogs(prev => [log, ...prev.slice(0, 15)]);
        };
        window.addEventListener('focoflow_data_updated', handleUpdate as any);
        return () => window.removeEventListener('focoflow_data_updated', handleUpdate as any);
    }, []);

    return (
        <div className="h-full w-full p-8 border border-white/5 bg-black/40 rounded-3xl flex flex-col gap-6 shadow-2xl backdrop-blur-md">
            <h2 className="text-sm font-bold text-white uppercase tracking-[0.3em] flex items-center gap-4">
                <Shield className="w-5 h-5" style={{ color: theme.primary }} /> Logs de Fluxo
            </h2>
            <div className="flex-1 overflow-auto bg-black/60 rounded-2xl border border-white/5 p-6 font-mono text-[11px] flex flex-col gap-3 custom-scrollbar shadow-inner">
                {logs.length === 0 ? (
                    <p className="text-white/20 italic">Aguardando telemetria operacional...</p>
                ) : (
                    logs.map((log, i) => (
                        <p key={i} className="leading-relaxed" style={{ color: i === 0 ? theme.primary : 'rgba(255,255,255,0.4)' }}>
                            <span className="text-white/20 mr-2">&gt;</span> {log}
                        </p>
                    ))
                )}
            </div>
        </div>
    );
};

export const CoreDiagnosticView = ({ theme }: ThemeProps) => {
    const [cpu] = useState(1.2);
    const [ram] = useState(14.5);

    return (
        <div className="h-full w-full p-8 border border-white/5 bg-black/40 rounded-3xl flex flex-col gap-8 shadow-2xl backdrop-blur-md">
            <h2 className="text-sm font-bold text-white uppercase tracking-[0.3em] flex items-center gap-4">
                <Cpu className="w-5 h-5" style={{ color: theme.primary }} /> Diagnóstico Sistema
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-10 bg-black/40 rounded-2xl border border-white/5 relative overflow-hidden group">
                    <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity"
                        style={{ backgroundColor: theme.primary }}
                    />
                    <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold mb-6">Uso de CPU</p>
                    <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                        <div 
                           className="h-full transition-all duration-1000" 
                           style={{ width: `${cpu}%`, backgroundColor: theme.primary, boxShadow: `0 0 10px ${theme.glow}` }}
                        />
                    </div>
                    <p className="text-2xl text-white font-bold mt-6 font-mono tracking-tighter">{cpu}%</p>
                </div>
                <div className="p-10 bg-black/40 rounded-2xl border border-white/5 relative overflow-hidden group">
                    <div 
                         className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity"
                         style={{ backgroundColor: theme.primary }}
                    />
                    <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold mb-6">Uso de RAM</p>
                    <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                        <div 
                           className="h-full opacity-60 transition-all duration-1000" 
                           style={{ width: `${ram}%`, backgroundColor: theme.primary }}
                        />
                    </div>
                    <p className="text-2xl text-white font-bold mt-6 font-mono tracking-tighter">{ram}%</p>
                </div>
            </div>
        </div>
    );
};

export const DatabaseAdminView = ({ theme }: ThemeProps) => {
    const [storage, setStorage] = useState(0);

    useEffect(() => {
        const calculateStorage = () => {
             let total = 0;
             for (let i = 0; i < localStorage.length; i++) {
                 const key = localStorage.key(i);
                 if (key && key.startsWith('focoflow_')) {
                     total += (localStorage.getItem(key)?.length || 0);
                 }
             }
             setStorage(Math.round(total / 1024)); // KB
        };
        calculateStorage();
        window.addEventListener('focoflow_data_updated', calculateStorage);
        return () => window.removeEventListener('focoflow_data_updated', calculateStorage);
    }, []);

    return (
        <div className="h-full w-full p-8 border border-white/5 bg-black/40 rounded-3xl flex flex-col gap-8 shadow-2xl backdrop-blur-md">
            <h2 className="text-sm font-bold text-white uppercase tracking-[0.3em] flex items-center gap-4">
                <Database className="w-5 h-5" style={{ color: theme.primary }} /> Gestão de Dados
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold mb-4">Exportação Operacional</p>
                    <button 
                        onClick={() => { alert('Exportação de dados iniciada.'); }}
                        className="w-full flex items-center justify-center gap-3 px-8 py-3.5 text-black font-bold text-[11px] uppercase tracking-widest rounded-2xl cursor-pointer hover:opacity-90 transition-all shadow-xl"
                        style={{ backgroundColor: theme.primary }}
                    >
                        <Save className="w-4 h-4" /> Exportar Dados Local
                    </button>
                </div>
                
                <div className="p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Nodos de Memória (Cloud)</span>
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                        </div>
                        <p className="text-xs text-white/40 leading-relaxed mb-4">Sincronização bidirecional ativa com o Core OS. Atlas pode ler e escrever estados operacionais.</p>
                    </div>
                    <div className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-sm bg-indigo-500/40" /> Status: Operando
                    </div>
                </div>
            </div>
            
            <div className="flex flex-col gap-4 mt-auto">
                <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-white/20">
                    <span>Espaço de Armazenamento Local</span>
                    <span className="text-white/60">{storage} KB / 5 MB</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div 
                       className="h-full opacity-40 shadow-[0_0_10px_rgba(255,255,255,0.1)]" 
                       style={{ width: `${(storage/5120)*100}%`, backgroundColor: theme.primary }}
                    />
                </div>
            </div>
        </div>
    );
};
