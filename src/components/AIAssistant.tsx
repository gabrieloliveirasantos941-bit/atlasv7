import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Loader2, Database, Brain, Save, History, X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface AIAssistantProps {
    userId: string;
}

interface ThemeProps {
    theme: {
        primary: string;
        primaryRgb: string;
        glow: string;
        overlay: string;
    }
}

interface Memory {
    id: string;
    content: string;
    category: string;
    createdAt: string;
}

export const AIAssistant: React.FC<AIAssistantProps & ThemeProps> = ({ userId, theme }) => {
    const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showMemories, setShowMemories] = useState(false);
    const [memories, setMemories] = useState<Memory[]>([]);
    const [isFetchingMemories, setIsFetchingMemories] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const fetchMemories = async () => {
        setIsFetchingMemories(true);
        try {
            const q = query(
                collection(db, 'memories'),
                where('userId', '==', userId),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            const fetched = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Memory));
            setMemories(fetched);
        } catch (error) {
            console.error('Error fetching memories:', error);
        } finally {
            setIsFetchingMemories(false);
        }
    };

    const handleDeleteMemory = async (id: string) => {
        if (!confirm('Deletar este nodo de memória permanentemente?')) return;
        try {
            await deleteDoc(doc(db, 'memories', id));
            setMemories(prev => prev.filter(m => m.id !== id));
        } catch (error) {
            console.error('Error deleting memory:', error);
        }
    };

    useEffect(() => {
        if (showMemories) {
            fetchMemories();
        }
    }, [showMemories]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, {role: 'user', content: userMessage}]);
        setIsLoading(true);

        try {
            const response = await fetch('/api/memory/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage, userId }),
            });
            const data = await response.json();
            
            if (data.memorySaved) {
                setIsSaving(true);
                setTimeout(() => setIsSaving(false), 3000);
            }

            setMessages(prev => [...prev, {role: 'assistant', content: data.reply}]);
        } catch (error) {
            console.error('Error:', error);
            setMessages(prev => [...prev, {role: 'assistant', content: 'ERRO CRÍTICO: FALHA NA SINCRONIZAÇÃO COM O NÚCLEO DA MEMÓRIA.'}]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-black/40 backdrop-blur-xl font-sans relative overflow-hidden">
            {/* Header / Status */}
            <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500/20 blur-lg rounded-full animate-pulse" />
                        <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center">
                            <Brain className="w-5 h-5 text-indigo-400" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white tracking-widest uppercase">Núcleo da Memória</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Sincronizado via Firebase/Core</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <AnimatePresence>
                        {isSaving && (
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg"
                            >
                                <Save className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Memória Sincronizada</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <button 
                        onClick={() => setShowMemories(!showMemories)}
                        className={`p-2 rounded-lg transition-all cursor-pointer ${showMemories ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-white/5 text-slate-500'}`} 
                        title="Ver Memórias Salvas"
                    >
                        <Database className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-white/5 text-slate-500 transition-all cursor-pointer" title="Histórico Operacional">
                        <History className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex-1 relative overflow-hidden">
                <div 
                    ref={scrollRef}
                    className="h-full overflow-y-auto p-8 flex flex-col gap-6 custom-scrollbar pr-4"
                >
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-6">
                            <div className="w-24 h-24 rounded-[32px] border border-white/10 bg-white/[0.02] flex items-center justify-center relative group">
                                <div className="absolute inset-0 bg-indigo-500/5 blur-2xl group-hover:bg-indigo-500/10 transition-all" />
                                <Brain className="w-12 h-12 opacity-20 group-hover:opacity-40 transition-all duration-700" style={{ color: theme.primary }} />
                            </div>
                            <div className="text-center">
                                <span className="text-[10px] uppercase font-black tracking-[0.5em] text-indigo-400/60 block mb-2">Sistema Onisciente Ativo</span>
                                <p className="text-xs text-slate-500 max-w-[200px] leading-relaxed mx-auto">Pronto para aprender e gerenciar informações críticas do seu ecossistema.</p>
                            </div>
                        </div>
                    )}
                    
                    {messages.map((m, i) => (
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            key={i} 
                            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[85%] px-7 py-5 rounded-[28px] text-[13px] leading-relaxed shadow-2xl relative group
                                ${m.role === 'user' 
                                    ? 'text-black font-semibold' 
                                    : 'bg-slate-900 border border-white/5 text-slate-300'}`}
                                 style={m.role === 'user' ? { backgroundColor: theme.primary } : {}}
                            >
                                {m.role === 'assistant' && (
                                    <div className="absolute -top-3 -left-1 px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-[8px] font-black text-indigo-400 tracking-widest uppercase">
                                        CORE_EYE
                                    </div>
                                )}
                                <p className="whitespace-pre-wrap">{m.content}</p>
                            </div>
                        </motion.div>
                    ))}
                    
                    {isLoading && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-start"
                        >
                            <div className="bg-slate-900/50 border border-white/5 p-6 rounded-[28px] flex items-center gap-3">
                                <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                                <span className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">Processando Memória...</span>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Memory Overlay View */}
                <AnimatePresence>
                    {showMemories && (
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            className="absolute inset-0 bg-slate-950/95 z-50 flex flex-col"
                        >
                            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/40">
                                <div className="flex items-center gap-3 text-indigo-400 font-bold uppercase tracking-widest text-xs">
                                    <Database className="w-4 h-4" />
                                    Nodos Memorizados
                                </div>
                                <button 
                                    onClick={() => setShowMemories(false)}
                                    className="p-2 hover:bg-white/10 rounded-xl transition-all cursor-pointer text-slate-500"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col gap-4">
                                {isFetchingMemories ? (
                                    <div className="flex-1 flex items-center justify-center flex-col gap-4">
                                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                                        <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Sincronizando Banco...</span>
                                    </div>
                                ) : memories.length === 0 ? (
                                    <div className="flex-1 flex items-center justify-center flex-col gap-4 opacity-30">
                                        <Database className="w-12 h-12" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Nenhuma memória salva.</span>
                                    </div>
                                ) : (
                                    memories.map((m) => (
                                        <div key={m.id} className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-indigo-500/30 transition-all">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-md text-[8px] font-black text-indigo-400 uppercase tracking-widest">
                                                    {m.category || 'Geral'}
                                                </span>
                                                <button 
                                                    onClick={() => handleDeleteMemory(m.id)}
                                                    className="p-1.5 opacity-0 group-hover:opacity-100 hover:text-rose-500 transition-all cursor-pointer"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <p className="text-sm text-slate-400 leading-relaxed">{m.content}</p>
                                            <div className="mt-3 text-[9px] text-slate-700 font-bold italic">
                                                {new Date(m.createdAt).toLocaleString('pt-BR')}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            <div className="p-8 bg-gradient-to-t from-black/60 to-transparent">
                <div className="relative group">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-3xl px-8 py-5 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all font-medium placeholder:text-slate-700 shadow-2xl"
                        placeholder="Ensine algo novo ou consulte o núcleo..."
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="absolute right-3 top-3 w-12 h-12 text-black rounded-2xl flex items-center justify-center disabled:opacity-20 transition-all overflow-hidden cursor-pointer group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                        style={{ backgroundColor: theme.primary }}
                    >
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Send className="w-5 h-5 ml-1 relative z-10" />
                    </button>
                </div>
                <div className="mt-4 flex items-center justify-center gap-6">
                    <div className="flex items-center gap-2 cursor-pointer group">
                        <Save className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest group-hover:text-slate-400 transition-colors">Salvar Estado</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-slate-800" />
                    <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setShowMemories(true)}>
                        <Database className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest group-hover:text-slate-400 transition-colors">Nodos Memória</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
