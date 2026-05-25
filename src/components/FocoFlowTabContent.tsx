/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  Check, 
  Trash2, 
  AlertTriangle, 
  ExternalLink, 
  Clock, 
  BookOpen, 
  PlusCircle, 
  DollarSign, 
  Bookmark,
  Bell,
  Calendar,
  Layers,
  Edit2,
  Save,
  Search,
  CheckCircle2,
  FileText,
  Cpu
} from 'lucide-react';
import { 
  getFocoFlowData,
  addTask,
  toggleTaskCompleted,
  addFocusTime,
  deleteTask,
  addFinancialGoal,
  updateGoalContribution,
  deleteGoal,
  addQuickLink,
  trackLinkClick,
  deleteLink,
  addReminder,
  toggleReminderCompleted,
  deleteReminder,
  addNote,
  updateNote,
  deleteNote,
  Task,
  FinancialGoal,
  QuickLink,
  Reminder,
  Note
} from '../services/focoFlowService';
import { NetworkLogsView, CoreDiagnosticView, DatabaseAdminView } from './AdminComponents';

interface FocoFlowTabContentProps {
  userId: string;
  activeTab: string;
  theme: {
    primary: string;
    primaryRgb: string;
    glow: string;
    overlay: string;
  };
}

export const FocoFlowTabContent: React.FC<FocoFlowTabContentProps> = ({ userId, activeTab, theme }) => {
  // Common states
  const [loading, setLoading] = useState(true);
  const [updater, setUpdater] = useState(0);

  // Lists
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [links, setLinks] = useState<QuickLink[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  // Task Creation Form State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState('PRODUTIVIDADE');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // Goals Form State
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [contributionAmount, setContributionAmount] = useState<{ [key: string]: string }>({});

  // Links Form State
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkCategory, setLinkCategory] = useState('PRODUTIVIDADE');

  // Reminder Form State
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');

  // Notes Form/Editing State
  const [searchNoteQuery, setSearchNoteQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [noteEditTitle, setNoteEditTitle] = useState('');
  const [noteEditContent, setNoteEditContent] = useState('');
  const [isEditingNote, setIsEditingNote] = useState(false);

  // Focus Timer States (Pomodoro for Tasks)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [timerPreset, setTimerPreset] = useState<number>(25); // minutes
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(1500); // 25 mins
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch data depending on activeTab
  useEffect(() => {
    setLoading(true);
    getFocoFlowData(userId, activeTab).then(data => {
      if (activeTab === 'tasks') setTasks(data as Task[]);
      else if (activeTab === 'financial_goals') setGoals(data as FinancialGoal[]);
      else if (activeTab === 'links') setLinks(data as QuickLink[]);
      else if (activeTab === 'important_reminders' || activeTab === 'reminders') setReminders(data as Reminder[]);
      else if (activeTab === 'notes') {
        const notesList = data as Note[];
        setNotes(notesList);
        if (notesList.length > 0 && !selectedNote) {
          setSelectedNote(notesList[0]);
          setNoteEditTitle(notesList[0].title);
          setNoteEditContent(notesList[0].content);
        }
      }
      setLoading(false);
    });
  }, [userId, activeTab, updater]);

  // Handle data updates from window events triggered by service
  useEffect(() => {
    const handleUpdate = (e: any) => {
      setUpdater(prev => prev + 1);
    };
    window.addEventListener('focoflow_data_updated', handleUpdate);
    return () => window.removeEventListener('focoflow_data_updated', handleUpdate);
  }, []);

  // Timer Core logic
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsTimerRunning(false);
            // Add focus time to the task if one is selected!
            if (selectedTaskId) {
              addFocusTime(selectedTaskId, timerPreset);
              alert('Parabéns! Sessão de foco concluída e registrada.');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, selectedTaskId, timerPreset]);

  const handleSelectTaskForTimer = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsTimerRunning(false);
    setTimerSecondsLeft(timerPreset * 60);
  };

  const incrementTimerByMinutes = (mins: number) => {
    setTimerPreset(mins);
    setTimerSecondsLeft(mins * 60);
    setIsTimerRunning(false);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Submit Handlers
  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    addTask(taskTitle, taskCategory, taskPriority);
    setTaskTitle('');
  };

  const handleAddGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim() || !goalTarget) return;
    addFinancialGoal(
      goalTitle,
      parseFloat(goalTarget),
      parseFloat(goalCurrent) || 0,
      goalDeadline || new Date(Date.now() + 30 * 24 * 3600000).toISOString().split('T')[0]
    );
    alert('Meta operacional inaugurada com sucesso!');
    setGoalTitle('');
    setGoalTarget('');
    setGoalCurrent('');
    setGoalDeadline('');
  };

  const handleAddLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkTitle.trim() || !linkUrl.trim()) return;
    addQuickLink(linkTitle, linkUrl, linkCategory);
    setLinkTitle('');
    setLinkUrl('');
  };

  const handleAddReminderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderTitle.trim() || !reminderDate) return;
    const isImportant = activeTab === 'important_reminders';
    const datetimeStr = `${reminderDate}T${reminderTime || '09:00'}:00`;
    addReminder(reminderTitle, datetimeStr, isImportant);
    setReminderTitle('');
    setReminderDate('');
    setReminderTime('');
  };

  const handleNoteSelect = (n: Note) => {
    setSelectedNote(n);
    setNoteEditTitle(n.title);
    setNoteEditContent(n.content);
    setIsEditingNote(false);
  };

  const handleSaveNote = () => {
    if (!selectedNote) return;
    updateNote(selectedNote.id, noteEditTitle, noteEditContent);
    const updated = { ...selectedNote, title: noteEditTitle, content: noteEditContent, updatedAt: new Date().toISOString() };
    setSelectedNote(updated);
    setIsEditingNote(false);
  };

  const handleCreateNote = () => {
    const newN = addNote('Nova Anotação', 'Escreva algo aqui...');
    setSelectedNote(newN);
    setNoteEditTitle(newN.title);
    setNoteEditContent(newN.content);
    setIsEditingNote(true);
  };

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-slate-500 text-xs tracking-widest font-sans">
        <Clock className="w-8 h-8 animate-spin mb-3 text-white/20" />
        <span className="opacity-50">SINCRONIZANDO FLUXO // {activeTab?.toUpperCase()}</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden text-sm">
      
      {/* 1. TASKS VIEW */}
      {activeTab === 'tasks' && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Interactive Task List and Adding Form */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            
            {/* Quick Add Form */}
            <form onSubmit={handleAddTaskSubmit} className="p-6 border border-white/5 bg-white/[0.03] backdrop-blur-md rounded-2xl flex flex-col md:flex-row gap-4 items-end shadow-xl relative overflow-hidden group">
              <div 
                className="absolute inset-0 opacity-10 pointer-events-none group-focus-within:opacity-20 transition-opacity"
                style={{ background: `radial-gradient(circle at top right, ${theme.primary}, transparent)` }}
              />
              <div className="flex-1 flex flex-col gap-2 w-full relative z-10">
                <span className="text-[10px] uppercase text-white/40 tracking-widest font-bold">Adicionar Tarefa</span>
                <input 
                  type="text"
                  placeholder="Defina a próxima meta operacional..."
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-white/10 bg-black/40 text-sm text-white rounded-xl focus:outline-none transition-all font-medium"
                  style={{ borderColor: taskTitle ? theme.primary + '40' : undefined }}
                />
              </div>

              <div className="w-full md:w-40 flex flex-col gap-2 relative z-10">
                <span className="text-[10px] uppercase text-white/40 tracking-widest font-bold">Categoria</span>
                <select 
                  value={taskCategory}
                  onChange={e => setTaskCategory(e.target.value)}
                  className="w-full px-3 py-2.5 border border-white/10 bg-slate-900 text-xs text-slate-300 rounded-xl"
                >
                  <option value="PRODUTIVIDADE">PRODUTIVIDADE</option>
                  <option value="DESENVOLVIMENTO">DEV_CODE</option>
                  <option value="SEGURANÇA">SEGURANÇA</option>
                  <option value="FINANÇAS">FINANÇAS</option>
                  <option value="CONFIG">DIRETIVAS</option>
                </select>
              </div>

              <button 
                type="submit"
                className="px-6 py-2.5 bg-white text-black hover:bg-slate-200 font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all h-11 shrink-0 flex items-center justify-center shadow-lg relative z-10"
                style={{ backgroundColor: theme.primary, color: '#000000' }}
              >
                <Plus className="w-4 h-4 mr-1.5" /> Adicionar
              </button>
            </form>

            {/* Task list core */}
            <div className="flex-1 border border-white/5 bg-black/40 rounded-2xl overflow-hidden flex flex-col backdrop-blur-md">
              <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center shrink-0">
                <span className="text-[11px] tracking-widest font-bold text-slate-400">FLUXO DE ATIVIDADES</span>
                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{tasks.length} TAREFAS</span>
              </div>

              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3 custom-scrollbar">
                {tasks.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-12 text-slate-600">
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/5 flex items-center justify-center mb-4">
                        <Check className="w-8 h-8 opacity-20" />
                    </div>
                    <span className="text-[11px] uppercase tracking-widest font-bold">Fluxo Vazio // Pronto para Iniciar</span>
                  </div>
                ) : (
                  tasks.map(t => (
                    <div 
                      key={t.id} 
                      onClick={() => handleSelectTaskForTimer(t.id)}
                      className={`p-4 border rounded-2xl transition-all flex items-center justify-between cursor-pointer group
                        ${selectedTaskId === t.id ? 'bg-white/10 shadow-xl' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'}
                      `}
                      style={{ borderColor: selectedTaskId === t.id ? theme.primary : undefined }}
                    >
                      <div className="flex items-center gap-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTaskCompleted(t.id);
                          }}
                          className={`w-5 h-5 border rounded-lg flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-inner
                            ${t.completed ? 'bg-emerald-500 border-emerald-500' : 'border-white/20 bg-black/40 hover:border-white/40'}
                          `}
                          style={{ backgroundColor: t.completed ? theme.primary : undefined, borderColor: t.completed ? theme.primary : undefined }}
                        >
                          {t.completed && <Check className="w-3.5 h-3.5 text-black" />}
                        </button>

                        <div className="flex flex-col">
                          <span className={`text-[13px] font-semibold tracking-tight leading-snug ${t.completed ? 'line-through text-slate-500' : 'text-white'}`}>
                            {t.title}
                          </span>
                          
                          <div className="flex items-center gap-3 mt-2 text-[10px] font-bold tracking-widest text-white/40 uppercase">
                            <span className="opacity-60" style={{ color: theme.primary }}>
                              {t.category}
                            </span>
                            <span className="opacity-30">•</span>
                            <span className={`${t.priority === 'high' ? 'text-rose-500' : t.priority === 'medium' ? 'text-amber-500' : 'text-slate-500'}`}>
                              {t.priority}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTask(t.id);
                          setTasks(prev => prev.filter(item => item.id !== t.id));
                          setUpdater(prev => prev + 1);
                          if (selectedTaskId === t.id) setSelectedTaskId(null);
                        }}
                        className="p-2 rounded-xl border border-transparent hover:border-rose-500/20 hover:bg-rose-500/10 text-slate-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right: Pomodoro Clock timer and task focus summary */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="border bg-black/60 backdrop-blur-md rounded-2xl p-8 flex flex-col items-center justify-center text-center flex-1 shadow-2xl relative overflow-hidden"
                 style={{ borderColor: theme.primary + '20' }}>
              
              <div 
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ background: `radial-gradient(circle at center, ${theme.primary}20, transparent)` }}
              />

              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 mb-1 relative z-10">PROGRAMA DE SESSÃO FOCO</span>
              
              {selectedTaskId ? (
                <div className="text-[11px] font-bold tracking-widest text-white border-b border-white/5 pb-4 w-full text-center relative z-10 mb-6 uppercase">
                  foco ativo: <span style={{ color: theme.primary }}>{tasks.find(t => t.id === selectedTaskId)?.title || 'Processo'}</span>
                </div>
              ) : (
                <div className="text-[10px] text-slate-500 tracking-widest text-center border-b border-white/5 pb-4 w-full relative z-10 mb-6 uppercase font-bold">
                  SELECIONE UMA TAREFA NO LADO ESQUERDO PARA SE CONCENTRAR
                </div>
              )}

              {/* Big Neon Clock Face representation */}
              <div className="relative my-8 w-56 h-56 rounded-full border border-white/5 flex items-center justify-center shadow-inner relative z-10">
                <div 
                    className="absolute inset-2 rounded-full border border-dashed animate-[spin_60s_linear_infinite]" 
                    style={{ borderColor: theme.primary + '40' }}
                />
                {isTimerRunning && (
                  <div className="absolute inset-0 rounded-full border-2 border-transparent animate-spin duration-1000" 
                       style={{ borderTopColor: theme.primary }}
                  />
                )}
                <div className="flex flex-col items-center">
                  <span className="text-5xl font-bold tracking-[0.05em] text-white font-mono"
                        style={{ textShadow: `0 0 20px ${theme.primary}40` }}>
                    {formatTime(timerSecondsLeft)}
                  </span>
                  <span className="text-[9px] uppercase font-bold tracking-[0.4em] text-white/20 mt-3">Quantum Timer</span>
                </div>
              </div>

              {/* Presets Grid */}
              <div className="grid grid-cols-4 gap-3 w-full mb-8 max-w-sm relative z-10">
                {[10, 25, 40, 60].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => incrementTimerByMinutes(mins)}
                    className={`py-2 rounded-xl text-[11px] font-bold uppercase border transition-all cursor-pointer
                      ${timerPreset === mins ? 'text-black' : 'border-white/5 bg-black/40 text-white/40 hover:text-white'}
                    `}
                    style={{ backgroundColor: timerPreset === mins ? theme.primary : undefined, borderColor: timerPreset === mins ? theme.primary : undefined }}
                  >
                    {mins}m
                  </button>
                ))}
              </div>

              {/* Timer controls */}
              <div className="flex gap-4 items-center justify-center w-full max-w-sm relative z-10">
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`flex-1 py-4 border rounded-[14px] font-bold text-xs uppercase tracking-[0.2em] transition-all cursor-pointer flex items-center justify-center gap-3 h-[40.6667px]
                    ${isTimerRunning 
                      ? 'border-white/10 bg-white/5 text-white hover:bg-white/10' 
                      : 'text-black'
                    }
                  `}
                  style={{ backgroundColor: !isTimerRunning ? theme.primary : undefined, borderColor: !isTimerRunning ? theme.primary : undefined }}
                >
                  {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isTimerRunning ? 'Pausar' : 'Iniciar'}
                </button>

                <button
                  onClick={() => {
                    setIsTimerRunning(false);
                    setTimerSecondsLeft(timerPreset * 60);
                  }}
                  className="px-5 py-4 border border-white/5 bg-black/40 hover:bg-white/5 text-white/40 hover:text-white rounded-[14px] transition-all cursor-pointer flex items-center justify-center h-[40.6667px]"
                  title="Reiniciar Cronômetro"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. FINANCIAL GOALS VIEW */}
      {activeTab === 'financial_goals' && (
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-8 overflow-hidden">
          {/* Left Panel: Adding Goals */}
          <div className="xl:col-span-5 flex flex-col gap-6 justify-start">
            <span className="text-[11px] font-bold tracking-[0.3em] text-white/40 uppercase flex items-center gap-3 border-b border-white/5 pb-4">
              <PlusCircle className="w-4 h-4" /> CRIAR NOVA META
            </span>

            <form onSubmit={handleAddGoalSubmit} className="p-8 border border-white/5 bg-white/[0.03] backdrop-blur-md rounded-2xl flex flex-col gap-6 shadow-xl relative overflow-hidden group">
              <div 
                className="absolute inset-0 opacity-10 pointer-events-none group-focus-within:opacity-20 transition-opacity"
                style={{ background: `radial-gradient(circle at bottom left, ${theme.primary}, transparent)` }}
              />
              <div className="flex flex-col gap-2 relative z-10">
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/30">Meta ou Sonho</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex. Servidor de Backup"
                  value={goalTitle}
                  onChange={e => setGoalTitle(e.target.value)}
                  className="px-4 py-2.5 border border-white/10 bg-black/40 text-sm text-white rounded-xl focus:outline-none transition-all font-medium"
                  style={{ borderColor: goalTitle ? theme.primary + '40' : undefined }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 relative z-10">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/30">Valor Alvo (R$)</label>
                  <input 
                    type="number" 
                    required
                    placeholder="5000.00"
                    value={goalTarget}
                    onChange={e => setGoalTarget(e.target.value)}
                    className="px-4 py-2.5 border border-white/10 bg-black/40 text-sm text-white rounded-xl focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/30">Valor Atual (R$)</label>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    value={goalCurrent}
                    onChange={e => setGoalCurrent(e.target.value)}
                    className="px-4 py-2.5 border border-white/10 bg-black/40 text-sm text-white rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 relative z-10">
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/30">Prazo Estimado</label>
                <input 
                  type="date" 
                  value={goalDeadline}
                  onChange={e => setGoalDeadline(e.target.value)}
                  className="px-4 py-2.5 border border-white/10 bg-black/40 text-sm text-white rounded-xl focus:outline-none"
                />
              </div>

              <button 
                type="submit"
                className="w-full mt-4 py-4 text-black hover:bg-slate-200 font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all shadow-lg cursor-pointer relative z-10"
                style={{ backgroundColor: theme.primary }}
              >
                Inaugurar Meta Operacional
              </button>
            </form>
          </div>

          {/* Right Panel: Track and edit goals */}
          <div className="xl:col-span-7 flex flex-col gap-6 overflow-hidden">
            <span className="text-[11px] font-bold tracking-[0.3em] text-white/40 uppercase border-b border-white/5 pb-4 flex justify-between items-center">
              <span>CONTROLE DE METAS</span>
              <span className="text-white/20 font-bold uppercase text-[9px]">{goals.length} METAS</span>
            </span>

            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-5 custom-scrollbar">
              {goals.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-12 text-slate-600 border border-white/5 border-dashed rounded-3xl">
                  <DollarSign className="w-12 h-12 mb-4 opacity-20" />
                  <span className="text-[11px] uppercase font-bold tracking-widest">Nenhuma meta ativa</span>
                </div>
              ) : (
                goals.map(g => {
                  const pct = Math.min(100, Math.floor((g.currentAmount / g.targetAmount) * 100));
                  return (
                    <div key={g.id} className="p-6 border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl relative group transition-all">
                      
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white">{g.title}</span>
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-1.5 font-semibold">PRAZO: {g.deadline.split('-').reverse().join('/')}</span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 border border-white/10 text-[10px] text-white/60 font-bold rounded-lg bg-black/40">
                            {pct}%
                          </span>
                          <button
                            onClick={() => {
                              deleteGoal(g.id);
                              setGoals(prev => prev.filter(item => item.id !== g.id));
                              setUpdater(prev => prev + 1);
                            }}
                            className="p-2 rounded-xl hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 text-slate-600 hover:text-rose-400 cursor-pointer transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Cool High-tech Progress Line */}
                      <div className="h-6 border border-white/5 bg-black/40 rounded-xl overflow-hidden p-1 relative mb-5">
                        <div 
                          className="h-full rounded-lg relative transition-all duration-1000" 
                          style={{ width: `${pct}%`, backgroundColor: theme.primary, boxShadow: `0 0 15px ${theme.glow}` }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white uppercase tracking-[0.2em] pointer-events-none bg-black/10">
                          R$ {g.currentAmount.toLocaleString()} / R$ {g.targetAmount.toLocaleString()}
                        </span>
                      </div>

                      {/* Contribution Quick Interface */}
                      <div className="flex gap-3 items-center justify-end bg-black/30 p-3 border border-white/5 rounded-xl">
                        <span className="text-[10px] font-bold text-white/30 uppercase mr-auto pl-2 tracking-widest">Ajuste de Saldo (R$)</span>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={contributionAmount[g.id] || ''}
                          onChange={e => setContributionAmount(prev => ({ ...prev, [g.id]: e.target.value }))}
                          className="w-20 px-3 py-2 text-[12px] border border-white/10 bg-black/40 text-white rounded-lg focus:outline-none"
                        />
                        <button
                          onClick={() => {
                            const val = parseFloat(contributionAmount[g.id] || '');
                            if (!val || isNaN(val)) return;
                            updateGoalContribution(g.id, val);
                            setContributionAmount(prev => ({ ...prev, [g.id]: '' }));
                          }}
                          className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 font-bold text-[10px] uppercase tracking-widest rounded-lg cursor-pointer transition-all"
                        >
                          Soma
                        </button>
                        <button
                          onClick={() => {
                            const val = parseFloat(contributionAmount[g.id] || '');
                            if (!val || isNaN(val)) return;
                            updateGoalContribution(g.id, -val);
                            setContributionAmount(prev => ({ ...prev, [g.id]: '' }));
                          }}
                          className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 font-bold text-[10px] uppercase tracking-widest rounded-lg cursor-pointer transition-all"
                        >
                          Sub
                        </button>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. QUICK LINKS VIEW */}
      {activeTab === 'links' && (
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-8 overflow-hidden">
          {/* Left panel to add Links */}
          <div className="xl:col-span-5 flex flex-col gap-6">
            <span className="text-[11px] font-bold tracking-[0.3em] text-white/40 uppercase flex items-center gap-3 border-b border-white/5 pb-4">
              <Bookmark className="w-4 h-4" /> ADICIONAR ATALHO
            </span>

            <form onSubmit={handleAddLinkSubmit} className="p-8 border border-white/5 bg-white/[0.03] rounded-2xl flex flex-col gap-6 shadow-xl relative overflow-hidden group">
              <div 
                className="absolute inset-0 opacity-10 pointer-events-none group-focus-within:opacity-20 transition-opacity"
                style={{ background: `radial-gradient(circle at top right, ${theme.primary}, transparent)` }}
              />
              <div className="flex flex-col gap-2 relative z-10">
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/30">Título</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex. Repositório Principal"
                  value={linkTitle}
                  onChange={e => setLinkTitle(e.target.value)}
                  className="px-4 py-2.5 border border-white/10 bg-black/40 text-sm text-white rounded-xl focus:outline-none transition-all font-medium"
                  style={{ borderColor: linkTitle ? theme.primary + '40' : undefined }}
                />
              </div>

              <div className="flex flex-col gap-2 relative z-10">
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/30">URL</label>
                <input 
                  type="text" 
                  required
                  placeholder="https://..."
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  className="px-4 py-2.5 border border-white/10 bg-black/40 text-sm text-white rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-2 relative z-10">
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/30">Categoria</label>
                <select 
                  value={linkCategory}
                  onChange={e => setLinkCategory(e.target.value)}
                  className="px-3 py-2.5 border border-white/10 bg-slate-900 border-white/10 text-xs text-slate-300 rounded-xl"
                >
                  <option value="CÓDIGO">CÓDIGO / REPOS</option>
                  <option value="FERRAMENTAS">PROCESSOS / TOOLS</option>
                  <option value="INFRA">INFRA / CLOUD</option>
                  <option value="DESIGN">ESTÉTICA / DESIGN</option>
                  <option value="GERAL">OUTROS</option>
                </select>
              </div>

              <button 
                type="submit"
                className="w-full mt-4 py-4 text-black hover:bg-slate-200 font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all shadow-lg relative z-10"
                style={{ backgroundColor: theme.primary }}
              >
                Mapear Acesso Rápido
              </button>
            </form>
          </div>

          {/* Right Panel: Bookmark Grid */}
          <div className="xl:col-span-7 flex flex-col gap-6 overflow-hidden">
            <span className="text-[11px] font-bold tracking-[0.3em] text-white/40 uppercase border-b border-white/5 pb-4 flex justify-between items-center">
              <span>DIRETÓRIO DE ATALHOS</span>
              <span className="text-white/20 text-[9px] tracking-widest">{links.length} LINKS</span>
            </span>

            <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-5 auto-rows-max custom-scrollbar pr-1 pb-4">
              {links.length === 0 ? (
                <div className="col-span-full h-full flex flex-col items-center justify-center p-12 text-slate-600 border border-white/5 border-dashed rounded-3xl">
                  <ExternalLink className="w-12 h-12 mb-4 opacity-20" />
                  <span className="text-[11px] uppercase font-bold tracking-widest">Nenhum mapa registrado</span>
                </div>
              ) : (
                links.map(l => (
                  <div key={l.id} className="p-5 border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl flex flex-col justify-between group transition-all relative overflow-hidden">
                    <div className="flex flex-col mb-4">
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <span className="px-3 py-1 border border-white/10 text-[9px] font-bold text-white/40 uppercase rounded-lg bg-black/40">
                          {l.category}
                        </span>
                        <button
                          onClick={() => {
                            deleteLink(l.id);
                            setLinks(prev => prev.filter(item => item.id !== l.id));
                            setUpdater(prev => prev + 1);
                          }}
                          className="p-2 rounded-xl hover:bg-rose-500/10 text-slate-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-sm font-bold text-white leading-tight mb-1 truncate">
                        {l.title}
                      </span>
                      <span className="text-[10px] text-slate-500 truncate leading-normal font-medium">
                        {l.url.replace('https://', '').replace('http://', '')}
                      </span>
                    </div>

                    <div className="flex justify-between items-center bg-black/60 px-4 py-3 rounded-xl border border-white/5 group-hover:border-white/10 transition-colors">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        CLIKS: <span className="text-white">{l.clicks}</span>
                      </span>

                      <a
                        href={l.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => trackLinkClick(l.id)}
                        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white hover:opacity-70 transition-all"
                      >
                        Abrir <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. IMPORTANT REMINDERS & HUB OF REMINDERS */}
      {(activeTab === 'important_reminders' || activeTab === 'reminders') && (
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-8 overflow-hidden">
          {/* Left Panel: Create reminders */}
          <div className="xl:col-span-5 flex flex-col gap-6">
            <span className="text-[11px] font-bold tracking-[0.3em] text-white/40 uppercase flex items-center gap-3 border-b border-white/5 pb-4">
              <Bell className="w-4 h-4" /> AGENDAR ALERTA
            </span>

            <form onSubmit={handleAddReminderSubmit} className="p-8 border border-white/5 bg-white/[0.03] rounded-2xl flex flex-col gap-6 shadow-xl relative overflow-hidden group">
              <div 
                className="absolute inset-0 opacity-10 pointer-events-none group-focus-within:opacity-20 transition-opacity"
                style={{ background: `radial-gradient(circle at top left, ${theme.primary}, transparent)` }}
              />
              <div className="flex flex-col gap-2 relative z-10">
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/30">Título</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex. Backup Global"
                  value={reminderTitle}
                  onChange={e => setReminderTitle(e.target.value)}
                  className="px-4 py-2.5 border border-white/10 bg-black/40 text-sm text-white rounded-xl focus:outline-none transition-all font-medium"
                  style={{ borderColor: reminderTitle ? theme.primary + '40' : undefined }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 relative z-10">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/30">Data</label>
                  <input 
                    type="date" 
                    required
                    value={reminderDate}
                    onChange={e => setReminderDate(e.target.value)}
                    className="px-4 py-2.5 border border-white/10 bg-black/40 text-sm text-white rounded-xl focus:outline-none dark-calendar"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/30">Hora</label>
                  <input 
                    type="time" 
                    value={reminderTime}
                    placeholder="09:00"
                    onChange={e => setReminderTime(e.target.value)}
                    className="px-4 py-2.5 border border-white/10 bg-black/40 text-sm text-white rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full mt-4 py-4 text-black hover:bg-slate-200 font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all shadow-lg relative z-10"
                style={{ backgroundColor: theme.primary }}
              >
                Ativar Alerta Sistema
              </button>

              <button 
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('test_alarm_sound'))}
                className="w-full mt-3 py-3 border border-white/10 hover:bg-white/5 text-white/40 hover:text-white font-bold text-[9px] uppercase tracking-[0.2em] rounded-xl transition-all relative z-10 cursor-pointer"
              >
                🧪 Testar Sistema de Áudio
              </button>
            </form>
          </div>

          {/* Right Panel: Reminder Timelines */}
          <div className="xl:col-span-7 flex flex-col gap-6 overflow-hidden">
            <span className="text-[11px] font-bold tracking-[0.3em] text-white/40 uppercase border-b border-white/5 pb-4 flex justify-between items-center">
              <span>CRONOGRAMA DE ALERTAS</span>
              <span className="text-white/20 text-[9px] tracking-widest uppercase font-bold">
                {reminders.length} ATIVOS
              </span>
            </span>

            <div className="flex-1 overflow-y-auto px-1 flex flex-col gap-4 custom-scrollbar pb-6">
              {reminders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-12 text-slate-600 border border-white/5 border-dashed rounded-3xl">
                  <AlertTriangle className="w-12 h-12 mb-4 opacity-20" />
                  <span className="text-[11px] uppercase font-bold tracking-widest">Nenhum alerta pendente</span>
                </div>
              ) : (
                reminders.map(r => (
                    <div 
                      key={r.id} 
                      className={`p-5 border rounded-2xl transition-all flex items-center justify-between group
                        ${r.completed 
                          ? 'border-white/5 bg-white/[0.01] opacity-50' 
                          : 'border-white/10 bg-white/[0.04] shadow-lg'
                        }
                      `}
                    >
                      <div className="flex items-center gap-5">
                        <button
                          onClick={() => toggleReminderCompleted(r.id)}
                          className={`w-6 h-6 border rounded-lg flex items-center justify-center cursor-pointer transition-all shadow-inner
                            ${r.completed ? 'bg-emerald-500 border-emerald-500' : 'border-white/20 bg-black/40 hover:border-white/40'}
                          `}
                        >
                          {r.completed && <Check className="w-4 h-4 text-black" />}
                        </button>
                        
                        <div className="flex flex-col">
                          <span className={`text-[13px] font-bold leading-none mb-2 ${r.completed ? 'line-through text-slate-500' : 'text-white'}`}>
                            {r.title}
                          </span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-2 font-semibold tracking-wider uppercase">
                            <Calendar className="w-3.5 h-3.5 text-white/20" /> 
                            {new Date(r.datetime).toLocaleDateString()} • {new Date(r.datetime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteReminder(r.id);
                          setReminders(prev => prev.filter(item => item.id !== r.id));
                          // We don't necessarily need setUpdater here as we updated state locally, 
                          // but let's keep it to keep overall system in sync
                          setUpdater(prev => prev + 1);
                        }}
                        className="p-2 rounded-xl hover:bg-rose-500/10 text-slate-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. NOTES VIEW (TERMINAL-STYLE WRITER) */}
      {activeTab === 'notes' && (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-8 overflow-hidden h-full">
          {/* Note List Selector Pane (col-span-4) */}
          <div className="md:col-span-4 border-r border-white/5 flex flex-col gap-5 h-full overflow-hidden pr-6">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input 
                  type="text"
                  placeholder="Pesquisar notas..."
                  value={searchNoteQuery}
                  onChange={e => setSearchNoteQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-white/10 bg-black/40 text-[13px] text-white rounded-xl focus:outline-none focus:border-white/30 transition-all"
                />
              </div>
              <button
                onClick={handleCreateNote}
                className="w-10 h-10 text-black hover:bg-slate-200 rounded-xl flex items-center justify-center cursor-pointer font-bold shadow-lg shrink-0"
                style={{ backgroundColor: theme.primary }}
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-3 custom-scrollbar">
              {notes
                .filter(n => n.title.toLowerCase().includes(searchNoteQuery.toLowerCase()) || n.content.toLowerCase().includes(searchNoteQuery.toLowerCase()))
                .map(n => (
                  <div
                    key={n.id}
                    onClick={() => handleNoteSelect(n)}
                    className={`p-4 border rounded-2xl cursor-pointer transition-all text-left flex flex-col gap-2
                      ${selectedNote?.id === n.id ? 'bg-white/10 shadow-xl' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'}
                    `}
                    style={{ borderColor: selectedNote?.id === n.id ? theme.primary : undefined }}
                  >
                    <span className="text-[13px] font-bold text-white truncate">{n.title}</span>
                    <span className="text-[11px] text-slate-500 truncate leading-none">{n.content.replace(/[#*`_-]/g, '')}</span>
                    <span className="text-[9px] text-white/20 uppercase mt-1.5 font-bold tracking-widest">{new Date(n.updatedAt).toLocaleDateString()}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Note Editor Active Block (col-span-8) */}
          <div className="md:col-span-8 flex flex-col h-full overflow-hidden">
            {selectedNote ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/5 pb-5 shrink-0">
                  {isEditingNote ? (
                    <input
                      type="text"
                      value={noteEditTitle}
                      onChange={e => setNoteEditTitle(e.target.value)}
                      className="border border-white/10 bg-black/40 text-[15px] font-bold text-white px-4 py-1.5 select-all h-10 w-full max-w-md rounded-xl focus:outline-none"
                    />
                  ) : (
                    <span className="text-sm font-bold text-white tracking-tight flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5">
                        <FileText className="w-4 h-4 opacity-40" />
                      </div>
                      {selectedNote.title}
                    </span>
                  )}

                  <div className="flex items-center gap-3">
                    {isEditingNote ? (
                      <button
                        onClick={handleSaveNote}
                        className="flex items-center gap-2 px-5 py-2 text-black font-bold text-[11px] uppercase tracking-widest rounded-xl cursor-pointer h-10 shadow-lg"
                        style={{ backgroundColor: theme.primary }}
                      >
                        <Save className="w-4 h-4" /> Salvar
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsEditingNote(true)}
                        className="flex items-center gap-2 px-5 py-2 bg-white/5 border border-white/10 text-white font-bold text-[11px] uppercase tracking-widest rounded-xl hover:bg-white/10 cursor-pointer h-10 transition-all font-sans"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Editar
                      </button>
                    )}
                    <button
                      onClick={() => {
                        deleteNote(selectedNote.id);
                        setNotes(prev => prev.filter(item => item.id !== selectedNote.id));
                        setUpdater(prev => prev + 1);
                        setSelectedNote(null);
                      }}
                      className="w-10 h-10 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-500 rounded-xl cursor-pointer flex items-center justify-center transition-all"
                      title="Deletar Nota"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto mt-6 pr-1 text-left custom-scrollbar h-full">
                  {isEditingNote ? (
                    <textarea
                      value={noteEditContent}
                      onChange={e => setNoteEditContent(e.target.value)}
                      placeholder="Comece sua anotação..."
                      className="w-full p-6 bg-black/20 text-white font-sans text-sm border border-white/10 rounded-2xl focus:outline-none focus:border-white/30 leading-relaxed resize-none h-full shadow-inner"
                    />
                  ) : (
                    <div className="note-preview-pane text-slate-300 font-sans leading-relaxed text-[13px] p-8 bg-white/[0.02] border border-white/5 rounded-3xl h-full overflow-y-auto shadow-xl">
                      <div className="prose prose-invert max-w-none text-left">
                        {selectedNote.content.split('\n').map((line, idx) => {
                          if (line.startsWith('# ')) return <h1 key={idx} className="text-xl font-bold text-white border-b border-white/5 pb-4 mt-6 mb-4">{line.replace('# ', '')}</h1>;
                          if (line.startsWith('## ')) return <h2 key={idx} className="text-[13px] font-bold text-white uppercase tracking-widest mt-6 mb-2">{line.replace('## ', '')}</h2>;
                          if (line.startsWith('* ') || line.startsWith('- ')) return <li key={idx} className="ml-5 list-disc pl-2 mb-2 text-slate-400">{line.substring(2)}</li>;
                          if (line.startsWith('- [x] ')) return <div key={idx} className="flex items-center gap-3 mb-2.5"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /><span className="text-slate-500 line-through">{line.replace('- [x] ', '')}</span></div>;
                          if (line.startsWith('- [ ] ')) return <div key={idx} className="flex items-center gap-3 mb-2.5"><div className="w-5 h-5 border border-white/20 rounded-lg bg-black/20 shrink-0" /><span className="text-slate-300">{line.replace('- [ ] ', '')}</span></div>;
                          if (line.trim() === '') return <br key={idx} />;
                          return <p key={idx} className="mb-3 leading-relaxed text-slate-300">{line}</p>;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center border border-white/5 border-dashed rounded-3xl">
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/5 flex items-center justify-center mb-6">
                    <FileText className="w-10 h-10 opacity-20" />
                </div>
                <span className="text-[11px] uppercase font-bold tracking-widest">Nenhuma nota selecionada</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. FUNCTIONAL SETTINGS/ADMIN VIEWS */}
      {activeTab === 'network_logs' && <NetworkLogsView theme={theme} />}
      {activeTab === 'core_diagnostic' && <CoreDiagnosticView theme={theme} />}
      {activeTab === 'database_admin' && <DatabaseAdminView theme={theme} />}

    </div>
  );
};
